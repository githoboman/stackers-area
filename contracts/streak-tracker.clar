;; Transaction History Streak Tracker - Clarity 4
;; Tracks user login streaks when they connect their wallet

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-unauthorized (err u100))
(define-constant err-already-checked-in (err u101))
(define-constant err-no-activity (err u102))

;; Streak window: 24 hours in seconds
(define-constant streak-window u86400)

;; Data structures
(define-map user-streaks
  principal
  {
    current-streak: uint,
    longest-streak: uint,
    last-check-in: uint,
    total-check-ins: uint,
    streak-start: uint
  }
)

(define-map daily-activity
  { user: principal, day: uint }
  { checked-in: bool, timestamp: uint }
)

;; Data vars for global stats
(define-data-var total-users uint u0)
(define-data-var total-check-ins uint u0)

;; Helper: Calculate days between timestamps
(define-private (get-day-number (timestamp uint))
  (/ timestamp streak-window)
)

;; Helper: Check if user has checked in today
(define-private (has-checked-in-today (user principal))
  (let ((current-time block-height)
        (current-day (get-day-number current-time)))
    (default-to false
      (get checked-in (map-get? daily-activity { user: user, day: current-day }))
    )
  )
)

;; Public function: Check in (called when wallet connects)
(define-public (check-in)
  (let (
    (user tx-sender)
    (current-time block-height)
    (current-day (get-day-number current-time))
    (user-data (default-to
      { current-streak: u0, longest-streak: u0, last-check-in: u0, total-check-ins: u0, streak-start: u0 }
      (map-get? user-streaks user)
    ))
  )
    ;; Check if already checked in today
    (asserts! (not (has-checked-in-today user)) err-already-checked-in)

    ;; Calculate new streak
    (let (
      (last-day (get-day-number (get last-check-in user-data)))
      (is-consecutive (is-eq (- current-day last-day) u1))
      (is-same-day (is-eq current-day last-day))
      (is-first-checkin (is-eq (get last-check-in user-data) u0))
      (new-streak (if (or is-consecutive is-first-checkin)
                    (+ (get current-streak user-data) u1)
                    u1))
      (new-longest (if (> new-streak (get longest-streak user-data))
                      new-streak
                      (get longest-streak user-data)))
      (streak-start-time (if (or is-first-checkin (not is-consecutive))
                            current-time
                            (get streak-start user-data)))
    )
      ;; Update daily activity
      (map-set daily-activity
        { user: user, day: current-day }
        { checked-in: true, timestamp: current-time }
      )

      ;; Update user streaks
      (map-set user-streaks user
        {
          current-streak: new-streak,
          longest-streak: new-longest,
          last-check-in: current-time,
          total-check-ins: (+ (get total-check-ins user-data) u1),
          streak-start: streak-start-time
        }
      )

      ;; Update global stats
      (if is-first-checkin
        (var-set total-users (+ (var-get total-users) u1))
        true
      )
      (var-set total-check-ins (+ (var-get total-check-ins) u1))

      (ok {
        current-streak: new-streak,
        longest-streak: new-longest,
        streak-continued: is-consecutive,
        total-check-ins: (+ (get total-check-ins user-data) u1)
      })
    )
  )
)

;; Read-only: Get user streak data
(define-read-only (get-user-streak (user principal))
  (ok (default-to
    { current-streak: u0, longest-streak: u0, last-check-in: u0, total-check-ins: u0, streak-start: u0 }
    (map-get? user-streaks user)
  ))
)

;; Read-only: Check if user can check in now
(define-read-only (can-check-in (user principal))
  (ok (not (has-checked-in-today user)))
)

;; Read-only: Get current day number
(define-read-only (get-current-day)
  (ok (get-day-number block-height))
)

;; Read-only: Get time until next check-in available
(define-read-only (time-until-next-checkin (user principal))
  (let (
    (current-time block-height)
    (current-day (get-day-number current-time))
    (user-data (map-get? user-streaks user))
  )
    (match user-data
      data
        (if (has-checked-in-today user)
          (let (
            (next-day-start (* (+ current-day u1) streak-window))
            (time-remaining (- next-day-start current-time))
          )
            (ok time-remaining)
          )
          (ok u0)
        )
      (ok u0)
    )
  )
)

;; Read-only: Get global stats
(define-read-only (get-global-stats)
  (ok {
    total-users: (var-get total-users),
    total-check-ins: (var-get total-check-ins),
    current-time: block-height
  })
)

;; Read-only: Check if streak is at risk (missed yesterday)
(define-read-only (is-streak-at-risk (user principal))
  (let (
    (current-time block-height)
    (current-day (get-day-number current-time))
    (user-data (map-get? user-streaks user))
  )
    (match user-data
      data
        (let (
          (last-day (get-day-number (get last-check-in data)))
          (days-since-last (- current-day last-day))
        )
          (ok {
            at-risk: (> days-since-last u1),
            days-missed: (if (> days-since-last u1) (- days-since-last u1) u0),
            will-break: (>= days-since-last u2)
          })
        )
      (ok { at-risk: false, days-missed: u0, will-break: false })
    )
  )
)

;; Read-only: Get leaderboard data (top streaks)
;; Note: This is a simple implementation. For production, consider using
;; a separate indexing service or off-chain aggregation
(define-read-only (get-streak-info (user principal))
  (let ((streak-data (unwrap! (get-user-streak user) err-no-activity)))
    (ok {
      user: user,
      current-streak: (get current-streak streak-data),
      longest-streak: (get longest-streak streak-data),
      total-check-ins: (get total-check-ins streak-data),
      last-check-in: (get last-check-in streak-data),
      can-check-in-now: (unwrap! (can-check-in user) err-unauthorized)
    })
  )
)
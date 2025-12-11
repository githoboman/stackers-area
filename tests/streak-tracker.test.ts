import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;

describe("streak tracker tests", () => {
  it("ensures user can check in successfully", () => {
    const { result } = simnet.callPublicFn(
      "streak-tracker",
      "check-in",
      [],
      address1
    );

    expect(result).toBeDefined();
    expect(result.isOk).toBe(true);

    // Verify streak data
    const streakData = simnet.callReadOnlyFn(
      "streak-tracker",
      "get-user-streak",
      [address1],
      address1
    );

    expect(streakData.result).toBeDefined();
    expect(streakData.result.isOk).toBe(true);
    const data = streakData.result.unwrap();
    expect(data).toBeDefined();
    expect(data["current-streak"]).toBe(1);
    expect(data["total-check-ins"]).toBe(1);
  });

  it("ensures user cannot check in twice in same day", () => {
    // First check-in
    const firstCheck = simnet.callPublicFn(
      "streak-tracker",
      "check-in",
      [],
      address1
    );
    expect(firstCheck.result).toBeDefined();
    expect(firstCheck.result.isOk).toBe(true);

    // Second check-in same day should fail
    const secondCheck = simnet.callPublicFn(
      "streak-tracker",
      "check-in",
      [],
      address1
    );
    expect(secondCheck.result).toBeDefined();
    expect(secondCheck.result.isErr).toBe(true);
    expect(secondCheck.result.unwrapErr()).toBe(101); // err-already-checked-in
  });

  it("ensures streak continues on consecutive days", () => {
    // Day 1 check-in
    const day1 = simnet.callPublicFn(
      "streak-tracker",
      "check-in",
      [],
      address1
    );
    expect(day1.result).toBeOk();

    // Advance to next day (144 blocks = ~24 hours)
    simnet.mineEmptyBlocks(144);

    // Day 2 check-in
    const day2 = simnet.callPublicFn(
      "streak-tracker",
      "check-in",
      [],
      address1
    );
    expect(day2.result).toBeOk();

    const result = day2.result.unwrap();
    expect(result["current-streak"]).toBeUint(2);
    expect(result["streak-continued"]).toBeBool(true);
  });

  it("ensures streak resets when missing a day", () => {
    // Day 1
    const day1 = simnet.callPublicFn(
      "streak-tracker",
      "check-in",
      [],
      address1
    );
    expect(day1.result).toBeOk();

    // Skip day 2, advance to day 3 (288 blocks = ~48 hours)
    simnet.mineEmptyBlocks(288);

    // Day 3 check-in
    const day3 = simnet.callPublicFn(
      "streak-tracker",
      "check-in",
      [],
      address1
    );
    expect(day3.result).toBeOk();

    const result = day3.result.unwrap();
    expect(result["current-streak"]).toBeUint(1);
    expect(result["streak-continued"]).toBeBool(false);
  });

  it("ensures longest streak is tracked correctly", () => {
    // Build a 3-day streak
    for (let i = 0; i < 3; i++) {
      const check = simnet.callPublicFn(
        "streak-tracker",
        "check-in",
        [],
        address1
      );
      expect(check.result).toBeOk();

      if (i < 2) simnet.mineEmptyBlocks(144);
    }

    // Skip a day and start new streak
    simnet.mineEmptyBlocks(288);
    const newCheck = simnet.callPublicFn(
      "streak-tracker",
      "check-in",
      [],
      address1
    );
    expect(newCheck.result).toBeOk();

    // Check that longest streak is still 3
    const streakData = simnet.callReadOnlyFn(
      "streak-tracker",
      "get-user-streak",
      [address1],
      address1
    );

    expect(streakData.result).toBeOk();
    const data = streakData.result.unwrap();
    expect(data["longest-streak"]).toBeUint(3);
    expect(data["current-streak"]).toBeUint(1);
  });

  it("tests can-check-in function", () => {
    // Before check-in, should be able to
    const canCheckBefore = simnet.callReadOnlyFn(
      "streak-tracker",
      "can-check-in",
      [address1],
      address1
    );
    expect(canCheckBefore.result).toBeOk();
    expect(canCheckBefore.result.unwrap()).toBeBool(true);

    // Check in
    const check = simnet.callPublicFn(
      "streak-tracker",
      "check-in",
      [],
      address1
    );
    expect(check.result).toBeOk();

    // After check-in, should not be able to
    const canCheckAfter = simnet.callReadOnlyFn(
      "streak-tracker",
      "can-check-in",
      [address1],
      address1
    );
    expect(canCheckAfter.result).toBeOk();
    expect(canCheckAfter.result.unwrap()).toBeBool(false);
  });

  it("tests global stats tracking", () => {
    // Two users check in
    const check1 = simnet.callPublicFn(
      "streak-tracker",
      "check-in",
      [],
      address1
    );
    expect(check1.result).toBeOk();

    const check2 = simnet.callPublicFn(
      "streak-tracker",
      "check-in",
      [],
      address2
    );
    expect(check2.result).toBeOk();

    // Check global stats
    const stats = simnet.callReadOnlyFn(
      "streak-tracker",
      "get-global-stats",
      [],
      address1
    );

    expect(stats.result).toBeOk();
    const data = stats.result.unwrap();
    expect(data["total-users"]).toBeUint(2);
    expect(data["total-check-ins"]).toBeUint(2);
  });

  it("tests streak risk detection", () => {
    // Day 1 check-in
    const day1 = simnet.callPublicFn(
      "streak-tracker",
      "check-in",
      [],
      address1
    );
    expect(day1.result).toBeOk();

    // Advance to day 3 (missed day 2)
    simnet.mineEmptyBlocks(288);

    // Check risk status
    const riskData = simnet.callReadOnlyFn(
      "streak-tracker",
      "is-streak-at-risk",
      [address1],
      address1
    );

    expect(riskData.result).toBeOk();
    const data = riskData.result.unwrap();
    expect(data["at-risk"]).toBeBool(true);
    expect(data["days-missed"]).toBeUint(1);
    expect(data["will-break"]).toBeBool(true);
  });
});
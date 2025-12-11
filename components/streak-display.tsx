"use client";
import { useEffect, useState } from "react";
import { useStacks } from "@/hooks/use-stacks";
import { fetchCallReadOnlyFunction, cvToJSON } from "@stacks/transactions";
import { STACKS_TESTNET } from "@stacks/network";
import { type UserData } from "@stacks/connect";

// Contract details - replace with actual deployed contract address
const CONTRACT_ADDRESS = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"; // placeholder
const CONTRACT_NAME = "streak-tracker";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  lastCheckIn: number;
}

export function StreakDisplay() {
  const { userData } = useStacks();
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userData) {
      fetchStreakData(userData);
    }
  }, [userData]);

  async function fetchStreakData(user: UserData) {
    setLoading(true);
    try {
      const result = await fetchCallReadOnlyFunction({
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: "get-streak-info",
        functionArgs: [], // tx-sender is implicit
        senderAddress: user.profile.stxAddress.mainnet,
        network: STACKS_TESTNET,
      });

      const data = cvToJSON(result);
      setStreakData({
        currentStreak: data.value.currentStreak.value,
        longestStreak: data.value.longestStreak.value,
        totalCheckIns: data.value.totalCheckIns.value,
        lastCheckIn: data.value.lastCheckIn.value,
      });
    } catch (error) {
      console.error("Error fetching streak data:", error);
    } finally {
      setLoading(false);
    }
  }

  if (!userData) return null;

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-yellow-100 border-2 border-black rounded">
      {loading ? (
        <span>Loading streak...</span>
      ) : streakData ? (
        <>
          <div className="text-sm">
            <div>🔥 Current: {streakData.currentStreak}</div>
            <div>🏆 Best: {streakData.longestStreak}</div>
            <div>📊 Total: {streakData.totalCheckIns}</div>
          </div>
        </>
      ) : (
        <span>No streak data</span>
      )}
    </div>
  );
}
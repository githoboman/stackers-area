"use client";
import { useEffect, useState } from "react";
import { useStacks } from "@/hooks/use-stacks";
import { 
  callReadOnlyFunction, 
  cvToJSON,
  standardPrincipalCV 
} from "@stacks/transactions";
import { StacksTestnet, StacksMainnet } from "@stacks/network";

// Update with your deployed contract address
const CONTRACT_ADDRESS = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
const CONTRACT_NAME = "streak-tracker";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  lastCheckIn: number;
  canCheckInNow: boolean;
}

export function StreakDisplay() {
  const { stxAddress, isConnected } = useStacks();
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && stxAddress) {
      fetchStreakData(stxAddress);
    }
  }, [isConnected, stxAddress]);

  async function fetchStreakData(address: string) {
    setLoading(true);
    setError(null);
    
    try {
      // Use testnet if address starts with ST, mainnet if SP
      const network = address.startsWith("ST") 
        ? new StacksTestnet() 
        : new StacksMainnet();
      
      const result = await callReadOnlyFunction({
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: "get-streak-info",
        functionArgs: [standardPrincipalCV(address)],
        network,
        senderAddress: address,
      });

      const data = cvToJSON(result);
      
      if (data.success && data.value) {
        setStreakData({
          currentStreak: Number(data.value["current-streak"]?.value || 0),
          longestStreak: Number(data.value["longest-streak"]?.value || 0),
          totalCheckIns: Number(data.value["total-check-ins"]?.value || 0),
          lastCheckIn: Number(data.value["last-check-in"]?.value || 0),
          canCheckInNow: data.value["can-check-in-now"]?.value === true,
        });
      } else {
        setStreakData({
          currentStreak: 0,
          longestStreak: 0,
          totalCheckIns: 0,
          lastCheckIn: 0,
          canCheckInNow: true,
        });
      }
    } catch (err) {
      console.error("Error fetching streak data:", err);
      setError("Failed to load streak data");
      setStreakData({
        currentStreak: 0,
        longestStreak: 0,
        totalCheckIns: 0,
        lastCheckIn: 0,
        canCheckInNow: true,
      });
    } finally {
      setLoading(false);
    }
  }

  if (!isConnected) return null;

  return (
    <div className="brutal-card p-4 bg-[var(--accent-yellow)]">
      <h3 className="text-lg font-bold mb-2">🔥 YOUR STREAK</h3>
      {loading ? (
        <div className="text-sm">Loading streak data...</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : streakData ? (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-bold">Current Streak</div>
            <div className="text-2xl">{streakData.currentStreak} days</div>
          </div>
          <div>
            <div className="font-bold">Best Streak</div>
            <div className="text-2xl">{streakData.longestStreak} days</div>
          </div>
          <div>
            <div className="font-bold">Total Check-ins</div>
            <div className="text-2xl">{streakData.totalCheckIns}</div>
          </div>
          <div>
            <div className="font-bold">Can Check In?</div>
            <div className="text-2xl">
              {streakData.canCheckInNow ? "✅ Yes" : "❌ No"}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-sm">No streak data available</div>
      )}
    </div>
  );
}
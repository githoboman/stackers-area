"use client";

import { connect, disconnect, getLocalStorage } from "@stacks/connect";
import { useEffect, useState } from "react";

interface UserAddress {
  address: string;
}

interface StoredUserData {
  addresses?: {
    stx?: UserAddress[];
    btc?: UserAddress[];
  };
}

export function useStacks() {
  const [userData, setUserData] = useState<StoredUserData | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    // Load existing connection data from local storage
    try {
      const data = getLocalStorage();
      if (data?.addresses?.stx?.[0]) {
        setUserData(data as StoredUserData);
      }
    } catch (err) {
      console.error("Error loading stored data:", err);
    }
  }, []);

  async function connectWallet() {
    if (typeof window === 'undefined') return;

    try {
      setError(null);
      
      // The new connect() method from @stacks/connect v8
      const response = await connect();
      
      if (response?.addresses?.stx?.[0]) {
        setUserData(response as StoredUserData);
      }
    } catch (err: any) {
      console.error("Error connecting wallet:", err);
      setError(err.message || "Failed to connect wallet");
      
      if (err.message?.includes("StacksProvider") || err.message?.includes("immutable")) {
        setError("Multiple Stacks wallets detected. Please disable all but one wallet extension and refresh the page.");
      }
    }
  }

  function disconnectWallet() {
    try {
      disconnect();
      setUserData(null);
      setError(null);
    } catch (err: any) {
      console.error("Error disconnecting wallet:", err);
      setError(err.message || "Failed to disconnect wallet");
    }
  }

  // Helper function to get the main STX address
  const getStxAddress = () => {
    return userData?.addresses?.stx?.[0]?.address || null;
  };

  return { 
    userData, 
    connectWallet, 
    disconnectWallet, 
    error,
    stxAddress: getStxAddress(),
    isConnected: !!userData?.addresses?.stx?.[0]
  };
}
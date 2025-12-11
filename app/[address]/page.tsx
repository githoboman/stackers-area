"use client";

import { useStacks } from "@/hooks/use-stacks";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { stxAddress, isConnected } = useStacks();

  useEffect(() => {
    if (isConnected && stxAddress) {
      redirect(`/${stxAddress}`);
    }
  }, [isConnected, stxAddress]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8 md:p-24">
      <div className="brutal-card p-6 md:p-8 text-center max-w-md w-full">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-[var(--foreground)]">
          WELCOME
        </h1>
        <span className="text-lg md:text-xl text-[var(--foreground)]">
          Connect your wallet or search for an address
        </span>
      </div>
    </main>
  );
}
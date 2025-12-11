"use client";
import { useStacks } from "@/hooks/use-stacks";
import { abbreviateAddress } from "@/app/lib/stx-utils";
import { createAddress } from "@stacks/transactions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function Navbar() {
  const router = useRouter();
  const [searchAddress, setSearchAddress] = useState("");
  const { stxAddress, isConnected, connectWallet, disconnectWallet, error } = useStacks();

  function handleSearch() {
    if (!searchAddress.startsWith("SP") && !searchAddress.startsWith("ST")) {
      alert("Please enter a valid Stacks address (SP... for mainnet or ST... for testnet)");
      return;
    }

    try {
      createAddress(searchAddress);
    } catch (error) {
      alert(`Invalid Stacks address entered: ${error}`);
      return;
    }

    router.push(`/${searchAddress}`);
  }

  return (
    <nav className="flex w-full flex-col gap-2 p-4 border-b-4 border-black bg-[var(--background)]">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link href="/" className="text-2xl font-bold hover:text-[var(--accent-blue)] transition-colors">
          STACKS HISTORY
        </Link>

        <input
          type="text"
          placeholder="SP... or ST..."
          className="brutal-input w-96 max-w-full px-4 py-2 text-sm"
          value={searchAddress}
          onChange={(e) => setSearchAddress(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
        />

        <div className="flex items-center gap-2">
          {isConnected && stxAddress ? (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => router.push(`/${stxAddress}`)}
                className="brutal-button px-4 py-2 text-sm bg-[var(--accent-blue)] text-white"
              >
                View {abbreviateAddress(stxAddress)}
              </button>
              <button
                type="button"
                onClick={disconnectWallet}
                className="brutal-button px-4 py-2 text-sm bg-red-500 text-white"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={connectWallet}
              className="brutal-button px-4 py-2 text-sm bg-[var(--accent-green)]"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="brutal-card p-3 bg-red-200 text-sm">
          <strong>⚠️ Error:</strong> {error}
          {error.includes("Multiple") && (
            <div className="mt-2">
              <strong>Fix:</strong> Go to your browser extensions and disable all Stacks wallets except one, then refresh this page.
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
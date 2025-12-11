import type {
  FetchAddressTransactionsResponse,
  Transaction,
} from "@/app/lib/fetch-address-transactions";
import { abbreviateTxnId, abbreviateAddress } from "@/app/lib/stx-utils";
import {
  ActivityIcon,
  ArrowLeftRightIcon,
  BlocksIcon,
  CodeSquareIcon,
  FunctionSquareIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

interface TransactionDetailProps {
  result: FetchAddressTransactionsResponse["results"][number];
}

// Each component will display the following pieces of information
// that will vary depending on the type of transaction
type TransactionInformationByType = {
  primaryTitle: string;
  secondaryTitle: string;
  tags: string[];
};

// An icon to represent each type of transaction
const TxTypeIcon: Record<Transaction["tx_type"], LucideIcon> = {
  coinbase: BlocksIcon,
  token_transfer: ArrowLeftRightIcon,
  smart_contract: CodeSquareIcon,
  contract_call: FunctionSquareIcon,
  poison_microblock: ActivityIcon,
};

function getTransactionInformationByType(
  result: TransactionDetailProps["result"]
): TransactionInformationByType {
  if (result.tx.tx_type === "coinbase") {
    return {
      primaryTitle: `Block #${result.tx.block_height}`,
      secondaryTitle: "",
      tags: ["Coinbase"],
    };
  }

  if (result.tx.tx_type === "token_transfer") {
    return {
      primaryTitle: `Transfer ${(
        Number.parseFloat(result.tx.token_transfer.amount) / 1_000_000
      ).toFixed(2)} STX`,
      secondaryTitle: "",
      tags: ["Token Transfer"],
    };
  }

  if (result.tx.tx_type === "smart_contract") {
    return {
      primaryTitle: result.tx.smart_contract.contract_id,
      secondaryTitle: "",
      tags: ["Contract Deployment"],
    };
  }

  if (result.tx.tx_type === "contract_call") {
    return {
      primaryTitle: result.tx.contract_call.function_name,
      secondaryTitle: result.tx.contract_call.contract_id.split(".")[1],
      tags: ["Contract Call"],
    };
  }

  if (result.tx.tx_type === "poison_microblock") {
    return {
      primaryTitle: "Microblock",
      secondaryTitle: "",
      tags: ["Microblock"],
    };
  }

  return {
    primaryTitle: "",
    secondaryTitle: "",
    tags: [],
  };
}
export function TransactionDetail({ result }: TransactionDetailProps) {
  const Icon = TxTypeIcon[result.tx.tx_type];
  const { primaryTitle, secondaryTitle, tags } =
    getTransactionInformationByType(result);

  return (
    <div className="flex flex-col md:flex-row md:items-center p-6 hover:shadow-2xl transition-all md:justify-between gap-4">
      <div className="flex items-center gap-4">
        <Icon className="h-12 w-12 p-2 border-4 border-[var(--foreground)] bg-[var(--background)]" />

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">{primaryTitle}</span>
            {secondaryTitle && (
              <span className="text-[var(--foreground)] opacity-75">({secondaryTitle})</span>
            )}
          </div>
          <div className="flex items-center gap-1 font-bold text-xs text-[var(--foreground)] opacity-75">
            {tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
            <span>•</span>
            <span className="font-normal">
              By{" "}
              <Link
                href={`/address/${result.tx.sender_address}`}
                className="hover:underline transition-all"
              >{`${abbreviateAddress(result.tx.sender_address)}`}</Link>
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-start md:items-end gap-2">
        <div className="flex items-center gap-2">
          <span>{abbreviateTxnId(result.tx.tx_id)}</span>
          <span>•</span>
          <span suppressHydrationWarning>
            {new Date(result.tx.block_time).toLocaleTimeString()}
          </span>
        </div>

        <div className="flex items-center gap-1 font-bold text-xs text-[var(--foreground)] opacity-75">
          <span>Block #{result.tx.block_height}</span>
          <span>•</span>
          <span>Nonce {result.tx.nonce}</span>
        </div>
      </div>
    </div>
  );
}

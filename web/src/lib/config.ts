import { CONTRACT as FALLBACK } from "@/data/demo-map";

const isProd = process.env.NODE_ENV === "production";

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) {
    throw new Error(
      `Missing ${name}. Set it in web/.env.local (see .env.example).`,
    );
  }
  if (isProd && !process.env[name] && fallback) {
    console.warn(`[doqtri] ${name} unset in production — using built-in fallback`);
  }
  return v;
}

export const RPC_URL = required(
  "NEXT_PUBLIC_SOROBAN_RPC_URL",
  "https://soroban-testnet.stellar.org",
);

export const CONTRACT_ID = required(
  "NEXT_PUBLIC_CONTRACT_ID",
  FALLBACK.id,
);

export const NETWORK_PASSPHRASE = required(
  "NEXT_PUBLIC_NETWORK_PASSPHRASE",
  "Test SDF Network ; September 2015",
);

export const HORIZON_URL = required(
  "NEXT_PUBLIC_HORIZON_URL",
  "https://horizon-testnet.stellar.org",
);

export const EXPERT_TX_BASE =
  process.env.NEXT_PUBLIC_EXPERT_TX_BASE ??
  "https://stellar.expert/explorer/testnet/tx";

export function expertTxUrl(hash: string) {
  return `${EXPERT_TX_BASE}/${hash}`;
}

export function labContractUrl(id = CONTRACT_ID) {
  return `https://lab.stellar.org/r/testnet/contract/${id}`;
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  connectWallet,
  disconnectWallet,
  initWalletKit,
  onWalletDisconnect,
  onWalletState,
} from "@/lib/wallet";

type WalletContextValue = {
  address: string | null;
  connecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

const E2E_ADDRESS = process.env.NEXT_PUBLIC_E2E_ADDRESS;

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(E2E_ADDRESS ?? null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (E2E_ADDRESS) {
      setAddress(E2E_ADDRESS);
      return;
    }
    initWalletKit();
    const offState = onWalletState((addr) => setAddress(addr ?? null));
    const offDisc = onWalletDisconnect(() => setAddress(null));
    return () => {
      offState();
      offDisc();
    };
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const addr = await connectWallet();
      setAddress(addr);
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Wallet connection was cancelled or could not be completed.";
      setError(message);
      throw err;
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    setError(null);
    await disconnectWallet();
    setAddress(null);
  }, []);

  const value = useMemo(
    () => ({ address, connecting, error, connect, disconnect }),
    [address, connecting, error, connect, disconnect],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}

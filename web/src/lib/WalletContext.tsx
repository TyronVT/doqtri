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
  connectFreighter,
  disconnectWallet,
  initWalletKit,
  onWalletDisconnect,
  onWalletState,
} from "@/lib/wallet";

type WalletContextValue = {
  address: string | null;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
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
    try {
      const addr = await connectFreighter();
      setAddress(addr);
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    await disconnectWallet();
    setAddress(null);
  }, []);

  const value = useMemo(
    () => ({ address, connecting, connect, disconnect }),
    [address, connecting, connect, disconnect],
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

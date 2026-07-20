"use client";

import { WalletProvider } from "@/lib/WalletContext";
import type { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return <WalletProvider>{children}</WalletProvider>;
}

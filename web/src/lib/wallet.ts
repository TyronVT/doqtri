"use client";

import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk";
import {
  FREIGHTER_ID,
  FreighterModule,
} from "@creit.tech/stellar-wallets-kit/modules/freighter";
import {
  KitEventType,
  Networks,
  SwkAppDarkTheme,
} from "@creit.tech/stellar-wallets-kit/types";

let ready = false;

export function initWalletKit() {
  if (ready || typeof window === "undefined") return;
  StellarWalletsKit.init({
    modules: [new FreighterModule()],
    selectedWalletId: FREIGHTER_ID,
    network: Networks.TESTNET,
    theme: SwkAppDarkTheme,
  });
  ready = true;
}

export async function connectFreighter(): Promise<string> {
  initWalletKit();
  StellarWalletsKit.setWallet(FREIGHTER_ID);
  const { address } = await StellarWalletsKit.fetchAddress();
  return address;
}

export async function disconnectWallet(): Promise<void> {
  initWalletKit();
  await StellarWalletsKit.disconnect();
}

export function onWalletState(
  cb: (address: string | undefined) => void,
): () => void {
  initWalletKit();
  return StellarWalletsKit.on(KitEventType.STATE_UPDATED, (event) => {
    cb(event.payload.address);
  });
}

export function onWalletDisconnect(cb: () => void): () => void {
  initWalletKit();
  return StellarWalletsKit.on(KitEventType.DISCONNECT, () => cb());
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

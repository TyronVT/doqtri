"use client";

import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk";
import { defaultModules } from "@creit.tech/stellar-wallets-kit/modules/utils";
import {
  KitEventType,
  Networks,
  SwkAppDarkTheme,
} from "@creit.tech/stellar-wallets-kit/types";
import { NETWORK_PASSPHRASE } from "@/lib/config";

let ready = false;

export function initWalletKit() {
  if (ready || typeof window === "undefined") return;
  StellarWalletsKit.init({
    modules: defaultModules(),
    network: Networks.TESTNET,
    theme: SwkAppDarkTheme,
  });
  ready = true;
}

export async function connectWallet(): Promise<string> {
  initWalletKit();
  const { address } = await StellarWalletsKit.authModal();
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

export async function signSorobanTx(
  xdr: string,
  address: string,
): Promise<string> {
  initWalletKit();
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
    networkPassphrase: NETWORK_PASSPHRASE,
    address,
  });
  return signedTxXdr;
}

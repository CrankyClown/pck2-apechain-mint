// wagmi.ts
import { createConfig, http } from "wagmi";
import { getDefaultConfig } from "connectkit";

// ✅ Custom ApeChain definition
export const apechain = {
  id: 33139,
  name: "ApeChain",
  network: "apechain",
  nativeCurrency: {
    name: "ApeCoin",
    symbol: "APE",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://rpc.apechain.com"] },
  },
  blockExplorers: {
    default: { name: "ApeScan", url: "https://apescan.io" },
  },
};

export const wagmiConfig = createConfig(
  getDefaultConfig({
    chains: [apechain],
    transports: {
      [apechain.id]: http(process.env.NEXT_PUBLIC_RPC_URL),
    },
    walletConnectProjectId:
      process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
    appName: "Pop Culture Kids Mint — Series 2",
    appDescription: "Mint your PCK Series 2 Pack",
    appUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://pck2mint.com",
    appIcon: "https://www.pck2mint.com/favicon.ico",
  })
);

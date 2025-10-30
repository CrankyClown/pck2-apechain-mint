import type { Chain } from 'viem/chains'

export const apechain = {
  id: 33139,
  name: 'ApeChain',
  nativeCurrency: {
    name: 'ApeCoin',
    symbol: 'APE',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.apechain.com'],
    },
    public: {
      http: ['https://rpc.apechain.com'],
    },
  },
  blockExplorers: {
    default: { name: 'ApeScan', url: 'https://apescan.io' },
  },
} as const satisfies Chain

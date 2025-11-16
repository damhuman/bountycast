'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { baseSepolia } from 'viem/chains'
import { http, WagmiProvider, createConfig } from 'wagmi'
import { coinbaseWallet } from 'wagmi/connectors'
import { config } from './config'

const queryClient = new QueryClient()

const wagmiConfig = createConfig({
  chains: [baseSepolia],
  connectors: [
    coinbaseWallet({
      appName: config.onchainKitConfig.projectName,
      preference: 'smartWalletOnly',
    }),
  ],
  ssr: true,
  transports: {
    [baseSepolia.id]: http(),
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export { wagmiConfig, queryClient }

import { baseSepolia } from 'viem/chains'
import { Address } from 'viem'

export const config = {
  // Chain configuration
  chain: baseSepolia,
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org',

  // Contract addresses
  contracts: {
    bountyEscrow: '0x46C0Ffa9C5E60cf0aBc865Fd293898b776604C19' as Address,
  },

  // Platform configuration
  platformFeePercent: 2.5,
  minBountyAmount: '0.001', // ETH
  maxBountyAmount: '10', // ETH

  // Time limits
  minDeadlineHours: 1,
  maxDeadlineDays: 30,
  refundGracePeriodDays: 7,

  // Application URLs
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

  // OnchainKit
  onchainKitConfig: {
    projectName: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'CastBounty',
    apiKey: process.env.NEXT_PUBLIC_CDP_API_KEY,
  },

  // Farcaster
  farcaster: {
    appFid: process.env.NEXT_PUBLIC_FARCASTER_APP_FID,
  },

  // IPFS
  ipfs: {
    pinataApiKey: process.env.PINATA_API_KEY,
    pinataSecretKey: process.env.PINATA_SECRET_KEY,
    pinataJwt: process.env.PINATA_JWT,
  },
} as const

export const calculatePlatformFee = (amount: bigint): bigint => {
  return (amount * BigInt(Math.floor(config.platformFeePercent * 100))) / BigInt(10000)
}

export const calculateTotalAmount = (bountyAmount: bigint): bigint => {
  return bountyAmount + calculatePlatformFee(bountyAmount)
}

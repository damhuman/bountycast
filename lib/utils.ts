import { keccak256, toBytes } from 'viem'

/**
 * Convert string to bytes32 hash for IPFS CID or metadata
 */
export function stringToBytes32(str: string): `0x${string}` {
  return keccak256(toBytes(str))
}

/**
 * Format ETH amount for display
 */
export function formatEthAmount(wei: bigint, decimals: number = 4): string {
  const eth = Number(wei) / 1e18
  return eth.toFixed(decimals)
}

/**
 * Parse ETH amount from string to wei
 */
export function parseEthAmount(eth: string): bigint {
  return BigInt(Math.floor(parseFloat(eth) * 1e18))
}

/**
 * Format timestamp to relative time
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffMs < 0) {
    return 'Expired'
  } else if (diffHours < 1) {
    return 'Less than 1 hour'
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`
  } else {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`
  }
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: string, chars: number = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

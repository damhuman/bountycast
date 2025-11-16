import { Address } from 'viem'

export enum BountyStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum BountyCategory {
  DESIGN = 'DESIGN',
  CODE = 'CODE',
  CONTENT = 'CONTENT',
  RESEARCH = 'RESEARCH',
  TRANSLATION = 'TRANSLATION',
  OTHER = 'OTHER',
}

export interface Bounty {
  id: number
  blockchainId?: number
  creatorFid: number
  creatorAddress: Address
  creatorUsername?: string
  title: string
  description: string
  amountWei: bigint
  deadline: Date
  category: BountyCategory
  status: BountyStatus
  winnerAddress?: Address
  castHash?: string
  metadataIpfs?: string
  createdAt: Date
  updatedAt: Date
  submissionCount?: number
}

export interface Submission {
  id: number
  bountyId: number
  blockchainId?: number
  submitterFid: number
  submitterAddress: Address
  submitterUsername?: string
  submitterReputation?: number
  contentIpfs?: string
  externalUrl?: string
  description?: string
  replyCastHash?: string
  isWinner: boolean
  createdAt: Date
}

export interface User {
  fid: number
  address?: Address
  username?: string
  reputationScore: number
  totalEarnedWei: bigint
  bountiesCreated: number
  bountiesWon: number
  createdAt: Date
  updatedAt: Date
}

export interface CreateBountyInput {
  title: string
  description: string
  amount: string // ETH amount as string
  deadline: Date
  category: BountyCategory
}

export interface CreateSubmissionInput {
  bountyId: number
  contentIpfs?: string
  externalUrl?: string
  description?: string
}

export interface ContractBounty {
  creator: Address
  amount: bigint
  deadline: bigint
  status: number
  winner: Address
  metadataHash: `0x${string}`
  createdAt: bigint
}

export interface BountyMetadata {
  title: string
  description: string
  category: BountyCategory
  creatorFid: number
}

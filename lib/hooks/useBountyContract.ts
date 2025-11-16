import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, keccak256, toBytes } from 'viem'
import { config } from '@/lib/config'
import BountyEscrowABI from '@/lib/abi/BountyEscrowABI.json'

export function useBountyContract() {
  const { data: hash, writeContract, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const createBounty = async (
    amount: string,
    deadline: Date,
    metadata: { title: string; description: string; category: string }
  ) => {
    const amountWei = parseEther(amount)
    const platformFee = (amountWei * BigInt(250)) / BigInt(10000) // 2.5%
    const totalValue = amountWei + platformFee

    const deadlineTimestamp = BigInt(Math.floor(deadline.getTime() / 1000))
    const metadataHash = keccak256(toBytes(JSON.stringify(metadata)))

    return writeContract({
      address: config.contracts.bountyEscrow,
      abi: BountyEscrowABI,
      functionName: 'createBounty',
      args: [amountWei, deadlineTimestamp, metadataHash],
      value: totalValue,
    })
  }

  const selectWinner = async (bountyId: number, submissionId: number) => {
    return writeContract({
      address: config.contracts.bountyEscrow,
      abi: BountyEscrowABI,
      functionName: 'selectWinner',
      args: [BigInt(bountyId), BigInt(submissionId)],
    })
  }

  const cancelBounty = async (bountyId: number) => {
    return writeContract({
      address: config.contracts.bountyEscrow,
      abi: BountyEscrowABI,
      functionName: 'cancelBounty',
      args: [BigInt(bountyId)],
    })
  }

  const claimRefund = async (bountyId: number) => {
    return writeContract({
      address: config.contracts.bountyEscrow,
      abi: BountyEscrowABI,
      functionName: 'claimRefund',
      args: [BigInt(bountyId)],
    })
  }

  return {
    createBounty,
    selectWinner,
    cancelBounty,
    claimRefund,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

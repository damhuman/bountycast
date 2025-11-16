export const BountyEscrowABI = [
  {
    type: 'constructor',
    inputs: [{ name: '_treasury', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'createBounty',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'metadataHash', type: 'bytes32' },
    ],
    outputs: [{ name: 'bountyId', type: 'uint256' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'submitWork',
    inputs: [
      { name: 'bountyId', type: 'uint256' },
      { name: 'contentHash', type: 'bytes32' },
    ],
    outputs: [{ name: 'submissionId', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'selectWinner',
    inputs: [
      { name: 'bountyId', type: 'uint256' },
      { name: 'submissionId', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'cancelBounty',
    inputs: [{ name: 'bountyId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'claimRefund',
    inputs: [{ name: 'bountyId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getBounty',
    inputs: [{ name: 'bountyId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'creator', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
          { name: 'status', type: 'uint8' },
          { name: 'winner', type: 'address' },
          { name: 'metadataHash', type: 'bytes32' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'submissionCount', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getBountyCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'BountyCreated',
    inputs: [
      { name: 'bountyId', type: 'uint256', indexed: true },
      { name: 'creator', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'deadline', type: 'uint256', indexed: false },
      { name: 'metadataHash', type: 'bytes32', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'SubmissionCreated',
    inputs: [
      { name: 'bountyId', type: 'uint256', indexed: true },
      { name: 'submissionId', type: 'uint256', indexed: true },
      { name: 'submitter', type: 'address', indexed: true },
      { name: 'contentHash', type: 'bytes32', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'WinnerSelected',
    inputs: [
      { name: 'bountyId', type: 'uint256', indexed: true },
      { name: 'submissionId', type: 'uint256', indexed: true },
      { name: 'winner', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
] as const

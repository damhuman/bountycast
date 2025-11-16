// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BountyEscrow
 * @notice Escrow contract for managing micro-bounties on Farcaster
 * @dev Handles bounty creation, submission tracking, winner selection, and automatic payouts
 */
contract BountyEscrow is ReentrancyGuard, Pausable, Ownable {
    // ============ State Variables ============

    uint256 public constant PLATFORM_FEE_BPS = 250; // 2.5%
    uint256 public constant BPS_DIVISOR = 10000;
    uint256 public constant REFUND_GRACE_PERIOD = 7 days;

    uint256 private _bountyIdCounter;
    address public treasury;

    // ============ Structs ============

    enum BountyStatus {
        ACTIVE,
        COMPLETED,
        CANCELLED,
        EXPIRED
    }

    struct Bounty {
        address creator;
        uint256 amount;
        uint256 deadline;
        BountyStatus status;
        address winner;
        bytes32 metadataHash; // IPFS hash of bounty details
        uint256 createdAt;
        uint256 submissionCount;
    }

    struct Submission {
        address submitter;
        bytes32 contentHash; // IPFS hash of submission
        uint256 timestamp;
    }

    // ============ Storage ============

    mapping(uint256 => Bounty) public bounties;
    mapping(uint256 => mapping(uint256 => Submission)) public submissions; // bountyId => submissionId => Submission
    mapping(uint256 => uint256) public bountySubmissionCount;

    // ============ Events ============

    event BountyCreated(
        uint256 indexed bountyId,
        address indexed creator,
        uint256 amount,
        uint256 deadline,
        bytes32 metadataHash
    );

    event SubmissionCreated(
        uint256 indexed bountyId,
        uint256 indexed submissionId,
        address indexed submitter,
        bytes32 contentHash
    );

    event WinnerSelected(
        uint256 indexed bountyId,
        uint256 indexed submissionId,
        address indexed winner,
        uint256 amount
    );

    event BountyCancelled(uint256 indexed bountyId, address indexed creator);

    event RefundClaimed(
        uint256 indexed bountyId,
        address indexed creator,
        uint256 amount
    );

    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    // ============ Errors ============

    error InvalidAmount();
    error InvalidDeadline();
    error BountyNotFound();
    error BountyNotActive();
    error NotBountyCreator();
    error DeadlineNotPassed();
    error NoSubmissions();
    error InvalidSubmissionId();
    error AlreadyHasWinner();
    error TransferFailed();
    error RefundPeriodNotPassed();

    // ============ Constructor ============

    constructor(address _treasury) Ownable(msg.sender) {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
    }

    // ============ Core Functions ============

    /**
     * @notice Create a new bounty with escrowed funds
     * @param amount The bounty reward amount (excluding platform fee)
     * @param deadline Unix timestamp when bounty expires
     * @param metadataHash IPFS hash containing bounty details
     * @return bountyId The ID of the created bounty
     */
    function createBounty(
        uint256 amount,
        uint256 deadline,
        bytes32 metadataHash
    ) external payable whenNotPaused nonReentrant returns (uint256 bountyId) {
        if (amount == 0) revert InvalidAmount();
        if (deadline <= block.timestamp) revert InvalidDeadline();

        uint256 platformFee = (amount * PLATFORM_FEE_BPS) / BPS_DIVISOR;
        uint256 totalRequired = amount + platformFee;

        if (msg.value != totalRequired) revert InvalidAmount();

        bountyId = _bountyIdCounter++;

        bounties[bountyId] = Bounty({
            creator: msg.sender,
            amount: amount,
            deadline: deadline,
            status: BountyStatus.ACTIVE,
            winner: address(0),
            metadataHash: metadataHash,
            createdAt: block.timestamp,
            submissionCount: 0
        });

        // Transfer platform fee to treasury immediately
        (bool success, ) = treasury.call{value: platformFee}("");
        if (!success) revert TransferFailed();

        emit BountyCreated(bountyId, msg.sender, amount, deadline, metadataHash);
    }

    /**
     * @notice Submit work for a bounty
     * @param bountyId The ID of the bounty
     * @param contentHash IPFS hash of the submission content
     * @return submissionId The ID of the created submission
     */
    function submitWork(
        uint256 bountyId,
        bytes32 contentHash
    ) external whenNotPaused returns (uint256 submissionId) {
        Bounty storage bounty = bounties[bountyId];

        if (bounty.creator == address(0)) revert BountyNotFound();
        if (bounty.status != BountyStatus.ACTIVE) revert BountyNotActive();
        if (block.timestamp > bounty.deadline) revert DeadlineNotPassed();

        submissionId = bountySubmissionCount[bountyId]++;

        submissions[bountyId][submissionId] = Submission({
            submitter: msg.sender,
            contentHash: contentHash,
            timestamp: block.timestamp
        });

        bounty.submissionCount++;

        emit SubmissionCreated(bountyId, submissionId, msg.sender, contentHash);
    }

    /**
     * @notice Select a winner and distribute funds
     * @param bountyId The ID of the bounty
     * @param submissionId The ID of the winning submission
     */
    function selectWinner(
        uint256 bountyId,
        uint256 submissionId
    ) external nonReentrant {
        Bounty storage bounty = bounties[bountyId];

        if (bounty.creator == address(0)) revert BountyNotFound();
        if (msg.sender != bounty.creator) revert NotBountyCreator();
        if (bounty.status != BountyStatus.ACTIVE) revert BountyNotActive();
        if (bounty.winner != address(0)) revert AlreadyHasWinner();
        if (submissionId >= bountySubmissionCount[bountyId]) revert InvalidSubmissionId();

        Submission storage submission = submissions[bountyId][submissionId];
        address winner = submission.submitter;

        bounty.status = BountyStatus.COMPLETED;
        bounty.winner = winner;

        // Transfer bounty amount to winner
        (bool success, ) = winner.call{value: bounty.amount}("");
        if (!success) revert TransferFailed();

        emit WinnerSelected(bountyId, submissionId, winner, bounty.amount);
    }

    /**
     * @notice Cancel a bounty (only if no submissions or after deadline + grace period)
     * @param bountyId The ID of the bounty to cancel
     */
    function cancelBounty(uint256 bountyId) external nonReentrant {
        Bounty storage bounty = bounties[bountyId];

        if (bounty.creator == address(0)) revert BountyNotFound();
        if (msg.sender != bounty.creator) revert NotBountyCreator();
        if (bounty.status != BountyStatus.ACTIVE) revert BountyNotActive();

        // Can only cancel if no submissions OR deadline + grace period has passed
        bool canCancel = bounty.submissionCount == 0 ||
                         block.timestamp > bounty.deadline + REFUND_GRACE_PERIOD;

        if (!canCancel) revert RefundPeriodNotPassed();

        bounty.status = BountyStatus.CANCELLED;

        // Refund bounty amount to creator
        (bool success, ) = bounty.creator.call{value: bounty.amount}("");
        if (!success) revert TransferFailed();

        emit BountyCancelled(bountyId, bounty.creator);
    }

    /**
     * @notice Claim refund for expired bounty with no winner selected
     * @param bountyId The ID of the bounty
     */
    function claimRefund(uint256 bountyId) external nonReentrant {
        Bounty storage bounty = bounties[bountyId];

        if (bounty.creator == address(0)) revert BountyNotFound();
        if (msg.sender != bounty.creator) revert NotBountyCreator();
        if (bounty.status != BountyStatus.ACTIVE) revert BountyNotActive();
        if (block.timestamp <= bounty.deadline + REFUND_GRACE_PERIOD) {
            revert RefundPeriodNotPassed();
        }

        bounty.status = BountyStatus.EXPIRED;

        // Refund bounty amount to creator
        (bool success, ) = bounty.creator.call{value: bounty.amount}("");
        if (!success) revert TransferFailed();

        emit RefundClaimed(bountyId, bounty.creator, bounty.amount);
    }

    // ============ View Functions ============

    /**
     * @notice Get bounty details
     * @param bountyId The ID of the bounty
     * @return Bounty struct
     */
    function getBounty(uint256 bountyId) external view returns (Bounty memory) {
        return bounties[bountyId];
    }

    /**
     * @notice Get submission details
     * @param bountyId The ID of the bounty
     * @param submissionId The ID of the submission
     * @return Submission struct
     */
    function getSubmission(
        uint256 bountyId,
        uint256 submissionId
    ) external view returns (Submission memory) {
        return submissions[bountyId][submissionId];
    }

    /**
     * @notice Get total number of bounties created
     * @return Total bounty count
     */
    function getBountyCount() external view returns (uint256) {
        return _bountyIdCounter;
    }

    /**
     * @notice Get number of submissions for a bounty
     * @param bountyId The ID of the bounty
     * @return Submission count
     */
    function getSubmissionCount(uint256 bountyId) external view returns (uint256) {
        return bountySubmissionCount[bountyId];
    }

    // ============ Admin Functions ============

    /**
     * @notice Update treasury address (only owner)
     * @param newTreasury New treasury address
     */
    function updateTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury");
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    /**
     * @notice Pause contract (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause contract (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}

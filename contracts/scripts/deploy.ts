import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Treasury address (change this to your treasury address)
  const treasuryAddress = process.env.TREASURY_ADDRESS || deployer.address;

  console.log("Treasury address:", treasuryAddress);

  // Deploy BountyEscrow
  const BountyEscrow = await ethers.getContractFactory("BountyEscrow");
  const bountyEscrow = await BountyEscrow.deploy(treasuryAddress);

  await bountyEscrow.waitForDeployment();

  const address = await bountyEscrow.getAddress();

  console.log("BountyEscrow deployed to:", address);
  console.log("\n=== Deployment Summary ===");
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Chain ID:", (await ethers.provider.getNetwork()).chainId);
  console.log("Contract Address:", address);
  console.log("Treasury Address:", treasuryAddress);
  console.log("\n=== Next Steps ===");
  console.log("1. Update .env.local with:");
  console.log(`   NEXT_PUBLIC_BOUNTY_CONTRACT=${address}`);
  console.log("\n2. Verify contract on Basescan:");
  console.log(`   npx hardhat verify --network baseSepolia ${address} ${treasuryAddress}`);
  console.log("\n3. Update lib/config.ts with the contract address");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

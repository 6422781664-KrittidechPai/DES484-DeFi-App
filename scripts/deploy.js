// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  // Fetch the contract factory for sETH
  const sETH = await hre.ethers.getContractFactory("sETH");

  // Deploy the sETH contract
  const sETHContract = await sETH.deploy();

  // Wait for the deployment to complete
  await sETHContract.waitForDeployment();

  // Log the deployed contract address
  console.log("sETH contract deployed to:", await sETHContract.getAddress());
}

// Handle errors and invoke the main function
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

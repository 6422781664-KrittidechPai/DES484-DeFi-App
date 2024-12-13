// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  // Deploy MockChainlink contract
  const MockChainlink = await hre.ethers.getContractFactory("MockChainlink");
  const mockChainlink = await MockChainlink.deploy();
  await mockChainlink.waitForDeployment();
  console.log("MockChainlink contract deployed to:", await mockChainlink.getAddress());

  // Deploy MockOracle contract with the address of MockChainlink
  const MockOracle = await hre.ethers.getContractFactory("MockOracle");
  const mockOracle = await MockOracle.deploy(await mockChainlink.getAddress());
  await mockOracle.waitForDeployment();
  console.log("MockOracle contract deployed to:", await mockOracle.getAddress());
}

// Handle errors and invoke the main function
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

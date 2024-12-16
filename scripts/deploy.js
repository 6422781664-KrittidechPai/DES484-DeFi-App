const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // ===============================
  // Deploy MockChainlink Contract
  // ===============================
  const MockChainlink = await hre.ethers.getContractFactory("MockChainlink");
  console.log("Deploying MockChainlink...");
  const mockChainlink = await MockChainlink.deploy();
  await mockChainlink.waitForDeployment();
  console.log("MockChainlink contract deployed to:", await mockChainlink.getAddress());

  // ===============================
  // Deploy MockOracle Contract
  // ===============================
  const MockOracle = await hre.ethers.getContractFactory("MockOracle");
  console.log("Deploying MockOracle...");
  const mockOracle = await MockOracle.deploy(await mockChainlink.getAddress());
  await mockOracle.waitForDeployment();
  console.log("MockOracle contract deployed to:", await mockOracle.getAddress());

  // ===============================
  // Deploy sToken Contracts (sETH, sBTC, mBTC)
  // ===============================
  const sTokenFactory = await hre.ethers.getContractFactory("sToken");

  console.log("Deploying sETH...");
  const sETH = await sTokenFactory.deploy("Synthetic ETH", "sETH");
  await sETH.waitForDeployment();
  console.log("sETH contract deployed to:", await sETH.getAddress());

  console.log("Deploying sBTC...");
  const sBTC = await sTokenFactory.deploy("Synthetic BTC", "sBTC");
  await sBTC.waitForDeployment();
  console.log("sBTC contract deployed to:", await sBTC.getAddress());

  console.log("Deploying mBTC...");
  const mBTC = await sTokenFactory.deploy("Mock BTC", "mBTC");
  await mBTC.waitForDeployment();
  console.log("mBTC contract deployed to:", await mBTC.getAddress());

  // ===============================
  // Deploy LinearInterestRateModel Contract
  // ===============================
  const LinearInterestRateModel = await hre.ethers.getContractFactory("LinearInterestRateModel");
  console.log("Deploying LinearInterestRateModel...");
  const interestRateModel = await LinearInterestRateModel.deploy();
  await interestRateModel.waitForDeployment();
  console.log("LinearInterestRateModel contract deployed to:", await interestRateModel.getAddress());

  // ===============================
  // Deploy Liquidation Contract
  // ===============================
  // Deploy Liquidation contract with a specified collateral factor (for 75%)
  const collateralFactor = 75; // Example value, adjust as needed
  const Liquidation = await hre.ethers.getContractFactory("Liquidation");
  const liquidation = await Liquidation.deploy(collateralFactor);
  await liquidation.waitForDeployment();
  console.log("Liquidation contract deployed to:", await liquidation.getAddress());

  // ===============================
  // Deploy LendingPool Contract
  // ===============================
  const LendingPool = await hre.ethers.getContractFactory("LendingPool");
  console.log("Deploying LendingPool...");

  const lendingPoolContract = await LendingPool.deploy(
    await sETH.getAddress(), // use sETH contract address
    await sBTC.getAddress(), // use sBTC contract address
    await mBTC.getAddress(), // use mBTC contract address
    await mockOracle.getAddress(), // use mockOracle contract address
    await interestRateModel.getAddress(), // use interestRateModel contract address
    await liquidation.getAddress() // use liquidation contract address
  );

  await lendingPoolContract.waitForDeployment();
  console.log("LendingPool Contract deployed to:", lendingPoolContract.address);

  // ===============================
  // Deployment Summary
  // ===============================
  console.log("Deployment Summary:");
  console.log("MockChainlink deployed to:", await mockChainlink.getAddress());
  console.log("MockOracle deployed to:", await mockOracle.getAddress());
  console.log("sETH deployed to:", await sETH.getAddress());
  console.log("sBTC deployed to:", await sBTC.getAddress());
  console.log("mBTC deployed to:", await mBTC.getAddress());
  console.log("LendingPool deployed to:", await lendingPoolContract.getAddress());
}

// Handle errors and invoke the main function
main().catch((error) => {
  console.error("Error during deployment:", error);
  process.exitCode = 1;
});

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

  // Initialize the prices
  const ethPrice = hre.ethers.parseUnits("20000", 18);
  const mbtcPrice = hre.ethers.parseUnits("5000", 18);

  const ethAssetId = ethers.encodeBytes32String("ETH");
  const mbtcAssetId = ethers.encodeBytes32String("BTC");

  const setETHPrice = await mockChainlink.setPrice(ethAssetId, ethPrice);
  await setETHPrice.wait();
  console.log("ETH price set to: ", ethPrice.toString());

  const setmBTCPrice = await mockChainlink.setPrice(mbtcAssetId, mbtcPrice);
  await setmBTCPrice.wait();
  console.log("mBTC price set to: ", mbtcPrice.toString());

  // ===============================
  // Deploy MockOracle Contract
  // ===============================
  const MockOracle = await hre.ethers.getContractFactory("MockOracle");
  console.log("Deploying MockOracle...");
  const mockOracle = await MockOracle.deploy(await mockChainlink.getAddress());
  await mockOracle.waitForDeployment();
  console.log("MockOracle contract deployed to:", await mockOracle.getAddress());

  await mockOracle.fetchPrice(ethers.toUtf8Bytes("ETH"));
  await mockOracle.fetchPrice(ethers.toUtf8Bytes("BTC"));


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

  await lendingPoolContract.updatePrices();

/// for test ///
  const test = await hre.ethers.getContractFactory("test");
  const Test = await test.deploy();
  await Test.waitForDeployment();
  console.log("test deployed to",Test.address);

  // ===============================
  // Deployment Summary
  // ===============================
  console.log("Deployment Summary:");
  console.log("MockChainlink deployed to:", await mockChainlink.getAddress());
  console.log("MockOracle deployed to:", await mockOracle.getAddress());
  console.log("sETH deployed to:", await sETH.getAddress());
  console.log("sBTC deployed to:", await sBTC.getAddress());
  console.log("mBTC deployed to:", await mBTC.getAddress());
  console.log("interestRateModel deployed to:", await interestRateModel.getAddress());
  console.log("Liquidation deployed to:", await liquidation.getAddress());
  console.log("LendingPool deployed to:", await lendingPoolContract.getAddress());
  console.log("test deployed to:", await Test.getAddress());
}

// Handle errors and invoke the main function
main().catch((error) => {
  console.error("Error during deployment:", error);
  process.exitCode = 1;
});

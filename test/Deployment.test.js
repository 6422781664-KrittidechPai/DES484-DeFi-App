const { expect } = require("chai");
const { ethers } = require("hardhat");

describe.skip("Deployment Test", function () {
    let LendingPool, sETH, sBTC, mBTC;
    let owner;
  
    beforeEach(async function () {
      [owner] = await ethers.getSigners();
  
      // Deploy the sToken (sETH, sBTC, mBTC) contracts
      const sTokenFactory = await ethers.getContractFactory("sToken");
      sETH = await sTokenFactory.deploy("Synthetic ETH", "sETH");
      sBTC = await sTokenFactory.deploy("Synthetic BTC", "sBTC");
      mBTC = await sTokenFactory.deploy("mBTC", "mBTC");
  
      // Deploy LendingPool contract with addresses of sETH, sBTC, and mBTC contracts
      const LendingPoolFactory = await ethers.getContractFactory("LendingPool");
      LendingPool = await LendingPoolFactory.deploy(await sETH.getAddress(), await sBTC.getAddress(), await mBTC.getAddress());
    });
  
    it("should deploy the contracts and ensure none of the addresses are null", async function () {
      // Check if the contract addresses are not null
      expect(await sETH.getAddress()).to.not.equal(ethers.ZeroAddress, "sETH address is null");
      expect(await sBTC.getAddress()).to.not.equal(ethers.ZeroAddress, "sBTC address is null");
      expect(await mBTC.getAddress()).to.not.equal(ethers.ZeroAddress, "mBTC address is null");
      expect(await LendingPool.getAddress()).to.not.equal(ethers.ZeroAddress, "LendingPool address is null");
  
      // Ensure that LendingPool has the correct addresses for sETH, sBTC, and mBTC
      expect(await LendingPool.sETHContract()).to.equal(await sETH.getAddress(), "sETH address in LendingPool is incorrect");
      expect(await LendingPool.sBTCContract()).to.equal(await sBTC.getAddress(), "sBTC address in LendingPool is incorrect");
      expect(await LendingPool.mBTCContract()).to.equal(await mBTC.getAddress(), "mBTC address in LendingPool is incorrect");
    });
  });
  
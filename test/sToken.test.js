const { expect } = require("chai");
const hre = require("hardhat");

describe("LendingPool Contract", function () {
  let lendingPool;
  let sETH;
  let sBTC;
  let owner;
  let user1;

  beforeEach(async function () {
    // Get the signers
    [owner, user1] = await hre.ethers.getSigners();

    // Deploy the sToken contract for both sETH and sBTC
    const sTokenFactory = await hre.ethers.getContractFactory("sToken");
    
    sETH = await sTokenFactory.deploy(owner.address, "Support ETH", "sETH", "ETH");
    await sETH.waitForDeployment(); // Use waitForDeployment

    sBTC = await sTokenFactory.deploy(owner.address, "Support BTC", "sBTC", "BTC");
    await sBTC.waitForDeployment(); // Use waitForDeployment

    // Deploy the LendingPool contract
    const LendingPoolFactory = await hre.ethers.getContractFactory("LendingPool");
    lendingPool = await LendingPoolFactory.deploy();
    await lendingPool.waitForDeployment(); // Use waitForDeployment

    // Set the sToken addresses in LendingPool contract
    await lendingPool.setTokenAddresses(await sETH.getAddress(), await sBTC.getAddress());

    // Fund user1 with some ETH for deposit
    await owner.sendTransaction({
      to: user1.address,
      value: hre.ethers.parseEther("10.0"), // Use hre.ethers.parseEther
    });
  });

  describe("Deposit functionality", function () {
    it("should allow user to deposit ETH and mint sETH", async function () {
      const depositAmount = hre.ethers.parseEther("1.0"); // Use hre.ethers.parseEther

      // Connect user1 and deposit ETH
      await lendingPool.connect(user1).deposit(depositAmount, "ETH");

      // Check balances
      const userBalance = await sETH.balanceOf(user1.address);
      expect(userBalance).to.equal(depositAmount);
    });

    it("should allow user to deposit BTC and mint sBTC", async function () {
      const depositAmount = hre.ethers.parseEther("1.0"); // Use hre.ethers.parseEther

      // Connect user1 and deposit BTC (assuming deposit logic for BTC is simulated)
      await lendingPool.connect(user1).deposit(depositAmount, "BTC");

      // Check balances
      const userBalance = await sBTC.balanceOf(user1.address);
      expect(userBalance).to.equal(depositAmount);
    });
  });

  describe("Withdraw functionality", function () {
    it("should allow user to withdraw sETH and burn the tokens", async function () {
      const depositAmount = hre.ethers.parseEther("1.0"); // Use hre.ethers.parseEther

      // User deposits ETH and mints sETH
      await lendingPool.connect(user1).deposit(depositAmount, "ETH");

      // Now withdraw sETH
      await lendingPool.connect(user1).withdraw(depositAmount, "ETH");

      // Check the balance of sETH for user1 should be 0
      const userBalance = await sETH.balanceOf(user1.address);
      expect(userBalance).to.equal(0);
    });

    it("should allow user to withdraw sBTC and burn the tokens", async function () {
      const depositAmount = hre.ethers.parseEther("1.0"); // Use hre.ethers.parseEther

      // User deposits BTC and mints sBTC
      await lendingPool.connect(user1).deposit(depositAmount, "BTC");

      // Now withdraw sBTC
      await lendingPool.connect(user1).withdraw(depositAmount, "BTC");

      // Check the balance of sBTC for user1 should be 0
      const userBalance = await sBTC.balanceOf(user1.address);
      expect(userBalance).to.equal(0);
    });
  });
});

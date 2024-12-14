const { expect } = require("chai");
const { ethers } = require("hardhat");

describe.skip("LendingPool Contract", function () {
  let LendingPool, sToken, sETH, sBTC, mBTC;
  let owner, user1, user2;
  const initialDepositAmount = ethers.parseEther("1"); // 1 ETH or 1 mBTC
  const mBTCAmount = ethers.parseUnits("1", 8); // For 1 mBTC assuming 8 decimals

  beforeEach(async function () {
    // Deploy the sToken (sETH, sBTC, mBTC) contracts
    [owner, user1, user2] = await ethers.getSigners();

    const sTokenFactory = await ethers.getContractFactory("sToken");
    sETH = await sTokenFactory.deploy("Synthetic ETH", "sETH");
    await sETH.waitForDeployment();
    sBTC = await sTokenFactory.deploy("Synthetic BTC", "sBTC");
    await sBTC.waitForDeployment();
    mBTC = await sTokenFactory.deploy("mBTC", "mBTC");
    await mBTC.waitForDeployment();

    // Ensure the contracts were deployed and check their addresses
    expect(sETH.address).to.not.equal(ethers.ZeroAddress);
    expect(sBTC.address).to.not.equal(ethers.ZeroAddress);
    expect(mBTC.address).to.not.equal(ethers.ZeroAddress);

    // Deploy LendingPool contract with addresses of sETH, sBTC, and mBTC contracts
    const LendingPoolFactory = await ethers.getContractFactory("LendingPool");
    LendingPool = await LendingPoolFactory.deploy(sETH.address, sBTC.address, mBTC.address);
    await LendingPool.waitForDeployment();

    // Fund user1 with mBTC
    await mBTC.mint(user1.address, mBTCAmount);
    await mBTC.connect(user1).approve(LendingPool.address, mBTCAmount);
  });

  describe("Deposit and Withdraw ETH", function () {
    it("should deposit ETH and mint corresponding sETH", async function () {
      const depositAmount = initialDepositAmount;

      // User1 deposits ETH
      await LendingPool.connect(user1).deposit(depositAmount, "ETH");

      // Check the balance of the synthetic token (sETH) minted
      const sETHBalance = await sETH.balanceOf(user1.address);
      expect(sETHBalance).to.equal(depositAmount);

      // User1 withdraws ETH
      await expect(() =>
        LendingPool.connect(user1).withdraw(depositAmount, "ETH")
      ).to.changeEtherBalances([user1, LendingPool], [depositAmount, -depositAmount]);

      // Check sETH balance after withdrawal
      const finalBalance = await sETH.balanceOf(user1.address);
      expect(finalBalance).to.equal(0);
    });

    it("should revert if user tries to withdraw more than they have", async function () {
      const depositAmount = initialDepositAmount;

      // User1 deposits ETH
      await LendingPool.connect(user1).deposit(depositAmount, "ETH");

      // Try to withdraw more than the deposited amount
      await expect(
        LendingPool.connect(user1).withdraw(depositAmount.add(1), "ETH")
      ).to.be.revertedWith("Insufficient sETH balance");
    });
  });

  describe("Deposit and Withdraw mBTC", function () {
    it("should deposit mBTC and mint corresponding sBTC", async function () {
      const depositAmount = mBTCAmount;

      // User1 deposits mBTC
      await LendingPool.connect(user1).deposit(depositAmount, "BTC");

      // Check the balance of the synthetic token (sBTC) minted
      const sBTCBalance = await sBTC.balanceOf(user1.address);
      expect(sBTCBalance).to.equal(depositAmount);

      // User1 withdraws mBTC
      await expect(() =>
        LendingPool.connect(user1).withdraw(depositAmount, "BTC")
      ).to.changeTokenBalances(mBTC, [user1, LendingPool], [depositAmount, -depositAmount]);

      // Check sBTC balance after withdrawal
      const finalBalance = await sBTC.balanceOf(user1.address);
      expect(finalBalance).to.equal(0);
    });

    it("should revert if user tries to withdraw more than they have", async function () {
      const depositAmount = mBTCAmount;

      // User1 deposits mBTC
      await LendingPool.connect(user1).deposit(depositAmount, "BTC");

      // Try to withdraw more than the deposited amount
      await expect(
        LendingPool.connect(user1).withdraw(mBTCAmount.add(1), "BTC")
      ).to.be.revertedWith("Insufficient sBTC balance");
    });
  });

  describe("Edge Cases", function () {
    it("should revert if user deposits an invalid token type", async function () {
      await expect(
        LendingPool.connect(user1).deposit(initialDepositAmount, "INVALID")
      ).to.be.revertedWith("Invalid token type");
    });

    it("should revert if user tries to withdraw an invalid token type", async function () {
      await expect(
        LendingPool.connect(user1).withdraw(initialDepositAmount, "INVALID")
      ).to.be.revertedWith("Invalid token type");
    });
  });
});

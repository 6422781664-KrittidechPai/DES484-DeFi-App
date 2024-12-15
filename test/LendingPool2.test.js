const { expect } = require("chai");
const { ethers } = require("hardhat");

describe.skip("LendingPool2 Contract", function () {
  let LendingPool, sToken, sETH, sBTC, mBTC, mockChainlink, mockOracle;
  let owner, user1, user2;
  const initialDepositAmount = ethers.parseEther("1"); // 1 ETH or 1 mBTC
  const mBTCAmount = ethers.parseUnits("1", 8); // 1 mBTC in 8 decimals
  const BTC_PRICE = ethers.parseUnits("20000", 8); // Example BTC price in USD (mock value)
  const ETH_PRICE = ethers.parseUnits("1500", 8); // Example ETH price in USD (mock value)

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const sTokenFactory = await ethers.getContractFactory("sToken");
    sETH = await sTokenFactory.deploy("Synthetic ETH", "sETH");
    await sETH.waitForDeployment();
    sBTC = await sTokenFactory.deploy("Synthetic BTC", "sBTC");
    await sBTC.waitForDeployment();
    mBTC = await sTokenFactory.deploy("mBTC", "mBTC");
    await mBTC.waitForDeployment();

    expect(sETH.getAddress()).to.not.equal(ethers.ZeroAddress);
    expect(sBTC.getAddress()).to.not.equal(ethers.ZeroAddress);
    expect(mBTC.getAddress()).to.not.equal(ethers.ZeroAddress);

    const MockChainlinkFactory = await ethers.getContractFactory("MockChainlink");
    mockChainlink = await MockChainlinkFactory.deploy();
    await mockChainlink.waitForDeployment();

    await mockChainlink.setPrice(ethers.toUtf8Bytes("BTC"), BTC_PRICE);
    await mockChainlink.setPrice(ethers.toUtf8Bytes("ETH"), ETH_PRICE);

    const MockOracleFactory = await ethers.getContractFactory("MockOracle");
    mockOracle = await MockOracleFactory.deploy(mockChainlink.getAddress());
    await mockOracle.waitForDeployment();

    const LendingPoolFactory = await ethers.getContractFactory("LendingPool");
    LendingPool = await LendingPoolFactory.deploy(sETH.getAddress(), sBTC.getAddress(), mBTC.getAddress(), mockOracle.getAddress());
    await LendingPool.waitForDeployment();
    await LendingPool.updatePrices();

    await mBTC.mint(user1.getAddress(), mBTCAmount);
    await mBTC.connect(user1).approve(LendingPool.getAddress(), mBTCAmount);
  });

  describe("Deposit and Withdraw Collateral", function () {
    it("should deposit ETH as collateral", async function () {
      const depositAmount = initialDepositAmount;
      await LendingPool.connect(user1).depositCollateral(depositAmount, "ETH", { value: depositAmount });
      
      const collateralBalance = await LendingPool.getCollateralETH(user1.address);
      expect(collateralBalance).to.equal(depositAmount);
    });

    it("should deposit mBTC as collateral", async function () {
      const depositAmount = mBTCAmount;
      await LendingPool.connect(user1).depositCollateral(depositAmount, "BTC", { value: depositAmount });

      const collateralBalance = await LendingPool.getCollateralBTC(user1.address);
      expect(collateralBalance).to.equal(depositAmount);
    });

    it("should withdraw ETH collateral after loan repayment", async function () {
      const depositAmount = initialDepositAmount;
      await LendingPool.connect(user1).depositCollateral(depositAmount, "ETH", { value: depositAmount });

      // Simulate loan repayment by making borrowedETH 0
      await LendingPool.connect(user1).withdrawETHCollateral(depositAmount);
      
      const collateralBalance = await LendingPool.getCollateralETH(user1.address);
      expect(collateralBalance).to.equal(0);
    });

    it("should withdraw mBTC collateral after loan repayment", async function () {
      const depositAmount = mBTCAmount;
      await LendingPool.connect(user1).depositCollateral(depositAmount, "BTC", { value: depositAmount });

      // Simulate loan repayment by making borrowedmBTC 0
      await LendingPool.connect(user1).withdrawBTC(depositAmount);
      
      const collateralBalance = await LendingPool.getCollateralBTC(user1.address);
      expect(collateralBalance).to.equal(0);
    });
  });

  describe("Borrowing and Repayment", function () {
    it("should allow borrowing ETH if collateral is sufficient", async function () {
      const borrowAmount = ethers.parseEther("0.5"); // Borrow 0.5 ETH
      const depositAmount = initialDepositAmount;

      await LendingPool.connect(user1).depositCollateral(depositAmount, "ETH", { value: depositAmount });
      await LendingPool.connect(user1).borrowETH(borrowAmount);

      const borrowedBalance = await LendingPool.borrowedETH(user1.address);
      expect(borrowedBalance).to.equal(borrowAmount);
    });

    it("should allow borrowing mBTC if collateral is sufficient", async function () {
      const borrowAmount = ethers.parseUnits("0.5", 8); // Borrow 0.5 mBTC
      const depositAmount = mBTCAmount;

      await LendingPool.connect(user1).depositCollateral(depositAmount, "BTC", { value: depositAmount });
      await LendingPool.connect(user1).borrowBTC(borrowAmount);

      const borrowedBalance = await LendingPool.borrowedmBTC(user1.address);
      expect(borrowedBalance).to.equal(borrowAmount);
    });

    it("should not allow borrowing if collateral is insufficient", async function () {
      const borrowAmount = ethers.parseEther("5"); // Try to borrow more than available collateral

      await expect(
        LendingPool.connect(user1).borrowETH(borrowAmount)
      ).to.be.revertedWith("Insufficient collateral for the requested loan");
    });

    it("should allow repayment of borrowed ETH", async function () {
      const borrowAmount = ethers.parseEther("0.5"); // Borrow 0.5 ETH
      const repayAmount = ethers.parseEther("0.5");

      await LendingPool.connect(user1).depositCollateral(initialDepositAmount, "ETH", { value: initialDepositAmount });
      await LendingPool.connect(user1).borrowETH(borrowAmount);
      
      // Repay borrowed ETH
      await LendingPool.connect(user1).repayETH(repayAmount, { value: repayAmount });

      const borrowedBalance = await LendingPool.borrowedETH(user1.address);
      expect(borrowedBalance).to.equal(0);
    });

    it("should allow repayment of borrowed mBTC", async function () {
        const borrowAmount = ethers.parseUnits("0.5", 8); // Borrow 0.5 mBTC
        const repayAmount = ethers.parseUnits("0.5", 8);

        await LendingPool.connect(user1).depositCollateral(mBTCAmount, "BTC", { value: mBTCAmount });
        await LendingPool.connect(user1).borrowBTC(borrowAmount);

        // Approve the LendingPool contract to spend mBTC on behalf of user1
        await mBTC.connect(user1).approve(LendingPool.getAddress(), repayAmount);

        // Repay borrowed mBTC
        await LendingPool.connect(user1).repayBTC(repayAmount);

        const borrowedBalance = await LendingPool.borrowedmBTC(user1.address);
        expect(borrowedBalance).to.equal(0);
    });
  });
});

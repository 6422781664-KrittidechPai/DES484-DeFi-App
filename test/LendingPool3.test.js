const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LendingPool Contract", function () {
  let LendingPool, sToken, sETH, sBTC, mBTC, mockChainlink, mockOracle, interestModel;
  let owner, user1, user2;
  const initialDepositAmount = ethers.parseEther("1"); // 1 ETH
  const mBTCAmount = ethers.parseUnits("1", 8); // 1 mBTC, assuming 8 decimals
  const BTC_PRICE = ethers.parseUnits("20000", 8); // Example BTC price in USD
  const ETH_PRICE = ethers.parseUnits("1500", 8); // Example ETH price in USD

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy the sToken contracts
    const sTokenFactory = await ethers.getContractFactory("sToken");
    sETH = await sTokenFactory.deploy("Synthetic ETH", "sETH");
    await sETH.waitForDeployment();
    sBTC = await sTokenFactory.deploy("Synthetic BTC", "sBTC");
    await sBTC.waitForDeployment();
    mBTC = await sTokenFactory.deploy("mBTC", "mBTC");
    await mBTC.waitForDeployment();

    // Deploy mockChainlink contract
    const MockChainlinkFactory = await ethers.getContractFactory("MockChainlink");
    mockChainlink = await MockChainlinkFactory.deploy();
    await mockChainlink.waitForDeployment();
    await mockChainlink.setPrice(ethers.toUtf8Bytes("BTC"), BTC_PRICE);
    await mockChainlink.setPrice(ethers.toUtf8Bytes("ETH"), ETH_PRICE);

    // Deploy mockOracle contract
    const MockOracleFactory = await ethers.getContractFactory("MockOracle");
    mockOracle = await MockOracleFactory.deploy(mockChainlink.getAddress());
    await mockOracle.waitForDeployment();

    // Deploy the LinearInterestRateModel contract
    const LinearInterestRateModelFactory = await ethers.getContractFactory("LinearInterestRateModel");
    interestModel = await LinearInterestRateModelFactory.deploy();
    await interestModel.waitForDeployment();

    // Deploy LendingPool contract
    const LendingPoolFactory = await ethers.getContractFactory("LendingPool");
    LendingPool = await LendingPoolFactory.deploy(sETH.getAddress(), sBTC.getAddress(), mBTC.getAddress(), mockOracle.getAddress(), interestModel.getAddress());
    await LendingPool.waitForDeployment();
    await LendingPool.connect(user1).updatePrices();

    // Fund user1 with mBTC and approve the LendingPool to transfer it
    await mBTC.mint(user1.getAddress(), mBTCAmount);
    await mBTC.connect(user1).approve(LendingPool.getAddress(), mBTCAmount);
  });

  describe("Deposit and Withdraw Collateral", function () {
    it("should deposit ETH as collateral", async function () {
      const depositAmount = initialDepositAmount;

      await LendingPool.connect(user1).depositCollateral(depositAmount, "ETH", { value: depositAmount});

      const collateralETH = await LendingPool.getCollateralETH(user1.getAddress());
      expect(collateralETH).to.equal(depositAmount);
    });

    it("should deposit mBTC as collateral", async function () {
      const depositAmount = mBTCAmount;

      await LendingPool.connect(user1).depositCollateral(depositAmount, "BTC");

      const collateralBTC = await LendingPool.getCollateralBTC(user1.getAddress());
      expect(collateralBTC).to.equal(depositAmount);
    });

    it("should withdraw ETH collateral after loan repayment", async function () {
      const depositAmount = initialDepositAmount;
      await LendingPool.connect(user1).depositCollateral(depositAmount, "ETH");

      await LendingPool.connect(user1).borrowETH(depositAmount);

      await LendingPool.connect(user1).repayETH(depositAmount);

      await LendingPool.connect(user1).withdrawETHCollateral(depositAmount);

      const finalCollateralETH = await LendingPool.getCollateralETH(user1.getAddress());
      expect(finalCollateralETH).to.equal(0);
    });

    it("should withdraw mBTC collateral after loan repayment", async function () {
      const depositAmount = mBTCAmount;
      await LendingPool.connect(user1).depositCollateral(depositAmount, "BTC");

      await LendingPool.connect(user1).borrowBTC(depositAmount);

      await LendingPool.connect(user1).repayBTC(depositAmount);

      await LendingPool.connect(user1).withdrawBTCCollateral(depositAmount);

      const finalCollateralBTC = await LendingPool.getCollateralBTC(user1.getAddress());
      expect(finalCollateralBTC).to.equal(0);
    });
  });

  describe("Borrowing and Repayment", function () {
    it("should allow borrowing ETH with sufficient collateral", async function () {
      const depositAmount = initialDepositAmount;
      await LendingPool.connect(user1).depositCollateral(depositAmount, "ETH");

      await LendingPool.connect(user1).borrowETH(depositAmount);

      const borrowedETH = await LendingPool.borrowedETH(user1.getAddress());
      expect(borrowedETH).to.be.gt(0);
    });

    it("should not allow borrowing ETH with insufficient collateral", async function () {
      const depositAmount = initialDepositAmount;
      await LendingPool.connect(user1).depositCollateral(depositAmount, "ETH");

      await expect(LendingPool.connect(user1).borrowETH(depositAmount.mul(2)))
        .to.be.revertedWith("Insufficient collateral for the requested loan");
    });

    it("should allow borrowing mBTC with sufficient collateral", async function () {
      const depositAmount = mBTCAmount;
      await LendingPool.connect(user1).depositCollateral(depositAmount, "BTC");

      await LendingPool.connect(user1).borrowBTC(depositAmount);

      const borrowedBTC = await LendingPool.borrowedmBTC(user1.getAddress());
      expect(borrowedBTC).to.be.gt(0);
    });

    it("should not allow borrowing mBTC with insufficient collateral", async function () {
      const depositAmount = mBTCAmount;
      await LendingPool.connect(user1).depositCollateral(depositAmount, "BTC");

      await expect(LendingPool.connect(user1).borrowBTC(depositAmount.mul(2)))
        .to.be.revertedWith("Insufficient collateral for the requested loan");
    });

    it("should allow repayment of borrowed ETH", async function () {
      const depositAmount = initialDepositAmount;
      await LendingPool.connect(user1).depositCollateral(depositAmount, "ETH");

      await LendingPool.connect(user1).borrowETH(depositAmount);

      const borrowedETHBefore = await LendingPool.borrowedETH(user1.getAddress());

      await LendingPool.connect(user1).repayETH(depositAmount);

      const borrowedETHAfter = await LendingPool.borrowedETH(user1.getAddress());
      expect(borrowedETHBefore).to.be.gt(borrowedETHAfter);
      expect(borrowedETHAfter).to.equal(0);
    });

    it("should allow repayment of borrowed mBTC", async function () {
      const depositAmount = mBTCAmount;
      await LendingPool.connect(user1).depositCollateral(depositAmount, "BTC");

      await LendingPool.connect(user1).borrowBTC(depositAmount);

      const borrowedBTCBefore = await LendingPool.borrowedmBTC(user1.getAddress());

      await LendingPool.connect(user1).repayBTC(depositAmount);

      const borrowedBTCAfter = await LendingPool.borrowedmBTC(user1.getAddress());
      expect(borrowedBTCBefore).to.be.gt(borrowedBTCAfter);
      expect(borrowedBTCAfter).to.equal(0);
    });
  });

  describe("Debt and Deposit Calculations", function () {
    it("should return the correct debt value in USD", async function () {
      const depositAmountETH = initialDepositAmount;
      const depositAmountBTC = mBTCAmount;

      await LendingPool.connect(user1).depositCollateral(depositAmountETH, "ETH");
      await LendingPool.connect(user1).depositCollateral(depositAmountBTC, "BTC");

      await LendingPool.connect(user1).borrowETH(depositAmountETH);

      const debt = await LendingPool.getDebt(user1.getAddress());
      expect(debt).to.be.gt(0);
    });

    it("should return the correct deposit value in USD", async function () {
      const depositAmountETH = initialDepositAmount;
      const depositAmountBTC = mBTCAmount;

      await LendingPool.connect(user1).depositCollateral(depositAmountETH, "ETH");
      await LendingPool.connect(user1).depositCollateral(depositAmountBTC, "BTC");

      const deposit = await LendingPool.getDeposit(user1.getAddress());
      expect(deposit).to.be.gt(0);
    });
  });
});

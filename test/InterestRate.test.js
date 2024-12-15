const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("InterestRateModel", function () {
  let InterestRateModel, interestRateModel, MockLendingPool, mockLendingPool;
  const baseRate = ethers.utils.parseEther("0.05"); // 5% in wei
  const multiplier = ethers.utils.parseEther("0.1"); // 10% in wei

  beforeEach(async function () {
    // Deploy the mock LendingPool contract
    MockLendingPool = await ethers.getContractFactory("MockLendingPool");
    mockLendingPool = await MockLendingPool.deploy();
    await mockLendingPool.deployed();

    // Deploy the InterestRateModel contract
    InterestRateModel = await ethers.getContractFactory("InterestRateModel");
    interestRateModel = await InterestRateModel.deploy(
      mockLendingPool.address,
      baseRate,
      multiplier
    );
    await interestRateModel.deployed();
  });

  it("should calculate interest rate correctly", async function () {
    // Set mock LendingPool data
    const totalBorrow = ethers.utils.parseEther("500"); // 500 USD
    const totalDeposit = ethers.utils.parseEther("1000"); // 1000 USD
    await mockLendingPool.setTotalBorrow(totalBorrow);
    await mockLendingPool.setTotalDeposit(totalDeposit);

    // Calculate utilization ratio: 500 / 1000 = 0.5 (50%)
    // Interest rate = baseRate + (multiplier * utilizationRatio)
    //                = 0.05 + (0.1 * 0.5) = 0.1 (10%)

    const interestRate = await interestRateModel.getInterestRate();
    expect(interestRate).to.equal(ethers.utils.parseEther("0.1")); // 10%
  });
});

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe.skip("LinearInterestRateModel Contract", function () {
  let interestRateModel;
  let owner;
  
  // Constants for test
  const BASE_INTEREST_RATE = 10000000000000000n; // 1% base interest rate
  const MAX_INTEREST_RATE = 100000000000000000n; // 10% max interest rate
  const MAX_UTILIZATION_RATE = 1000000000000000000n; // 100%

  beforeEach(async function () {
    // Deploy LinearInterestRateModel contract
    const LinearInterestRateModel = await ethers.getContractFactory("LinearInterestRateModel");
    interestRateModel = await LinearInterestRateModel.deploy();
    await interestRateModel.waitForDeployment();

    // Get the owner address
    [owner] = await ethers.getSigners();
  });

  describe("Utilization Rate Calculation", function () {
    it("should calculate utilization rate correctly", async function () {
      const totalDeposits = 1000n; // 1000 units
      const totalBorrowed = 500n;  // 500 units

      const utilizationRate = await interestRateModel.calculateUtilizationRate(totalDeposits, totalBorrowed);

      // Should return 0.5 * 1e18 (utilization rate as percentage * 1e18)
      const expectedRate = (500n * 1000000000000000000n) / 1000n;
      expect(utilizationRate).to.equal(expectedRate);
    });

    it("should return 0 utilization rate if totalDeposits is 0", async function () {
      const totalDeposits = 0n;
      const totalBorrowed = 500n;

      const utilizationRate = await interestRateModel.calculateUtilizationRate(totalDeposits, totalBorrowed);
      expect(utilizationRate).to.equal(0n);
    });
  });

  describe("Interest Rate Calculation", function () {
    it("should calculate interest rate based on utilization rate", async function () {
      const totalDeposits = 1000n; // 1000 units
      const totalBorrowed = 500n;  // 500 units
      const utilizationRate = await interestRateModel.calculateUtilizationRate(totalDeposits, totalBorrowed)
      const interestRate = await interestRateModel.calculateInterestRate(utilizationRate);
      const expectedInterestRate = BASE_INTEREST_RATE + (utilizationRate * (MAX_INTEREST_RATE - BASE_INTEREST_RATE)) / MAX_UTILIZATION_RATE;
      expect(interestRate).to.equal(expectedInterestRate);
    });

    it("should return the base interest rate if no deposits are made", async function () {
      const totalDeposits = 0n; // 1000 units
      const totalBorrowed = 500n;  // 500 units
      const utilizationRate = await interestRateModel.calculateUtilizationRate(totalDeposits, totalBorrowed)
      const interestRate = await interestRateModel.calculateInterestRate(utilizationRate);
      expect(interestRate).to.equal(BASE_INTEREST_RATE);
    });

    it("should return max interest rate if utilization exceeds 100%", async function () {
      const totalDeposits = 1000n;
      const totalBorrowed = 1500n; // Borrowing more than available deposits (150%)
      const utilizationRate = await interestRateModel.calculateUtilizationRate(totalDeposits, totalBorrowed)

      const interestRate = await interestRateModel.calculateInterestRate(utilizationRate);

      // Interest rate should not exceed max interest rate
      expect(interestRate).to.equal(MAX_INTEREST_RATE);
    });
  });
});

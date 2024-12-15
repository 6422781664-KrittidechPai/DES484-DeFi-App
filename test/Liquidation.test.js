const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Liquidation Contract", function () {
  let liquidationContract;
  let owner;
  let borrower;
  let collateralAsset;

  const collateralFactor = 75; // 75%
  const initialCollateralValue = 1000; // 1000 units of collateral (e.g., in USD equivalent)
  const loanValue = 800; // 800 USD loan

  beforeEach(async function () {
    // Deploy the Liquidation contract
    const Liquidation = await ethers.getContractFactory("Liquidation");
    [owner, borrower] = await ethers.getSigners();
    liquidationContract = await Liquidation.deploy(collateralFactor);
    await liquidationContract.waitForDeployment();

    // Set loan and collateral values for the borrower
    // Assume the collateral is ETH in this example, with 1 ETH = 1000 USD equivalent
    await liquidationContract.setLoanAndCollateral(borrower.address, loanValue, initialCollateralValue, borrower.address);
  });

  it("should trigger liquidation when loan exceeds allowed value", async function () {
    // Set collateral price to 1 ETH = 1000 USD, so collateral value is 1000 USD
    const currentCollateralPrice = 1; // Mock value for ETH price in USD

    // Loan value is 800 USD, and the maximum loan allowed is CF * collateral value = 75% * 1000 = 750 USD
    // Since the loan value (800) is greater than 750, liquidation should occur

    await expect(liquidationContract.checkLiquidation(borrower.address, currentCollateralPrice))
      .to.emit(liquidationContract, "LiquidationTriggered")
      .withArgs(borrower.address, 50); // The shortfall should be 50 (800 - 750)

    // Check if the borrower has the correct loan and collateral values
    const loan = await liquidationContract.loanValue(borrower.address);
    const collateral = await liquidationContract.collateralValue(borrower.address);

    expect(loan).to.equal(loanValue);
    expect(collateral).to.equal(initialCollateralValue);
  });

  it("should not trigger liquidation if loan is within the allowed limit", async function () {
    // In this case, the loan is less than the allowed loan value (750 USD)
    const currentCollateralPrice = 1; // Collateral price = 1000 USD

    // Set the loan value to 700 USD, which is below the allowed limit of 750 USD
    await liquidationContract.setLoanAndCollateral(borrower.address, 700, initialCollateralValue, borrower.address);

    await expect(liquidationContract.checkLiquidation(borrower.address, currentCollateralPrice))
      .to.not.emit(liquidationContract, "LiquidationTriggered");
  });
});

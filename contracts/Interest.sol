// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract InterestRateModel {
    // Variables to store total borrow and deposit values
    uint256 public totalBorrow;
    uint256 public totalDeposit;

    // Constants for the linear interest rate formula
    uint256 public baseRate; // Base interest rate (in wei, e.g., 5% = 5e16)
    uint256 public multiplier; // Multiplier for utilization ratio (in wei, e.g., 10% = 1e17)

    // Events for logging updates
    event TotalBorrowUpdated(uint256 totalBorrow);
    event TotalDepositUpdated(uint256 totalDeposit);
    event BaseRateUpdated(uint256 baseRate);
    event MultiplierUpdated(uint256 multiplier);

    // Constructor to initialize interest rate parameters
    constructor(
        uint256 _baseRate,
        uint256 _multiplier
    ) {
        require(_baseRate <= 1e18, "Base rate must be <= 100%");
        require(_multiplier <= 1e18, "Multiplier must be <= 100%");

        baseRate = _baseRate;
        multiplier = _multiplier;
    }

    // Function to manually update the total borrow value
    function setTotalBorrow(uint256 _totalBorrow) external {
        totalBorrow = _totalBorrow;
        emit TotalBorrowUpdated(_totalBorrow);
    }

    // Function to manually update the total deposit value
    function setTotalDeposit(uint256 _totalDeposit) external {
        require(_totalDeposit > 0, "Total deposit must be greater than zero");
        totalDeposit = _totalDeposit;
        emit TotalDepositUpdated(_totalDeposit);
    }

    // Function to calculate the current interest rate
    function getInterestRate() external view returns (uint256) {
        require(totalDeposit > 0, "Total deposit must be greater than zero");

        // Utilization ratio = Total Borrow / Total Deposit
        uint256 utilization = (totalBorrow * 1e18) / totalDeposit;

        // Interest rate = Base Rate + (Multiplier * Utilization Ratio)
        uint256 interestRate = baseRate + ((multiplier * utilization) / 1e18);

        return interestRate;
    }

    // Function to update the base rate
    function setBaseRate(uint256 _baseRate) external {
        require(_baseRate <= 1e18, "Base rate must be <= 100%");
        baseRate = _baseRate;
        emit BaseRateUpdated(_baseRate);
    }

    // Function to update the multiplier
    function setMultiplier(uint256 _multiplier) external {
        require(_multiplier <= 1e18, "Multiplier must be <= 100%");
        multiplier = _multiplier;
        emit MultiplierUpdated(_multiplier);
    }
}

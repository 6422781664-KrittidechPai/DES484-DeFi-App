// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.28;

// interface LendingPool {
//     function getTotalBorrow() external view returns (uint256);
//     function getTotalDeposit() external view returns (uint256);
// }

// contract InterestRateModel {
//     address public lendingPool;

//     // Constants for the linear interest rate formula
//     uint256 public baseRate; // Base interest rate (in wei, e.g., 5% = 5e16)
//     uint256 public multiplier; // Multiplier for utilization ratio (in wei, e.g., 10% = 1e17)

//     // Constructor to initialize the LendingPool address and interest rate parameters
//     constructor(
//         address _lendingPool,
//         uint256 _baseRate,
//         uint256 _multiplier
//     ) {
//         require(_lendingPool != address(0), "Invalid Lending Pool address");
//         require(_baseRate <= 1e18, "Base rate must be <= 100%");
//         require(_multiplier <= 1e18, "Multiplier must be <= 100%");

//         lendingPool = _lendingPool;
//         baseRate = _baseRate;
//         multiplier = _multiplier;
//     }

//     // Function to calculate the current interest rate
//     function getInterestRate() external view returns (uint256) {
//         LendingPool pool = LendingPool(lendingPool);

//         // Fetch total borrow and deposit values
//         uint256 totalBorrow = pool.getTotalBorrow();
//         uint256 totalDeposit = pool.getTotalDeposit();

//         require(totalDeposit > 0, "Total deposit must be greater than zero");

//         // Utilization ratio = Total Borrow / Total Deposit
//         uint256 utilization = (totalBorrow * 1e18) / totalDeposit;

//         // Interest rate = Base Rate + (Multiplier * Utilization Ratio)
//         uint256 interestRate = baseRate + ((multiplier * utilization) / 1e18);

//         return interestRate;
//     }

//     // Function to update the base rate (restricted to owner)
//     function setBaseRate(uint256 _baseRate) external {
//         require(_baseRate <= 1e18, "Base rate must be <= 100%");
//         baseRate = _baseRate;
//     }

//     // Function to update the multiplier (restricted to owner)
//     function setMultiplier(uint256 _multiplier) external {
//         require(_multiplier <= 1e18, "Multiplier must be <= 100%");
//         multiplier = _multiplier;
//     }
// }

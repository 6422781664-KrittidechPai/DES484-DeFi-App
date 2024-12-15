// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract LinearInterestRateModel {
    // Variables to control the interest rate calculation
    uint256 public constant BASE_INTEREST_RATE = 1e16; // Minimum interest rate (1%)
    uint256 public constant MAX_INTEREST_RATE = 1e17; // Maximum interest rate (10%)
    uint256 public constant MAX_UTILIZATION_RATE = 1e18; // 100% utilization

    constructor() {}
    
    // Function to calculate the utilization rate
    function calculateUtilizationRate(uint256 totalDeposits, uint256 totalBorrowed) external pure returns (uint256) {
        // Prevent division by zero
        if (totalDeposits == 0) {
            return 0;
        }
        
        uint256 utilizationRate = (totalBorrowed * 1e18) / totalDeposits; // Utilization rate as a percentage (1e18 is 100%)
        
        if (utilizationRate > MAX_UTILIZATION_RATE) {
            utilizationRate = MAX_UTILIZATION_RATE;
        }

        return utilizationRate;
    }

    // Function to calculate the interest rate based on utilization
    function calculateInterestRate(uint256 utilizationRate) external pure returns (uint256) {
        // Linear interpolation to calculate interest rate based on utilization rate
        uint256 interestRate = BASE_INTEREST_RATE + (utilizationRate * (MAX_INTEREST_RATE - BASE_INTEREST_RATE)) / MAX_UTILIZATION_RATE;

        return interestRate;
    }
}

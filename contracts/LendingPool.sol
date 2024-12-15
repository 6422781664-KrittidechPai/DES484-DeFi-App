// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./sToken.sol";
import "./MockOracle.sol";
import "./LinearInterestRateModel.sol";
import "./Liquidation.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";

contract LendingPool {
    // References to the sToken contracts for ETH and BTC
    sToken public sETHContract;
    sToken public sBTCContract;
    sToken public mBTCContract;

    // Reference to MockOracle
    MockOracle public mockOracle;

    // Reference to interest contract
    LinearInterestRateModel public interest;

    // Mapping to track user balances in tokens
    mapping(address => uint256) public ETHPool;
    mapping(address => uint256) public mBTCPool;
    
    // Mapping to track user balances in synthetic tokens
    mapping(address => uint256) public sETHBalance;
    mapping(address => uint256) public sBTCBalance;

    // Mapping to track collateral and borrowed amounts
    mapping(address => uint256) public collateralETH; // Collateral in ETH
    mapping(address => uint256) public collateralmBTC; // Collateral in mBTC
    mapping(address => uint256) public borrowedETH; // Borrowed ETH
    mapping(address => uint256) public borrowedmBTC; // Borrowed mBTC

    // Mapping to track borrow logic
    mapping(address => bool) public isBorrowing;

    // Array for users
    address[] public users; // for user with deposits

    // Constants for token type hashing
    bytes32 private constant ETH_HASH = keccak256(abi.encodePacked("ETH"));
    bytes32 private constant BTC_HASH = keccak256(abi.encodePacked("BTC"));

    // Struct for AssetPrice
    struct AssetPrices {
        int256 btcPrice;
        int256 ethPrice;
    }

    AssetPrices public assetPrices;

    // Collateral Factor (e.g., 0.75 means users can borrow up to 75% of the value of their collateral)
    uint256 public collateralFactor = 75; // 75% collateral factor

    // util and interest rate
    uint256 public utilizationRate = 0;
    uint256 public interestRate = 1; // Base interest = 1%

    // Events for deposit actions
    event Deposited(address indexed user, uint256 amount, string tokenType);
    event CollateralDeposited(address indexed user, uint256 amount, string collateralType);
    event DepositFailed(address indexed user, uint256 amount, string reason);

    // Events for withdraw actions
    event Withdrawn(address indexed user, uint256 amount, string tokenType);
    event CollateralWithdrawn(address indexed user, uint256 amount, string collateralType);
    event WithdrawFailed(address indexed user, uint256 amount, string reason);

    // Event for borrowing
    event Borrowed(address indexed user, uint256 amount, string tokenType);
    event BorrowFail(address indexed user, uint256 amount, string reason);

    // Event for repaying
    event Repaid(address indexed user, uint256 amount, string tokenType);
    event RepayFailed(address indexed user, uint256 amount, string reason);

    // Event to log price updates
    event PriceUpdated(string assetId, int256 newPrice);

    constructor(address _sETHAddress, address _sBTCAddress, address _mBTCAddress, address _MockOracleAddress, address _interestRateModelAddress) {
        sETHContract = sToken(_sETHAddress);
        sBTCContract = sToken(_sBTCAddress);
        mBTCContract = sToken(_mBTCAddress);
        mockOracle = MockOracle(_MockOracleAddress);
        interest = LinearInterestRateModel(_interestRateModelAddress);
    }

    // Deposit function to deposit ETH or BTC into the LendingPool and mint corresponding sTokens
    function deposit(uint256 amount, string memory tokenType) external payable {
        require(amount > 0, "Amount must be greater than 0");
        
        bytes32 tokenTypeHash = keccak256(abi.encodePacked(tokenType));

        if (tokenTypeHash == ETH_HASH) {
            require(msg.value == amount, "ETH amount mismatch");

            // Mint sETH to the user
            sETHContract.mint(msg.sender, amount);
            sETHBalance[msg.sender] += amount;
            ETHPool[msg.sender] += amount;
            emit Deposited(msg.sender, amount, "ETH");
        } else if (tokenTypeHash == BTC_HASH) {
            require(msg.value == amount, "BTC amount mismatch");

            // Transfer mBTC from the user to the LendingPool
            require(mBTCContract.transferFrom(msg.sender, address(this), amount), "Transfer of mBTC failed");

            // Mint sBTC to the user
            sBTCContract.mint(msg.sender, amount);
            sBTCBalance[msg.sender] += amount;
            mBTCPool[msg.sender] += amount;
            emit Deposited(msg.sender, amount, "BTC");
        } else {
            emit DepositFailed(msg.sender, amount, "Invalid token type: Deposit");
            revert("Invalid token type: Deposit");
        }
    }

    // Withdraw function to withdraw sETH or mBTC and burn corresponding tokens
    function withdraw(uint256 amount, string memory tokenType) external payable {
        require(amount > 0, "Amount must be greater than 0");

        bytes32 tokenTypeHash = keccak256(abi.encodePacked(tokenType));

        if (tokenTypeHash == ETH_HASH) {
            
            require(sETHBalance[msg.sender] >= amount, "Insufficient sETH balance");

            sETHBalance[msg.sender] -= amount;
            ETHPool[msg.sender] -= amount;

            // Burn sETH from the user
            sETHContract.burn(msg.sender, amount);

            // Transfer ETH from the LendingPool to the user
            (bool success, ) = msg.sender.call{value: amount}("");
            require(success, "Transfer failed");

            emit Withdrawn(msg.sender, amount, "ETH");
        } else if (tokenTypeHash == BTC_HASH) {
            require(sBTCBalance[msg.sender] >= amount, "Insufficient sBTC balance");

            sBTCBalance[msg.sender] -= amount;
            mBTCPool[msg.sender] -= amount;

            // Burn sBTC from the user
            sBTCContract.burn(msg.sender, amount);

            // Transfer mBTC from the LendingPool to the user
            require(mBTCContract.transfer(msg.sender, amount), "Transfer of mBTC failed");

            emit Withdrawn(msg.sender, amount, "BTC");
        } else {
            emit WithdrawFailed(msg.sender, amount, "Invalid token type: Withdraw");
            revert("Invalid token type: Withdraw");
        }
    }

    // Function to get all users who have deposited
    function getAllUsers() public view returns (address[] memory) {
        return users;
    }

    // Function to update price from MockOracle
    function updatePrices() public {
        assetPrices.btcPrice = mockOracle.fetchPrice("BTC");
        assetPrices.ethPrice = mockOracle.fetchPrice("ETH");
    }

    // Function to calculate utilization and interest rate using the LinearInterestRateModel
    function calculateUtilizationAndInterestRate() public {
        uint256 totalDeposits = calculateTotalDepositsInUSD();
        uint256 totalBorrowings = calculateTotalBorrowingsInUSD();
        
        utilizationRate = interest.calculateUtilizationRate(totalDeposits, totalBorrowings);
        interestRate = interest.calculateInterestRate(utilizationRate);
    }

    // Function to calculate debt with interest
    function calculateValueWithInterest(uint256 amount) public returns (uint256){
        calculateUtilizationAndInterestRate();
        uint256 totalDebtWithInterest = amount + ((amount * interestRate) / 1e18);
        return totalDebtWithInterest;
    }

    // Function to deposit collateral (ETH or mBTC) into the lending pool
    function depositCollateral(uint256 amount, string memory tokenType) external payable {
        require(amount > 0, "Amount must be greater than 0");
        bytes32 tokenTypeHash = keccak256(abi.encodePacked(tokenType));

        if (tokenTypeHash == ETH_HASH) {
            // ETH deposit logic
            require(msg.value == amount, "ETH amount mismatch");

            // Add the ETH amount to the user's collateral balance
            collateralETH[msg.sender] += amount;

            emit CollateralWithdrawn(msg.sender, amount, "ETH");

        } else if (tokenTypeHash == BTC_HASH) {
            // mBTC deposit logic
            require(msg.value == amount, "mBTC amount mismatch");

            // Transfer mBTC from the user to the LendingPool
            require(mBTCContract.transferFrom(msg.sender, address(this), amount), "Transfer of mBTC failed");

            // Add the mBTC amount to the user's collateral balance
            collateralmBTC[msg.sender] += amount;

            emit CollateralWithdrawn(msg.sender, amount, "BTC");
        } else {
            emit DepositFailed(msg.sender, amount, "Invalid token type: Deposit Collateral");
            revert("Invalid token type: Deposit Collateral");
        }
    }

    // Function to withdraw ETH collateral after loan repayment
    function withdrawETHCollateral(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(collateralETH[msg.sender] >= amount, "Not enough collateral");
        require(borrowedETH[msg.sender] == 0, "Loan not fully repaid");

        // Update the collateral balance
        collateralETH[msg.sender] -= amount;

        // Transfer ETH collateral back to the user
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "ETH transfer failed");

        emit CollateralWithdrawn(msg.sender, amount, "ETH");
    }

    // Function to withdraw mBTC collateral after loan repayment
    function withdrawBTCCollateral(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(collateralmBTC[msg.sender] >= amount, "Not enough collateral");
        require(borrowedmBTC[msg.sender] == 0, "Loan not fully repaid");

        // Update the collateral balance
        collateralmBTC[msg.sender] -= amount;

        // Transfer mBTC collateral back to the user
        require(mBTCContract.transfer(msg.sender, amount), "mBTC transfer failed");

        emit CollateralWithdrawn(msg.sender, amount, "mBTC");
    }

    // Function to get the current collateral balance for the user in ETH
    function getCollateralETH(address user) public view returns (uint256) {
        return collateralETH[user];
    }

    // Function to get the current collateral balance for the user in mBTC
    function getCollateralBTC(address user) public view returns (uint256) {
        return collateralmBTC[user];
    }

    // Function to get the current collateral balance for the user in USD (ETH)
    function getCollateralETHInUSD(address user) public view returns (uint256) {
        uint256 collateralInETH = collateralETH[user];
        int256 ethPrice = assetPrices.ethPrice; // Replace with actual ETH price in USD
        return collateralInETH * uint256(ethPrice);
    }

    // Function to get the current collateral balance for the user in USD (mBTC)
    function getCollateralBTCInUSD(address user) public view returns (uint256) {
        uint256 collateralInBTC = collateralmBTC[user];
        int256 btcPrice = assetPrices.btcPrice; // Replace with actual mBTC price in USD
        return collateralInBTC * uint256(btcPrice);
    }

    // Function to calculate total deposits in the pool in USD
    function calculateTotalDepositsInUSD() public view returns (uint256 totalDepositsUSD) {
        uint256 ethPool = ETHPool[address(this)];
        uint256 btcPool = mBTCPool[address(this)];
        
        int256 ethPrice = assetPrices.ethPrice; // Replace with actual ETH price in USD
        int256 btcPrice = assetPrices.btcPrice; // Replace with actual mBTC price in USD
        
        totalDepositsUSD = (ethPool * uint256(ethPrice)) + (btcPool * uint256(btcPrice));
        return totalDepositsUSD;
    }

    // Function to calculate total borrowings in the pool in USD
    function calculateTotalBorrowingsInUSD() public view returns (uint256 totalBorrowingsUSD) {
        uint256 borrowedETHValue = borrowedETH[address(this)];
        uint256 borrowedBTCValue = borrowedmBTC[address(this)];
        
        int256 ethPrice = assetPrices.ethPrice; // Replace with actual ETH price in USD
        int256 btcPrice = assetPrices.btcPrice; // Replace with actual mBTC price in USD
        
        totalBorrowingsUSD = (borrowedETHValue * uint256(ethPrice)) + (borrowedBTCValue * uint256(btcPrice));
        return totalBorrowingsUSD;
    }
    
    // Calculate the total collateral value in USD for all native tokens (ETH and mBTC)
    function calculateTotalCollateralInUSD(address user) internal view returns (uint256 totalCollateralInUSD) {
        uint256 collateralETHAmount = collateralETH[user];
        uint256 collateralBTCAmount = collateralmBTC[user];

        // Get the current price of ETH and mBTC in USD
        int256 ethPrice = assetPrices.ethPrice; // ETH price in USD
        int256 btcPrice = assetPrices.btcPrice; // BTC price in USD

        uint256 collateralETHInUSD = 0;
        uint256 collateralBTCInUSD = 0;
        
        collateralETHInUSD = uint256(ethPrice) * collateralETHAmount;
        collateralBTCInUSD = uint256(btcPrice) * collateralBTCAmount;

        // Calculate total collateral value in USD
        totalCollateralInUSD = collateralETHInUSD + collateralBTCInUSD;
        return totalCollateralInUSD;
    }

    // Function to borrow ETH with collateral from both ETH and mBTC
    function borrowETH(uint256 amount) external {
        require(!isBorrowing[msg.sender], "User is already borrowing");
        require(amount > 0, "Amount must be greater than 0");

        uint256 totalCollateralInUSD = calculateTotalCollateralInUSD(msg.sender);

        uint256 borrowedValueInUSD = uint256(amount) * uint256(assetPrices.ethPrice);

        // Ensure the collateral is sufficient to borrow the amount (based on Collateral Factor)
        uint256 maxBorrowable = (totalCollateralInUSD * collateralFactor) / 100;
        require(borrowedValueInUSD <= maxBorrowable, "Insufficient collateral for the requested loan");

        borrowedETH[msg.sender] += amount;

        // Transfer the borrowed ETH to the user
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "ETH transfer failed");

        isBorrowing[msg.sender] = true;
        emit Borrowed(msg.sender, amount, "ETH");
    }

    // Function to borrow mBTC with collateral from both ETH and mBTC using Collateral Factor
    function borrowBTC(uint256 amount) external {
        require(!isBorrowing[msg.sender], "User is already borrowing");
        require(amount > 0, "Amount must be greater than 0");

        uint256 totalCollateralInUSD = calculateTotalCollateralInUSD(msg.sender);

        // Calculate the borrowed value in USD (using mBTC price)
        uint256 borrowedValueInUSD = uint256(amount) * uint256(assetPrices.btcPrice);

        // Ensure the collateral is sufficient to borrow the amount (based on Collateral Factor)
        uint256 maxBorrowable = (totalCollateralInUSD * collateralFactor) / 100;
        require(borrowedValueInUSD <= maxBorrowable, "Insufficient collateral for the requested loan");

        borrowedmBTC[msg.sender] += amount;

        // Transfer the borrowed mBTC to the user
        require(mBTCContract.transfer(msg.sender, amount), "mBTC transfer failed");

        isBorrowing[msg.sender] = true;
        emit Borrowed(msg.sender, amount, "BTC");
    }

    // Function to repay borrowed ETH
    function repayETH(uint256 amount) external payable {
        require(amount > 0, "Amount must be greater than 0");
        require(isBorrowing[msg.sender], "User is not borrowing ETH");
        require(borrowedETH[msg.sender] >= amount, "Repayment exceeds borrowed amount");

        // Ensure the sender is providing the correct amount of ETH
        require(msg.value == amount, "ETH amount mismatch");

        // Deduct the repaid amount from the borrowed balance
        borrowedETH[msg.sender] -= amount;

        // If the borrowed amount is fully repaid, set isBorrowing to false
        if (borrowedETH[msg.sender] == 0) {
            isBorrowing[msg.sender] = false;
        }

        emit Repaid(msg.sender, amount, "ETH");
    }

    // Function to repay borrowed mBTC
    function repayBTC(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(isBorrowing[msg.sender], "User is not borrowing mBTC");
        require(borrowedmBTC[msg.sender] >= amount, "Repayment exceeds borrowed amount");

        // Transfer mBTC from the user to the LendingPool
        require(mBTCContract.transferFrom(msg.sender, address(this), amount), "mBTC transfer failed");

        // Deduct the repaid amount from the borrowed balance
        borrowedmBTC[msg.sender] -= amount;

        // If the borrowed amount is fully repaid, set isBorrowing to false
        if (borrowedmBTC[msg.sender] == 0) {
            isBorrowing[msg.sender] = false;
        }

        emit Repaid(msg.sender, amount, "BTC");
    }

    // Function to fetch debt amount
    function getDebt(address user) public view returns (uint256 debt) {
        uint256 borrowedETHValue = borrowedETH[address(user)];
        uint256 borrowedBTCValue = borrowedmBTC[address(user)];
        
        int256 ethPrice = assetPrices.ethPrice;
        int256 btcPrice = assetPrices.btcPrice;
        
        debt = (borrowedETHValue * uint256(ethPrice)) + (borrowedBTCValue * uint256(btcPrice));
        return debt;
    }

    // Function to fetch deposit amount
    function getDeposit(address user) public view returns (uint256 deposits) {
        uint256 ethPool = ETHPool[address(user)];
        uint256 btcPool = mBTCPool[address(user)];
        
        int256 ethPrice = assetPrices.ethPrice; // Replace with actual ETH price in USD
        int256 btcPrice = assetPrices.btcPrice; // Replace with actual mBTC price in USD
        
        deposits = (ethPool * uint256(ethPrice)) + (btcPool * uint256(btcPrice));
        return deposits;
    }

    // Function to calculate interest and apply it to depositors and borrowers
    function applyInterest() public {
        address temp_user;
        uint ul = users.length;
        // Apply interest to all depositors
        for (uint i = 0; i < ul; i++) {
            temp_user = users[i];
            uint256 usersETH = sETHBalance[temp_user];
            uint256 usersBTC = sBTCBalance[temp_user];
            
            uint256 sETHinterest = (usersETH * uint256(interestRate)) / 1e18;
            uint256 sBTCinterest = (usersBTC * uint256(interestRate)) / 1e18;

            sETHBalance[temp_user] += sETHinterest;
            sBTCBalance[temp_user] += sBTCinterest;

            // Apply interest to all borrowers

            uint256 debtETH = borrowedETH[temp_user];
            uint256 debtBTC = borrowedmBTC[temp_user];

            uint256 ETHDebtInterest = (debtETH * uint256(interestRate)) / 1e18;
            uint256 sBTCDebtInterest = (debtBTC * uint256(interestRate)) / 1e18;
            
            // Update the user's borrowed amount
            borrowedETH[temp_user] += ETHDebtInterest;
            borrowedmBTC[temp_user] += sBTCDebtInterest;
        }
    }
        
    // Function to fetch BTC price
    function getBtcPrice() public view returns (int256) {
        return assetPrices.btcPrice;
        }

    // Function to fetch ETH price
    function getEthPrice() public view returns (int256) {
        return assetPrices.ethPrice;
        } 
}

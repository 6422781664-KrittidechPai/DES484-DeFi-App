// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./sToken.sol";
import "./MockOracle.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract LendingPool {
    // References to the sToken contracts for ETH and BTC
    sToken public sETHContract;
    sToken public sBTCContract;
    sToken public mBTCContract;

    // Reference to MockOracle
    MockOracle public mockOracle;

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

    // Constants for token type hashing
    bytes32 private constant ETH_HASH = keccak256(abi.encodePacked("ETH"));
    bytes32 private constant BTC_HASH = keccak256(abi.encodePacked("BTC"));

    // Struct for AssetPrice
    struct AssetPrices {
        int256 btcPrice;
        int256 ethPrice;
    }

    AssetPrices public assetPrices;

    // Collateralization ratio (150% in this case)
    uint256 public constant COLLATERALIZATION_RATIO = 150;

    // Events for deposit actions
    event Deposited(address indexed user, uint256 amount, string tokenType);
    event DepositFailed(address indexed user, uint256 amount, string reason);

    // Events for withdraw actions
    event Withdrawn(address indexed user, uint256 amount, string tokenType);
    event WithdrawFailed(address indexed user, uint256 amount, string reason);

    // Event for borrowing
    event Borrowed(address indexed user, uint256 amount, string tokenType);
    event BorrowFail(address indexed user, uint256 amount, string reason);

    // Event for repaying
    event Repaid(address indexed user, uint256 amount, string tokenType);
    event RepayFailed(address indexed user, uint256 amount, string reason);

    // Event to log price updates
    event PriceUpdated(string assetId, int256 newPrice);

    constructor(address _sETHAddress, address _sBTCAddress, address _mBTCAddress, address _MockOracleAddress) {
        sETHContract = sToken(_sETHAddress);
        sBTCContract = sToken(_sBTCAddress);
        mBTCContract = sToken(_mBTCAddress);
        mockOracle = MockOracle(_MockOracleAddress);
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

    // Function to update price from MockOracle
    function updatePrices() public {
        assetPrices.btcPrice = mockOracle.fetchPrice("BTC");
        assetPrices.ethPrice = mockOracle.fetchPrice("ETH");
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
        require(amount > 0, "Amount must be greater than 0");

        uint256 totalCollateralInUSD = calculateTotalCollateralInUSD(msg.sender);

        uint256 borrowedValueInUSD = uint256(amount) * uint256(assetPrices.ethPrice);

        // Ensure the collateral is sufficient to borrow the amount (e.g., 150% collateralization)
        require(totalCollateralInUSD >= borrowedValueInUSD * 150 / 100, "Insufficient collateral");

        borrowedETH[msg.sender] += amount;

        // Transfer the borrowed ETH to the user
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "ETH transfer failed");

        emit Borrowed(msg.sender, amount, "ETH");
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

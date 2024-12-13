// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./sToken.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract LendingPool {
    // References to the sToken contracts for ETH and BTC
    sToken public sETHContract;
    sToken public sBTCContract;
    sToken public mBTCContract;

    // Mapping to track user balances in  tokens
    mapping(address => uint256) public ETHPool;
    mapping(address => uint256) public mBTCPool;
    
    // Mapping to track user balances in synthetic tokens
    mapping(address => uint256) public sETHBalance;
    mapping(address => uint256) public sBTCBalance;

    // Events for deposit actions
    event Deposited(address indexed user, uint256 amount, string tokenType);
    event DepositFailed(address indexed user, uint256 amount, string reason);

    // Events for withdraw actions
    event Withdrawn(address indexed user, uint256 amount, string tokenType);
    event WithdrawFailed(address indexed user, uint256 amount, string reason);

    constructor(address _sETHAddress, address _sBTCAddress, address _mBTCAddress) {
        sETHContract = sToken(_sETHAddress);
        sBTCContract = sToken(_sBTCAddress);
        mBTCContract = sToken(_mBTCAddress);
    }

    // Deposit function to deposit ETH or BTC into the LendingPool and mint corresponding sTokens
    function deposit(uint256 amount, string memory tokenType) external payable {
        require(amount > 0, "Amount must be greater than 0");
        
        if (keccak256(abi.encodePacked(tokenType)) == keccak256(abi.encodePacked("ETH"))) {
            require(msg.value == amount, "ETH amount mismatch");
            // Mint sETH to the user
            sETHContract.mint(msg.sender, amount);
            sETHBalance[msg.sender] += amount;
            ETHPool[msg.sender] += amount;
            emit Deposited(msg.sender, amount, "ETH");
        } else if (keccak256(abi.encodePacked(tokenType)) == keccak256(abi.encodePacked("BTC"))) {
            require(msg.value == amount, "BTC amount mismatch");
            // Mint sBTC to the user
            sBTCContract.mint(msg.sender, amount);
            sBTCBalance[msg.sender] += amount;
            mBTCPool[msg.sender] += amount;
            emit Deposited(msg.sender, amount, "BTC");
        } else {
            emit DepositFailed(msg.sender, amount, "Invalid token type");
            revert("Invalid token type");
        }
    }

    // Withdraw function to withdraw sETH or mBTC and burn corresponding tokens
    function withdraw(uint256 amount, string memory tokenType) external payable {
        require(amount > 0, "Amount must be greater than 0");

        if (keccak256(abi.encodePacked(tokenType)) == keccak256(abi.encodePacked("ETH"))) {
            require(sETHBalance[msg.sender] >= amount, "Insufficient sETH balance");
            sETHBalance[msg.sender] -= amount;
            ETHPool[msg.sender] -= amount;
            sETHContract.burn(msg.sender, amount);
            emit Withdrawn(msg.sender, amount, "ETH");
        } else if (keccak256(abi.encodePacked(tokenType)) == keccak256(abi.encodePacked("BTC"))) {
            require(sBTCBalance[msg.sender] >= amount, "Insufficient sBTC balance");
            sBTCBalance[msg.sender] -= amount;
            mBTCPool[msg.sender] -= amount;
            sBTCContract.burn(msg.sender, amount);
            emit Withdrawn(msg.sender, amount, "BTC");
        } else {
            emit WithdrawFailed(msg.sender, amount, "Invalid token type");
            revert("Invalid token type");
        }
    }
}

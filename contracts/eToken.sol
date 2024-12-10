// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract eToken is ERC20 {
    address public admin;
    address public minter;

    constructor() ERC20("Ethereum Support Token", "eETH") {
        admin = msg.sender;
    }

    // Set the minter (e.g., LendingPool)
    function setMinter(address _minter) external {
        require(msg.sender == admin, "Only admin can set minter");
        minter = _minter;
    }

    // Mint tokens to users (called by LendingPool)
    function mint(address to, uint256 amount) external {
        require(msg.sender == minter, "Only minter can mint");
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external {
        require(msg.sender == minter, "Only minter can burn");
        _burn(from, amount);
    }

    // Get the current minter (to view who is the authorized minter)
    function getMinter() external view returns (address) {
        return minter;
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// This contract can be used for both sETH and sBTC as synthetic tokens for the LendingPool
contract sToken is ERC20 {
    // Constructor to set the name and symbol
    constructor(string memory _name, string memory _symbol) ERC20(_name, _symbol) {
    }

    // Event emitted when new tokens are minted
    event Mint(address indexed to, uint256 amount);

    // Event emitted when tokens are burned
    event Burn(address indexed from, uint256 amount);

    // Function to mint sToken
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
        emit Mint(to, amount);  // Emit the mint event
    }

    // Function to burn sToken
    function burn(address from, uint256 amount) external {
        _burn(from, amount);
        emit Burn(from, amount);  // Emit the burn event
    }
}

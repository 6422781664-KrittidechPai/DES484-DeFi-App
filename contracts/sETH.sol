// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// This contract is the Synthetic Ether Token contract by ERC20 standard. Use to track how much asset a user has.
// The user will get this token when they deposit Ethers or Bitcoin into our LendingPool.
contract sETH is ERC20 {
    address public lendingPool;

    // Constructor to set the name, symbol, and LendingPool address
    constructor(address _lendingPool) ERC20("Support Ether", "sETH") {
        require(_lendingPool != address(0), "Invalid Lending Pool address");
        lendingPool = _lendingPool;
    }

    // Modifier to restrict access to only the LendingPool.sol
    modifier onlyLendingPool() {
        require(msg.sender == lendingPool, "Caller is not the Lending Pool");
        _;
    }

    // Event emitted when new sETH tokens are minted
    event Mint(address indexed to, uint256 amount);

    // Event emitted when sETH tokens are burned
    event Burn(address indexed from, uint256 amount);

    // Function to mint sETH tokens (restricted to LendingPool)
    function mint(address to, uint256 amount) external onlyLendingPool {
        _mint(to, amount);
        emit Mint(to, amount);  // Emit the mint event
    }

    // Function to burn sETH tokens (restricted to LendingPool)
    function burn(address from, uint256 amount) external onlyLendingPool {
        _burn(from, amount);
        emit Burn(from, amount);  // Emit the burn event
    }

    // For testing only
    // constructor() ERC20("Synthetic Ether", "sETH") {
    // }

    // function mint(address to, uint256 amount) public {
    //     _mint(to, amount);
    // }

    // function burn(address from, uint256 amount) public {
    //     _burn(from, amount);
    // }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract MyContract {
    uint private value;

    // Function to set a value
    function setValue(uint _value) public {
        value = _value;
    }

    // Function to get the stored value
    function getValue() public view returns (uint) {
        return value;
    }
}
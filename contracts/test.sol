// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract test {
    uint256 private myNumber;
    function getNumber() public view returns (uint256) {
        return myNumber;
    }

    function setNumber(uint256 _number) public {
        myNumber = _number;
    }
}
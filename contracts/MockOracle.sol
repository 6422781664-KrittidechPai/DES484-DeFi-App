// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface MockChainlinkInterface {
    function getPrice(bytes calldata assetId) external view returns (int256);
}

contract MockOracle {
    MockChainlinkInterface public mockChainlink;

    constructor(address _mockChainlink) {
        mockChainlink = MockChainlinkInterface(_mockChainlink);
    }

    // Retrieves price data for a specific asset from MockChainlink
    function fetchPrice(bytes calldata assetId) public view returns (int256) {
        return mockChainlink.getPrice(assetId);
    }
}

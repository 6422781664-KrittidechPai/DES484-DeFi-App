// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MockChainlink {
    mapping(bytes => int256) private prices; // Maps asset IDs to their prices
    uint256 public funds;

    event PriceUpdated(bytes indexed assetId, int256 newPrice);
    event FundsPaid(address payer, uint256 amount);

    // Sets the price for a specific asset
    function setPrice(bytes calldata assetId, int256 _price) public {
        prices[assetId] = _price;
        emit PriceUpdated(assetId, _price);
    }

    // Simulates receiving payment for price data
    function payForData() public payable {
        funds += msg.value;
        emit FundsPaid(msg.sender, msg.value);
    }

    // Retrieves the latest price for a specific asset
    function getPrice(bytes calldata assetId) public view returns (int256) {
        require(prices[assetId] != 0, "Price not set for this asset");
        return prices[assetId];
    }
}

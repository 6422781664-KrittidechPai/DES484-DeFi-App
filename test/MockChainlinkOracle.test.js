const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MockChainlink and MockOracle Integration", function () {
  let mockChainlink, mockOracle;
  let deployer, user;

  before(async function () {
    // Get signers
    [deployer, user] = await ethers.getSigners();
  });

  beforeEach(async function () {
    // Deploy MockChainlink
    const MockChainlink = await ethers.getContractFactory("MockChainlink");
    mockChainlink = await MockChainlink.deploy();
    await mockChainlink.waitForDeployment();

    // Deploy MockOracle with the address of MockChainlink
    const MockOracle = await ethers.getContractFactory("MockOracle");
    mockOracle = await MockOracle.deploy(await mockChainlink.getAddress());
    await mockOracle.waitForDeployment();
  });

  it("Should set and retrieve prices in MockChainlink", async function () {
    const assetId = ethers.encodeBytes32String("ETH");
    const price = 2000;

    // Set the price in MockChainlink
    await mockChainlink.setPrice(assetId, price);

    // Retrieve the price from MockChainlink
    const fetchedPrice = await mockChainlink.getPrice(assetId);
    expect(fetchedPrice).to.equal(price);
  });

  it("Should fetch price from MockChainlink via MockOracle", async function () {
    const assetId = ethers.encodeBytes32String("BTC");
    const price = 30000;

    // Set the price in MockChainlink
    await mockChainlink.setPrice(assetId, price);

    // Fetch the price from MockOracle
    const fetchedPrice = await mockOracle.fetchPrice(assetId);
    expect(fetchedPrice).to.equal(price);
  });

  it("Should emit PriceUpdated event when setting a price", async function () {
    const assetId = ethers.encodeBytes32String("ETH");
    const price = 2500;

    // Expect event to be emitted
    await expect(mockChainlink.setPrice(assetId, price))
      .to.emit(mockChainlink, "PriceUpdated")
      .withArgs(assetId, price);
  });

  it("Should accept payments in MockChainlink and emit FundsPaid event", async function () {
    const paymentAmount = ethers.parseEther("1");

    // Send payment to MockChainlink
    await expect(mockChainlink.connect(user).payForData({ value: paymentAmount }))
      .to.emit(mockChainlink, "FundsPaid")
      .withArgs(user.address, paymentAmount);

    // Verify funds balance
    const funds = await mockChainlink.funds();
    expect(funds).to.equal(paymentAmount);
  });

  it("Should revert when fetching price for an asset with no price set", async function () {
    const assetId = ethers.encodeBytes32String("DOGE");

    // Attempt to fetch a price for an unset asset and expect a revert
    await expect(mockChainlink.getPrice(assetId)).to.be.revertedWith(
      "Price not set for this asset"
    );
  });
});

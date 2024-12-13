// test/sETH.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe.skip("sETH Contract", function () {
  let sETH;
  let sETHContract;
  let owner;
  let addr1;

  beforeEach(async function () {
    // Deploy the contract
    [owner, addr1] = await ethers.getSigners();
    const sETHFactory = await ethers.getContractFactory("sETH");
    sETHContract = await sETHFactory.deploy();
    await sETHContract.waitForDeployment();
  });

  it("Should mint tokens to an address", async function () {
    const mintAmount = ethers.parseEther("10");

    // Mint tokens to addr1
    await sETHContract.mint(await addr1.getAddress(), mintAmount);

    // Check balance of addr1
    const addr1Balance = await sETHContract.balanceOf(await addr1.getAddress());
    expect(addr1Balance).to.equal(mintAmount);
  });

  it("Should burn tokens from an address", async function () {
    const mintAmount = ethers.parseEther("10");
    const burnAmount = ethers.parseEther("5");

    // Mint tokens to addr1
    await sETHContract.mint(await addr1.getAddress(), mintAmount);

    // Burn tokens from addr1
    await sETHContract.burn(await addr1.getAddress(), burnAmount);

    // Check balance of addr1
    const addr1Balance = await sETHContract.balanceOf(await addr1.getAddress());
    expect(addr1Balance).to.equal(mintAmount - burnAmount);
  });

  it("Should revert if burn amount exceeds balance", async function () {
    const burnAmount = ethers.parseEther("1");

    // Attempt to burn without minting
    await expect(
      sETHContract.burn(await addr1.getAddress(), burnAmount)
    ).to.be.reverted;
  });
});
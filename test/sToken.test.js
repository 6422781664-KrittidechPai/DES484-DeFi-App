const { expect } = require("chai");
const { ethers } = require("hardhat");

describe.skip("sToken Contract", function () {
  let sETHToken;
  let sBTCToken;
  let owner;
  let user;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    // Deploy sETH and sBTC
    const sToken = await ethers.getContractFactory("sToken");
    sETHToken = await sToken.deploy("Synthetic Ether", "sETH");
    sBTCToken = await sToken.deploy("Synthetic Bitcoin", "sBTC");
  });

  it("Should mint sETH tokens to user", async function () {
    await sETHToken.mint(user.address, ethers.parseEther("10"));
    const balance = await sETHToken.balanceOf(user.address);
    expect(balance).to.equal(ethers.parseEther("10"));
  });

  it("Should burn sETH tokens from user", async function () {
    await sETHToken.mint(user.address, ethers.parseEther("10"));
    await sETHToken.burn(user.address, ethers.parseEther("5"));
    const balance = await sETHToken.balanceOf(user.address);
    expect(balance).to.equal(ethers.parseEther("5"));
  });

  it("Should mint sBTC tokens to user", async function () {
    await sBTCToken.mint(user.address, ethers.parseEther("1"));
    const balance = await sBTCToken.balanceOf(user.address);
    expect(balance).to.equal(ethers.parseEther("1"));
  });

  it("Should burn sBTC tokens from user", async function () {
    await sBTCToken.mint(user.address, ethers.parseEther("1"));
    await sBTCToken.burn(user.address, ethers.parseEther("0.5"));
    const balance = await sBTCToken.balanceOf(user.address);
    expect(balance).to.equal(ethers.parseEther("0.5"));
  });
});
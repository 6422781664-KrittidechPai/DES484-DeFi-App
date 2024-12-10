    // eToken.test.js

const eToken = artifacts.require("eToken");

contract("eToken", (accounts) => {
  let tokenInstance;
  const admin = accounts[0];
  const minter = accounts[1];
  const user = accounts[2];
  
  beforeEach(async () => {
    // Deploy a new instance of eToken for each test
    tokenInstance = await eToken.new();
    // Set minter (can be a LendingPool contract in future)
    await tokenInstance.setMinter(minter, { from: admin });
  });

  it("should deploy the contract and set the correct admin", async () => {
    const adminAddress = await tokenInstance.admin();
    assert.equal(adminAddress, admin, "The admin address should be correct");
  });

  it("should allow the minter to mint tokens", async () => {
    const amount = web3.utils.toWei("10", "ether");
    
    // Minter mints tokens to user
    await tokenInstance.mint(user, amount, { from: minter });

    const balance = await tokenInstance.balanceOf(user);
    assert.equal(balance.toString(), amount, "The minted amount should be correct");
  });

  it("should not allow non-minters to mint tokens", async () => {
    const amount = web3.utils.toWei("10", "ether");

    try {
      // Trying to mint tokens from a non-minter address (should fail)
      await tokenInstance.mint(user, amount, { from: accounts[3] });
      assert.fail("Minting should have failed for non-minter");
    } catch (err) {
      assert.include(err.message, "Only minter can mint", "Error message should contain 'Only minter can mint'");
    }
  });

  it("should allow the minter to burn tokens", async () => {
    const mintAmount = web3.utils.toWei("10", "ether");
    const burnAmount = web3.utils.toWei("5", "ether");

    // Minter mints tokens to user
    await tokenInstance.mint(user, mintAmount, { from: minter });

    // Minter burns some tokens from user
    await tokenInstance.burn(user, burnAmount, { from: minter });

    const balance = await tokenInstance.balanceOf(user);
    assert.equal(balance.toString(), web3.utils.toWei("5", "ether"), "The burned amount should be correct");
  });

  it("should not allow non-minters to burn tokens", async () => {
    const burnAmount = web3.utils.toWei("5", "ether");

    try {
      // Trying to burn tokens from a non-minter address (should fail)
      await tokenInstance.burn(user, burnAmount, { from: accounts[3] });
      assert.fail("Burning should have failed for non-minter");
    } catch (err) {
      assert.include(err.message, "Only minter can burn", "Error message should contain 'Only minter can burn'");
    }
  });

  it("should return the correct minter address", async () => {
    const currentMinter = await tokenInstance.getMinter();
    assert.equal(currentMinter, minter, "The minter address should be correct");
  });
});

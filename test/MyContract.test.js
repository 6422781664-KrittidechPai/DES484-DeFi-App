const MyContract = artifacts.require("MyContract");

contract("MyContract", (accounts) => {
  const [owner, user] = accounts;

  it("should deploy the contract", async () => {
    const instance = await MyContract.deployed();
    assert(instance.address !== "");
  });

  it("should set and get a value", async () => {
    const instance = await MyContract.deployed();

    // Set a value
    await instance.setValue(42, { from: owner });

    // Get the value
    const value = await instance.getValue();
    assert.equal(value.toNumber(), 42, "The value was not set correctly");
  });
});

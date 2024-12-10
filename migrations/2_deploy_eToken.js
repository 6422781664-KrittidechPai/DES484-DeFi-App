// 2_deploy_eToken.js

const eToken = artifacts.require("eToken");

module.exports = async function(deployer) {
  // Deploy the eToken contract
  await deployer.deploy(eToken);

  // Set the minter address after deployment (assuming deployer will act as the admin)
  const tokenInstance = await eToken.deployed();
  await tokenInstance.setMinter(tokenInstance.address); // Setting the contract itself as minter (or you can set LendingPool address later)
};
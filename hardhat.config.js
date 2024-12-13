require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.28",
  networks: {
    // Ganache GUI
    ganache_gui: {
      url: "http://127.0.0.1:7545",
      chainId: 1337, // Default Ganache chain ID
    },
    ganache_cli: {
      url: "http://127.0.0.1:8545",
      chainId: 1337
    },
  },
};

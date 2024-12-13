require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.28",
  networks: {
    ganache: {
      url: "http://127.0.0.1:7545",
      accounts: [
        "0xc508aa5634606e3d49023e9fd48f67d3fe2ff120431c4f0774a4c3ebca6efbc4",
        "0x618deb25c5fb1b2605c4ce6d5146ee6257a88a8bc863d0d1423a8528d5e41d98",
        "0x19d1b70027a3f173867248c2f619f76e6f06fcade1af4d10a64cd804316c3c80",
      ],
      chainId: 1337, // Default Ganache chain ID
    },
  },
};

# DeFi Lending and Borrowing App

This project is part of assignment in DES484 Class. The DeFi Lending and Borrowing Platform is a blockchain-based decentralised application (DApp) designed to provide a secure, transparent, and efficient solution for lending and borrowing cryptocurrencies.

# Prerequisite
- Ganache GUI or Ganache CLI installed

# How to deploy smart contracts
1. install dependencies (use npm install)
  - In case of any missing dependency, it might mean that:
    a. It needs separate installing.
    b. It's updated and the syntax has changed.
2. npx hardhat compile
3. Initiate the blockchain network
  - For Ganache GUI: Open Ganache and initiate the network
  - For Ganache CLI: (In terminal) ganache-cli
4. Run script
  - For Ganache GUI: npx hardhat run scripts/deploy.js --network ganache_gui
  - For Ganache CLI: npx hardhat run scripts/deploy.js --network ganache_cli
 
# How to run front-end app
- 

# The main branch used in development is HardHatNew
1. npm create vite@latest prototype
2. cd prototype
3. npm install
4. Copy files from source code into directory (prototype)
5. npm run dev

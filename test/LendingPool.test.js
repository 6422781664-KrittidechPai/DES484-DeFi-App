  const { expect } = require("chai");
  const { ethers } = require("hardhat");

  describe("LendingPool Contract", function () {
    let LendingPool, sToken, sETH, sBTC, mBTC;
    let owner, user1, user2;
    const initialDepositAmount = ethers.parseEther("1"); // 1 ETH or 1 mBTC
    const exceedDepositAmount = ethers.parseEther("2")
    const mBTCAmount = ethers.parseUnits("1", 8); // For 1 mBTC assuming 8 decimals
    const BTC_PRICE = ethers.parseUnits("20000", 8); // Example BTC price in USD (mock value)
    const ETH_PRICE = ethers.parseUnits("1500", 8); // Example ETH price in USD (mock value)

    beforeEach(async function () {
      // Deploy the sToken (sETH, sBTC, mBTC) contracts
      [owner, user1, user2] = await ethers.getSigners();

      const sTokenFactory = await ethers.getContractFactory("sToken");
      sETH = await sTokenFactory.deploy("Synthetic ETH", "sETH");
      await sETH.waitForDeployment();
      sBTC = await sTokenFactory.deploy("Synthetic BTC", "sBTC");
      await sBTC.waitForDeployment();
      mBTC = await sTokenFactory.deploy("mBTC", "mBTC");
      await mBTC.waitForDeployment();

      // Ensure the contracts were deployed and check their addresses
      expect(sETH.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(sBTC.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(mBTC.getAddress()).to.not.equal(ethers.ZeroAddress);

      // Deploy MockChainlink contract
      const MockChainlinkFactory = await ethers.getContractFactory("MockChainlink");
      mockChainlink = await MockChainlinkFactory.deploy();
      await mockChainlink.waitForDeployment();

      // Set initial BTC and ETH prices in MockChainlink
      await mockChainlink.setPrice(ethers.toUtf8Bytes("BTC"), BTC_PRICE);
      await mockChainlink.setPrice(ethers.toUtf8Bytes("ETH"), ETH_PRICE);

      // Deploy MockOracle contract, passing the MockChainlink address
      const MockOracleFactory = await ethers.getContractFactory("MockOracle");
      mockOracle = await MockOracleFactory.deploy(mockChainlink.getAddress());
      await mockOracle.waitForDeployment();


      // Deploy LendingPool contract with addresses contracts
      const LendingPoolFactory = await ethers.getContractFactory("LendingPool");
      LendingPool = await LendingPoolFactory.deploy(sETH.getAddress(), sBTC.getAddress(), mBTC.getAddress(), mockOracle.getAddress());
      await LendingPool.waitForDeployment();

      // Fund user1 with mBTC
      await mBTC.mint(user1.getAddress(), mBTCAmount);
      await mBTC.connect(user1).approve(LendingPool.getAddress(), mBTCAmount);
    });

    describe("Deposit and Withdraw ETH", function () {
      it("should deposit ETH and mint corresponding sETH", async function () {
        const depositAmount = initialDepositAmount;

        // User1 deposits ETH
        await LendingPool.connect(user1).deposit(depositAmount, "ETH", { value: depositAmount});

        // Check the balance of the synthetic token (sETH) minted
        const sETHBalance = await sETH.balanceOf(user1.getAddress());
        expect(sETHBalance).to.equal(depositAmount);

        // User1 withdraws ETH
        await expect(() =>
          LendingPool.connect(user1).withdraw(depositAmount, "ETH")
        ).to.changeEtherBalances([user1, LendingPool], [depositAmount, -depositAmount]);

        // Check sETH balance after withdrawal
        const finalBalance = await sETH.balanceOf(user1.getAddress());
        expect(finalBalance).to.equal(0);
      });

      it("should revert if user tries to withdraw more than they have", async function () {
        const depositAmount = initialDepositAmount;

        // User1 deposits ETH
        await LendingPool.connect(user1).deposit(depositAmount, "ETH", { value: depositAmount});

        // Try to withdraw more than the deposited amount
        await expect(
          LendingPool.connect(user1).withdraw(exceedDepositAmount, "ETH")
        ).to.be.revertedWith("Insufficient sETH balance");
      });
    });

    describe("Deposit and Withdraw mBTC", function () {
      it("should deposit mBTC and mint corresponding sBTC", async function () {
        const depositAmount = mBTCAmount;

        // User1 deposits mBTC
        await LendingPool.connect(user1).deposit(depositAmount, "BTC", { value: depositAmount});

        // Check the balance of the synthetic token (sBTC) minted
        const sBTCBalance = await sBTC.balanceOf(user1.getAddress());
        expect(sBTCBalance).to.equal(depositAmount);

        // User1 withdraws mBTC
        await expect(() =>
          LendingPool.connect(user1).withdraw(depositAmount, "BTC")
        ).to.changeTokenBalances(mBTC, [user1, LendingPool], [depositAmount, -depositAmount]);

        // Check sBTC balance after withdrawal
        const finalBalance = await sBTC.balanceOf(user1.getAddress());
        expect(finalBalance).to.equal(0);
      });

      it("should revert if user tries to withdraw more than they have", async function () {
        const depositAmount = mBTCAmount;

        // User1 deposits mBTC
        await LendingPool.connect(user1).deposit(depositAmount, "BTC", { value: depositAmount});

        // Try to withdraw more than the deposited amount
        await expect(
          LendingPool.connect(user1).withdraw(exceedDepositAmount, "BTC")
        ).to.be.revertedWith("Insufficient sBTC balance");
      });
    });

    describe("Edge Cases", function () {
      it("should revert if user deposits an invalid token type", async function () {
        await expect(
          LendingPool.connect(user1).deposit(initialDepositAmount, "INVALID", { value: initialDepositAmount})
        ).to.be.revertedWith("Invalid token type: Deposit");
      });

      it("should revert if user tries to withdraw an invalid token type", async function () {
        await expect(
          LendingPool.connect(user1).withdraw(initialDepositAmount, "INVALID")
        ).to.be.revertedWith("Invalid token type: Withdraw");
      });
    });

    describe("MockOracle Price Fetching", function () {
      it("should fetch the correct BTC price from MockOracle", async function () {
        // Fetch BTC price from MockOracle
        const btcPrice = await mockOracle.fetchPrice(ethers.toUtf8Bytes("BTC"));
        
        // Check if the fetched price matches the expected price
        expect(btcPrice).to.equal(BTC_PRICE);
      });

      it("should fetch the correct ETH price from MockOracle", async function () {
        // Fetch ETH price from MockOracle
        const ethPrice = await mockOracle.fetchPrice(ethers.toUtf8Bytes("ETH"));
        
        // Check if the fetched price matches the expected price
        expect(ethPrice).to.equal(ETH_PRICE);
      });
    });

    describe("Integration with LendingPool", function () {
      it("should fetch and use the correct price for collateral calculation", async function () {
        // Assume we're using the price from the MockOracle for collateral calculations
        const btcPrice = await mockOracle.fetchPrice(ethers.toUtf8Bytes("BTC"));
        const ethPrice = await mockOracle.fetchPrice(ethers.toUtf8Bytes("ETH"));

        // Example: Use these prices for deposit/borrow calculations (this is hypothetical and depends on your logic)
        // You would now have the BTC/ETH prices available to apply in your LendingPool logic
        console.log("BTC Price: ", ethers.formatUnits(btcPrice, 8));
        console.log("ETH Price: ", ethers.formatUnits(ethPrice, 8));

        // Placeholder for actual logic based on price fetching (like setting collateral values or calculating interest)
      });
    });
  });

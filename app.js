const express = require("express");
const Web3 = require("web3");

// MOCKCHAINLINK //
//const MockChainlink = require("./MockChainlink.json")
//const MockChainlinkABI = MockChainlink.abi;
//const MockChainlinkAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"

// MOCKORCLE //
//const MockOracle = require("./MockOracle.json")
//const MockOracleABI = MockOracle.abi;
//const MockOracleAddress = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"

// STOKEN sETH //
//const sToken = require("./sToken.json")
//const sToken_sETH_ABI = sToken.abi;
//const sToken_sETH_Address = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707"

// STOKEN sBTC//
//const sToken_sBTC_ABI = sToken.abi;
//const sToken_sBTC_Address = "0x0165878A594ca255338adfa4d48449f69242Eb8F"

// STOKEN mBTC//
//const sToken_mBTC_ABI = sToken.abi;
//const sToken_mBTC_Address = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853"

// LIQUIDATION //
//const Liquidation = require("./Liquidation.json")
//const LiquidationABI = Liquidation.abi;
//const LiquidationAddress = "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318"

// INTEREST RATE //
//const LinearInterestRateModel = require("./LinearInterestRateModel.json")
//const LinearInterestRateModelABI = LinearInterestRateModel.abi;
//const LinearInterestRateModelAddress = "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"

// LENDINGPOOL //
//const LendingPool = require("./LendingPool.json")
//const LendingPoolABI = LendingPool.abi;
//const LendingPoolAddress = "0x610178dA211FEF7D417bC0e6FeD39F05609AD788"

/// for test ///
const test = require("./artifacts/contracts/test.sol/test.json")
const testABI = test.abi;
const testAddress = "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"

const rpcEndpoint = "http://127.0.0.1:8545"

const app = express();
const web3 = new Web3(new Web3.providers.HttpProvider(rpcEndpoint));




//const contract_MockChainLink = new web3.eth.Contract(MockChainlinkABI,MockChainlinkAddress);
//const contract_MockOracle = new web3.eth.Contract(MockOracleABI,MockOracleAddress);
//const contract_sToken_sETH = new web3.eth.Contract(sToken_sETH_ABI,sToken_sETH_Address);
//const contract_sToken_sBTC = new web3.eth.Contract(sToken_sBTC_ABI,sToken_sBTC_Address);
//const contract_sToken_mBTC = new web3.eth.Contract(sToken_mBTC_ABI,sToken_mBTC_Address);
//const contract_Liquidation = new web3.eth.Contract(LiquidationABI,LiquidationAddress);
//const contract_LinearInterrestRate = new web3.eth.Contract(LinearInterestRateModelABI,LinearInterestRateModelAddress);
//const contract_LendingPool = new Web3.eth.Contract(LendingPoolABI,LendingPoolAddress);

/// for test //
const contract = new web3.eth.Contract(testABI,testAddress);



app.use(express.json());


/// TEST /// 
app.get("/number", async(req,res)=> {
    const number = await contract.methods.getNumber().call();
    res.json({ number });
});

app.post("/number", async(req, res)=> {
    const { number } = req.body;
    const account = await web3.eth.getAccount();
    const result = await contract.methods
        .setNumber(number)
        .send({ from:account[0]});
    res.json({ message: "number set successfully"});
});

app.listen(3000, () => {
    console.log("Server listening on port 3000");
});


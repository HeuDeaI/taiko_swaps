const { ethers } = require("ethers");
const axios = require("axios");
require("dotenv").config();

const provider = new ethers.JsonRpcProvider("https://rpc.taiko.xyz");

const wallets = [
  {
    address: process.env.ADDRESS,
    privateKey: process.env.PRIVATE_KEY,
  },
];

const WETH_ADDRESS = "0xa51894664a773981c6c112c43ce576f315d5b1b6";
const WETH_ABI = [
  "function deposit() public payable",
  "function withdraw(uint wad) public",
  "function balanceOf(address owner) view returns (uint256)",
];

function getRandomPercentage(min, max) {
  return Math.random() * (max - min) + min;
}

function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min) * 1000;
}

async function getBalance(contract, address) {
  try {
    return await contract.balanceOf(address);
  } catch (error) {
    console.error(`Error getting balance: ${error.message}`);
    throw error;
  }
}

async function getETHPriceInUSDT() {
  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price",
      {
        params: {
          ids: "ethereum",
          vs_currencies: "usd",
        },
      }
    );

    const ethPriceInUSD = response.data.ethereum.usd;
    return ethPriceInUSD;
  } catch (error) {
    console.error(`Error fetching ETH price: ${error.message}`);
    throw error;
  }
}

async function getCombinedBalanceInUSDT(walletAddress) {
  const wethContract = new ethers.Contract(WETH_ADDRESS, WETH_ABI, provider);
  const [ethBalance, wethBalance, ethPrice] = await Promise.all([
    provider.getBalance(walletAddress),
    getBalance(wethContract, walletAddress),
    getETHPriceInUSDT(),
  ]);

  const ethBalanceFormatted = ethers.formatEther(ethBalance);
  const wethBalanceFormatted = ethers.formatEther(wethBalance);
  const totalEth =
    parseFloat(ethBalanceFormatted) + parseFloat(wethBalanceFormatted);

  return totalEth * ethPrice;
}

async function wrapETH(contract, amount) {
  try {
    const tx = await contract.deposit({ value: amount });
    await tx.wait();
  } catch (error) {
    console.error(`Error wrapping ETH: ${error.message}`);
    throw error;
  }
}

async function unwrapETH(contract, amount) {
  try {
    const tx = await contract.withdraw(amount);
    await tx.wait();
  } catch (error) {
    console.error(`Error unwrapping ETH: ${error.message}`);
    throw error;
  }
}

async function performWrapsAndUnwraps(wallet) {
  const walletInstance = new ethers.Wallet(wallet.privateKey, provider);
  const wethContract = new ethers.Contract(
    WETH_ADDRESS,
    WETH_ABI,
    walletInstance
  );

  try {
    const [ethBalance, wethBalance] = await Promise.all([
      provider.getBalance(wallet.address),
      getBalance(wethContract, wallet.address),
    ]);

    await performOperations(wrapETH.bind(null, wethContract), ethBalance, 3, 6);
    await performOperations(
      unwrapETH.bind(null, wethContract),
      wethBalance,
      3,
      6
    );
  } catch (error) {
    console.error(
      `Error in main function for ${wallet.address}: ${error.message}`
    );
  }
}

async function performOperations(operation, balance, minTimes, maxTimes) {
  const times =
    Math.floor(Math.random() * (maxTimes - minTimes + 1)) + minTimes;
  for (let i = 0; i < times; i++) {
    const percentage = getRandomPercentage(0.08, 0.12);
    const amount =
      (BigInt(balance) * BigInt(Math.floor(percentage * 1e18))) / BigInt(1e18);
    await operation(amount);
    await new Promise((resolve) => setTimeout(resolve, getRandomDelay(2, 6)));
  }
}

async function main() {
  const promises = wallets.map((wallet) => performWrapsAndUnwraps(wallet));
  await Promise.all(promises);
}

async function runMultipleTimes(times) {
  const initialBalances = await Promise.all(
    wallets.map(async (wallet) => {
      const balanceInUSDT = await getCombinedBalanceInUSDT(wallet.address);
      console.log(
        `Initial balance for ${wallet.address.slice(
          0,
          6
        )}...${wallet.address.slice(-4)}: ${balanceInUSDT.toFixed(2)}$`
      );
      return balanceInUSDT;
    })
  );

  for (let i = 0; i < times; i++) {
    await main();
  }

  const finalBalances = await Promise.all(
    wallets.map(async (wallet) => {
      const balanceInUSDT = await getCombinedBalanceInUSDT(wallet.address);
      console.log(
        `Final balance for ${wallet.address.slice(
          0,
          6
        )}...${wallet.address.slice(-4)}: ${balanceInUSDT.toFixed(2)}$`
      );
      return balanceInUSDT;
    })
  );
}

runMultipleTimes(14); // More than 14 iterations achieve daily limit

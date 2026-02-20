require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: "0.8.24",
    networks: {
        hardhat: {
        },
        // bscTestnet: {
        //   url: "https://data-seed-prebsc-1-s1.binance.org:8545",
        //   chainId: 97,
        //   accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
        // },
    },
};

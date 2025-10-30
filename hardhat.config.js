require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.26", // MUST match the deployed version
    settings: {
      optimizer: {
        enabled: false, // MUST match deployment settings
        runs: 200      // Adjust if yours was different
      }
    }
  },
  networks: {
    apechain: {
      url: "https://rpc.apechain.com",
      chainId: 33139,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      apechain: process.env.APE_EXPLORER_API_KEY || "",
    },
    customChains: [
      {
        network: "apechain",
        chainId: 33139,
        urls: {
          apiURL: "", // leave blank if ApeScan doesn't support full API verification
          browserURL: "https://apescan.io",
        },
      },
    ],
  },
};

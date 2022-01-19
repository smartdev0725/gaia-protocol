// eslint-disable-next-line import/no-extraneous-dependencies
require('@nomiclabs/hardhat-truffle5');
// eslint-disable-next-line import/no-extraneous-dependencies
require('solidity-coverage');
/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: '0.8.11',
    settings: {
      optimizer: {
        enabled: true,
        runs: 20000,
      },
    },
  },
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      hardfork: 'london',
    },
  },
  mocha: {
    timeout: 120000,
  },
};

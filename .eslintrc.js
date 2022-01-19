module.exports = {
  "root": true,
  "globals": {
    "expect": true,
    "assert": true,
    "contract": true,
    "sinon": true,
    "__DEV__": true,
    "artifacts": true,
    "web3": true,
    "beforeEach": true,
    "it": true,
    "xit": true,
    "BigInt": true,
  },
  extends: '@nomisma/eslint-config-shared/node/.eslintrc.js'
};

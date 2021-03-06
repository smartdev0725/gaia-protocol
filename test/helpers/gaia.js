import { contractInstanceAt, BigNumber } from '@nomisma/nomisma-smart-contract-helpers';
import { setupResolver } from './resolver';


const GaiaTokenRouter = artifacts.require('./GaiaTokenRouter.sol');
const GaiaToken = artifacts.require('./GaiaToken.sol');
const IGaiaToken = artifacts.require('./IGaiaToken.sol');

const GaiaUpgradedMock = artifacts.require('./GaiaUpgradedMock.sol');
const IGaiaUpgradedMock = artifacts.require('./IGaiaUpgradedMock.sol');

export const deployGaiaToken = async (
  tokenName,
  tokenSymbol,
  roleManager,
  governor
) => {
  const gaiaImpl = await GaiaToken.new();
  const gaiaResolver = await setupResolver(
    [ gaiaImpl ],
    roleManager,
    governor
  );

  const encodedArguments = web3.eth.abi.encodeParameters(
    [ 'string', 'string' ], // TODO: need to get this dynamically through ABI!
    [ tokenName, tokenSymbol ]
  );

  const gaiaRouter = await GaiaTokenRouter.new(
    'init(string,string)', // TODO: need to get this dynamically through ABI!
    encodedArguments,
    roleManager,
    gaiaResolver.address,
    { from: governor }
  );

  return {
    token: await contractInstanceAt(IGaiaToken, gaiaRouter.address),
    resolver: gaiaResolver,
  };
};

export const deployGaiaUpgradedMock = async (
) => GaiaUpgradedMock.new();

export const upgradedMockInterface = async (
  gaiaAddress,
) => contractInstanceAt(IGaiaUpgradedMock, gaiaAddress);

export const intToTokenDecimals = (amount) => {
  const decimalsFactor = new BigNumber(10).pow(new BigNumber(18));
  return new BigNumber(amount).mul(decimalsFactor);
};

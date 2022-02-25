import { contractInstanceAt, BigNumber } from '@nomisma/nomisma-smart-contract-helpers';
import { setupResolver } from './resolver';


const GaiaTokenRouter = artifacts.require('./GaiaTokenRouter.sol');
const GaiaToken = artifacts.require('./GaiaToken.sol');
const IGaiaToken = artifacts.require('./IGaiaToken.sol');

const GaiaUpgradedMock = artifacts.require('./GaiaUpgradedMock.sol');
const IGaiaUpgradedMock = artifacts.require('./IGaiaUpgradedMock.sol');

export const deployGaiaToken = async (
  roleManager,
  governor
) => {
  const rgtImpl = await GaiaToken.new();
  const rgtResolver = await setupResolver(
    [ rgtImpl ],
    roleManager,
    governor
  );

  const rgtRouter = await GaiaTokenRouter.new(
    roleManager,
    rgtResolver.address,
    { from: governor }
  );

  return {
    token: await contractInstanceAt(IGaiaToken, rgtRouter.address),
    resolver: rgtResolver,
  };
};

export const deployGaiaUpgradedMock = async (
) => GaiaUpgradedMock.new();

export const upgradedMockInterface = async (
  rgtAddress,
) => contractInstanceAt(IGaiaUpgradedMock, rgtAddress);

export const intToTokenDecimals = (amount) => {
  const decimalsFactor = new BigNumber(10).pow(new BigNumber(18));
  return new BigNumber(amount).mul(decimalsFactor);
};

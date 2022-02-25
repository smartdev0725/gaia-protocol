import { contractInstanceAt, BigNumber } from '@nomisma/nomisma-smart-contract-helpers';
import { setupResolver } from './resolver';


const RheaGeTokenRouter = artifacts.require('./RheaGeTokenRouter.sol');
const RheaGeToken = artifacts.require('./RheaGeToken.sol');
const IRheaGeToken = artifacts.require('./IRheaGeToken.sol');

const RheaGeUpgradedMock = artifacts.require('./RheaGeUpgradedMock.sol');
const IRheaGeUpgradedMock = artifacts.require('./IRheaGeUpgradedMock.sol');

export const deployRheaGeToken = async (
  roleManager,
  governor
) => {
  const rgtImpl = await RheaGeToken.new();
  const rgtResolver = await setupResolver(
    [ rgtImpl ],
    roleManager,
    governor
  );

  const rgtRouter = await RheaGeTokenRouter.new(
    roleManager,
    rgtResolver.address,
    { from: governor }
  );

  return {
    token: await contractInstanceAt(IRheaGeToken, rgtRouter.address),
    resolver: rgtResolver,
  };
};

export const deployRheaGeUpgradedMock = async (
) => RheaGeUpgradedMock.new();

export const upgradedMockInterface = async (
  rgtAddress,
) => contractInstanceAt(IRheaGeUpgradedMock, rgtAddress);

export const intToTokenDecimals = (amount) => {
  const decimalsFactor = new BigNumber(10).pow(new BigNumber(18));
  return new BigNumber(amount).mul(decimalsFactor);
};

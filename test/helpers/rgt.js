import { contractInstanceAt } from '@nomisma/nomisma-smart-contract-helpers';
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

  return contractInstanceAt(IRheaGeToken, rgtRouter.address);
};

export const deployRheaGeUpgradedMock = async (
  roleManager,
  governor
) => {
  const rgtImpl = await RheaGeToken.new();
  const rgtResolver = await setupResolver(
    [ rgtImpl ],
    roleManager,
    governor
  );

  const rgtRouter = await RheaGeUpgradedMock.new(
    roleManager,
    rgtResolver.address,
    { from: governor }
  );

  return contractInstanceAt(IRheaGeUpgradedMock, rgtRouter.address);
};

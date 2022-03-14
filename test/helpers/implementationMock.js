/* eslint-disable import/no-extraneous-dependencies */
import {
  contractInstanceAt,
} from '@nomisma/nomisma-smart-contract-helpers';
import { setupResolver } from './resolver';

const Router = artifacts.require('./Router.sol');
const ImplementationMock = artifacts.require('/ImplementationMock.sol');

export const deployImplementationMock = async (
  initSignature,
  encodedArguments,
  roleManager,
  governor
) => {
  const implementation = await ImplementationMock.new();
  const resolver = await setupResolver(
    [ implementation ],
    roleManager,
    governor
  );

  const router = await Router.new(
    initSignature,
    encodedArguments,
    roleManager,
    resolver.address,
    'Error in delegator',
    { from: governor }
  );

  const proxy = await contractInstanceAt(
    ImplementationMock,
    router.address
  );

  return {
    proxy,
    implementation,
  };
};

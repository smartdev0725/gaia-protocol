import {
  bulkRegister,
  buildConfigs,
} from '@nomisma/nomisma-smart-contract-helpers';

const Resolver = artifacts.require('./Resolver.sol');

export const setupResolver = async (contracts, roleManagerAddr, owner) => {
  const resolver = await Resolver.new(roleManagerAddr);
  const configs = buildConfigs(contracts);

  await bulkRegister({
    resolver,
    contracts,
    configs,
    owner,
  });

  return resolver;
};

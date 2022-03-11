import { ethers } from 'ethers';
import { contractInstanceAt } from '@nomisma/nomisma-smart-contract-helpers';
import { setupResolver } from './resolver';


const Registry = artifacts.require('./GaiaRegistry.sol');
const RegistryInterface = artifacts.require('./IGaiaRegistryMain.sol');
const RegistryRouter = artifacts.require('./GaiaRegistryRouter.sol');

export const deployRegistry = async (
  gaiaToken,
  roleManager,
  governor
) => {
  const regImpl = await Registry.new();
  const regResolver = await setupResolver(
    [ regImpl ],
    roleManager,
    governor
  );

  const encodedArguments = ethers.utils.defaultAbiCoder.encode(
    [ 'address', 'address' ],
    [ gaiaToken, roleManager ]
  );

  const regRouter = await RegistryRouter.new(
    'init(address,address)',
    encodedArguments,
    roleManager,
    regResolver.address,
    { from: governor }
  );

  return contractInstanceAt(RegistryInterface, regRouter.address);
};

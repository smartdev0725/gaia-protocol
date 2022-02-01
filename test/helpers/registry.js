import { contractInstanceAt } from '@nomisma/nomisma-smart-contract-helpers';
import { setupResolver } from './resolver';


const Registry = artifacts.require('./RGRegistry.sol');
const RegistryInterface = artifacts.require('./IRGRegistryMain.sol');
const RegistryRouter = artifacts.require('./RGRegistryRouter.sol');

export const deployRegistry = async (
  rgToken,
  roleManager,
  tokenValidator,
  governor
) => {
  const regImpl = await Registry.new();
  const regResolver = await setupResolver(
    [ regImpl ],
    roleManager,
    governor
  );
  const regRouter = await RegistryRouter.new(
    rgToken,
    regResolver.address,
    roleManager,
    tokenValidator,
    { from: governor }
  );

  return contractInstanceAt(RegistryInterface, regRouter.address);
};

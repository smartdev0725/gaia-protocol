import { ethers } from 'ethers';
import {
  getChaiBN,
  BigNumber,
} from '@nomisma/nomisma-smart-contract-helpers';
import { setupResolver } from '../helpers/resolver';

require('chai')
  .use(require('chai-as-promised'))
  .use(getChaiBN())
  .should();

const RoleManager = artifacts.require('./RoleManager.sol');
const Router = artifacts.require('./Router.sol');
const ImplementationMock = artifacts.require('/ImplementationMock.sol');

contract('Router tests', ([ governor ]) => {
  before(async function () {
    const confirmationsRequired = 1;
    this.roleManager = await RoleManager.new([ governor ], confirmationsRequired);
  });

  it('should init with no parameters', async function () {
    const implementation = await ImplementationMock.new();
    const resolver = await setupResolver(
      [ implementation ],
      this.roleManager.address,
      governor
    );

    const router = await Router.new(
      'init()',
      '0x00',
      this.roleManager.address,
      resolver.address,
      { from: governor }
    );

    implementation.init();
    console.log('router.stringVar()', router.stringVar());
    console.log('implementation.stringVar()', implementation.stringVar());
  });
});

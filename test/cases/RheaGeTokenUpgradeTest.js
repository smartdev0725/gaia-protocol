import {
  getChaiBN,
  BigNumber,
  configToKeccakSignature,
} from '@nomisma/nomisma-smart-contract-helpers';
import { 
  deployRheaGeToken,
  deployRheaGeUpgradedMock,
} from '../helpers/rgt';

import {
  roleNames,
} from '../helpers/roles';

require('chai')
  .use(require('chai-as-promised'))
  .use(getChaiBN())
  .should();

const {
  MINTER_ROLE,
  BURNER_ROLE,
} = roleNames;

const RoleManager = artifacts.require('./RoleManager.sol');
const Resolver = artifacts.require('./Resolver.sol');
const RheaGeUpgradedMock = artifacts.require('./RheaGeUpgradedMock.sol');

export const tokenName = 'RheaGe Token';
export const tokenSymbol = 'RGT';


contract('RheaGeToken Upgrade Tests', ([
  governor,
  minter,
  burner,
  receiver
]) => {
  before(async function () {
    const confirmationsRequired = 1;
    this.roleManager = await RoleManager.new([ governor ], confirmationsRequired);
    await this.roleManager.addRolesForAddresses(
      [ minter, burner ],
      [ MINTER_ROLE, BURNER_ROLE ],
      { from: governor }
    );
    this.rheaGe = await deployRheaGeToken(this.roleManager.address, governor);
    this.resolver = await Resolver.new(this.roleManager.address);
    this.rheaGeUpgradedMock = await RheaGeUpgradedMock.new()
  });

  it.only('should upgrade rheaGeToken', async function () {
    const signature = configToKeccakSignature({
      contract: this.rheaGeUpgradedMock,
      name: 'mint',
    });

    await this.resolver.bulkRegister(
      [ signature ],
      [ this.rheaGe.address ],
      { from: governor }
    ).should.be.fulfilled;

    await this.resolver.bulkUpdate(
      [ signature ],
      [ this.rheaGeUpgradedMock.address ],
      { from: governor }
    ).should.be.fulfilled;

    const amount = new BigNumber(100);
    await this.rheaGe.mint(
      receiver,
      amount, 
      { from: minter }
    ).should.be.rejectedWith("RoleAware: Permission denied to execute this function");
  });
});

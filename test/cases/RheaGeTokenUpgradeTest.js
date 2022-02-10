import {
  getChaiBN,
  BigNumber,
  configToKeccakSignature,
  getFirst4bytes,
} from '@nomisma/nomisma-smart-contract-helpers';
import {
  deployRheaGeToken,
  deployRheaGeUpgradedMock,
  upgradedMockInterface,
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
  MOCK_ROLE,
} = roleNames;

const RoleManager = artifacts.require('./RoleManager.sol');
const Resolver = artifacts.require('./Resolver.sol');

export const tokenName = 'RheaGe Token';
export const tokenSymbol = 'RGT';


contract.only('RheaGeToken Upgrade Tests', ([
  governor,
  minter,
  burner,
  mocker,
  receiver,
]) => {
  before(async function () {
    const confirmationsRequired = 1;
    this.roleManager = await RoleManager.new([ governor ], confirmationsRequired);
    await this.roleManager.addRolesForAddresses(
      [ minter, burner, mocker ],
      [ MINTER_ROLE, BURNER_ROLE, MOCK_ROLE ],
      { from: governor }
    );
    const deployment = await deployRheaGeToken(this.roleManager.address, governor);
    this.rheaGe = deployment.token;
    this.rheaGeResolver = deployment.resolver;
    this.resolver = await Resolver.new(this.roleManager.address);
    this.rheaGeUpgradedMock = await deployRheaGeUpgradedMock(this.roleManager.address, governor);
  });

  it('should upgrade rheaGeToken', async function () {
    const mintSignature = getFirst4bytes(configToKeccakSignature({
      contract: this.rheaGeUpgradedMock,
      name: 'mint',
    }));
    const burnSignature = getFirst4bytes(configToKeccakSignature({
      contract: this.rheaGe,
      name: 'burn',
    }));
    const setVersionSignature = getFirst4bytes(configToKeccakSignature({
      contract: this.rheaGeUpgradedMock,
      name: 'setVersion',
    }));
    const versionSignature = getFirst4bytes(configToKeccakSignature({
      contract: this.rheaGeUpgradedMock,
      name: 'version',
    }));

    await this.rheaGeResolver.bulkRegister(
      [
        setVersionSignature,
        versionSignature,
      ],
      [
        this.rheaGeUpgradedMock.address,
        this.rheaGeUpgradedMock.address,
      ],
      { from: governor }
    ).should.be.fulfilled;

    await this.rheaGeResolver.updateSignature(
      mintSignature,
      this.rheaGeUpgradedMock.address,
      { from: governor }
    ).should.be.fulfilled;

    await this.rheaGeResolver.removeSignature(
      burnSignature,
      { from: governor }
    ).should.be.fulfilled;
  });

  it('should mint zero tokens, in the previous version, this was prohibited', async function () {
    await this.rheaGe.mint(
      receiver,
      new BigNumber(0),
      { from: minter }
    ).should.be.fulfilled;
  });

  it('should mint a few tokens to make sure that nothing is broken', async function () {
    const amount = new BigNumber(50);
    await this.rheaGe.mint(
      receiver,
      amount,
      { from: minter }
    ).should.be.fulfilled;
    const balance = await this.rheaGe.balanceOf(receiver);
    amount.should.be.bignumber.equal(balance);
  });

  it('should NOT burn because the function was removed', async function () {
    await this.rheaGe.burn(
      receiver,
      new BigNumber(0),
      { from: burner }
    ).should.be.rejected;
  });

  it('should make sure a new var has not been initialized', async function () {
    this.rheaGe = await upgradedMockInterface(this.rheaGe.address);
    const expectedVersion = new BigNumber(0);
    const receivedVersion = await this.rheaGe.version().should.be.fulfilled;
    expectedVersion.should.be.bignumber.equal(receivedVersion);
  });

  it('should setVersion with a new MOCK_ROLE', async function () {
    await this.rheaGe.setVersion(
      new BigNumber(2),
      { from: mocker }
    ).should.be.fulfilled;
  });

  it('should get a version of the new variable', async function () {
    const expectedVersion = new BigNumber(2);
    const receivedVersion = await this.rheaGe.version().should.be.fulfilled;
    expectedVersion.should.be.bignumber.equal(receivedVersion);
  });
});

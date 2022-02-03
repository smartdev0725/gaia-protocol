import {
  getChaiBN,
  BigNumber,
} from '@nomisma/nomisma-smart-contract-helpers';
import { roleNames } from '../helpers/roles';
import { tokenName, tokenSymbol } from './RheaGeTokenBasicTest';

require('chai')
  .use(require('chai-as-promised'))
  .use(getChaiBN())
  .should();


const RheaGe = artifacts.require('./RheaGeToken.sol');
const Registry = artifacts.require('./RGRegistry.sol');
const RoleManager = artifacts.require('./RoleManager.sol');

const {
  MINTER_ROLE,
  BURNER_ROLE,
} = roleNames;

contract('RheaGeRegistry Test', ([
  governor,
  minter,
  batchOwner,
  offsetter1,
  rheaGeTokenMock,
  rgtReceiver,
]) => {
  const batchDataBase = {
    serialNumber: '1234567',
    projectId: new BigNumber(777),
    vintage: 'vintage', // TODO: what should this look like ??
    creditType: 'creditType', // TODO: what should this look like ??
    units: new BigNumber(10000),
    batchOwner,
  };

  before(async function () {
    this.roleManager = await RoleManager.new([ governor ], '1');
    this.rheaGe = await RheaGe.new(
      tokenName,
      tokenSymbol,
      this.roleManager.address,
      { from: governor }
    );

    this.registry = await Registry.new(
      this.rheaGe.address,
      this.roleManager.address,
      rgtReceiver,
      { from: governor }
    );

    await this.roleManager.addRolesForAddresses(
      [
        minter,
        this.registry.address,
        this.registry.address,
      ],
      [
        MINTER_ROLE,
        MINTER_ROLE,
        BURNER_ROLE,
      ],
      { from: governor }
    );

    await this.registry.generateBatch(
      ...Object.values(batchDataBase),
      { from: minter }
    );
  });

  describe('#generateBatch()', () => {
    it('should generate new batch and mint the correct amount of tokens to the rgtReceiver', async function () {
      const newBatch = {
        ...batchDataBase,
        serialNumber: '131553135',
      };
      const receiverBalBefore = await this.rheaGe.balanceOf(rgtReceiver);

      await this.registry.generateBatch(
        ...Object.values(newBatch),
        { from: minter }
      ).should.be.fulfilled;

      const {
        serialNumber: serialNumberSC,
        projectId: projectIdSC,
        vintage: vintageSC,
        creditType: cresitTypeSC,
        units: unitsSC,
        owner: ownerSC,
        created,
      } = await this.registry.registeredBatches(newBatch.serialNumber);

      serialNumberSC.should.be.equal(newBatch.serialNumber);
      projectIdSC.should.be.bignumber.equal(newBatch.projectId);
      vintageSC.should.be.equal(newBatch.vintage);
      cresitTypeSC.should.be.equal(newBatch.creditType);
      unitsSC.should.be.bignumber.equal(newBatch.units);
      ownerSC.should.be.equal(newBatch.batchOwner);
      created.should.be.equal(true);

      const receiverBalAfter = await this.rheaGe.balanceOf(rgtReceiver);
      receiverBalAfter.sub(receiverBalBefore).should.be.bignumber.equal(newBatch.units);
      receiverBalAfter.sub(receiverBalBefore).should.be.bignumber.equal(unitsSC);
    });

    it('should should NOT generate the same batch twice', async function () {
      const newBatch = {
        ...batchDataBase,
        serialNumber: '3333333',
      };

      await this.registry.generateBatch(
        ...Object.values(newBatch),
        { from: minter }
      ).should.be.fulfilled;

      await this.registry.generateBatch(
        ...Object.values(newBatch),
        { from: minter }
      ).should.be.rejectedWith('RGRegistry::generateBatch: Batch already created');
    });
  });

  describe('#offset()', async () => {
    // eslint-disable-next-line max-len
    it('should offset, burn the correct amount of tokens and change clients balance appropriately when called by any client', async function () {
      const newBatch = {
        ...batchDataBase,
        serialNumber: '3331233',
      };
      const tokenAmtBought = new BigNumber(350);
      const tokenAmtOffset1 = new BigNumber(7);
      const tokenAmtOffset2 = new BigNumber(179);

      await this.registry.generateBatch(
        ...Object.values(newBatch),
        { from: minter }
      ).should.be.fulfilled;

      await this.rheaGe.transfer(offsetter1, tokenAmtBought, { from: rgtReceiver });

      const offsetterBalanceBefore = await this.rheaGe.balanceOf(offsetter1);

      await this.registry.offset(tokenAmtOffset1, { from: offsetter1 }).should.be.fulfilled;

      // for checking proper storage updates
      await this.registry.offset(tokenAmtOffset2, { from: rgtReceiver }).should.be.fulfilled;

      const offsetterBalanceAfter = await this.rheaGe.balanceOf(offsetter1);

      offsetterBalanceBefore.sub(offsetterBalanceAfter).should.be.bignumber.equal(tokenAmtOffset1);
      offsetterBalanceAfter.should.be.bignumber.equal(tokenAmtBought.sub(tokenAmtOffset1));

      const retiredBalanceClient1 = await this.registry.retiredBalances(offsetter1);
      const retiredBalanceClient2 = await this.registry.retiredBalances(rgtReceiver);
      const totalSupplyRetired = await this.registry.totalSupplyRetired();

      retiredBalanceClient1.should.be.bignumber.equal(tokenAmtOffset1);
      retiredBalanceClient2.should.be.bignumber.equal(tokenAmtOffset2);
      totalSupplyRetired.should.be.bignumber.equal(tokenAmtOffset1.add(tokenAmtOffset2));
    });

    // TODO: add more tests here !!! (i.e. does it add up to retiredBalanced if a client offsets multiple times?)
  });

  // TODO: test access to each function

  // TODO: describe('Events', () => {}); test all events on Registry

  it('should set new rheaGeToken address', async function () {
    const previousTokenAddress = await this.registry.rheaGeToken();
    previousTokenAddress.should.be.equal(this.rheaGe.address);

    await this.registry.setRheaGeToken(rheaGeTokenMock, { from: governor });
    const tokenAddressAfter = await this.registry.rheaGeToken();
    tokenAddressAfter.should.be.equal(rheaGeTokenMock);

    // set it back so other tests work
    await this.registry.setRheaGeToken(this.rheaGe.address, { from: governor });
    const tokenAddressReSet = await this.registry.rheaGeToken();
    tokenAddressReSet.should.be.equal(this.rheaGe.address);
  });
});

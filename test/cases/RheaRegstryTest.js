import {
  getChaiBN,
  BigNumber,
} from '@nomisma/nomisma-smart-contract-helpers';
import { contract } from 'hardhat';
import { roleNames } from '../helpers/roles';
import { tokenName, tokenSymbol } from './RheaGeTokenBasicTest';

require('chai')
  .use(require('chai-as-promised'))
  .use(getChaiBN())
  .should();


const RheaGe = artifacts.require('./RheaGeToken.sol');
const Registry = artifacts.require('./RheaRegistry.sol');
const RoleManager = artifacts.require('./RoleManager.sol');

const {
  MINTER_ROLE,
  BURNER_ROLE,
  OPERATOR_ROLE,
} = roleNames;

contract('RheaRegistry Test', ([
  governor,
  minter,
  burner,
  operator,
  batchOwner,
  buyer1,
  buyer2,
  offsetter1,
  rheaGeTokenMock,
]) => {
  const batchDataBase = {
    serialNumber: '1234567',
    projectId: new BigNumber(777),
    vintage: 'vintage', // TODO: what should this look like ??
    creditType: 'creditType', // TODO: what should this look like ??
    units: new BigNumber(123),
    batchOwner,
  };

  before(async function () {
    this.roleManager = await RoleManager.new([ governor ], '1');
    this.token = await RheaGe.new(
      tokenName,
      tokenSymbol,
      this.roleManager.address,
      { from: governor }
    );
    this.registry = await Registry.new(
      this.token.address,
      this.roleManager.address,
      { from: governor }
    );

    await this.roleManager.addRolesForAddresses(
      [
        minter,
        this.registry.address,
        operator,
        burner,
        this.registry.address,
      ],
      [
        MINTER_ROLE,
        MINTER_ROLE,
        OPERATOR_ROLE,
        BURNER_ROLE,
        BURNER_ROLE,
      ],
      { from: governor }
    );
  });

  describe('#generateBatch()', () => {
    it('should generate new batch and mint the correct amount of tokens', async function () {
      const registryBalBefore = await this.token.balanceOf(this.registry.address);
      registryBalBefore.should.be.bignumber.equal(new BigNumber(0));

      await this.registry.generateBatch(
        ...Object.values(batchDataBase),
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
      } = await this.registry.registeredBatches(batchDataBase.serialNumber);

      serialNumberSC.should.be.equal(batchDataBase.serialNumber);
      projectIdSC.should.be.bignumber.equal(batchDataBase.projectId);
      vintageSC.should.be.equal(batchDataBase.vintage);
      cresitTypeSC.should.be.equal(batchDataBase.creditType);
      unitsSC.should.be.bignumber.equal(batchDataBase.units);
      ownerSC.should.be.equal(batchDataBase.batchOwner);
      created.should.be.equal(true);

      const registryBalAfter = await this.token.balanceOf(this.registry.address);
      registryBalAfter.sub(registryBalBefore).should.be.bignumber.equal(batchDataBase.units);
      registryBalAfter.sub(registryBalBefore).should.be.bignumber.equal(unitsSC);
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
      ).should.be.rejectedWith('RheaRegistry::generateBatch: Batch already created');
    });
  });

  describe('#updateBatch()', () => {
    // TODO: check the todo in the updateBatch() regarding minting
    it('should update existing batch and mint tokens', async function () {
      const initialBatch = {
        ...batchDataBase,
        serialNumber: '7777',
      };

      await this.registry.generateBatch(
        ...Object.values(initialBatch),
        { from: minter }
      );

      const updatedBatch = {
        ...initialBatch,
        creditType: 'creditTypeUpdated',
        units: new BigNumber(150),
      };
      const mintTokens = true;

      const registryBalBefore = await this.token.balanceOf(this.registry.address);

      await this.registry.updateBatch(
        ...Object.values(updatedBatch),
        mintTokens,
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
      } = await this.registry.registeredBatches(initialBatch.serialNumber);

      const registryBalAfter = await this.token.balanceOf(this.registry.address);

      serialNumberSC.should.be.equal(initialBatch.serialNumber);
      projectIdSC.should.be.bignumber.equal(initialBatch.projectId);
      vintageSC.should.be.equal(initialBatch.vintage);
      cresitTypeSC.should.be.equal(updatedBatch.creditType);
      unitsSC.should.be.bignumber.equal(updatedBatch.units);
      ownerSC.should.be.equal(updatedBatch.batchOwner);
      created.should.be.equal(true);

      registryBalAfter.sub(registryBalBefore).should.be.bignumber.equal(updatedBatch.units);
    });

    it('should update existing batch and NOT mint tokens', async function () {
      const initialBatch = {
        ...batchDataBase,
        serialNumber: '777',
      };

      await this.registry.generateBatch(
        ...Object.values(initialBatch),
        { from: minter }
      );

      const updatedBatch = {
        ...initialBatch,
        creditType: 'creditTypeUpdated',
        batchOwner: operator,
      };
      const mintTokens = false;

      const registryBalBefore = await this.token.balanceOf(this.registry.address);

      await this.registry.updateBatch(
        ...Object.values(updatedBatch),
        mintTokens,
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
      } = await this.registry.registeredBatches(initialBatch.serialNumber);

      const registryBalAfter = await this.token.balanceOf(this.registry.address);

      serialNumberSC.should.be.equal(initialBatch.serialNumber);
      projectIdSC.should.be.bignumber.equal(initialBatch.projectId);
      vintageSC.should.be.equal(initialBatch.vintage);
      cresitTypeSC.should.be.equal(updatedBatch.creditType);
      unitsSC.should.be.bignumber.equal(initialBatch.units);
      ownerSC.should.be.equal(updatedBatch.batchOwner);
      created.should.be.equal(true);

      registryBalAfter.should.be.bignumber.equal(registryBalBefore);
    });

    it('should NOT update a batch that was not registered', async function () {
      const newBatch = {
        ...batchDataBase,
        serialNumber: 'asdasda',
      };

      await this.registry.updateBatch(
        ...Object.values(newBatch),
        false,
        { from: minter }
      ).should.be.rejectedWith('RheaRegistry::updateBatch: Batch is empty');
    });
  });

  describe('#transferTokens()', () => {
    it('should transfer minted tokens to 2 different clients', async function () {
      const newBatch = {
        ...batchDataBase,
        serialNumber: '2222222',
      };

      const tokenAmt1 = new BigNumber(50);
      const tokenAmt2 = new BigNumber(35);

      await this.registry.generateBatch(
        ...Object.values(newBatch),
        { from: minter }
      ).should.be.fulfilled;

      const client1BalanceBefore = await this.token.balanceOf(buyer1);
      const client2BalanceBefore = await this.token.balanceOf(buyer2);

      await this.registry.transferTokens(buyer1, tokenAmt1, { from: operator }).should.be.fulfilled;
      await this.registry.transferTokens(buyer2, tokenAmt2, { from: operator }).should.be.fulfilled;

      const client1BalanceAfter = await this.token.balanceOf(buyer1);
      const client2BalanceAfter = await this.token.balanceOf(buyer2);

      client1BalanceAfter.sub(client1BalanceBefore).should.be.bignumber.equal(tokenAmt1);
      client2BalanceAfter.sub(client2BalanceBefore).should.be.bignumber.equal(tokenAmt2);
    });

    it('should NOT transfer more than was minted', async function () {
      const newBatch = {
        ...batchDataBase,
        serialNumber: '11111',
        units: new BigNumber(10),
      };

      const transferAmt = new BigNumber(1000);

      await this.registry.generateBatch(
        ...Object.values(newBatch),
        { from: minter }
      ).should.be.fulfilled;

      await this.registry.transferTokens(buyer1, transferAmt, { from: operator })
        .should.be.rejectedWith('RheaRegistry::transferTokens: Unsufficient amount of tokens on Registry');
    });
  });

  describe('#offset()', async () => {
    it('should offset, burn the correct amount of tokens and change clients balance appropriately', async function () {
      const newBatch = {
        ...batchDataBase,
        serialNumber: '3331233',
      };
      const tokenAmtBought = new BigNumber(35);
      const tokenAmtOffset = new BigNumber(7);

      await this.registry.generateBatch(
        ...Object.values(newBatch),
        { from: minter }
      ).should.be.fulfilled;

      await this.registry.transferTokens(offsetter1, tokenAmtBought, { from: operator });

      const offsetterBalanceBefore = await this.token.balanceOf(offsetter1);

      await this.registry.offset(offsetter1, tokenAmtOffset, { from: burner }).should.be.fulfilled;

      const offsetterBalanceAfter = await this.token.balanceOf(offsetter1);

      offsetterBalanceBefore.sub(offsetterBalanceAfter).should.be.bignumber.equal(tokenAmtOffset);
      offsetterBalanceAfter.should.be.bignumber.equal(tokenAmtBought.sub(tokenAmtOffset));
    });
  });

  // TODO: describe('ACCESS', () => {}); test access to each function

  // TODO: describe('Events', () => {}); test all event on Registry

  it('should set new rheaGeToken address', async function () {
    const previousTokenAddress = await this.registry.rheaGeToken();
    previousTokenAddress.should.be.equal(this.token.address);

    await this.registry.setRheaGeToken(rheaGeTokenMock, { from: governor });
    const tokenAddressAfter = await this.registry.rheaGeToken();
    tokenAddressAfter.should.be.equal(rheaGeTokenMock);

    // set it back so other tests work
    await this.registry.setRheaGeToken(this.token.address, { from: governor });
    const tokenAddressReSet = await this.registry.rheaGeToken();
    tokenAddressReSet.should.be.equal(this.token.address);
  });
});

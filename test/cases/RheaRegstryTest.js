import {
  getChaiBN,
  BigNumber,
} from '@nomisma/nomisma-smart-contract-helpers';
import { contract } from 'hardhat';
import { getRoleBytes32 } from '../helpers/roles';
import { tokenName, tokenSymbol } from './CO2TokenBasicTest';

require('chai')
  .use(require('chai-as-promised'))
  .use(getChaiBN())
  .should();


const RheaGe = artifacts.require('./RheaGeToken.sol');
const Registry = artifacts.require('./RheaRegistry.sol');


const MINTER_ROLE = getRoleBytes32('MINTER_ROLE');
const OPERATOR_ROLE = getRoleBytes32('OPERATOR_ROLE');
const BURNER_ROLE = getRoleBytes32('BURNER_ROLE');


contract('RheaRegistry Test', ([
  governor,
  minter,
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
    this.token = await RheaGe.new(tokenName, tokenSymbol, { from: governor });
    this.registry = await Registry.new(this.token.address, { from: governor });

    // TODO: rework Access and Role Management
    await this.registry.grantRole(MINTER_ROLE, minter, { from: governor });
    await this.token.grantRole(MINTER_ROLE, this.registry.address, { from: governor });
    await this.registry.grantRole(OPERATOR_ROLE, governor, { from: governor });
    await this.registry.grantRole(BURNER_ROLE, governor, { from: governor });
    await this.token.grantRole(BURNER_ROLE, this.registry.address, { from: governor });
  });

  // TODO: describe('ACCESS');

  describe('#generateBatch()', () => {
    it('should generate new batch and mint the correct amount of tokens', async function () {
      const registryBalBefore = await this.token.balanceOf(this.registry.address);
      registryBalBefore.should.be.bignumber.equal(new BigNumber(0));

      await this.registry.generateBatch(
        ...Object.values(batchDataBase),
        { from: minter }
      ).should.be.fulfilled;

      const registryBalAfter = await this.token.balanceOf(this.registry.address);
      registryBalAfter.sub(registryBalBefore).should.be.bignumber.equal(batchDataBase.units);
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

      await this.registry.transferTokens(buyer1, tokenAmt1, { from: governor }).should.be.fulfilled;
      await this.registry.transferTokens(buyer2, tokenAmt2, { from: governor }).should.be.fulfilled;

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

      await this.registry.transferTokens(buyer1, transferAmt, { from: governor })
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

      await this.registry.transferTokens(offsetter1, tokenAmtBought, { from: governor });

      const offsetterBalanceBefore = await this.token.balanceOf(offsetter1);

      await this.registry.offset(offsetter1, tokenAmtOffset, { from: governor }).should.be.fulfilled;

      const offsetterBalanceAfter = await this.token.balanceOf(offsetter1);

      offsetterBalanceBefore.sub(offsetterBalanceAfter).should.be.bignumber.equal(tokenAmtOffset);
      offsetterBalanceAfter.should.be.bignumber.equal(tokenAmtBought.sub(tokenAmtOffset));
    });
  });

  it('should set new rheaGeToken address', async function () {
    const previousTokenAddress = await this.registry.rheaGeToken();
    previousTokenAddress.should.be.equal(this.token.address);

    await this.registry.setRheaGeToken(rheaGeTokenMock);
    const tokenAddressAfter = await this.registry.rheaGeToken();
    tokenAddressAfter.should.be.equal(rheaGeTokenMock);

    // set it back so other tests work
    await this.registry.setRheaGeToken(this.token.address);
    const tokenAddressReSet = await this.registry.rheaGeToken();
    tokenAddressReSet.should.be.equal(this.token.address);
  });
});

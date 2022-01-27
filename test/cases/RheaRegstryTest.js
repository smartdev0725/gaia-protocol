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
const Registry = artifacts.require('./RheaGeRegistry.sol');
const RoleManager = artifacts.require('./RoleManager.sol');
const PaymentManager = artifacts.require('./PaymentManager.sol');
const Token = artifacts.require('./ERC20Mock.sol');

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
  etherAddress,
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
    this.payToken = await Token.new('ERC20Mock', 'ETM', buyer1);
    this.rheaGe = await RheaGe.new(
      tokenName,
      tokenSymbol,
      this.roleManager.address,
      { from: governor }
    );

    this.payManager = await PaymentManager.new(this.roleManager.address, etherAddress);

    await this.payManager.addTokensToWhitelist([ this.payToken.address ]);

    this.registry = await Registry.new(
      this.rheaGe.address,
      this.roleManager.address,
      this.payManager.address,
      { from: governor }
    );

    await this.roleManager.addRolesForAddresses(
      [
        minter,
        this.registry.address,
        operator,
        this.registry.address,
        burner,
        this.registry.address,
      ],
      [
        MINTER_ROLE,
        MINTER_ROLE,
        OPERATOR_ROLE,
        OPERATOR_ROLE,
        BURNER_ROLE,
        BURNER_ROLE,
      ],
      { from: governor }
    );
  });

  describe('#generateBatch()', () => {
    it('should generate new batch and mint the correct amount of tokens', async function () {
      const registryBalBefore = await this.rheaGe.balanceOf(this.registry.address);
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

      const registryBalAfter = await this.rheaGe.balanceOf(this.registry.address);
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

  describe('#purchase()', () => {
    it('should transfer minted tokens to 2 different clients who pay with ERC20', async function () {
      const newBatch = {
        ...batchDataBase,
        serialNumber: '2222222',
      };

      const rheaGeAmt1 = new BigNumber(50);
      const rheaGeAmt2 = new BigNumber(35);
      const payAmt1 = new BigNumber(79);
      const payAmt2 = new BigNumber(52);

      await this.registry.generateBatch(
        ...Object.values(newBatch),
        { from: minter }
      ).should.be.fulfilled;

      await this.payToken.transfer(buyer2, payAmt2, { from: buyer1 });

      const client1BalanceBefore = await this.rheaGe.balanceOf(buyer1);
      const client2BalanceBefore = await this.rheaGe.balanceOf(buyer2);
      const registryBalBefore = await this.payToken.balanceOf(this.registry.address);

      await this.payToken.approve(this.payManager.address, payAmt1, { from: buyer1 });
      await this.payToken.approve(this.payManager.address, payAmt2, { from: buyer2 });

      await this.registry.purchase(
        buyer1,
        this.payToken.address,
        payAmt1,
        rheaGeAmt1,
        { from: operator }
      ).should.be.fulfilled;

      await this.registry.purchase(
        buyer2,
        this.payToken.address,
        payAmt2,
        rheaGeAmt2,
        { from: operator }
      ).should.be.fulfilled;

      const client1BalanceAfter = await this.rheaGe.balanceOf(buyer1);
      const client2BalanceAfter = await this.rheaGe.balanceOf(buyer2);
      const registryBalAfter = await this.payToken.balanceOf(this.registry.address);

      client1BalanceAfter.sub(client1BalanceBefore).should.be.bignumber.equal(rheaGeAmt1);
      client2BalanceAfter.sub(client2BalanceBefore).should.be.bignumber.equal(rheaGeAmt2);

      registryBalAfter.sub(registryBalBefore).should.be.bignumber.equal(
        payAmt1.add(payAmt2)
      );
    });

    it('should NOT transfer more than was minted', async function () {
      const newBatch = {
        ...batchDataBase,
        serialNumber: '11111',
        units: new BigNumber(10),
      };

      const transferAmt = new BigNumber(1000);
      const payAmt = new BigNumber(15000);

      await this.payToken.approve(this.payManager.address, payAmt, { from: buyer1 });

      await this.registry.generateBatch(
        ...Object.values(newBatch),
        { from: minter }
      ).should.be.fulfilled;

      await this.registry.purchase(buyer1, this.payToken.address, payAmt, transferAmt, { from: operator })
        .should.be.rejectedWith('ERC20: transfer amount exceeds balance');
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
      const payAmt = new BigNumber(15000);

      await this.payToken.transfer(offsetter1, payAmt, { from: buyer1 });
      await this.payToken.approve(this.payManager.address, payAmt, { from: offsetter1 });

      await this.registry.generateBatch(
        ...Object.values(newBatch),
        { from: minter }
      ).should.be.fulfilled;

      await this.registry.purchase(offsetter1, this.payToken.address, payAmt, tokenAmtBought, { from: operator });

      const offsetterBalanceBefore = await this.rheaGe.balanceOf(offsetter1);

      await this.registry.offset(offsetter1, tokenAmtOffset, { from: burner }).should.be.fulfilled;

      const offsetterBalanceAfter = await this.rheaGe.balanceOf(offsetter1);

      offsetterBalanceBefore.sub(offsetterBalanceAfter).should.be.bignumber.equal(tokenAmtOffset);
      offsetterBalanceAfter.should.be.bignumber.equal(tokenAmtBought.sub(tokenAmtOffset));
    });
  });

  // TODO: describe('ACCESS', () => {}); test access to each function

  // TODO: describe('Events', () => {}); test all event on Registry

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

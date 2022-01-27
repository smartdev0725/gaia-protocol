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
  operator,
  batchOwner,
  buyer1,
  buyer2,
  offsetter1,
  rheaGeTokenMock,
  etherAddress,
  nonWhitelistedTokenMock,
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

    await this.payManager.addTokensToWhitelist([ this.payToken.address, etherAddress ]);

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
        this.registry.address,
      ],
      [
        MINTER_ROLE,
        MINTER_ROLE,
        OPERATOR_ROLE,
        OPERATOR_ROLE,
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
    before(async function () {
      const newBatch = {
        ...batchDataBase,
        serialNumber: '2222222',
        units: new BigNumber(1000000),
      };

      await this.registry.generateBatch(
        ...Object.values(newBatch),
        { from: minter }
      ).should.be.fulfilled;
    });

    it('should transfer minted tokens to 2 different clients who pay with ERC20', async function () {
      const rheaGeAmt1 = new BigNumber(50);
      const rheaGeAmt2 = new BigNumber(35);
      const payAmt1 = new BigNumber(79);
      const payAmt2 = new BigNumber(52);

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

    it('should NOT transfer more ERC20 than was minted', async function () {
      const rgAmount = new BigNumber(1000000000);
      const payAmt = new BigNumber(15);

      await this.payToken.approve(this.payManager.address, payAmt, { from: buyer1 });

      await this.registry.purchase(buyer1, this.payToken.address, payAmt, rgAmount, { from: operator })
        .should.be.rejectedWith('ERC20: transfer amount exceeds balance');
    });

    it('should transfer minted tokens to 2 different clients who pay with ETH', async function () {
      const rheaGeAmt1 = new BigNumber(50);
      const rheaGeAmt2 = new BigNumber(35);
      const payAmt1 = new BigNumber(79);
      const payAmt2 = new BigNumber(52);

      const client1BalanceBefore = await this.rheaGe.balanceOf(buyer1);
      const client2BalanceBefore = await this.rheaGe.balanceOf(buyer2);
      // TODO: figure out who calls this function and if these commented balances should change here !!!
      // const cl1EthBalBefore = new BigNumber(await web3.eth.getBalance(buyer1));
      // const cl2EthBalBefore = new BigNumber(await web3.eth.getBalance(buyer2));
      const registryBalBefore = new BigNumber(await web3.eth.getBalance(this.registry.address));

      await this.registry.purchase(buyer1, etherAddress, payAmt1, rheaGeAmt1, { from: operator, value: payAmt1 });
      await this.registry.purchase(buyer2, etherAddress, payAmt2, rheaGeAmt2, { from: operator, value: payAmt2 });

      const client1BalanceAfter = await this.rheaGe.balanceOf(buyer1);
      const client2BalanceAfter = await this.rheaGe.balanceOf(buyer2);
      // const cl1EthBalAfter = new BigNumber(await web3.eth.getBalance(buyer1));
      // const cl2EthBalAfter = new BigNumber(await web3.eth.getBalance(buyer2));
      const registryBalAfter = new BigNumber(await web3.eth.getBalance(this.registry.address));

      client1BalanceAfter.sub(client1BalanceBefore).should.be.bignumber.equal(rheaGeAmt1);
      client2BalanceAfter.sub(client2BalanceBefore).should.be.bignumber.equal(rheaGeAmt2);
      // TODO: see TODO above
      // cl1EthBalAfter.sub(cl1EthBalBefore).should.be.bignumber.equal(payAmt1);
      // cl2EthBalAfter.sub(cl2EthBalBefore).should.be.bignumber.equal(payAmt2);

      registryBalAfter.sub(registryBalBefore).should.be.bignumber.equal(
        payAmt1.add(payAmt2)
      );
    });

    it('should NOT transfer if amount and msg.value differ when paying with ETH', async function () {
      const rheaGeAmt = new BigNumber(50);
      const payAmt = new BigNumber(79);
      const incorrectPayAmt = payAmt.div(new BigNumber(2));

      await this.registry.purchase(
        buyer1,
        etherAddress,
        incorrectPayAmt,
        rheaGeAmt,
        { from: operator, value: payAmt }
      ).should.be.rejectedWith('PaymentManager::collectPayment: incorrect amount has been passed with ETH purchase');
    });

    it('should NOT transfer if ETH has been sent with an ERC20 purchase', async function () {
      const rheaGeAmt = new BigNumber(50);
      const payAmt = new BigNumber(79);

      await this.registry.purchase(
        buyer1,
        this.payToken.address,
        payAmt,
        rheaGeAmt,
        { from: operator, value: payAmt }
      ).should.be.rejectedWith('PaymentManager::collectPayment: ETH has been sent with an ERC20 purchase');
    });

    it('should NOT transfer if payment was zero with an ERC20 or ETH purchase', async function () {
      const rheaGeAmt = new BigNumber(50);
      const zeroAmt = new BigNumber(0);

      await this.registry.purchase(
        buyer1,
        this.payToken.address,
        zeroAmt,
        rheaGeAmt,
        { from: operator }
      ).should.be.rejectedWith('PaymentManager::collectPayment: no payment provided');

      await this.registry.purchase(
        buyer1,
        this.payToken.address,
        zeroAmt,
        rheaGeAmt,
        { from: operator, value: zeroAmt }
      ).should.be.rejectedWith('PaymentManager::collectPayment: no payment provided');
    });

    it('should NOT transfer if paying with non-whitelisted token', async function () {
      const rheaGeAmt = new BigNumber(50);
      const payAmt = new BigNumber(79);

      await this.registry.purchase(
        buyer1,
        nonWhitelistedTokenMock,
        payAmt,
        rheaGeAmt,
        { from: operator }
      ).should.be.rejectedWith('PaymentManager::validateToken: Token is not whitelisted');
    });

    it('should NOT transfer if client has insufficient funds in ETH', async function () {
      const rheaGeAmt = new BigNumber(50);
      const payAmt = new BigNumber(10000000000000).mul(new BigNumber(10).pow(new BigNumber(18)));

      await this.registry.purchase(
        buyer1,
        etherAddress,
        payAmt,
        rheaGeAmt,
        { from: operator, value: payAmt }
      ).should.be.rejectedWith('sender doesn\'t have enough funds to send tx.');
    });

    it('should NOT transfer if client has not approved the payment amount with an ERC20 purchase', async function () {
      const rheaGeAmt = new BigNumber(50);
      const payAmt = new BigNumber(79);

      await this.registry.purchase(
        buyer1,
        this.payToken.address,
        payAmt,
        rheaGeAmt,
        { from: operator }
      ).should.be.rejectedWith('ERC20: transfer amount exceeds allowance');
    });
  });

  describe('#offset()', async () => {
    // eslint-disable-next-line max-len
    it('should offset, burn the correct amount of tokens and change clients balance appropriately when called by any client', async function () {
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

      await this.registry.offset(tokenAmtOffset, { from: offsetter1 }).should.be.fulfilled;

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

import {
  getChaiBN,
  BigNumber,
} from '@nomisma/nomisma-smart-contract-helpers';
import { deployGaiaToken } from '../helpers/gaia';

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

export const tokenName = 'Gaia Token';
export const tokenSymbol = 'GAIA';


contract('GaiaToken Basic Tests', ([
  governor,
  minter,
  burner,
  moneybag, // send any amount to this account
  receiver,
  clientWithoutTokens, // do not send tokens to this account
  client1,
  client2,
]) => {
  const zeroAddress = '0x0000000000000000000000000000000000000000';

  before(async function () {
    const confirmationsRequired = 1;
    this.roleManager = await RoleManager.new([ governor ], confirmationsRequired);
    await this.roleManager.addRolesForAddresses(
      [ minter, burner ],
      [ MINTER_ROLE, BURNER_ROLE ],
      { from: governor }
    );
    this.gaia = (await deployGaiaToken(this.roleManager.address, governor)).token;
  });

  it('should NOT initialize twice', async function () {
    await this.gaia.init(this.roleManager.address)
      .should.be.rejectedWith('Initializable: contract is already initialized');
  });

  it('should set initial storage correctly', async function () {
    const nameFromSc = await this.gaia.name();
    const symbolFromSc = await this.gaia.symbol();
    const totalSupply = await this.gaia.totalSupply();

    assert.equal(nameFromSc, tokenName);
    assert.equal(symbolFromSc, tokenSymbol);
    assert.equal(totalSupply, '0');
  });

  it('should NOT transfer before minting', async function () {
    await this.gaia.transfer(client2, new BigNumber(10), { from: client1 })
      .should.be.rejectedWith('ERC20: transfer amount exceeds balance');
  });

  it('should mint with MINTER_ROLE', async function () {
    const amount = new BigNumber(1000);
    await this.gaia.mint(moneybag, amount, { from: minter }).should.be.fulfilled;
  });

  it('should NOT mint to zero address', async function () {
    const amount = new BigNumber(1000);
    await this.gaia.mint(zeroAddress, amount, { from: minter })
      .should.be.rejectedWith('ERC20: mint to the zero address');
  });

  it('should NOT mint zero amount', async function () {
    const amount = new BigNumber(0);
    await this.gaia.mint(moneybag, amount, { from: minter })
      .should.be.rejectedWith('GaiaToken: minting zero amount');
  });

  it('should NOT mint without MINTER_ROLE', async function () {
    const amount = new BigNumber(1000);
    await this.gaia.mint(moneybag, amount, { from: governor })
      .should.be.rejectedWith('RoleAware: Permission denied to execute this function');
  });

  it('should burn with BURNER_ROLE', async function () {
    const amount = new BigNumber(10);
    await this.gaia.burn(moneybag, amount, { from: burner }).should.be.fulfilled;
  });

  it('should NOT burn from zero address', async function () {
    const amount = new BigNumber(10);
    await this.gaia.burn(zeroAddress, amount, { from: burner })
      .should.be.rejectedWith('ERC20: burn from the zero address');
  });

  it('should NOT burn zero amount', async function () {
    const amount = new BigNumber(0);
    await this.gaia.burn(moneybag, amount, { from: burner })
      .should.be.rejectedWith('GaiaToken: burning zero amount');
  });

  it('should NOT burn without BURNER_ROLE', async function () {
    const amount = new BigNumber(10);
    await this.gaia.burn(moneybag, amount, { from: governor })
      .should.be.rejectedWith('RoleAware: Permission denied to execute this function');
  });

  it('should NOT transfer to zero address', async function () {
    const amount = new BigNumber(10);
    await this.gaia.transfer(zeroAddress, amount, { from: moneybag })
      .should.be.rejectedWith('ERC20: transfer to the zero address');
  });

  it('should transfer a few tokens', async function () {
    const amount = new BigNumber(50);
    await this.gaia.transfer(receiver, amount, { from: moneybag })
      .should.be.fulfilled;
  });

  it('should transfer zero amount', async function () {
    const amount = new BigNumber(0);
    await this.gaia.transfer(clientWithoutTokens, amount, { from: clientWithoutTokens })
      .should.be.fulfilled;
  });

  it('should NOT transfer from zero balance', async function () {
    const amount = new BigNumber(10);
    await this.gaia.transfer(moneybag, amount, { from: clientWithoutTokens })
      .should.be.rejectedWith('ERC20: transfer amount exceeds balance');
  });

  it('should approve if balance is zero', async function () {
    const amount = new BigNumber(10);
    await this.gaia.approve(moneybag, amount, { from: clientWithoutTokens })
      .should.be.fulfilled;
  });

  it('should change allowance', async function () {
    const allowanceBefore = await this.gaia.allowance(moneybag, clientWithoutTokens);
    const increaseToAmount = new BigNumber(200);
    await this.gaia.approve(clientWithoutTokens, increaseToAmount, { from: moneybag })
      .should.be.fulfilled;
    const allowanceAfter = await this.gaia.allowance(moneybag, clientWithoutTokens);
    allowanceBefore.should.be.bignumber.equal(allowanceAfter.sub(increaseToAmount));
  });

  it('should set allowance to zero', async function () {
    const initialAmount = new BigNumber(200);
    await this.gaia.approve(clientWithoutTokens, initialAmount, { from: moneybag })
      .should.be.fulfilled;
    const allowanceBefore = await this.gaia.allowance(moneybag, clientWithoutTokens);
    allowanceBefore.should.be.bignumber.equal(initialAmount);

    const zeroAmount = new BigNumber(0);
    await this.gaia.approve(clientWithoutTokens, zeroAmount, { from: moneybag })
      .should.be.fulfilled;
    const allowanceAfter = await this.gaia.allowance(moneybag, clientWithoutTokens);
    allowanceAfter.should.be.bignumber.equal(zeroAmount);
  });

  it('should approve to spend infinity', async function () {
    const infinity = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    await this.gaia.approve(client1, infinity, { from: moneybag })
      .should.be.fulfilled;
  });

  it('should NOT spend tokens without approval', async function () {
    const amount = new BigNumber(10);
    await this.gaia.transferFrom(moneybag, client1, amount, { from: client2 })
      .should.be.rejectedWith('ERC20: transfer amount exceeds allowance');
  });

  it('should spend approved tokens', async function () {
    const amount = new BigNumber(10);
    const recipient = '0x0000000000000000000000000000000000000001';
    await this.gaia.approve(clientWithoutTokens, amount, { from: moneybag })
      .should.be.fulfilled;
    await this.gaia.transferFrom(moneybag, recipient, amount, { from: clientWithoutTokens })
      .should.be.fulfilled;
  });

  it('should NOT spend from zero balance', async function () {
    const amount = new BigNumber(10);
    await this.gaia.approve(client1, amount, { from: clientWithoutTokens })
      .should.be.fulfilled;
    await this.gaia.transferFrom(clientWithoutTokens, client2, amount, { from: client1 })
      .should.be.rejectedWith('ERC20: transfer amount exceeds balance');
  });

  it('should find and match Transfer (mint) event', async function () {
    const amount = new BigNumber(20);
    await this.gaia.mint(moneybag, amount, { from: minter }).should.be.fulfilled;

    const transferEvent = (await this.gaia.getPastEvents('Transfer')).at(-1).args;
    transferEvent.from.should.be.equal(zeroAddress);
    transferEvent.to.should.be.equal(moneybag);
    transferEvent.value.should.be.bignumber.equal(amount);
  });

  it('should find and match Transfer (burn) event', async function () {
    const amount = new BigNumber(10);
    await this.gaia.burn(moneybag, amount, { from: burner }).should.be.fulfilled;

    const transferEvent = (await this.gaia.getPastEvents('Transfer')).at(-1).args;
    transferEvent.from.should.be.equal(moneybag);
    transferEvent.to.should.be.equal(zeroAddress);
    transferEvent.value.should.be.bignumber.equal(amount);
  });
});
import {
  getChaiBN,
  BigNumber,
} from '@nomisma/nomisma-smart-contract-helpers';

require('chai')
  .use(require('chai-as-promised'))
  .use(getChaiBN())
  .should();

import {
  roleNames,
} from '../helpers/roles';


const {
  MINTER_ROLE,
  BURNER_ROLE,
} = roleNames;


const RheaGe = artifacts.require('./RheaGeToken.sol');
const RoleManager = artifacts.require('./RoleManager.sol');

export const tokenName = 'RheaGe'; // TODO: figure out the name
export const tokenSymbol = 'RGT';


contract('RheaGeToken Basic Tests', ([
  governor,
  minter,
  burner,
  moneybag,
  clientWithoutTokens,
  client1,
  client2,
]) => {
  before(async function () {
    const confirmationsRequired = 1;
    const roleManager = await RoleManager.new([governor], confirmationsRequired);
    this.token = await RheaGe.new(tokenName, tokenSymbol, roleManager.address);
    await roleManager.addRolesForAddresses(
      [minter, burner],
      [MINTER_ROLE, BURNER_ROLE],
      { from: governor }
    );
  });

  it('should set initial storage', async function () {
    const nameFromSc = await this.token.name();
    const symbolFromSc = await this.token.symbol();
    const totalSupply = await this.token.totalSupply();

    assert.equal(nameFromSc, tokenName);
    assert.equal(symbolFromSc, tokenSymbol);
    assert.equal(totalSupply, '0');
  });

  it('should NOT transfer before minting', async function () {
    await this.token.transfer(client2, new BigNumber(10), { from: client1 })
      .should.be.rejectedWith('ERC20: transfer amount exceeds balance');
  });

  it('should mint with MINTER_ROLE', async function () {
    const amount = new BigNumber(1000);
    await this.token.mint(moneybag, amount, { from: minter }).should.be.fulfilled;
  });

  it('should NOT mint to zero address', async function () {
    const amount = new BigNumber(1000);
    const zeroAddress = '0x0000000000000000000000000000000000000000';
    await this.token.mint(zeroAddress, amount, { from: minter })
      .should.be.rejectedWith('ERC20: mint to the zero address');
  });

  it('should NOT mint zero amount', async function () {
    const amount = new BigNumber(0);
    await this.token.mint(moneybag, amount, { from: minter })
      .should.be.rejectedWith('ERC20: minting zero amount');
  });

  it('should NOT mint without MINTER_ROLE', async function () {
    const amount = new BigNumber(1000);
    await this.token.mint(moneybag, amount, { from: governor })
      .should.be.rejectedWith('RoleAware: Permission denied to execute this function');
  });

  it('should burn with BURNER_ROLE', async function () {
    const amount = new BigNumber(10);
    await this.token.burn(moneybag, amount, { from: burner }).should.be.fulfilled;
  });

  it('should NOT burn from zero address', async function () {
    const amount = new BigNumber(10);
    const zeroAddress = '0x0000000000000000000000000000000000000000';
    await this.token.burn(zeroAddress, amount, { from: burner })
      .should.be.rejectedWith('ERC20: burn from the zero address');
  });

  it('should NOT burn zero amount', async function () {
    const amount = new BigNumber(0);
    await this.token.burn(moneybag, amount, { from: burner })
      .should.be.rejectedWith('ERC20: burning zero amount');
  });

  it('should NOT burn without BURNER_ROLE', async function () {
    const amount = new BigNumber(10);
    await this.token.burn(moneybag, amount, { from: governor })
      .should.be.rejectedWith('RoleAware: Permission denied to execute this function');
  });

  it('should NOT transfer to zero address', async function () {
    const amount = new BigNumber(10);
    const zeroAddress = '0x0000000000000000000000000000000000000000';
    await this.token.transfer(zeroAddress, amount, { from: moneybag })
      .should.be.rejectedWith('ERC20: transfer to the zero address');
  });

  it('should transfer zero amount', async function () {
    const amount = new BigNumber(0);
    await this.token.transfer(clientWithoutTokens, amount, { from: clientWithoutTokens })
      .should.be.fulfilled;
  });

  it('should NOT transfer from zero balance', async function () {
    const amount = new BigNumber(10);
    await this.token.transfer(moneybag, amount, { from: clientWithoutTokens })
      .should.be.rejectedWith('ERC20: transfer amount exceeds balance');
  });

  it('should approve if balance is zero', async function () {
    const amount = new BigNumber(10);
    await this.token.approve(moneybag, amount, { from: clientWithoutTokens })
      .should.be.fulfilled;
  });

  it('should approve to spend infinity', async function () {
    const infinity = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    await this.token.approve(client1, infinity, { from: moneybag })
      .should.be.fulfilled;
  });

  it('should NOT spend tokens without approval', async function () {
    const amount = new BigNumber(10);
    await this.token.transferFrom(moneybag, client1, amount, { from: client2 })
      .should.be.rejectedWith('ERC20: transfer amount exceeds allowance');
  });

  it('should spend approved tokens', async function () {
    const amount = new BigNumber(10);
    const recipient = '0x0000000000000000000000000000000000000001';
    await this.token.approve(clientWithoutTokens, amount, { from: moneybag })
      .should.be.fulfilled;
    await this.token.transferFrom(moneybag, recipient, amount, { from: clientWithoutTokens })
      .should.be.fulfilled;
  });

  it('should NOT spend from zero balance', async function () {
    const amount = new BigNumber(10);
    await this.token.approve(client1, amount, { from: clientWithoutTokens })
      .should.be.fulfilled;
    await this.token.transferFrom(clientWithoutTokens, client2, amount, { from: client1 })
      .should.be.rejectedWith('ERC20: transfer amount exceeds balance');
  });

  it.skip('should NOT transfer from locked address', async function () {

  });

  it.skip('should NOT transferFrom from locked address', async function () {

  });

  // TODO: test access and other functionality
});

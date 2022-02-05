import {
  getChaiBN,
  BigNumber,
} from '@nomisma/nomisma-smart-contract-helpers';
import { deployRheaGeToken } from '../helpers/rgt';

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

export const tokenName = 'RheaGe Token';
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
    this.roleManager = await RoleManager.new([ governor ], confirmationsRequired);
    await this.roleManager.addRolesForAddresses(
      [ minter, burner ],
      [ MINTER_ROLE, BURNER_ROLE ],
      { from: governor }
    );
    this.rheaGe = await deployRheaGeToken(this.roleManager.address, governor);
  });

  it('should NOT initialize twice', async function () {
    await this.rheaGe.init(this.roleManager.address)
      .should.be.rejectedWith('Initializable: contract is already initialized');
  });

  it('should set initial storage correctly', async function () {
    const nameFromSc = await this.rheaGe.name();
    const symbolFromSc = await this.rheaGe.symbol();
    const totalSupply = await this.rheaGe.totalSupply();

    assert.equal(nameFromSc, tokenName);
    assert.equal(symbolFromSc, tokenSymbol);
    assert.equal(totalSupply, '0');
  });

  it('should NOT transfer before minting', async function () {
    await this.rheaGe.transfer(client2, new BigNumber(10), { from: client1 })
      .should.be.rejectedWith('ERC20: transfer amount exceeds balance');
  });

  it('should mint with MINTER_ROLE', async function () {
    const amount = new BigNumber(1000);
    await this.rheaGe.mint(moneybag, amount, { from: minter }).should.be.fulfilled;
  });

  it('should NOT mint to zero address', async function () {
    const amount = new BigNumber(1000);
    const zeroAddress = '0x0000000000000000000000000000000000000000';
    await this.rheaGe.mint(zeroAddress, amount, { from: minter })
      .should.be.rejectedWith('ERC20: mint to the zero address');
  });

  it('should NOT mint zero amount', async function () {
    const amount = new BigNumber(0);
    await this.rheaGe.mint(moneybag, amount, { from: minter })
      .should.be.rejectedWith('RheaGeToken: minting zero amount');
  });

  it('should NOT mint without MINTER_ROLE', async function () {
    const amount = new BigNumber(1000);
    await this.rheaGe.mint(moneybag, amount, { from: governor })
      .should.be.rejectedWith('RoleAware: Permission denied to execute this function');
  });

  it('should burn with BURNER_ROLE', async function () {
    const amount = new BigNumber(10);
    await this.rheaGe.burn(moneybag, amount, { from: burner }).should.be.fulfilled;
  });

  it('should NOT burn from zero address', async function () {
    const amount = new BigNumber(10);
    const zeroAddress = '0x0000000000000000000000000000000000000000';
    await this.rheaGe.burn(zeroAddress, amount, { from: burner })
      .should.be.rejectedWith('ERC20: burn from the zero address');
  });

  it('should NOT burn zero amount', async function () {
    const amount = new BigNumber(0);
    await this.rheaGe.burn(moneybag, amount, { from: burner })
      .should.be.rejectedWith('ERC20: burning zero amount');
  });

  it('should NOT burn without BURNER_ROLE', async function () {
    const amount = new BigNumber(10);
    await this.rheaGe.burn(moneybag, amount, { from: governor })
      .should.be.rejectedWith('RoleAware: Permission denied to execute this function');
  });

  it('should NOT transfer to zero address', async function () {
    const amount = new BigNumber(10);
    const zeroAddress = '0x0000000000000000000000000000000000000000';
    await this.rheaGe.transfer(zeroAddress, amount, { from: moneybag })
      .should.be.rejectedWith('ERC20: transfer to the zero address');
  });

  it('should transfer zero amount', async function () {
    const amount = new BigNumber(0);
    await this.rheaGe.transfer(clientWithoutTokens, amount, { from: clientWithoutTokens })
      .should.be.fulfilled;
  });

  it('should NOT transfer from zero balance', async function () {
    const amount = new BigNumber(10);
    await this.rheaGe.transfer(moneybag, amount, { from: clientWithoutTokens })
      .should.be.rejectedWith('ERC20: transfer amount exceeds balance');
  });

  it('should approve if balance is zero', async function () {
    const amount = new BigNumber(10);
    await this.rheaGe.approve(moneybag, amount, { from: clientWithoutTokens })
      .should.be.fulfilled;
  });

  it('should approve to spend infinity', async function () {
    const infinity = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    await this.rheaGe.approve(client1, infinity, { from: moneybag })
      .should.be.fulfilled;
  });

  it('should NOT spend tokens without approval', async function () {
    const amount = new BigNumber(10);
    await this.rheaGe.transferFrom(moneybag, client1, amount, { from: client2 })
      .should.be.rejectedWith('ERC20: transfer amount exceeds allowance');
  });

  it('should spend approved tokens', async function () {
    const amount = new BigNumber(10);
    const recipient = '0x0000000000000000000000000000000000000001';
    await this.rheaGe.approve(clientWithoutTokens, amount, { from: moneybag })
      .should.be.fulfilled;
    await this.rheaGe.transferFrom(moneybag, recipient, amount, { from: clientWithoutTokens })
      .should.be.fulfilled;
  });

  it('should NOT spend from zero balance', async function () {
    const amount = new BigNumber(10);
    await this.rheaGe.approve(client1, amount, { from: clientWithoutTokens })
      .should.be.fulfilled;
    await this.rheaGe.transferFrom(clientWithoutTokens, client2, amount, { from: client1 })
      .should.be.rejectedWith('ERC20: transfer amount exceeds balance');
  });

  it.skip('should NOT transfer from locked address', async () => {

  });

  it.skip('should NOT transferFrom from locked address', async () => {

  });

  // TODO: test access and other functionality
});

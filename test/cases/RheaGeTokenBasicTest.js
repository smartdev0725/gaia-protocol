import {
  getChaiBN,
  BigNumber,
} from '@nomisma/nomisma-smart-contract-helpers';

require('chai')
  .use(require('chai-as-promised'))
  .use(getChaiBN())
  .should();


const RheaGe = artifacts.require('./RheaGeToken.sol');
const RoleManager = artifacts.require('./RoleManager.sol');

export const tokenName = 'RheaGe'; // TODO: figure out the name
export const tokenSymbol = 'RGT';


contract('RheaGeToken Basic Tests', ([
  governor,
  client1,
  client2,
]) => {
  before(async function () {
    const roleManager = await RoleManager.new([ governor ], 1);
    this.token = await RheaGe.new(tokenName, tokenSymbol, roleManager.address);
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

  // TODO: test access and other functionality
});

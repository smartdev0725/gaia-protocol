import {
  getChaiBN,
  BigNumber,
} from '@nomisma/nomisma-smart-contract-helpers';
import { deployRheaGeToken } from '../helpers/rgt';

require('chai')
  .use(require('chai-as-promised'))
  .use(getChaiBN())
  .should();


const RoleManager = artifacts.require('./RoleManager.sol');

export const tokenName = 'RheaGe Token'; // TODO: figure out the name
export const tokenSymbol = 'RGT';


contract('RheaGeToken Basic Tests', ([
  governor,
  client1,
  client2,
]) => {
  before(async function () {
    this.roleManager = await RoleManager.new([ governor ], 1);
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

  // TODO: test access and other functionality
});

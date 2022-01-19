import {
  getChaiBN,
  BigNumber,
} from '@nomisma/nomisma-smart-contract-helpers';

require('chai')
  .use(require('chai-as-promised'))
  .use(getChaiBN())
  .should();


const CO2 = artifacts.require('./CO2.sol');

const name = 'Carbon'; // TODO: figure out the name
const symbol = 'CO2';

contract('CO2Token Basic Tests', (addresses) => {
  before(async function () {
    this.token = await CO2.new(name, symbol);
  });

  it('should set initial storage', async function () {
    const nameFromSc = await this.token.name();
    const symbolFromSc = await this.token.symbol();
    const totalSupply = await this.token.totalSupply();

    assert.equal(nameFromSc, name);
    assert.equal(symbolFromSc, symbol);
    assert.equal(totalSupply, '0');
  });

  it('should NOT transfer before minting', async function () {
    const [ client1, client2 ] = addresses;
    await this.token.transfer(client2, new BigNumber(10), { from: client1 })
      .should.be.rejectedWith('ERC20: transfer amount exceeds balance');
  });
});

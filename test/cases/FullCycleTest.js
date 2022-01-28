import { BigNumber, getChaiBN } from '@nomisma/nomisma-smart-contract-helpers';
import { getDefBatch } from '../helpers/batches';
import { getTxCostInETH } from '../helpers/tx';
import { tokenName, tokenSymbol } from './RheaGeTokenBasicTest';
import { roleNames } from '../helpers/roles';

require('chai')
  .use(require('chai-as-promised'))
  .use(getChaiBN())
  .should();

const {
  MINTER_ROLE,
  BURNER_ROLE,
  OPERATOR_ROLE,
} = roleNames;


const RheaGe = artifacts.require('./RheaGeToken.sol');
const Registry = artifacts.require('./RheaGeRegistry.sol');
const RoleManager = artifacts.require('./RoleManager.sol');
const PaymentManager = artifacts.require('./PaymentManager.sol');
const Token = artifacts.require('./ERC20Mock.sol');


contract('Full Cycle Test', ([
  governor,
  minter,
  operator,
  batchOwner,
  buyer1,
  buyer2,
  buyer3,
  buyer4,
  etherAddress,
  fundsReceiver,
]) => {
  before(async function () {
    this.batch = getDefBatch(batchOwner, new BigNumber(1000000));
    this.roleManager = await RoleManager.new([ governor ], '1');
    this.payToken = await Token.new('ERC20Mock', 'ETM', buyer1);

    this.rgt = await RheaGe.new(
      tokenName,
      tokenSymbol,
      this.roleManager.address,
      { from: governor }
    );

    this.payManager = await PaymentManager.new(this.roleManager.address, etherAddress);

    await this.payManager.addTokensToWhitelist([ this.payToken.address, etherAddress ]);

    this.registry = await Registry.new(
      this.rgt.address,
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

    this.userData = [
      {
        user: buyer1,
        rgtAmount: new BigNumber(50771),
        payAmount: new BigNumber(79024),
        token: this.payToken.address,
        offsetAmount: new BigNumber(111),
      },
      {
        user: buyer2,
        rgtAmount: new BigNumber(35432),
        payAmount: new BigNumber(52321),
        token: etherAddress,
        offsetAmount: new BigNumber(3791),
      },
      {
        user: buyer3,
        rgtAmount: new BigNumber(12351),
        payAmount: new BigNumber(2345),
        token: this.payToken.address,
        offsetAmount: null,
      },
      {
        user: buyer4,
        rgtAmount: new BigNumber(131),
        payAmount: new BigNumber(79),
        token: etherAddress,
        offsetAmount: new BigNumber(131),
      },
    ];

    const totalPayToken = await this.payToken.balanceOf(buyer1);
    await this.payToken.transfer(buyer3, totalPayToken.div(new BigNumber(2)), { from: buyer1 });
  });

  // eslint-disable-next-line max-len
  it('should generate batch, mint tokens, sell tokens with ETH and ERC20, burn tokens and withdraw payment', async function () {
    await this.registry.generateBatch(
      ...Object.values(this.batch),
      { from: minter }
    );

    const registryRgtBalBefore = await this.rgt.balanceOf(this.registry.address);

    await this.userData.reduce(
      async (acc, {
        user,
        rgtAmount,
        payAmount,
        offsetAmount,
        token,
      }, idx) => {
        await acc;
        const txObj = { from: user };

        const rgtBalBefore = await this.rgt.balanceOf(user);
        let payTokenBalBefore;
        if (token === this.payToken.address) {
          payTokenBalBefore = await this.payToken.balanceOf(user);
          await this.payToken.approve(this.payManager.address, payAmount, { from: user });
        } else {
          payTokenBalBefore = new BigNumber(
            await web3.eth.getBalance(user)
          );
          txObj.value = payAmount;
        }

        let txResult = await this.registry.purchase(
          token,
          payAmount,
          rgtAmount,
          txObj
        );

        let txEthSpent = token === etherAddress
          ? await getTxCostInETH(txResult)
          : null;

        if (!!offsetAmount) {
          txResult = await this.registry.offset(offsetAmount, { from: user });
          const cost = await getTxCostInETH(txResult);
          txEthSpent = token === etherAddress
            ? txEthSpent.add(cost)
            : null;
        }

        const rgtBalAfter = await this.rgt.balanceOf(user);
        const payTokenBalAfter = token === this.payToken.address
          ? await this.payToken.balanceOf(user)
          : new BigNumber(await web3.eth.getBalance(user));

        // for checks
        this.userData[idx].rgtBalDiff = rgtBalAfter.sub(rgtBalBefore);
        this.userData[idx].payTokenBalDiff = token === etherAddress
          ? payTokenBalBefore.sub(payTokenBalAfter).sub(txEthSpent)
          : payTokenBalBefore.sub(payTokenBalAfter);
      }, Promise.resolve()
    );

    const fundsReceiverEthBalBefore = new BigNumber(await web3.eth.getBalance(fundsReceiver));

    await this.registry.withdrawPaidFunds(
      fundsReceiver,
      this.payToken.address,
      '0',
      true,
      { from: governor }
    );

    await this.registry.withdrawPaidFunds(
      fundsReceiver,
      etherAddress,
      '0',
      true,
      { from: governor }
    );

    const registryRgtBalAfter = await this.rgt.balanceOf(this.registry.address);
    const registryPayTokenBalAfter = await this.payToken.balanceOf(this.registry.address);
    const registryEthBalAfter = new BigNumber(await web3.eth.getBalance(this.registry.address));
    const fundsReceiverPayTokenBalAfter = await this.payToken.balanceOf(fundsReceiver);
    const fundsReceiverEthBalAfter = new BigNumber(await web3.eth.getBalance(fundsReceiver));
    const totalRetiredSC = await this.registry.totalSupplyRetired();

    // checks
    const {
      totalSold,
      totalReceivedERC,
      totalReceivedETH,
      totalRetired,
    } = this.userData.reduce(
      (acc, {
        token,
        rgtAmount,
        payAmount,
        offsetAmount,
        rgtBalDiff,
        payTokenBalDiff,
      }) => {
        const rgtRefDiff = !!offsetAmount ? rgtAmount.sub(offsetAmount) : rgtAmount;

        // bal checks
        rgtBalDiff.should.be.bignumber.equal(rgtRefDiff);
        payTokenBalDiff.should.be.bignumber.equal(payAmount);

        // calc total ref values
        acc.totalSold.iadd(rgtAmount);
        if (token === etherAddress) {
          acc.totalReceivedETH.iadd(payAmount);
        } else {
          acc.totalReceivedERC.iadd(payAmount);
        }

        if (!!offsetAmount) acc.totalRetired.iadd(offsetAmount);

        return acc;
      }, {
        totalSold: new BigNumber(0),
        totalReceivedERC: new BigNumber(0),
        totalReceivedETH: new BigNumber(0),
        totalRetired: new BigNumber(0),
      }
    );

    registryRgtBalBefore.sub(registryRgtBalAfter).should.be.bignumber.equal(totalSold);
    fundsReceiverPayTokenBalAfter.should.be.bignumber.equal(totalReceivedERC);
    fundsReceiverEthBalAfter.sub(fundsReceiverEthBalBefore).should.be.bignumber.equal(totalReceivedETH);
    registryPayTokenBalAfter.should.be.bignumber.equal(new BigNumber(0));
    registryEthBalAfter.should.be.bignumber.equal(new BigNumber(0));
    totalRetiredSC.should.be.bignumber.equal(totalRetired);
  });
});

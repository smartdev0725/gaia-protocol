import {
  getChaiBN,
  BigNumber,
} from '@nomisma/nomisma-smart-contract-helpers';
import { deployRegistry } from '../helpers/registry';
import { deployRheaGeToken } from '../helpers/rgt';
import { roleNames } from '../helpers/roles';

require('chai')
  .use(require('chai-as-promised'))
  .use(getChaiBN())
  .should();


const RoleManager = artifacts.require('./RoleManager.sol');

const {
  MINTER_ROLE,
  BURNER_ROLE,
  CERTIFIER_ROLE,
} = roleNames;

contract('RheaGeRegistry Test', ([
  governor,
  certifier1,
  certifier2,
  offsetter1,
  rgtReceiver,
]) => {
  const batchDataBase = {
    serialNumber: '1234567',
    projectId: new BigNumber(777),
    vintage: 'vintage', // TODO: what should this look like ??
    creditType: 'creditType', // TODO: what should this look like ??
    quantity: new BigNumber(10000),
  };

  before(async function () {
    this.roleManager = await RoleManager.new([ governor ], '1');
    this.rheaGe = await deployRheaGeToken(this.roleManager.address, governor);

    this.registry = await deployRegistry(
      this.rheaGe.address,
      this.roleManager.address,
      governor
    );

    await this.roleManager.addRolesForAddresses(
      [
        certifier1,
        certifier2,
        this.registry.address,
        this.registry.address,
      ],
      [
        CERTIFIER_ROLE,
        CERTIFIER_ROLE,
        MINTER_ROLE,
        BURNER_ROLE,
      ],
      { from: governor }
    );

    await this.registry.generateBatch(
      ...Object.values(batchDataBase),
      rgtReceiver,
      { from: certifier1 }
    );
  });

  describe('#generateBatch()', () => {
    it('should generate new batch and mint the correct amount of tokens to the rgtReceiver', async function () {
      const newBatch = {
        ...batchDataBase,
        serialNumber: '131553135',
      };
      const receiverBalBefore = await this.rheaGe.balanceOf(rgtReceiver);

      await this.registry.generateBatch(
        ...Object.values(newBatch),
        rgtReceiver,
        { from: certifier1 }
      ).should.be.fulfilled;

      const {
        serialNumber: serialNumberSC,
        projectId: projectIdSC,
        vintage: vintageSC,
        creditType: cresitTypeSC,
        quantity: quantitySC,
        initialRgtOwner: initialRgtOwnerSC,
        created,
      } = await this.registry.registeredBatches(newBatch.serialNumber);

      serialNumberSC.should.be.equal(newBatch.serialNumber);
      projectIdSC.should.be.bignumber.equal(newBatch.projectId);
      vintageSC.should.be.equal(newBatch.vintage);
      cresitTypeSC.should.be.equal(newBatch.creditType);
      quantitySC.should.be.bignumber.equal(newBatch.quantity);
      initialRgtOwnerSC.should.be.equal(rgtReceiver);
      created.should.be.equal(true);

      const receiverBalAfter = await this.rheaGe.balanceOf(rgtReceiver);
      receiverBalAfter.sub(receiverBalBefore).should.be.bignumber.equal(newBatch.quantity);
      receiverBalAfter.sub(receiverBalBefore).should.be.bignumber.equal(quantitySC);
    });

    it('should should NOT generate the same batch twice', async function () {
      const newBatch = {
        ...batchDataBase,
        serialNumber: '3333333',
      };

      await this.registry.generateBatch(
        ...Object.values(newBatch),
        rgtReceiver,
        { from: certifier1 }
      ).should.be.fulfilled;

      await this.registry.generateBatch(
        ...Object.values(newBatch),
        rgtReceiver,
        { from: certifier1 }
      ).should.be.rejectedWith('RGRegistry::generateBatch: Batch already created');
    });
  });

  describe('#retire()', async () => {
    // eslint-disable-next-line max-len
    it('should retire, burn the correct amount of tokens and change clients balance appropriately when called by any client', async function () {
      const newBatch = {
        ...batchDataBase,
        serialNumber: '3331233',
      };
      const tokenAmtBought = new BigNumber(350);
      const tokenAmtRetire1 = new BigNumber(7);
      const tokenAmtRetire2 = new BigNumber(179);

      await this.registry.generateBatch(
        ...Object.values(newBatch),
        rgtReceiver,
        { from: certifier1 }
      ).should.be.fulfilled;

      await this.rheaGe.transfer(offsetter1, tokenAmtBought, { from: rgtReceiver });

      const offsetterBalanceBefore = await this.rheaGe.balanceOf(offsetter1);

      await this.registry.retire(tokenAmtRetire1, { from: offsetter1 }).should.be.fulfilled;

      // for checking proper storage updates
      await this.registry.retire(tokenAmtRetire2, { from: rgtReceiver }).should.be.fulfilled;

      const offsetterBalanceAfter = await this.rheaGe.balanceOf(offsetter1);

      offsetterBalanceBefore.sub(offsetterBalanceAfter).should.be.bignumber.equal(tokenAmtRetire1);
      offsetterBalanceAfter.should.be.bignumber.equal(tokenAmtBought.sub(tokenAmtRetire1));

      const retiredBalanceClient1 = await this.registry.retiredBalances(offsetter1);
      const retiredBalanceClient2 = await this.registry.retiredBalances(rgtReceiver);
      const totalSupplyRetired = await this.registry.totalSupplyRetired();

      retiredBalanceClient1.should.be.bignumber.equal(tokenAmtRetire1);
      retiredBalanceClient2.should.be.bignumber.equal(tokenAmtRetire2);
      totalSupplyRetired.should.be.bignumber.equal(tokenAmtRetire1.add(tokenAmtRetire2));
    });

    // TODO: add more tests here !!! (i.e. does it add up to retiredBalanced if a client offsets multiple times?)
  });

  describe('onlyRole access', async () => {
    it('should generateBatch from multiple certifier accounts', async function () {
      const newBatch1 = {
        ...batchDataBase,
        serialNumber: '1',
      };
      await this.registry.generateBatch(
        ...Object.values(newBatch1),
        rgtReceiver,
        { from: certifier1 }
      ).should.be.fulfilled;
      const newBatch2 = {
        ...batchDataBase,
        serialNumber: '2',
      };
      await this.registry.generateBatch(
        ...Object.values(newBatch2),
        rgtReceiver,
        { from: certifier2 }
      ).should.be.fulfilled;
    });

    it('should NOT generateBatch without CERTIFIER_ROLE', async function () {
      const newBatch = {
        ...batchDataBase,
        serialNumber: '3',
      };
      await this.registry.generateBatch(
        ...Object.values(newBatch),
        rgtReceiver,
        { from: governor }
      ).should.be.rejectedWith('RoleAware: Permission denied to execute this function');
    });

    it('should addProject with CERTIFIER_ROLE', async function () {
      const projectData = {
        id: 1,
        projectName: 'test',
        projectType: 'test',
        certifications: 'test',
      };
      await this.registry.addProject(
        ...Object.values(projectData),
        { from: certifier1 }
      ).should.be.fulfilled;
    });

    it('should NOT addProject with the same id', async function () {
      const projectData = {
        id: 10,
        projectName: 'test',
        projectType: 'test',
        certifications: 'test',
      };
      await this.registry.addProject(
        ...Object.values(projectData),
        { from: certifier1 }
      ).should.be.fulfilled;
      await this.registry.addProject(
        ...Object.values(projectData),
        { from: certifier1 }
      ).should.be.rejectedWith('RGRegistry::addProject: project has already been created');
    });

    it('should NOT addProject without CERTIFIER_ROLE', async function () {
      const projectData = {
        id: 2,
        projectName: 'test',
        projectType: 'test',
        certifications: 'test',
      };
      await this.registry.addProject(
        ...Object.values(projectData),
        { from: governor }
      ).should.be.rejectedWith('RoleAware: Permission denied to execute this function');
    });

    it('should setRheaGeToken with GOVERNOR_ROLE', async function () {
      await this.registry.setRheaGeToken(
        this.rheaGe.address,
        { from: governor }
      ).should.be.fulfilled;
    });

    it('should NOT setRheaGeToken to zero address', async function () {
      const zeroAddress = '0x0000000000000000000000000000000000000000';
      await this.registry.setRheaGeToken(
        zeroAddress,
        { from: governor }
      ).should.be.rejected;
    });

    it('should NOT setRheaGeToken if the address is not a contract', async function () {
      const firstAddress = '0x0000000000000000000000000000000000000001';
      await this.registry.setRheaGeToken(
        firstAddress,
        { from: governor }
      ).should.be.rejected;
    });

    it('should NOT setRheaGeToken without GOVERNOR_ROLE', async function () {
      await this.registry.setRheaGeToken(
        this.rheaGe.address,
        { from: certifier1 }
      ).should.be.rejectedWith('RoleAware: Permission denied to execute this function');
    });
  });

  describe('Events', () => {
    it('should find and match BatchGenerated event', async function () {
      const newBatch = {
        ...batchDataBase,
        serialNumber: '3',
      };
      const tx = await this.registry.generateBatch(
        ...Object.values(newBatch),
        rgtReceiver,
        { from: certifier1 }
      ).should.be.fulfilled;
      const batchEvent = tx.receipt.logs.find(x => x.event === 'BatchGenerated').args;
      batchEvent.serialNumber.should.be.equal(newBatch.serialNumber);
      batchEvent.projectId.should.be.bignumber.equal(newBatch.projectId);
      // TODO find a way to match the values below
      // batchEvent.vintage.should.be.bignumber.equal(newBatch.vintage);
      // batchEvent.creditType.should.be.bignumber.equal(newBatch.creditType);
      batchEvent.quantity.should.be.bignumber.equal(newBatch.quantity);
      batchEvent.initialRgtOwner.should.be.equal(rgtReceiver);
      batchEvent.certifier.should.be.equal(certifier1);
      // console.log(batchEvent);
    });

    // it('should find ProjectAdded event', async function () {

    // });

    // it('should find Transer, Retired events', async function () {

    // });
  });

  it('should NOT initialize twice', async function () {
    await this.registry.init(this.rheaGe.address, this.roleManager.address)
      .should.be.rejectedWith('Initializable: contract is already initialized');
  });
});

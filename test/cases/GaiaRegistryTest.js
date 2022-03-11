import {
  getChaiBN,
  BigNumber,
  sha3,
} from '@nomisma/nomisma-smart-contract-helpers';
import { deployRegistry } from '../helpers/registry';
import { deployGaiaToken, intToTokenDecimals } from '../helpers/gaia';
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

contract('GaiaRegistry Test', ([
  governor,
  certifier1,
  certifier2,
  offsetter1,
  gaiaReceiver,
]) => {
  const projectId = new BigNumber('1748');
  const batchDataBase = {
    serialNumber: '1234567-D81FA-3772',
    projectId,
    vintageEnd: '01-12-2019',
    creditType: 'VCU',
    quantity: intToTokenDecimals(10000),
    certifications: '01: No Poverty; 02: Zero Hunger; 03: Good Health and Well-being;',
  };

  const projectDataBase = {
    projectId,
    name: 'Southern Cardamom REDD+ Project',
    projectType: 'Agriculture Forestry and Other Land Use',
  };
  const zeroAddress = '0x0000000000000000000000000000000000000000';

  before(async function () {
    this.roleManager = await RoleManager.new([ governor ], '1');
    this.gaia = (await deployGaiaToken(
      'Gaia Token',
      'GAIA',
      this.roleManager.address,
      governor
    )).token;

    this.registry = await deployRegistry(
      this.gaia.address,
      this.roleManager.address,
      governor
    );

    await this.roleManager.addRolesForAddresses(
      [
        certifier1,
        certifier2,
        this.registry.address,
        this.registry.address,
        certifier1,
        certifier1,
      ],
      [
        CERTIFIER_ROLE,
        CERTIFIER_ROLE,
        MINTER_ROLE,
        BURNER_ROLE,
        MINTER_ROLE,
        BURNER_ROLE,
      ],
      { from: governor }
    );

    await this.registry.generateBatch(
      ...Object.values(batchDataBase),
      gaiaReceiver,
      { from: certifier1 }
    );
  });

  describe('#generateBatch()', () => {
    it('should generate new batch and mint the correct amount of tokens to the gaiaReceiver', async function () {
      const newBatch = {
        ...batchDataBase,
        serialNumber: '131553135',
      };
      const receiverBalBefore = await this.gaia.balanceOf(gaiaReceiver);

      await this.registry.generateBatch(
        ...Object.values(newBatch),
        gaiaReceiver,
        { from: certifier1 }
      ).should.be.fulfilled;

      const {
        serialNumber: serialNumberSC,
        projectId: projectIdSC,
        vintageEnd: vintageEndSC,
        creditType: cresitTypeSC,
        quantity: quantitySC,
        certificationsOrObjectives: certificationsOrObjectivesSC,
        initialGaiaOwner: initialGaiaOwnerSC,
        created,
      } = await this.registry.registeredBatches(newBatch.serialNumber);

      serialNumberSC.should.be.equal(newBatch.serialNumber);
      projectIdSC.should.be.bignumber.equal(newBatch.projectId);
      vintageEndSC.should.be.equal(newBatch.vintageEnd);
      cresitTypeSC.should.be.equal(newBatch.creditType);
      quantitySC.should.be.bignumber.equal(newBatch.quantity);
      initialGaiaOwnerSC.should.be.equal(gaiaReceiver);
      certificationsOrObjectivesSC.should.be.equal(newBatch.certifications);
      created.should.be.equal(true);

      const receiverBalAfter = await this.gaia.balanceOf(gaiaReceiver);
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
        gaiaReceiver,
        { from: certifier1 }
      ).should.be.fulfilled;

      await this.registry.generateBatch(
        ...Object.values(newBatch),
        gaiaReceiver,
        { from: certifier1 }
      ).should.be.rejectedWith('GaiaRegistry::generateBatch: Batch already created');
    });

    it('should only update storage and NOT mint tokens if mintTo address is passed as zero', async function () {
      const newBatch = {
        ...batchDataBase,
        serialNumber: '131553-ABDS-135',
      };
      const receiverBalBefore = await this.gaia.balanceOf(gaiaReceiver);

      await this.registry.generateBatch(
        ...Object.values(newBatch),
        zeroAddress,
        { from: certifier1 }
      ).should.be.fulfilled;

      const {
        serialNumber: serialNumberSC,
        projectId: projectIdSC,
        vintageEnd: vintageEndSC,
        creditType: cresitTypeSC,
        quantity: quantitySC,
        certificationsOrObjectives: certificationsOrObjectivesSC,
        initialGaiaOwner: initialGaiaOwnerSC,
        created,
      } = await this.registry.registeredBatches(newBatch.serialNumber);

      serialNumberSC.should.be.equal(newBatch.serialNumber);
      projectIdSC.should.be.bignumber.equal(newBatch.projectId);
      vintageEndSC.should.be.equal(newBatch.vintageEnd);
      cresitTypeSC.should.be.equal(newBatch.creditType);
      quantitySC.should.be.bignumber.equal(newBatch.quantity);
      initialGaiaOwnerSC.should.be.equal(zeroAddress);
      certificationsOrObjectivesSC.should.be.equal(newBatch.certifications);
      created.should.be.equal(true);

      const receiverBalAfter = await this.gaia.balanceOf(gaiaReceiver);
      receiverBalAfter.sub(receiverBalBefore).should.be.bignumber.equal(new BigNumber(0));
    });

    it('should revert generateBatch when quantity is a fraction', async function () {
      const newBatch = {
        ...batchDataBase,
        quantity: new BigNumber('1000000000000000001'),
        serialNumber: '131653135',
      };

      await this.registry.generateBatch(
        ...Object.values(newBatch),
        gaiaReceiver,
        { from: certifier1 }
      ).should.be.rejectedWith('GaiaRegistry::generateBatch: quantity cannot be a fraction');
    });

    it('should revert updateBatch when quantity is a fraction', async function () {
      const incorrectBatch = {
        ...batchDataBase,
        serialNumber: '131753135',
      };

      const correctBatch = {
        ...incorrectBatch,
        quantity: new BigNumber('1000000000000000001'),
        serialNumber: '131753135',
      };

      await this.registry.generateBatch(
        ...Object.values(incorrectBatch),
        gaiaReceiver,
        { from: certifier1 }
      );

      await this.registry.updateBatch(
        ...Object.values(correctBatch),
        gaiaReceiver,
        { from: certifier1 }
      ).should.be.rejectedWith('GaiaRegistry::updateBatch: quantity cannot be a fraction');
    });
  });

  describe('#retire()', async () => {
    // eslint-disable-next-line max-len
    it('should retire, burn the correct amount of tokens and change clients balance appropriately when called by any client', async function () {
      const newBatch = {
        ...batchDataBase,
        serialNumber: '3331233',
      };
      const tokenAmtBought = intToTokenDecimals(350);
      const tokenAmtRetire1 = intToTokenDecimals(7);
      const tokenAmtRetire2 = intToTokenDecimals(179);

      await this.registry.generateBatch(
        ...Object.values(newBatch),
        gaiaReceiver,
        { from: certifier1 }
      ).should.be.fulfilled;

      await this.gaia.transfer(offsetter1, tokenAmtBought, { from: gaiaReceiver });

      const offsetterBalanceBefore = await this.gaia.balanceOf(offsetter1);

      await this.registry.retire(tokenAmtRetire1, { from: offsetter1 }).should.be.fulfilled;

      // for checking proper storage updates
      await this.registry.retire(tokenAmtRetire2, { from: gaiaReceiver }).should.be.fulfilled;

      const offsetterBalanceAfter = await this.gaia.balanceOf(offsetter1);

      offsetterBalanceBefore.sub(offsetterBalanceAfter).should.be.bignumber.equal(tokenAmtRetire1);
      offsetterBalanceAfter.should.be.bignumber.equal(tokenAmtBought.sub(tokenAmtRetire1));

      const retiredBalanceClient1 = await this.registry.retiredBalances(offsetter1);
      const retiredBalanceClient2 = await this.registry.retiredBalances(gaiaReceiver);
      const totalSupplyRetired = await this.registry.totalSupplyRetired();

      retiredBalanceClient1.should.be.bignumber.equal(tokenAmtRetire1);
      retiredBalanceClient2.should.be.bignumber.equal(tokenAmtRetire2);
      totalSupplyRetired.should.be.bignumber.equal(tokenAmtRetire1.add(tokenAmtRetire2));
    });

    it('should add up to retiredBalances if a client offsets multiple times', async function () {
      const newBatch = {
        ...batchDataBase,
        serialNumber: '91234',
        projectId: new BigNumber(12341),
        quantity: intToTokenDecimals(100),
      };
      await this.registry.generateBatch(
        ...Object.values(newBatch),
        gaiaReceiver,
        { from: certifier1 }
      ).should.be.fulfilled;

      const retireAmount = intToTokenDecimals(2);
      let balanceBefore = await this.registry.retiredBalances(gaiaReceiver);

      await this.registry.retire(retireAmount, { from: gaiaReceiver }).should.be.fulfilled;
      let balance = await this.registry.retiredBalances(gaiaReceiver);
      balance.should.be.bignumber.equal(balanceBefore.add(retireAmount));

      balanceBefore = balanceBefore.add(retireAmount);
      await this.registry.retire(retireAmount, { from: gaiaReceiver }).should.be.fulfilled;
      balance = await this.registry.retiredBalances(gaiaReceiver);
      balance.should.be.bignumber.equal(balanceBefore.add(retireAmount));

      balanceBefore = balanceBefore.add(retireAmount);
      await this.registry.retire(retireAmount, { from: gaiaReceiver }).should.be.fulfilled;
      balance = await this.registry.retiredBalances(gaiaReceiver);
      balance.should.be.bignumber.equal(balanceBefore.add(retireAmount));
    });

    it('should revert if retiring a fraction amount', async function () {
      const retireAmount1 = new BigNumber('1000000000000000001');
      await this.registry.retire(
        retireAmount1,
        { from: gaiaReceiver }
      ).should.be.rejectedWith('GaiaRegistry::retire: can retire only non-fractional amounts');

      const retireAmount2 = new BigNumber('8543210678021340564056392755329843758284656389');
      await this.registry.retire(
        retireAmount2,
        { from: gaiaReceiver }
      ).should.be.rejectedWith('GaiaRegistry::retire: can retire only non-fractional amounts');

      const retireAmount3 = new BigNumber('999999999999999999');
      await this.registry.retire(
        retireAmount3,
        { from: gaiaReceiver }
      ).should.be.rejectedWith('GaiaRegistry::retire: can retire only non-fractional amounts');

      const retireAmount4 = new BigNumber('42');
      await this.registry.retire(
        retireAmount4,
        { from: gaiaReceiver }
      ).should.be.rejectedWith('GaiaRegistry::retire: can retire only non-fractional amounts');

      const retireAmount5 = new BigNumber('1234567890');
      await this.registry.retire(
        retireAmount5,
        { from: gaiaReceiver }
      ).should.be.rejectedWith('GaiaRegistry::retire: can retire only non-fractional amounts');

      const retireAmount6 = new BigNumber('900000000000000000');
      await this.registry.retire(
        retireAmount6,
        { from: gaiaReceiver }
      ).should.be.rejectedWith('GaiaRegistry::retire: can retire only non-fractional amounts');
    });

    it('should retire using whole numbers', async function () {
      const newBatch = {
        ...batchDataBase,
        quantity: intToTokenDecimals('9999992549857636392756320932746587328423'),
        serialNumber: '141553135',
      };

      await this.registry.generateBatch(
        ...Object.values(newBatch),
        gaiaReceiver,
        { from: certifier1 }
      );

      const retireAmount1 = new BigNumber('1000000000000000000');
      await this.registry.retire(
        retireAmount1,
        { from: gaiaReceiver }
      ).should.be.fulfilled;

      const retireAmount2 = new BigNumber('2000000000000000000');
      await this.registry.retire(
        retireAmount2,
        { from: gaiaReceiver }
      ).should.be.fulfilled;

      const retireAmount3 = new BigNumber('2549857636392756320932746587328423000000000000000000');
      await this.registry.retire(
        retireAmount3,
        { from: gaiaReceiver }
      ).should.be.fulfilled;
    });
  });

  describe('onlyRole access', async () => {
    it('should generateBatch from multiple certifier accounts', async function () {
      const newBatch1 = {
        ...batchDataBase,
        serialNumber: '1',
      };
      await this.registry.generateBatch(
        ...Object.values(newBatch1),
        gaiaReceiver,
        { from: certifier1 }
      ).should.be.fulfilled;
      const newBatch2 = {
        ...batchDataBase,
        serialNumber: '2',
      };
      await this.registry.generateBatch(
        ...Object.values(newBatch2),
        gaiaReceiver,
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
        gaiaReceiver,
        { from: governor }
      ).should.be.rejectedWith('RoleAware: Permission denied to execute this function');
    });

    it('should setProjectData with CERTIFIER_ROLE', async function () {
      const projectData = {
        projectId: new BigNumber(1),
        projectName: 'test',
        projectType: 'test',
      };
      await this.registry.setProjectData(
        ...Object.values(projectData),
        { from: certifier1 }
      ).should.be.fulfilled;
    });

    it('should NOT setProjectData without CERTIFIER_ROLE', async function () {
      const projectData = {
        projectId: new BigNumber(2),
        projectName: 'test',
        projectType: 'test',
      };
      await this.registry.setProjectData(
        ...Object.values(projectData),
        { from: governor }
      ).should.be.rejectedWith('RoleAware: Permission denied to execute this function');
    });

    // TODO: describe('Events', () => {}); test all events on Registry

    it('should NOT setGaiaToken to zero address', async function () {
      await this.registry.setGaiaToken(
        zeroAddress,
        { from: governor }
      ).should.be.rejected;
    });

    it('should NOT setGaiaToken if the address is not a contract', async function () {
      const firstAddress = '0x0000000000000000000000000000000000000001';
      await this.registry.setGaiaToken(
        firstAddress,
        { from: governor }
      ).should.be.rejected;
    });

    it('should NOT setGaiaToken without GOVERNOR_ROLE', async function () {
      await this.registry.setGaiaToken(
        this.gaia.address,
        { from: certifier1 }
      ).should.be.rejectedWith('RoleAware: Permission denied to execute this function');
    });
  });

  describe('Events', () => {
    it('should find and match BatchGenerated and Transfer (mint) events', async function () {
      const newBatch = {
        ...batchDataBase,
        serialNumber: '3',
        quantity: intToTokenDecimals(1000123),
      };
      await this.registry.generateBatch(
        ...Object.values(newBatch),
        gaiaReceiver,
        { from: certifier1 }
      ).should.be.fulfilled;
      const batchGeneratedEvent = (await this.registry.getPastEvents('BatchGenerated')).at(-1).args;
      batchGeneratedEvent.serialNumber.should.be.equal(newBatch.serialNumber);
      batchGeneratedEvent.projectId.should.be.bignumber.equal(newBatch.projectId);
      batchGeneratedEvent.vintageEnd.should.be.equal(sha3(newBatch.vintageEnd)); // indexed
      batchGeneratedEvent.creditType.should.be.equal(sha3(newBatch.creditType)); // indexed
      batchGeneratedEvent.quantity.should.be.bignumber.equal(newBatch.quantity);
      batchGeneratedEvent.certificationsOrObjectives.should.be.equal(newBatch.certifications);
      batchGeneratedEvent.initialGaiaOwner.should.be.equal(gaiaReceiver);
      batchGeneratedEvent.certifier.should.be.equal(certifier1);

      const transferEvent = (await this.gaia.getPastEvents('Transfer')).at(-1).args;
      transferEvent.from.should.be.equal(zeroAddress);
      transferEvent.to.should.be.equal(gaiaReceiver);
      transferEvent.value.should.be.bignumber.equal(newBatch.quantity);
    });

    it('should find and match ProjectDataSet event', async function () {
      const projectData = {
        projectId: new BigNumber(3),
        projectName: 'test project name',
        projectType: 'test project type',
      };
      await this.registry.setProjectData(
        ...Object.values(projectData),
        { from: certifier1 }
      ).should.be.fulfilled;
      const projectDataSetEvent = (await this.registry.getPastEvents('ProjectDataSet')).at(-1).args;
      projectDataSetEvent.projectId.should.be.bignumber.equal(projectData.projectId);
      projectDataSetEvent.projectName.should.be.equal(projectData.projectName);
      projectDataSetEvent.projectType.should.be.equal(sha3(projectData.projectType)); // indexed
      projectDataSetEvent.certifier.should.be.equal(certifier1);
    });

    it('should find Transer (burn) and Retired events', async function () {
      const tokenAmount = intToTokenDecimals(123);
      await this.registry.retire(tokenAmount, { from: gaiaReceiver }).should.be.fulfilled;

      const transferEvent = (await this.gaia.getPastEvents('Transfer')).at(-1).args;
      transferEvent.from.should.be.equal(gaiaReceiver);
      transferEvent.to.should.be.equal(zeroAddress);
      transferEvent.value.should.be.bignumber.equal(tokenAmount);

      const retiredEvent = (await this.registry.getPastEvents('Retired')).at(-1).args;
      retiredEvent.holder.should.be.equal(gaiaReceiver);
      retiredEvent.amount.should.be.bignumber.equal(tokenAmount);
    });
  });

  describe('Registry getters', () => {
    it('should getRegisteredBatch', async function () {
      const newBatch = {
        ...batchDataBase,
        serialNumber: '555',
        projectId: new BigNumber(56),
        quantity: intToTokenDecimals(100),
      };
      await this.registry.generateBatch(
        ...Object.values(newBatch),
        gaiaReceiver,
        { from: certifier1 }
      ).should.be.fulfilled;
      const registeredBatch = await this.registry.getRegisteredBatch(newBatch.serialNumber);
      registeredBatch.serialNumber.should.be.equal(newBatch.serialNumber.toString());
      registeredBatch.projectId.should.be.equal(newBatch.projectId.toString());
      registeredBatch.vintageEnd.should.be.equal(newBatch.vintageEnd);
      registeredBatch.creditType.should.be.equal(newBatch.creditType);
      registeredBatch.quantity.should.be.equal(newBatch.quantity.toString());
      registeredBatch.certificationsOrObjectives.should.be.equal(newBatch.certifications);
      registeredBatch.initialGaiaOwner.should.be.equal(gaiaReceiver);
      registeredBatch.created.should.be.equal(true);
    });

    it('should getRegisteredProject', async function () {
      const projectData = {
        projectId: new BigNumber(5),
        projectName: 'test 5',
        projectType: 'test type 5',
      };
      await this.registry.setProjectData(
        ...Object.values(projectData),
        { from: certifier1 }
      ).should.be.fulfilled;
      const registeredProject = await this.registry.getRegisteredProject(projectData.projectId);
      registeredProject.projectName.should.be.equal(projectData.projectName);
      registeredProject.projectType.should.be.equal(projectData.projectType);
      registeredProject.created.should.be.equal(true);
    });

    it('should get the address of the gaiaToken', async function () {
      const token = await this.registry.gaiaToken();
      token.should.be.equal(this.gaia.address);
    });

    it('should get totalSupplyRetired', async function () {
      const newBatch = {
        ...batchDataBase,
        serialNumber: '122',
        projectId: new BigNumber(561),
        quantity: intToTokenDecimals(100),
      };
      await this.registry.generateBatch(
        ...Object.values(newBatch),
        gaiaReceiver,
        { from: certifier1 }
      ).should.be.fulfilled;

      const retiredAmountBefore = await this.registry.totalSupplyRetired();
      const retireAmount = intToTokenDecimals(10);
      await this.registry.retire(retireAmount, { from: gaiaReceiver }).should.be.fulfilled;

      let totalRetiredAmount = await this.registry.totalSupplyRetired();
      totalRetiredAmount.should.be.bignumber.equal(retiredAmountBefore.add(retireAmount));

      await this.registry.retire(retireAmount, { from: gaiaReceiver }).should.be.fulfilled;
      totalRetiredAmount = await this.registry.totalSupplyRetired();
      totalRetiredAmount.should.be.bignumber.equal(retiredAmountBefore.add(retireAmount).add(retireAmount));
    });

    it('should get retiredBalances', async function () {
      const newBatch = {
        ...batchDataBase,
        serialNumber: '123',
        projectId: new BigNumber(567),
        quantity: intToTokenDecimals(100),
      };
      await this.registry.generateBatch(
        ...Object.values(newBatch),
        gaiaReceiver,
        { from: certifier1 }
      ).should.be.fulfilled;

      const balanceBefore = await this.registry.retiredBalances(gaiaReceiver);
      const retireAmount = intToTokenDecimals(12);
      await this.registry.retire(retireAmount, { from: gaiaReceiver }).should.be.fulfilled;
      const balance = await this.registry.retiredBalances(gaiaReceiver);
      balance.should.be.bignumber.equal(balanceBefore.add(retireAmount));
    });
  });

  describe('Edge cases', () => {
    // TODO: find other possible edge cases with all existing flows
    it('if batch was generated with incorrect quantity should be able to update and manually mint', async function () {
      const correctQuantity = intToTokenDecimals(150000);
      const incorrectQuantity = intToTokenDecimals(15143);
      const quantityDiff = correctQuantity.sub(incorrectQuantity);

      const incorrectBatch = {
        ...batchDataBase,
        quantity: incorrectQuantity,
        serialNumber: '13155-VCS',
      };

      const correctBatch = {
        ...incorrectBatch,
        quantity: correctQuantity,
      };

      const receiverBalBefore = await this.gaia.balanceOf(gaiaReceiver);

      await this.registry.generateBatch(
        ...Object.values(incorrectBatch),
        gaiaReceiver,
        { from: certifier1 }
      );

      const receiverBalAfterIncorrect = await this.gaia.balanceOf(gaiaReceiver);

      receiverBalAfterIncorrect.sub(receiverBalBefore).should.be.bignumber.equal(incorrectQuantity);

      const incorrectBatchFromSC = await this.registry.registeredBatches(incorrectBatch.serialNumber);
      incorrectBatchFromSC.quantity.should.be.bignumber.equal(incorrectBatch.quantity);

      await this.registry.updateBatch(
        ...Object.values(correctBatch),
        gaiaReceiver,
        { from: certifier1 }
      );

      await this.gaia.mint(gaiaReceiver, quantityDiff, { from: certifier1 });

      const receiverBalFinal = await this.gaia.balanceOf(gaiaReceiver);

      const finalBatchFromSC = await this.registry.registeredBatches(incorrectBatch.serialNumber);

      receiverBalFinal.sub(receiverBalBefore).should.be.bignumber.equal(correctQuantity);

      finalBatchFromSC.quantity.should.be.bignumber.equal(correctBatch.quantity);
      finalBatchFromSC.serialNumber.should.be.equal(incorrectBatchFromSC.serialNumber);
      finalBatchFromSC.projectId.should.be.bignumber.equal(incorrectBatchFromSC.projectId);
      finalBatchFromSC.vintageEnd.should.be.equal(incorrectBatchFromSC.vintageEnd);
      finalBatchFromSC.creditType.should.be.equal(incorrectBatchFromSC.creditType);
      finalBatchFromSC.certificationsOrObjectives.should.be.equal(incorrectBatchFromSC.certificationsOrObjectives);
      finalBatchFromSC.initialGaiaOwner.should.be.equal(incorrectBatchFromSC.initialGaiaOwner);
    });
  });

  // TODO: updateBatch() - should NOT update if batch has not been generated before
  // TODO: test all revert (require) cases that have not been tested

  describe('#setProjectData()', () => {
    it('#setProjectData() should write project to storage', async function () {
      await this.registry.setProjectData(
        ...Object.values(projectDataBase),
        { from: certifier1 }
      ).should.be.fulfilled;

      const {
        projectName,
        projectType,
        created,
      } = await this.registry.registeredProjects(projectDataBase.projectId);

      projectName.should.be.equal(projectDataBase.name);
      projectType.should.be.equal(projectDataBase.projectType);
      created.should.be.equal(true);
    });

    it('#setProjectData() should update existing project in storage', async function () {
      const incorrectProject = {
        ...projectDataBase,
        projectId: new BigNumber(111),
        projectType: 'Automotive',
      };

      const correctProject = {
        ...incorrectProject,
        projectType: 'Forestry',
      };

      await this.registry.setProjectData(
        ...Object.values(incorrectProject),
        { from: certifier1 }
      ).should.be.fulfilled;

      const {
        projectName: projectNameInc,
        projectType: projectTypeInc,
        created: createdInc,
      } = await this.registry.registeredProjects(incorrectProject.projectId);

      projectNameInc.should.be.equal(incorrectProject.name);
      projectTypeInc.should.be.equal(incorrectProject.projectType);
      createdInc.should.be.equal(true);

      await this.registry.setProjectData(
        ...Object.values(correctProject),
        { from: certifier1 }
      ).should.be.fulfilled;

      const {
        projectName: projectNameCorr,
        projectType: projectTypeCorr,
        created: createdCorr,
      } = await this.registry.registeredProjects(correctProject.projectId);

      projectNameCorr.should.be.equal(incorrectProject.name);
      projectTypeCorr.should.be.equal(correctProject.projectType);
      createdCorr.should.be.equal(true);
    });
  });

  it('should NOT initialize twice', async function () {
    await this.registry.init(this.gaia.address, this.roleManager.address)
      .should.be.rejectedWith('Initializable: contract is already initialized');
  });
});

import { getChaiBN } from '@nomisma/nomisma-smart-contract-helpers';
import {
  roleNames,
} from '../helpers/roles';

const RoleManager = artifacts.require('./RoleManager.sol');

const {
  GOVERNOR_ROLE,
  CERTIFIER_ROLE,
} = roleNames;

require('chai')
  .use(require('chai-as-promised'))
  .use(getChaiBN())
  .should();

const checkRoles = async (
  roleManager,
  addresses,
  role,
  shouldHave,
  owner
) => {
  await Promise.all(
    addresses.map(
      async (addr) => {
        const hasRole = await roleManager.hasRole(
          addr,
          role,
          { from: owner }
        );

        assert.equal(hasRole, shouldHave);
      }
    )
  );
};

contract('RoleManager', ([
  roleManager1,
  roleManager2,
  roleManager3,
  governor1,
  notGovernor,
  certifierAcc,
  certifierAcc2,
]) => {
  it('should NOT be deployed with less governor accounts then needed confirmations', async () => {
    const confirmationsRequired = 3;
    await RoleManager.new(
      [ roleManager1 ],
      confirmationsRequired
    ).should.be.rejectedWith('RoleManager: Not enough governors supplied for the amount of required confirmations');
  });

  it('should NOT deploy when passing the same governor address multiple times', async () => {
    const confirmationsRequired = 3;
    await RoleManager.new(
      [ roleManager1, roleManager2, roleManager1 ],
      confirmationsRequired
    ).should.be.rejectedWith('revert');
  });

  describe('#addRoleForAddress(-es)', () => {
    beforeEach(async function () {
      const confirmationsRequired = 1;
      this.roleManager = await RoleManager.new(
        [ roleManager1, roleManager2, roleManager3 ],
        confirmationsRequired
      );
    });

    it('should reject if try to add/remove governor by addRoleForAddress/removeRoleForAddress', async function () {
      let isGovernor1 = await this.roleManager.hasRole(
        governor1,
        GOVERNOR_ROLE
      );
      let isNotGovernor = await this.roleManager.hasRole(
        notGovernor,
        GOVERNOR_ROLE
      );
      let isRoleManagerGovernor = await this.roleManager.hasRole(
        roleManager1,
        GOVERNOR_ROLE
      );
      assert.equal(isGovernor1, false);
      assert.equal(isNotGovernor, false);
      assert.equal(isRoleManagerGovernor, true);

      await this.roleManager.addRoleForAddress(governor1, GOVERNOR_ROLE, {
        from: roleManager1,
      }).should.be.rejectedWith('Cannot assign Governor role, please use submitAddGovernorRequest() instead');
      await this.roleManager.removeRoleForAddress(roleManager1, GOVERNOR_ROLE, {
        from: roleManager1,
      }).should.be.rejectedWith('Cannot remove Governor role, please use submitRemoveGovernorRequest() instead');

      isGovernor1 = await this.roleManager.hasRole(governor1, GOVERNOR_ROLE);
      isNotGovernor = await this.roleManager.hasRole(
        notGovernor,
        GOVERNOR_ROLE
      );
      isRoleManagerGovernor = await this.roleManager.hasRole(
        roleManager1,
        GOVERNOR_ROLE
      );

      assert.equal(isGovernor1, false);
      assert.equal(isNotGovernor, false);
      assert.equal(isRoleManagerGovernor, true);
    });

    it('#addRolesForAddresses should add multiple certifier account roles', async function () {
      const addresses = [ certifierAcc, certifierAcc2 ];
      await checkRoles(
        this.roleManager,
        addresses,
        CERTIFIER_ROLE,
        false,
        roleManager1
      );

      await this.roleManager.addRolesForAddresses(
        addresses,
        [ CERTIFIER_ROLE, CERTIFIER_ROLE ],
        { from: roleManager1 }
      );

      await checkRoles(
        this.roleManager,
        addresses,
        CERTIFIER_ROLE,
        true,
        roleManager1
      );
    });

    it('#removeRoleForAddress should remove certifier account role', async function () {
      await checkRoles(
        this.roleManager,
        [ certifierAcc ],
        CERTIFIER_ROLE,
        false,
        roleManager1
      );

      await this.roleManager.addRoleForAddress(
        certifierAcc,
        CERTIFIER_ROLE,
        { from: roleManager1 }
      );

      await checkRoles(
        this.roleManager,
        [ certifierAcc ],
        CERTIFIER_ROLE,
        true,
        roleManager1
      );

      await this.roleManager.removeRoleForAddress(
        certifierAcc,
        CERTIFIER_ROLE,
        { from: roleManager1 }
      );

      await checkRoles(
        this.roleManager,
        [ certifierAcc ],
        CERTIFIER_ROLE,
        false,
        roleManager1
      );
    });

    it('#addRolesForAddresses should revert when passed arrays are different length', async function () {
      await this.roleManager.addRolesForAddresses(
        [ certifierAcc, certifierAcc2 ],
        [ CERTIFIER_ROLE ],
        { from: roleManager1 }
      ).should.be.rejectedWith(
        'RoleManager::addRolesForAddresses: addresses and rolesArr should be the same length'
      );

      await this.roleManager.addRolesForAddresses(
        [ certifierAcc ],
        [ CERTIFIER_ROLE, CERTIFIER_ROLE ],
        { from: roleManager1 }
      ).should.be.rejectedWith(
        'RoleManager::addRolesForAddresses: addresses and rolesArr should be the same length'
      );

      await checkRoles(
        this.roleManager,
        [ certifierAcc, certifierAcc2 ],
        CERTIFIER_ROLE,
        false,
        roleManager1
      );
    });

    it('#addRolesForAddresses should revert when one of the addresses is zero', async function () {
      const addresses = [ certifierAcc, '0x0000000000000000000000000000000000000000' ];

      await this.roleManager.addRolesForAddresses(
        addresses,
        [ CERTIFIER_ROLE, CERTIFIER_ROLE ],
        { from: roleManager1 }
      ).should.be.rejectedWith('RoleManager::addRolesForAddresses: one of the addresses is zero');
    });

    it('#addRolesForAddresses should revert when empty arrays are passed', async function () {
      await this.roleManager.addRolesForAddresses(
        [],
        [],
        { from: roleManager1 }
      )
        .should.be.rejectedWith(
          'RoleManager::addRolesForAddresses: no addresses provided'
        );
    });

    it('#removeRoleForAddress should revert if zero addressed is passed', async function () {
      await this.roleManager.removeRoleForAddress(
        '0x0000000000000000000000000000000000000000',
        CERTIFIER_ROLE,
        { from: roleManager1 }
      ).should.be.rejectedWith(
        'RoleManager::removeRoleForAddress: zero address passed'
      );
    });
  });
});

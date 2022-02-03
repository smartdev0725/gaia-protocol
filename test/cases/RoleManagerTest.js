import { getChaiBN } from '@nomisma/nomisma-smart-contract-helpers';
import {
    setupRoleManager,
} from '../helpers/role-manager';
import {
    roleNames,
} from '../helpers/roles';


const {
    GOVERNOR_ROLE,
    OPERATOR_ROLE,
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

contract.only('RoleManager', ([
    roleManager1,
    roleManager2,
    roleManager3,
    governor1,
    notGovernor,
    operatorAcc,
    operatorAcc2,
]) => {
    it('should NOT be deployed with less governor accounts then needed confirmations', async () => {
        await setupRoleManager(
            [roleManager1],
            [],
            3
        ).should.be.rejectedWith('RoleManager: Not enough governors supplied for the amount of required confirmations');
    });

    it('should NOT deploy when passing the same governor address multiple times', async () => {
        await setupRoleManager(
            [roleManager1, roleManager2, roleManager1],
            [],
            3
        ).should.be.rejectedWith('revert');
    });

    describe('#appointGovernors #addRoleForAddress(-es) #isGovernor', () => {
        beforeEach(async function () {
            this.roleManager = await setupRoleManager([roleManager1, roleManager2, roleManager3], []); // TODO move to before()?
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

        it('#addRolesForAddresses should add multiple operator account roles', async function () {
            const addresses = [operatorAcc, operatorAcc2];
            await checkRoles(
                this.roleManager,
                addresses,
                OPERATOR_ROLE,
                false,
                roleManager1
            );

            await this.roleManager.addRolesForAddresses(
                addresses,
                [OPERATOR_ROLE, OPERATOR_ROLE],
                { from: roleManager1 }
            );

            await checkRoles(
                this.roleManager,
                addresses,
                OPERATOR_ROLE,
                true,
                roleManager1
            );
        });

        it('#removeRoleForAddress should remove operator account role', async function () {
            await checkRoles(
                this.roleManager,
                [operatorAcc],
                OPERATOR_ROLE,
                false,
                roleManager1
            );

            await this.roleManager.addRoleForAddress(
                operatorAcc,
                OPERATOR_ROLE,
                { from: roleManager1 }
            );

            await checkRoles(
                this.roleManager,
                [operatorAcc],
                OPERATOR_ROLE,
                true,
                roleManager1
            );

            await this.roleManager.removeRoleForAddress(
                operatorAcc,
                OPERATOR_ROLE,
                { from: roleManager1 }
            );

            await checkRoles(
                this.roleManager,
                [operatorAcc],
                OPERATOR_ROLE,
                false,
                roleManager1
            );
        });

        it('#addRolesForAddresses should revert when passed arrays are different length', async function () {
            await this.roleManager.addRolesForAddresses(
                [operatorAcc, operatorAcc2],
                [OPERATOR_ROLE],
                { from: roleManager1 }
            ).should.be.rejectedWith(
                'RoleManager::addRolesForAddresses: addresses and rolesArr should be the same length'
            );

            await this.roleManager.addRolesForAddresses(
                [operatorAcc],
                [OPERATOR_ROLE, OPERATOR_ROLE],
                { from: roleManager1 }
            ).should.be.rejectedWith(
                'RoleManager::addRolesForAddresses: addresses and rolesArr should be the same length'
            );

            await checkRoles(
                this.roleManager,
                [operatorAcc, operatorAcc2],
                OPERATOR_ROLE,
                false,
                roleManager1
            );
        });

        it('#addRolesForAddresses should revert when one of the addresses is zero', async function () {
            const addresses = [operatorAcc, '0x0000000000000000000000000000000000000000'];

            await this.roleManager.addRolesForAddresses(
                addresses,
                [OPERATOR_ROLE, OPERATOR_ROLE],
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
                OPERATOR_ROLE,
                { from: roleManager1 }
            ).should.be.rejectedWith(
                'RoleManager::removeRoleForAddress: zero address passed'
            );
        });
    });
});

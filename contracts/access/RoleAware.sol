// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "./IRoleManager.sol";
import "./RoleNames.sol";


/**
 * @title RoleAware
 * @dev Provides the ability for heirs to restrict the use of functions
 * by specific roles using the `onlyRole` modifier.
 * See {IRoleManager}.
 */
contract RoleAware is RoleNames {
    IRoleManager internal roleManager;

    /**
     * @dev > IMPORTANT:
     * This function can not be changed after Router contracts have been deployed,
     * since their logic is not upgradable, and changing this logic which will be
     * inherited in implementation contracts might result in vulnerability
     * since all Routers on chain would have this current (unchanged) logic.
     */
    modifier onlyRole(bytes32 roleName) {
        require(roleManager.hasRole(msg.sender, roleName), "RoleAware: Permission denied to execute this function");
        _;
    }

    /**
     * See {IRoleManager}.
     */
    function setRoleManager(address _roleManager) internal {
        require(_roleManager != address(0), "RoleAware: Role manager address cannot be empty");
        roleManager = IRoleManager(_roleManager);
    }
}

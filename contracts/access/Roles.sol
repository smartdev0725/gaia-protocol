// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

/**
 * @title Roles
 * @dev Library for managing addresses assigned to a Role.
 * Contract defines struct `Role` that keeps mapping for which address has requested Role
 */
library Roles {
    struct Role {
        mapping (address => bool) bearer;
    }

    /**
     * @dev Function to grant role to account. New address is added to `role` mapping
     * @param role Role mapping of current roles to addresses
     * @param account to grant role to
     */
    function add(Role storage role, address account) internal {
        require(account != address(0));
        require(!has(role, account));

        role.bearer[account] = true;
    }

    /**
     * @dev Function to grant role to account. Address is removed from `role` mapping
     * @param role Role mapping of current roles to addresses
     * @param account to remove from the mapping
     */
    function remove(Role storage role, address account) internal {
        require(account != address(0));
        require(has(role, account));

        role.bearer[account] = false;
    }

    /**
     * @dev Function to check if address is present in `roleMapping`
     * @param role Role mapping of current roles to addresses
     * @param account to check if its present in the mapping
     */
    function has(Role storage role, address account) internal view returns (bool) {
        require(account != address(0));
        return role.bearer[account];
    }
}

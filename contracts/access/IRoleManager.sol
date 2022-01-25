// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;


interface IRoleManager {
    function addRoleForAddress(address addr, bytes32 roleName) external;

    function addRolesForAddresses(
        address[] calldata addresses,
        bytes32[] calldata rolesArr
    ) external;

    function removeRoleForAddress(address addr, bytes32 roleName) external;

    function hasRole(address addr, bytes32 roleName) external view returns (bool);

    function submitAddGovernorRequest(address govAddress) external;

    function submitRemoveGovernorRequest(address govAddress) external;

    function revokeGovernorRequestConfirmation(address govAddress) external;
}

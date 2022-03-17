// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "../utils/OnlyRouterAccess.sol";
import "../access/RoleAware.sol";
import "./IGaiaRegistryStorage.sol";
import "../proxy-base/Resolvable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";


contract GaiaRegistryStorage is
    RoleAware,
    Resolvable,
    ContextUpgradeable,
    OnlyRouterAccess,
    IGaiaRegistryStorage {

    mapping(address => bool) public override gaiaTokens;

    mapping(string => CCBatch) public registeredBatches;
    mapping(uint256 => CCProject) public registeredProjects;
    mapping(address => uint256) public override totalSuppliesRetired;
}

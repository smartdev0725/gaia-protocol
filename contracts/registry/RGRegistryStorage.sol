// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "../utils/OnlyRouterAccess.sol";
import "../access/RoleAware.sol";
import "./IRGRegistryStorage.sol";
import "../proxy-base/Resolvable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";


contract RGRegistryStorage is
    RoleAware,
    Resolvable,
    ContextUpgradeable,
    OnlyRouterAccess,
    IRGRegistryStorage {

    address public override rheaGeToken;

    mapping(string => CCBatch) public registeredBatches;
    mapping(address => uint256) public override retiredBalances;
    uint256 public override totalSupplyRetired;
}

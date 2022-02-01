// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "../utils/OnlyRouterAccess.sol";
import "../access/RoleAware.sol";
import "./IRGRegistryStorage.sol";
import "../proxy-base/Resolvable.sol";


contract RGRegistryStorage is RoleAware, Resolvable, OnlyRouterAccess, IRGRegistryStorage {
    bool public override initialized = false;

    address public override rheaGeToken;

    mapping(string => CCBatch) public registeredBatches;
    mapping(address => uint256) public override retiredBalances;
    uint256 public override totalSupplyRetired;

    address public override tokenValidator;
}

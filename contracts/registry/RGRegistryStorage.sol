// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;


contract RGRegistryStorage {
    // TODO: which fields do we need here ??
    struct CCBatch {
        string serialNumber;
        uint256 projectId;
        string vintage;
        string creditType;
        uint256 units;
        address owner;
        bool created;
    }

    address public rheaGeToken;

    mapping(string => CCBatch) public registeredBatches;
    mapping(address => uint256) public retiredBalances;
    uint256 public totalSupplyRetired;

    address public tokenValidator;
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "../structs/CCBatchStruct.sol";


interface IRGRegistryStorage is CCBatchStruct {
    // TODO: which are indexed ??
    event BatchGenerated(
        string serialNumber,
        uint256 projectId,
        string vintage,
        string creditType,
        uint256 units,
        address indexed batchOwner,
        address indexed certifier
    );

    event BatchUpdated(
        string serialNumber,
        uint256 projectId,
        string vintage,
        string creditType,
        uint256 units,
        address indexed batchOwner,
        address indexed certifier
    );

    // TODO: do we need operator here and should we keep this name ??
    event InitialPurchase(
        address indexed buyer,
        uint256 amount
    );

    // TODO: naming ??
    event OffsetAndBurned(
        address indexed holder,
        uint256 amount
    );

    // storage getters
    function initialized() external view returns (bool);

    function rheaGeToken() external view returns (address);

    function totalSupplyRetired() external view returns (uint256);

    function tokenValidator() external view returns (address);

    function retiredBalances(address) external view returns (uint256);
}

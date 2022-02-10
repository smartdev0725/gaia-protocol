// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "../structs/Structs.sol";


interface IRGRegistryStorage is Structs {
    event BatchGenerated(
        string serialNumber,
        uint256 projectId,
        string indexed vintageEnd,
        string indexed creditType,
        uint256 quantity,
        string certifications,
        address initialRgtOwner,
        address indexed certifier
    );

    event ProjectAdded(
        uint256 id,
        string name,
        string indexed projectType,
        address indexed certifier
    );

    event Retired(
        address indexed holder,
        uint256 amount
    );

    // storage getters
    function rheaGeToken() external view returns (address);

    function totalSupplyRetired() external view returns (uint256);

    function retiredBalances(address) external view returns (uint256);
}

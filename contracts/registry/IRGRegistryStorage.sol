// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "../structs/Structs.sol";


interface IRGRegistryStorage is Structs {
    event BatchGenerated(
        string serialNumber,
        uint256 indexed projectId,
        string indexed vintage,
        string indexed creditType,
        uint256 quantity,
        address initialRgtOwner,
        address certifier
    );

    event ProjectAdded(

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

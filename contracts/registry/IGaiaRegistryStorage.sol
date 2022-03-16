// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "../structs/Structs.sol";


interface IGaiaRegistryStorage is Structs {
    event BatchGenerated(
        string serialNumber,
        uint256 projectId,
        uint256 vintageStart,
        uint256 indexed vintageEnd,
        string indexed creditType,
        uint256 quantity,
        string certificationsOrObjectives,
        address tokenToMint,
        address initialOwner,
        address indexed certifier
    );

    event BatchUpdated(
        string serialNumber,
        uint256 projectId,
        uint256 vintageStart,
        uint256 indexed vintageEnd,
        string indexed creditType,
        uint256 quantity,
        string certificationsOrObjectives,
        address tokenToMint,
        address initialOwner,
        address indexed certifier
    );

    event ProjectDataSet(
        uint256 projectId,
        string projectName,
        string indexed country,
        string indexed projectType,
        string indexed methodology,
        address certifier
    );

    event Retired(
        address indexed retiredToken,
        address indexed holder,
        uint256 amount
    );

    // storage getters
    function gaiaTokens(address) external view returns (bool);

    function totalSuppliesRetired(address) external view returns (uint256);
}

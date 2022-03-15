// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "../structs/Structs.sol";


interface IGaiaRegistry is Structs {

    function init(
        address _gaiaToken,
        address _roleManager
    ) external;

    function generateBatch(
        string calldata serialNumber,
        uint256 projectId,
        string calldata vintageStart,
        string calldata vintageEnd,
        string calldata creditType,
        uint256 quantity,
        string calldata certifications,
        address tokenToMint,
        address mintTo
    ) external;

    function updateBatch(
        string calldata serialNumber,
        uint256 projectId,
        string calldata vintageStart,
        string calldata vintageEnd,
        string calldata creditType,
        uint256 quantity,
        string calldata certifications,
        address tokenToMint,
        address initialOwner
    ) external;

    function setProjectData(
        uint256 projectId,
        string calldata name,
        string calldata projectType
    ) external;

    function retire(
        address tokenToRetire,
        uint256 carbonTonAmt
    ) external;

    function setGaiaToken(address _gaiaToken) external;

    function getRegisteredBatch(string calldata serialNumber) external view returns (CCBatch memory);

    function getRegisteredProject(uint256 projectId) external view returns (CCProject memory);
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "../structs/Structs.sol";


interface IRGRegistry is Structs {

    function init(
        address _rheaGeToken,
        address _roleManager
    ) external;

    function generateBatch(
        string calldata serialNumber,
        uint256 projectId,
        string calldata vintage,
        string calldata creditType,
        uint256 quantity,
        address mintTo
    ) external;

    function addProject(
        uint256 projectId,
        string calldata name,
        string calldata projectType,
        string calldata certifications
    ) external;

    function retire(
        uint256 carbonTonAmt
    ) external;

    function setRheaGeToken(address _rheaGeToken) external;

    function getRegisteredBatch(string calldata serialNumber) external view returns (CCBatch memory);

    function getRegisteredProject(uint256 projectId) external view returns (CCProject memory);
}

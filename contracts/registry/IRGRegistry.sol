// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "../structs/CCBatchStruct.sol";


interface IRGRegistry is CCBatchStruct {

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

    function offset(
        uint256 carbonTonAmt
    ) external;

    function setRheaGeToken(address _rheaGeToken) external;

    function getRegisteredBatch(string calldata serialNumber) external view returns (CCBatch memory);
}

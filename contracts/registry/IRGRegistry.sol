// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "../structs/CCBatchStruct.sol";


interface IRGRegistry is CCBatchStruct {

    function init(
        address _rheaGeToken,
        address _roleManager,
        address _tokenValidator
    ) external;

    function generateBatch(
        string calldata serialNumber,
        uint256 projectId,
        string calldata vintage,
        string calldata creditType,
        uint256 units,
        address batchOwner
    ) external;

    function purchase(
        address paymentToken,
        uint256 paymentAmt,
        uint256 rgtAmt
    ) external payable;

    function offset(
        uint256 carbonTonAmt
    ) external;

    function setRheaGeToken(address _rheaGeToken) external;

    function withdrawPaidFunds(
        address to,
        address token,
        uint256 amount,
        bool withdrawAll
    ) external;

    function getRegisteredBatch(string calldata serialNumber) external view returns (CCBatch memory);
}

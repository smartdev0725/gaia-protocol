// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;


interface IRGRegistry {
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

    event Offset(
        address indexed holder,
        uint256 amount
    );

    function generateBatch(
        string calldata serialNumber,
        uint256 projectId,
        string calldata vintage,
        string calldata creditType,
        uint256 units,
        address batchOwner
    ) external;

    function offset(
        uint256 carbonTonAmt
    ) external;

    function setRheaGeToken(address _rheaGeToken) external;
}

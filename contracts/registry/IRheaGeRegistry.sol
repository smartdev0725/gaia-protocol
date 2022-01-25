// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;


interface IRheaGeRegistry {
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
        address indexed receiver,
        uint256 amount,
        address operator
    );

    // TODO: naming ??
    event OffsetAndBurned(
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

    function updateBatch(
        string calldata serialNumber,
        uint256 projectId,
        string calldata vintage,
        string calldata creditType,
        uint256 units,
        address batchOwner,
        bool mintTokens
    ) external;

    function transferTokens(
        address to,
        uint256 amount
    ) external;

    function offset(
        address tokenOwner,
        uint256 carbonTonAmt
    ) external;

    function setRheaGeToken(address _rheaGeToken) external;
}

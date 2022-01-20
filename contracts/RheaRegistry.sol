// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "./access/AccessManager.sol";
import "./token/RheaGeToken.sol";


contract RheaRegistry is AccessManager {
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

    // TODO: which fields do we need here ??
    struct CCBatch {
        string serialNumber;
        uint256 projectId;
        string vintage;
        string creditType;
        uint256 units;
        address owner;
        bool created;
    }

    // TODO: do we need Projects ??

    address public rheaGeToken;
    mapping(string => CCBatch) public ccBatches;
    mapping(address => uint256) public retiredBalances;
    uint256 public totalSupplyRetired;

    constructor(address _rheaGeToken) public {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        require(_rheaGeToken != address(0), "RheaRegistry: zero address passed as _rheaGeToken");
        rheaGeToken = _rheaGeToken;
    }

    function generateBatch(
        string calldata serialNumber,
        uint256 projectId,
        string calldata vintage,
        string calldata creditType,
        uint256 units,
        address batchOwner
    // TODO: should we change this to CERTIFIER_ROLE ??
    ) external onlyRole(MINTER_ROLE) {
        require(!ccBatches[serialNumber].created, "RheaRegistry::generateBatch: Batch already created");

        ccBatches[serialNumber] = CCBatch(
            serialNumber,
            projectId,
            vintage,
            creditType,
            units,
            batchOwner,
            true
        );

        emit BatchGenerated(
            serialNumber,
            projectId,
            vintage,
            creditType,
            units,
            batchOwner,
            msg.sender
        );

        RheaGeToken(rheaGeToken).mint(address(this), units);
    }

    function updateBatch(
        string calldata serialNumber,
        uint256 projectId,
        string calldata vintage,
        string calldata creditType,
        uint256 units,
        address batchOwner,
        bool mintTokens
    ) external onlyRole(OPERATOR_ROLE) {
        require(ccBatches[serialNumber].created, "RheaRegistry::updateBatch: Batch is empty");

        ccBatches[serialNumber] = CCBatch(
            serialNumber,
            projectId,
            vintage,
            creditType,
            units,
            batchOwner,
            true
        );

        emit BatchUpdated(
            serialNumber,
            projectId,
            vintage,
            creditType,
            units,
            batchOwner,
            msg.sender
        );

        if (mintTokens) {
            RheaGeToken(rheaGeToken).mint(address(this), units);
        }
    }

    function transferTokens(
        address to,
        uint256 amount
    ) external onlyRole(OPERATOR_ROLE) {
        require(to != address(0), "RheaRegistry::transferTokens: Transferring to a 0x0 address.");

        require(
            RheaGeToken(rheaGeToken).balanceOf(address(this)) >= amount,
            "RheaRegistry::transferTokens: Unsufficient amount of tokens on Registry"
        );

        // TODO: what other checks do we need ??
        // TODO: what other logic do we need here ??

        require(
            RheaGeToken(rheaGeToken).transfer(to, amount),
            "RheaRegistry::transferTokens: RheaGeToken::transfer failed"
        );

        emit InitialPurchase(to, amount, msg.sender);
    }

    function offset(
        address tokenOwner,
        uint256 carbonTonAmt
    ) external onlyRole(BURNER_ROLE) {
        // TODO: need to check if anyone can burn by calling parent contract !!
        RheaGeToken(rheaGeToken).burn(tokenOwner, carbonTonAmt);
        unchecked {
            retiredBalances[tokenOwner] += carbonTonAmt;
            totalSupplyRetired += carbonTonAmt;
        }

        emit OffsetAndBurned(tokenOwner, carbonTonAmt);
    }
}

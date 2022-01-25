// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "../access/RoleAware.sol";
import "../token/IRheaGeToken.sol";
import "./IRheaGeRegistry.sol";


contract RheaGeRegistry is RoleAware, IRheaGeRegistry {
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

    // TODO: do we need to store Projects ??

    address public rheaGeToken;
    mapping(string => CCBatch) public registeredBatches;

    mapping(address => uint256) public retiredBalances;
    uint256 public totalSupplyRetired;

    constructor(
        address _rheaGeToken,
        address _roleManager
    ) {
        require(_rheaGeToken != address(0), "RheaRegistry: zero address passed as _rheaGeToken");
        rheaGeToken = _rheaGeToken;
        setRoleManager(_roleManager);
    }

    function generateBatch(
        string calldata serialNumber,
        uint256 projectId,
        string calldata vintage,
        string calldata creditType,
        uint256 units,
        address batchOwner
    // TODO: should we change this to CERTIFIER_ROLE ??
    ) external override onlyRole(MINTER_ROLE) {
        require(!registeredBatches[serialNumber].created, "RheaRegistry::generateBatch: Batch already created");

        registeredBatches[serialNumber] = CCBatch(
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

        IRheaGeToken(rheaGeToken).mint(address(this), units);
    }

    function updateBatch(
        string calldata serialNumber,
        uint256 projectId,
        string calldata vintage,
        string calldata creditType,
        uint256 units,
        address batchOwner,
        bool mintTokens
    ) external override onlyRole(MINTER_ROLE) {
        require(registeredBatches[serialNumber].created, "RheaRegistry::updateBatch: Batch is empty");

        registeredBatches[serialNumber] = CCBatch(
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

        // TODO: should we only mint/burn the difference ??
        if (mintTokens) {
            IRheaGeToken(rheaGeToken).mint(address(this), units);
        }
    }

    function transferTokens(
        address to,
        uint256 amount
    ) external override onlyRole(OPERATOR_ROLE) {
        require(to != address(0), "RheaRegistry::transferTokens: Transferring to a 0x0 address.");

        // TODO: do we even need this chekc of the function at all ??
        require(
            IRheaGeToken(rheaGeToken).balanceOf(address(this)) >= amount,
            "RheaRegistry::transferTokens: Unsufficient amount of tokens on Registry"
        );

        // TODO: what other checks do we need ??
        // TODO: what other logic do we need here ??

        require(
            IRheaGeToken(rheaGeToken).transfer(to, amount),
            "RheaRegistry::transferTokens: RheaGeToken::transfer failed"
        );

        emit InitialPurchase(to, amount, msg.sender);
    }

    function offset(
        address tokenOwner,
        uint256 carbonTonAmt
    ) external override onlyRole(BURNER_ROLE) {
        IRheaGeToken(rheaGeToken).burn(tokenOwner, carbonTonAmt);
        unchecked {
            retiredBalances[tokenOwner] += carbonTonAmt;
            totalSupplyRetired += carbonTonAmt;
        }

        emit OffsetAndBurned(tokenOwner, carbonTonAmt);
    }

    function setRheaGeToken(address _rheaGeToken) external override onlyRole(GOVERNOR_ROLE) {
        require(
            _rheaGeToken != address(0),
            "RheaRegistry::generateBatch: 0x0 address passed as rheaGeTokenAddress"
        );
        rheaGeToken = _rheaGeToken;
    }
}

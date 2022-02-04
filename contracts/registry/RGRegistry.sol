// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../access/RoleAware.sol";
import "../tokens/rgt/IRheaGeToken.sol";
import "./IRGRegistry.sol";


contract RGRegistry is RoleAware, IRGRegistry {
    using SafeERC20 for IERC20;

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

    address public rheaGeToken;

    mapping(string => CCBatch) public registeredBatches;
    mapping(address => uint256) public retiredBalances;
    uint256 public totalSupplyRetired;

    constructor(
        address _rheaGeToken,
        address _roleManager
    ) {
        require(_rheaGeToken != address(0), "RGRegistry: zero address passed as _rheaGeToken");
        rheaGeToken = _rheaGeToken;
        setRoleManager(_roleManager);
    }

    function generateBatch(
        string calldata serialNumber,
        uint256 projectId,
        string calldata vintage,
        string calldata creditType,
        uint256 units,
        address batchOwner, // TODO: is this needed at all ??
        address mintTo
    ) external override onlyRole(MINTER_ROLE) {
        require(!registeredBatches[serialNumber].created, "RGRegistry::generateBatch: Batch already created");

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

        IRheaGeToken(rheaGeToken).mint(mintTo, units);
    }

    function offset(
        uint256 carbonTonAmt
    ) external override {
        IRheaGeToken(rheaGeToken).burn(msg.sender, carbonTonAmt);
        unchecked {
            retiredBalances[msg.sender] += carbonTonAmt;
            totalSupplyRetired += carbonTonAmt;
        }

        emit Offset(msg.sender, carbonTonAmt);
    }

    function setRheaGeToken(address _rheaGeToken) external override onlyRole(GOVERNOR_ROLE) {
        require(
            _rheaGeToken != address(0),
            "RGRegistry::generateBatch: 0x0 address passed as rheaGeTokenAddress"
        );
        rheaGeToken = _rheaGeToken;
    }
}

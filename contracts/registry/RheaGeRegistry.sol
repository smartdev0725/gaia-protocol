// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "../access/RoleAware.sol";
import "../token/IRheaGeToken.sol";
import "./IRheaGeRegistry.sol";
import "../tokens/manage/IPaymentManager.sol";


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
    address public paymentManager;

    mapping(string => CCBatch) public registeredBatches;
    mapping(address => uint256) public retiredBalances;
    uint256 public totalSupplyRetired;

    // TODO: do we need this to be able to transfer payment tokens from this SC
    //  or can we just use balanceOf() for each token ???
    // tokenAddress => totalAmount
    mapping(address => uint256) internal paymentBalances;

    constructor(
        address _rheaGeToken,
        address _roleManager,
        address _paymentManager
    ) {
        require(_rheaGeToken != address(0), "RheaRegistry: zero address passed as _rheaGeToken");
        require(_paymentManager != address(0), "RheaRegistry: zero address passed as _paymentManager");
        rheaGeToken = _rheaGeToken;
        setRoleManager(_roleManager);
        paymentManager = _paymentManager;
    }

    function generateBatch(
        string calldata serialNumber,
        uint256 projectId,
        string calldata vintage,
        string calldata creditType,
        uint256 units,
        address batchOwner
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

    // TODO: write and test different flows with different currencies for client payments !!!
    function purchase(
        address buyer,
        address paymentToken,
        uint256 paymentAmt,
        uint256 rgtAmt
    ) external override onlyRole(OPERATOR_ROLE) {
        // TODO: what other checks do we need ??
        // TODO: what other logic do we need here ??
        IPaymentManager(paymentManager).collectPayment(
            buyer,
            address(this),
            paymentToken,
            paymentAmt
        );

        // TODO: might not need this...
        paymentBalances[paymentToken] = paymentAmt;

        require(
            IRheaGeToken(rheaGeToken).transfer(buyer, amount),
            "RheaRegistry::purchase: RheaGeToken::transfer failed"
        );

        emit InitialPurchase(buyer, amount, msg.sender);
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

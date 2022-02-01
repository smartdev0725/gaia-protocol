// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../access/RoleAware.sol";
import "../tokens/rgt/IRheaGeToken.sol";
import "./IRGRegistry.sol";
import "../tokens/validation/ITokenValidator.sol";
import "./RGRegistryStorage.sol";


contract RGRegistry is RoleAware, RGRegistryStorage, IRGRegistry {
    using SafeERC20 for IERC20;

    constructor(
        address _rheaGeToken,
        address _roleManager,
        address _tokenValidator
    ) {
        require(_rheaGeToken != address(0), "RGRegistry: zero address passed as _rheaGeToken");
        require(_tokenValidator != address(0), "RGRegistry: zero address passed as _paymentManager");
        rheaGeToken = _rheaGeToken;
        setRoleManager(_roleManager);
        tokenValidator = _tokenValidator;
    }

    function generateBatch(
        string calldata serialNumber,
        uint256 projectId,
        string calldata vintage,
        string calldata creditType,
        uint256 units,
        address batchOwner
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

        IRheaGeToken(rheaGeToken).mint(address(this), units);
    }

    // TODO: who calls this function? who is msg.sender ?? how should we guard it if at all ??
    function purchase(
        address paymentToken,
        uint256 paymentAmt,
        uint256 rgtAmt
    ) external payable override {
        // TODO: what other checks do we need ??
        // TODO: what other logic do we need here ??
        collectPayment(
            msg.sender,
            address(this),
            paymentToken,
            paymentAmt
        );

        require(
            IRheaGeToken(rheaGeToken).transfer(msg.sender, rgtAmt),
            "RGRegistry::purchase: RheaGeToken::transfer failed"
        );

        emit InitialPurchase(msg.sender, rgtAmt);
    }

    function offset(
        uint256 carbonTonAmt
    ) external override {
        IRheaGeToken(rheaGeToken).burn(msg.sender, carbonTonAmt);
        unchecked {
            retiredBalances[msg.sender] += carbonTonAmt;
            totalSupplyRetired += carbonTonAmt;
        }

        emit OffsetAndBurned(msg.sender, carbonTonAmt);
    }

    // TODO: should we make a better guard or none at all ??
    // TODO: this function should probably be in Registry
    function collectPayment(
        address from,
        address to,
        address tokenAddress,
        uint256 amount
    ) internal {
        bool isEther = ITokenValidator(tokenValidator).validateToken(tokenAddress);
        uint256 paymentAmt = isEther ? msg.value : amount;
        require(paymentAmt != 0, "RGRegistry::collectPayment: no payment provided");

        if (isEther) {
            require(
                msg.value == amount,
                "RGRegistry::collectPayment: incorrect amount has been passed with ETH purchase"
            );
        } else {
            require(
                msg.value == 0,
                "RGRegistry::collectPayment: ETH has been sent with an ERC20 purchase"
            );
            IERC20(tokenAddress).safeTransferFrom(from, to, paymentAmt);
        }
    }

    function withdrawPaidFunds(
        address to,
        address token,
        uint256 amount,
        bool withdrawAll
    ) external override onlyRole(GOVERNOR_ROLE) {
        // TODO: think on the archi of Payments and where should each function be
        //  this contract vs PaymentManager
        uint256 toWithdrawAmt;
        // this returns if token is ETH or now + validates
        if (ITokenValidator(tokenValidator).validateToken(token)) {
            toWithdrawAmt = withdrawAll && amount == 0
                ? address(this).balance
                : amount;

            (bool success, ) = to.call{value: toWithdrawAmt}("");
            require(success, "RheaGeRegistry::withdrawPaidFunds: ETH transfer failed");
        } else {
            toWithdrawAmt = withdrawAll && amount == 0
                ? IERC20(token).balanceOf(address(this))
                : amount;

            IERC20(token).safeTransfer(to, toWithdrawAmt);
        }
    }

    function setRheaGeToken(address _rheaGeToken) external override onlyRole(GOVERNOR_ROLE) {
        require(
            _rheaGeToken != address(0),
            "RGRegistry::generateBatch: 0x0 address passed as rheaGeTokenAddress"
        );
        rheaGeToken = _rheaGeToken;
    }
}

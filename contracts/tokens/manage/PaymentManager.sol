// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../../access/RoleAware.sol";
import "./IPaymentManager.sol";


contract PaymentManager is RoleAware, IPaymentManager {
    using SafeERC20 for IERC20;

    event TokenWhitelisted(
        address indexed whitelistedToken
    );

    event TokenRemovedFromWhitelist(
        address indexed deletedToken
    );

    mapping(address => bool) public whitelistedTokens;
    address public etherAddress;

    constructor(
        address _roleManager,
        address _etherAddress
    ) {
        require(_etherAddress != address(0), "PaymentManager:: _etherAddress is 0x0");
        setRoleManager(roleManager);
        etherAddress = _etherAddress;
    }

    function validateToken(address token) public view {
        require(whitelistedTokens[token], "Token is not whitelisted");
    }

    function addTokensToWhitelist(
        address[] memory tokens
    ) external onlyRole(GOVENOR_ROLE) {
        for (uint256 i = 0; i < tokens.length; i++) {
            require(tokens[i] != address(0), "Whitelisted token address is zero");
            if (!whitelistedTokens[tokens[i]]) {
                whitelistedTokens[tokens[i]] = true;
                emit TokenWhitelisted(
                    tokens[i]
                );
            }
        }
    }

    function removeTokenFromWhitelist(address token) external onlyRole(GOVENOR_ROLE) {
        require(token != address(0), "Whitelisted token address is not set");
        require(whitelistedTokens[token], "Can not remove token that is not in the whitelist");
        whitelistedTokens[token] = false;
        emit TokenRemovedFromWhitelist(token);
    }

    // TODO: should we make a better guard or none at all ??
    function collectPayment(
        address from,
        address to,
        address tokenAddress,
        uint256 amount
    ) external onlyRole(OPERATOR_ROLE) {
        bool isEther = tokenAddress == etherAddress();
        uint256 paymentAmt = isEther ? msg.value : amount;
        require(paymentAmt != 0, "PaymentManager::collectPayment: no payment provided");
        validateToken(tokenAddress);

        if (isEther) {
            require(
                msg.value == amount,
                "PaymentManager::collectPayment: incorrect amount has been passed with ETH purchase"
            );
        } else {
            require(
                msg.value == 0,
                "PaymentManager::collectPayment: ETH has been sent with an ERC20 purchase"
            );
            IERC20(tokenAddress).safeTransferFrom(from, to, paymentAmt);
        }
    }
}

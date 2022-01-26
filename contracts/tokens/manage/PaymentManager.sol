// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "../../access/RoleAware.sol";


contract PaymentManager is
    RoleAware {

    event TokenWhitelisted(
        address indexed whitelistedToken
    );

    event TokenRemovedFromWhitelist(
        address indexed deletedToken
    );

    mapping(address => bool) public whitelistedTokens;

    constructor(address roleManager) {
        setRoleManager(roleManager);
    }

    function validateTokens(address[] memory tokens) public view {
        for (uint256 i = 0; i < tokens.length; i++) {
            validateToken(tokens[i]);
        }
    }

    function validateToken(address token) public view {
        require(whitelistedTokens[token], "Token is not whitelisted");
    }

    function addTokensToWhitelist(
        address[] memory tokens
    ) public onlyRole(GOVENOR_ROLE) {
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

    function removeTokenFromWhitelist(address token) public onlyRole(GOVENOR_ROLE) {
        require(token != address(0), "Whitelisted token address is not set");
        require(whitelistedTokens[token], "Can not remove token that is not in the whitelist");
        whitelistedTokens[token] = false;
        emit TokenRemovedFromWhitelist(token);
    }
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./ITokenValidator.sol";
import "../../access/RoleAware.sol";


contract TokenValidator is RoleAware, ITokenValidator {
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
        require(_etherAddress != address(0), "TokenValidator:: _etherAddress is 0x0");
        setRoleManager(_roleManager);
        etherAddress = _etherAddress;
    }

    function validateToken(address token) public view returns (bool isEther) {
        require(whitelistedTokens[token], "TokenValidator::validateToken: Token is not whitelisted");
        return token == etherAddress;
    }

    function addTokensToWhitelist(
        address[] memory tokens
    ) external onlyRole(GOVERNOR_ROLE) {
        for (uint256 i = 0; i < tokens.length; i++) {
            require(tokens[i] != address(0), "TokenValidator::addTokensToWhitelist: Whitelisted token address is zero");
            if (!whitelistedTokens[tokens[i]]) {
                whitelistedTokens[tokens[i]] = true;
                emit TokenWhitelisted(
                    tokens[i]
                );
            }
        }
    }

    function removeTokenFromWhitelist(address token) external onlyRole(GOVERNOR_ROLE) {
        require(token != address(0), "TokenValidator::removeTokenFromWhitelist: Whitelisted token address is not set");
        require(whitelistedTokens[token], "TokenValidator::removeTokenFromWhitelist: Can not remove token that is not in the whitelist");
        whitelistedTokens[token] = false;
        emit TokenRemovedFromWhitelist(token);
    }

    function setEtherAddress(address _etherAddress) external override onlyRole(GOVERNOR_ROLE) {
        require(_etherAddress != address(0), "TokenValidator::setEtherAddress: _etherAddress is 0x0");
        etherAddress = _etherAddress;
    }
}

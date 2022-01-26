// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;


interface IPaymentManager {
    function validateTokens(address[] memory tokens) external view;
    function validateToken(address token) external view;

    function addTokensToWhitelist(
        address[] memory tokens,
        uint256[] memory precisions
    ) external;

    function removeTokenFromWhitelist(address token) external;
}

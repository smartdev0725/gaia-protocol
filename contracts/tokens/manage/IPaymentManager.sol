// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;


interface IPaymentManager {
    function whitelistedTokens(address) external view returns (bool);

    function etherAddress() external view returns (address);

    function validateToken(address token) external view;

    function addTokensToWhitelist(
        address[] memory tokens
    ) external;

    function removeTokenFromWhitelist(address token) external;

    function collectPayment(
        address from,
        address to,
        address tokenAddress,
        uint256 amount,
        uint256 msgValue
    ) external;
}

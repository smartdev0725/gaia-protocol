// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;


interface ITokenValidator {
    function whitelistedTokens(address) external view returns (bool);

    function etherAddress() external view returns (address);

    function validateToken(address token) external view returns (bool isEther);

    function addTokensToWhitelist(
        address[] memory tokens
    ) external;

    function removeTokenFromWhitelist(address token) external;

    function setEtherAddress(address _etherAddress) external;
}

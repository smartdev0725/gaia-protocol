// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;


import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


interface IRheaGeToken is IERC20 {
    function mint(address to, uint256 amount) external;

    function burn(address account, uint256 amount) external;
}

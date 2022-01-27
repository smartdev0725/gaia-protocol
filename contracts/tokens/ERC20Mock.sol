// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract ERC20Mock is ERC20 {
    uint256 private total = 1000 * 10 ** 18;

    constructor(string memory name, string memory symbol, address owner) ERC20(name, symbol) {
        _mint(owner, total);
    }
}

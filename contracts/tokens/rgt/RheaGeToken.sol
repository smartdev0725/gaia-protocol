// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./IRheaGeToken.sol";
import "../../access/RoleAware.sol";


contract RheaGeToken is RoleAware, ERC20, IRheaGeToken {
    // TODO: do we need decimals to be set? if yes - we need to override all logic related to it
    // TODO: since it is not present
    constructor(
        string memory name,
        string memory symbol,
        address _roleManager
    ) ERC20(name, symbol) {
        setRoleManager(_roleManager);
    }

    // TODO: do we want to not pass an account and always mint only to Treasury ???
    function mint(address to, uint256 amount) public override onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function burn(address account, uint256 amount) public override onlyRole(BURNER_ROLE) {
        _burn(account, amount);
    }
}
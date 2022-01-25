// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../access/RoleAware.sol";


// TODO: 1. do we need other roles and functionality, like pause or cap enabler or forced transfer?
// TODO: 2. figure out the token name
// TODO: 3. Is this the ONLY token we use ?? should there be distinction between different valued CCs ??
contract RheaGeToken is ERC20, RoleAware {
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
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function burn(address account, uint256 amount) public onlyRole(BURNER_ROLE) {
        _burn(account, amount);
    }

// TODO: do we need this ??
//    function burnFrom(address account, uint256 amount) public override onlyRole(BURNER_ROLE) {
//        super.burnFrom(account, amount);
//    }
}

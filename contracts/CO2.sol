// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

// TODO: 1. do we need other roles and functionality, like pause or cap enabler or forced transfer?
// TODO: 2. figure out the token name
contract CO2 is ERC20Burnable, AccessControl {
    bytes32 public constant MINTER_ROLE = "MINTER_ROLE";
    bytes32 public constant BURNER_ROLE = "BURNER_ROLE";

    // TODO: do we need decimals to be set? if yes - we need to override all logic related to it
    // TODO: since it is not present
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    // TODO: do we want to not pass an account and always mint only to Treasury ???
    function mint(address account, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(account, amount);
    }

    function burn(uint256 amount) public override onlyRole(BURNER_ROLE) {
        super.burn(amount);
    }

    function burnFrom(address account, uint256 amount) public override onlyRole(BURNER_ROLE) {
        super.burnFrom(account, amount);
    }
}

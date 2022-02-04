// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./IRheaGeToken.sol";
import "../../access/RoleAware.sol";


// TODO: can and should we make token not tied to RoleManager ??
// TODO: should we make this token pausable ?? - NO we need to restrict only individual addresses
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

    function mint(address to, uint256 amount) public override onlyRole(MINTER_ROLE) {
        require(amount > 0, "ERC20: minting zero amount");
        _mint(to, amount);
    }

    function burn(address account, uint256 amount) public override onlyRole(BURNER_ROLE) {
        require(amount > 0, "ERC20: burning zero amount");
        _burn(account, amount);
    }
}

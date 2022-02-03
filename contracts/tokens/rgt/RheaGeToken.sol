// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "./IRheaGeToken.sol";
import "../../access/RoleAware.sol";
import "../../utils/OnlyRouterAccess.sol";


// TODO: can and should we make token not tied to RoleManager ??
// TODO: should we make this token pausable ??
contract RheaGeToken is RoleAware, ERC20Upgradeable, OnlyRouterAccess, IRheaGeToken {

    // TODO: do we need decimals to be set? if yes - we need to override all logic related to it
    // TODO: since it is not present
    function init(
        address _roleManager
    ) external override onlyRouter initializer {
        super.__ERC20_init("RheaGe Token", "RGT");
        setRoleManager(_roleManager);
    }

    function mint(address to, uint256 amount) public override onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function burn(address account, uint256 amount) public override onlyRole(BURNER_ROLE) {
        _burn(account, amount);
    }
}

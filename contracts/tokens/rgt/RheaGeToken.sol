// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "./IRheaGeToken.sol";
import "../../access/RoleAware.sol";
import "../../utils/OnlyRouterAccess.sol";


contract RheaGeToken is RoleAware, ERC20Upgradeable, OnlyRouterAccess, IRheaGeToken {

    function init(
        address _roleManager
    ) external override onlyRouter initializer {
        super.__ERC20_init("RheaGe Token", "RGT");
        setRoleManager(_roleManager);
    }

    function mint(address to, uint256 amount) public override onlyRole(MINTER_ROLE) {
        _mint(to, amount);
        emit RheaGeTokensMinted(to, amount);
    }

    function burn(address account, uint256 amount) public override onlyRole(BURNER_ROLE) {
        _burn(account, amount);
        emit RheaGeTokensBurned(account, amount);
    }
}

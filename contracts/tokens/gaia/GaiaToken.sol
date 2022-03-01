// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "./IGaiaToken.sol";
import "../../access/RoleAware.sol";
import "../../utils/OnlyRouterAccess.sol";


contract GaiaToken is RoleAware, ERC20Upgradeable, OnlyRouterAccess, IGaiaToken {

    function init(
        address _roleManager
    ) external override onlyRouter initializer {
        super.__ERC20_init("Gaia Token", "GAIA");
        setRoleManager(_roleManager);
    }

    function mint(address to, uint256 amount) public override onlyRole(MINTER_ROLE) onlyRouter {
        require(amount > 0, "GaiaToken: minting zero amount");
        _mint(to, amount);
        emit GaiaTokensMinted(to, amount);
    }

    function burn(address account, uint256 amount) public override onlyRole(BURNER_ROLE) onlyRouter {
        require(amount > 0, "GaiaToken: burning zero amount");
        _burn(account, amount);
        emit GaiaTokensBurned(account, amount);
    }
}

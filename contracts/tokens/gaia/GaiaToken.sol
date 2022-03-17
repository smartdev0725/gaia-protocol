// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "./IGaiaToken.sol";
import "../../access/RoleAware.sol";
import "../../proxy-base/Resolvable.sol";
import "../../utils/OnlyRouterAccess.sol";


contract GaiaToken is 
    RoleAware, 
    Resolvable, 
    ERC20Upgradeable, 
    OnlyRouterAccess, 
    IGaiaToken {

    function init(
        string memory name,
        string memory symbol,
        address _roleManager // TODO deploy: remove this potentially! seems we are setting this twice!
    ) external override onlyRouter initializer {
        super.__ERC20_init(name, symbol);
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

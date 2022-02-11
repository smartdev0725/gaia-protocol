// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "./IRheaGeUpgradedMock.sol";
import "../../access/RoleAware.sol";
import "../../utils/OnlyRouterAccess.sol";


contract RheaGeUpgradedMock is RoleAware, ERC20Upgradeable, OnlyRouterAccess, IRheaGeUpgradedMock {
    bytes32 public constant MOCK_ROLE = "MOCK_ROLE";
    uint256 public override version;

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

    function setVersion(uint256 _version) public override onlyRole(MOCK_ROLE) {
        version = _version;
    }
}

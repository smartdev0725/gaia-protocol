// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "../access/RoleAware.sol";
import "../tokens/rgt/IRheaGeToken.sol";
import "./IRGRegistry.sol";
import "./RGRegistryStorage.sol";


contract RGRegistry is RGRegistryStorage, IRGRegistry {

    function init(
        address _rheaGeToken,
        address _roleManager
    // TODO: proxy: figure out a good way to make this only callable by a Router
    ) external override onlyRouter initializer {
        require(_rheaGeToken != address(0), "RGRegistry: zero address passed as _rheaGeToken");
        rheaGeToken = _rheaGeToken;
        setRoleManager(_roleManager);
    }

    function generateBatch(
        string calldata serialNumber,
        uint256 projectId,
        string calldata vintage,
        string calldata creditType,
        uint256 quantity,
        address mintTo
    ) external override onlyRole(CERTIFIER_ROLE) onlyRouter {
        require(!registeredBatches[serialNumber].created, "RGRegistry::generateBatch: Batch already created");

        registeredBatches[serialNumber] = CCBatch(
            serialNumber,
            projectId,
            vintage,
            creditType,
            quantity,
            mintTo,
            true // created
        );

        emit BatchGenerated(
            serialNumber,
            projectId,
            vintage,
            creditType,
            quantity,
            mintTo,
            msg.sender // certifier
        );

        IRheaGeToken(rheaGeToken).mint(mintTo, quantity);
    }

    function addProject(
        uint256 projectId,
        string calldata projectName,
        string calldata projectType,
        string calldata certifications
    ) external override onlyRole(CERTIFIER_ROLE) onlyRouter {
        require(!registeredProjects[projectId].created, "RGRegistry::addProject: project has already been created");

        registeredProjects[projectId] = CCProject(
            projectName,
            projectType,
            certifications,
            true // created
        );

        emit ProjectAdded(
            projectId,
            projectName,
            projectType,
            certifications,
            msg.sender // certifier
        );
    }

    function retire(
        uint256 carbonTokenAmount
    ) external override onlyRouter {
        IRheaGeToken(rheaGeToken).burn(msg.sender, carbonTokenAmount);
        unchecked {
            retiredBalances[msg.sender] += carbonTokenAmount;
            totalSupplyRetired += carbonTokenAmount;
        }

        emit Retired(
            msg.sender, // holder
            carbonTokenAmount
        );
    }

    function setRheaGeToken(address _rheaGeToken) external override onlyRole(GOVERNOR_ROLE) onlyRouter {
        require(rheaGeToken == address(0), "RGRegistry::setRheaGeToken: address of RheaGeToken must be set only once");
        require(IRheaGeToken(_rheaGeToken).totalSupply() >= 0, "RGRegistry::setRheaGeToken: totalSupply is missing");
        require(IRheaGeToken(_rheaGeToken).decimals() > 0, "RGRegistry::setRheaGeToken: decimals is missing");
        rheaGeToken = _rheaGeToken;
    }

    function getRegisteredBatch(string calldata serialNumber) external view override onlyRouter returns (CCBatch memory) {
        return registeredBatches[serialNumber];
    }

    function getRegisteredProject(uint256 id) external view override onlyRouter returns (CCProject memory) {
        return registeredProjects[id];
    }
}

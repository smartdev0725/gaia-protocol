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
    ) external override onlyRouter initializer {
        require(_rheaGeToken != address(0), "RGRegistry: zero address passed as _rheaGeToken");
        rheaGeToken = _rheaGeToken;
        setRoleManager(_roleManager);
    }

    function generateBatch(
        string calldata serialNumber,
        uint256 projectId,
        string calldata vintageEnd,
        string calldata creditType,
        uint256 quantity,
        string calldata certifications,
        address mintTo
    ) external override onlyRole(CERTIFIER_ROLE) onlyRouter {
        require(!registeredBatches[serialNumber].created, "RGRegistry::generateBatch: Batch already created");
        require (
            !_isTokenFraction(quantity),
            "RGRegistry::generateBatch: quantity is a fraction"
        );

        registeredBatches[serialNumber] = CCBatch(
            serialNumber,
            projectId,
            vintageEnd,
            creditType,
            quantity,
            certifications,
            mintTo,
            true // created
        );

        emit BatchGenerated(
            serialNumber,
            projectId,
            vintageEnd,
            creditType,
            quantity,
            certifications,
            mintTo,
            msg.sender // certifier
        );

        if (mintTo != address(0)) {
            IRheaGeToken(rheaGeToken).mint(mintTo, quantity);
        }
    }

    function updateBatch(
        string calldata serialNumber,
        uint256 projectId,
        string calldata vintageEnd,
        string calldata creditType,
        uint256 quantity,
        string calldata certifications,
        address initialOwner
    ) external override onlyRole(CERTIFIER_ROLE) onlyRouter {
        require(registeredBatches[serialNumber].created, "RGRegistry::generateBatch: Batch has not been added yet");
        require (
            !_isTokenFraction(quantity),
            "RGRegistry::updateBatch: quantity is a fraction"
        );

        registeredBatches[serialNumber] = CCBatch(
            serialNumber,
            projectId,
            vintageEnd,
            creditType,
            quantity,
            certifications,
            initialOwner,
            true // created
        );

        emit BatchUpdated(
            serialNumber,
            projectId,
            vintageEnd,
            creditType,
            quantity,
            certifications,
            initialOwner,
            msg.sender // certifier
        );
    }

    function setProjectData(
        uint256 projectId,
        string calldata projectName,
        string calldata projectType
    ) external override onlyRole(CERTIFIER_ROLE) onlyRouter {
        registeredProjects[projectId] = CCProject(
            projectName,
            projectType,
            true // created
        );

        emit ProjectDataSet(
            projectId,
            projectName,
            projectType,
            msg.sender // certifier
        );
    }

    function retire(
        uint256 carbonTokenAmount
    ) external override onlyRouter {
        require (
            !_isTokenFraction(carbonTokenAmount),
            "RGRegistry::retire: token amount is a fraction"
        );

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
        require(
            _rheaGeToken != address(0),
            "RGRegistry::generateBatch: 0x0 address passed as rheaGeTokenAddress"
        );
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

    function _isTokenFraction(uint256 amount) internal view virtual returns (bool) {
        return amount % (10 ** IRheaGeToken(rheaGeToken).decimals()) != 0;
    }
}

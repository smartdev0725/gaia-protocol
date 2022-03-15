// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "../access/RoleAware.sol";
import "../tokens/gaia/IGaiaToken.sol";
import "./IGaiaRegistry.sol";
import "./GaiaRegistryStorage.sol";


contract GaiaRegistry is GaiaRegistryStorage, IGaiaRegistry {

    function init(
        address _gaiaToken,
        address _roleManager
    ) external override onlyRouter initializer {
        require(_gaiaToken != address(0), "GaiaRegistry: zero address passed as _gaiaToken");
        gaiaTokens[_gaiaToken] = true;
        setRoleManager(_roleManager);
    }

    function generateBatch(
        string calldata serialNumber,
        uint256 projectId,
        string calldata vintageStart,
        string calldata vintageEnd,
        string calldata creditType,
        uint256 quantity,
        string calldata certifications,
        address tokenToMint,
        address mintTo
    ) external override onlyRole(CERTIFIER_ROLE) onlyRouter {
        require(!registeredBatches[serialNumber].created, "GaiaRegistry::generateBatch: Batch already created");
        require (
            !_isTokenFraction(quantity, IGaiaToken(tokenToMint).decimals()),
            "GaiaRegistry::generateBatch: quantity cannot be a fraction"
        );
        require(gaiaTokens[tokenToMint], "GaiaRegistry::generateBatch: token to mint is not whitelisted");

        registeredBatches[serialNumber] = CCBatch(
            serialNumber,
            projectId,
            vintageStart,
            vintageEnd,
            creditType,
            quantity,
            certifications,
            tokenToMint,
            mintTo,
            true // created
        );

        emit BatchGenerated(
            serialNumber,
            projectId,
            vintageStart,
            vintageEnd,
            creditType,
            quantity,
            certifications,
            tokenToMint,
            mintTo,
            msg.sender // certifier
        );

        if (mintTo != address(0)) {
            IGaiaToken(tokenToMint).mint(mintTo, quantity);
        }
    }

    function updateBatch(
        string calldata serialNumber,
        uint256 projectId,
        string calldata vintageStart,
        string calldata vintageEnd,
        string calldata creditType,
        uint256 quantity,
        string calldata certifications,
        address tokenToMint,
        address initialOwner
    ) external override onlyRole(CERTIFIER_ROLE) onlyRouter {
        require(registeredBatches[serialNumber].created, "GaiaRegistry::generateBatch: Batch has not been added yet");
        require (
            !_isTokenFraction(quantity, IGaiaToken(tokenToMint).decimals()),
            "GaiaRegistry::updateBatch: quantity cannot be a fraction"
        );

        registeredBatches[serialNumber] = CCBatch(
            serialNumber,
            projectId,
            vintageStart,
            vintageEnd,
            creditType,
            quantity,
            certifications,
            tokenToMint,
            initialOwner,
            true // created
        );

        emit BatchUpdated(
            serialNumber,
            projectId,
            vintageStart,
            vintageEnd,
            creditType,
            quantity,
            certifications,
            tokenToMint,
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
        address tokenToRetire,
        uint256 carbonTokenAmount
    ) external override onlyRouter {
        require (
            !_isTokenFraction(carbonTokenAmount, IGaiaToken(tokenToRetire).decimals()),
            "GaiaRegistry::retire: can retire only non-fractional amounts"
        );

        IGaiaToken(tokenToRetire).burn(msg.sender, carbonTokenAmount);
        unchecked {
            totalSuppliesRetired[tokenToRetire] += carbonTokenAmount;
        }

        emit Retired(
            tokenToRetire,
            msg.sender, // holder
            carbonTokenAmount
        );
    }

    function setGaiaToken(address _gaiaToken) external override onlyRole(GOVERNOR_ROLE) onlyRouter {
        require(
            _gaiaToken != address(0),
            "GaiaRegistry::generateBatch: 0x0 address passed as gaiaTokenAddress"
        );
        require(IGaiaToken(_gaiaToken).totalSupply() >= 0, "GaiaRegistry::setGaiaToken: totalSupply is missing");
        require(IGaiaToken(_gaiaToken).decimals() > 0, "GaiaRegistry::setGaiaToken: decimals is missing");
        gaiaTokens[_gaiaToken] = true;
    }

    function getRegisteredBatch(string calldata serialNumber) external view override onlyRouter returns (CCBatch memory) {
        return registeredBatches[serialNumber];
    }

    function getRegisteredProject(uint256 id) external view override onlyRouter returns (CCProject memory) {
        return registeredProjects[id];
    }

    function _isTokenFraction(uint256 amount, uint256 decimals) internal view virtual returns (bool) {
        return amount % (10 ** decimals) != 0;
    }
}

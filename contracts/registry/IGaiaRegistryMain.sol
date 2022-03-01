// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "./GaiaRegistryStorage.sol";
import "./IGaiaRegistry.sol";

// solhint-disable-next-line no-empty-blocks
abstract contract IGaiaRegistryMain is GaiaRegistryStorage, IGaiaRegistry {}

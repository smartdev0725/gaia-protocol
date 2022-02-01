// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "./RGRegistryStorage.sol";
import "./IRGRegistry.sol";

// solhint-disable-next-line no-empty-blocks
abstract contract IRGRegistryMain is RGRegistryStorage, IRGRegistry {}

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "./Resolver.sol";

/**
 * @title Resolvable
 * @dev Contract is used in all concrete contracts that should have the same memory layout as Router
 * All concrete contracts that are accessed through Router must inherit from this contract
 */
contract Resolvable {
    Resolver public resolver;
}

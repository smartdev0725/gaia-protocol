// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;


contract OnlyRouterAccess {
    address private immutable __self = address(this);

    modifier onlyRouter() {
        require(address(this) != __self, "Function must be called through delegatecall");
        _;
    }
}

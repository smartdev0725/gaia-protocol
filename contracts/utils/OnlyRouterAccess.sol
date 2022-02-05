// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;


contract OnlyRouterAccess {
    address private immutable __self = address(this);

    modifier onlyRouter() {
        require(address(this) != __self, "Function must be called through delegatecall");
        // TODO: we can't use the below check since we might have multiple impls under one Router
        // TODO: find a better way to check that only Router can call this
        // require(_getImplementation() == __self, "Function must be called through active proxy");
        _;
    }
}

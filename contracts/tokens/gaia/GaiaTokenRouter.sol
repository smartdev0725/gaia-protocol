// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "../../proxy-base/Router.sol";
import "../../proxy-base/Resolver.sol";


contract GaiaTokenRouter is Router {

    constructor(        
        string memory _initFunctionSignature,
        bytes memory _encodedInitArguments,
        address _roleManager,
        address _resolver
    ) Router(
        _initFunctionSignature,
        _encodedInitArguments,
        _roleManager,
        _resolver,
        "delegatecall() failed in GaiaTokenRouter.constructor"
    // solhint-disable-next-line no-empty-blocks
    ) { }
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "../../proxy-base/Router.sol";
import "../../proxy-base/Delegator.sol";
import "../../proxy-base/Resolver.sol";


// TODO: test an upgrade of storage and functionality of this proxy module !!!
// TODO: to make sure we do not corrupt the storage and can extend both storage and functionality
contract GaiaTokenRouter is Router, Delegator {

    bytes4 internal constant INIT_SIG = bytes4(
        keccak256(
            bytes(
                "init(address)"
            )
        )
    );

    constructor(
        address _roleManager,
        address _resolver
    ) {
        initRouter(_resolver, _roleManager);

        address initializer = Resolver(_resolver).lookup(INIT_SIG);

        bytes memory args = abi.encodeWithSelector(
            INIT_SIG,
            _roleManager
        );

        delegate(
            initializer,
            args,
            "delegatecall() failed in RGRegistryRouter.constructor"
        );
    }

}

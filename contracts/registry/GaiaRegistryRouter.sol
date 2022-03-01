// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "../proxy-base/Router.sol";
import "../proxy-base/Delegator.sol";
import "../proxy-base/Resolver.sol";


contract GaiaRegistryRouter is Router, Delegator {

    bytes4 internal constant INIT_SIG = bytes4(
        keccak256(
            bytes(
                "init(address,address)"
            )
        )
    );

    constructor(
        address _gaiaToken,
        address _resolver,
        address _roleManager
    ) {
        initRouter(_resolver, _roleManager);

        address initializer = Resolver(_resolver).lookup(INIT_SIG);

        bytes memory args = abi.encodeWithSelector(
            INIT_SIG,
            _gaiaToken,
            _roleManager
        );

        delegate(
            initializer,
            args,
            "delegatecall() failed in GaiaRegistryRouter.constructor"
        );
    }
}

// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.11;

import "./Resolver.sol";
import "../access/RoleAware.sol";


/**
 * @title Router
 * @dev Contracts that extend {Router} contract serves as data storage. {Router} delegates
 * all calls based on mapping found in Resolver. All calls are executed in context
 * of calling router and for every functionality/proxy modules, Router's address is being used
 * as an entry point and represents functionality of the module (full module's ABI is tied
 * to the respective Router's address). This contract is not being deployed, but inherited
 * by specific Router contracts of each module.
 *
 * > IMPORTANT: A signature for any external or public function added to this contract
 * needs to be present in Resolver contract as a constant and be checked against
 * during `register()` process. {Router} functions can NOT be shadowed by any other
 * contracts!
 */
contract Router is RoleAware {
    bytes32 private constant GOVERNOR_ROLE_NAME = "governor";
    Resolver public resolver;

    /**
     * @dev Default fallback functions that intercepts/accepts all calls. Method signature found
     * in Resolver is used to get address of contract to call. Next `delegatecall` is
     * executed to call resolved contract address.
     *
     * > IMPORTANT: This function gets called ONLY when no functions with the needed name
     * are present in this contract!
     */
    // solhint-disable-next-line no-complex-fallback
    fallback() external payable {
        if (msg.sig == 0x0) {
            return;
        }

        // Get routing information for the called function
        address destination = resolver.lookup(msg.sig);

        // Make the call
        assembly {
            calldatacopy(mload(0x40), 0, calldatasize())
            let size := extcodesize(destination)
            if iszero(size) { revert(0, 0) }
            let result := delegatecall(gas(), destination, mload(0x40), calldatasize(), mload(0x40), 0)
            returndatacopy(mload(0x40), 0, returndatasize())
            switch result
            case 0 { revert(mload(0x40), returndatasize()) }
            default { return(mload(0x40), returndatasize()) }
        }
    }

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    /**
     * @dev Setting {Resolver} contract used for routing calls. This address is
     * one of the main key points of each Router contract, since this address
     * will be used to figure out where to route calls for each module.
     * > IMPORTANT! This function should not exist on implementation interfaces
     * or implementation logic contracts!
     * This would cause a potential shadowing problem that might arise.
     * We should ONLY call this function on a particular {Router} contract
     * DIRECTLY, and not through an implementation interface it is used with!
     * @param _resolver address of {Resolver} contract to be set for {Router}
     */
    function setResolver(address _resolver) public onlyRole(GOVERNOR_ROLE_NAME) {
        require(
            _resolver != address(0),
            "_resolver is passed as 0 address at Router.setResolver()."
        );
        resolver = Resolver(_resolver);
    }

    /**
     * @dev {Router} initialization function that sets resolver and governance role
     * @param _resolver address of {Resolver} contract to be set for {Router}
     */
    function initRouter(
        address _resolver,
        address _roleManager
    ) internal {
        require(_resolver != address(0));
        resolver = Resolver(_resolver);
        setRoleManager(_roleManager);
    }
}

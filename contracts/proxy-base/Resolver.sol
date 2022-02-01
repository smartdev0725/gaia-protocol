// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.11;

import "../access/RoleAware.sol";


/**
 * @title Resolver
 * @dev Contract is used to store mapping between keccak signatures and address of deployed
 * contract. It is used by router to resolve and call correct contract address.
 * This contract is an essential part of Elektro's Proxy Pattern architecture!
 * It does NOT get redeployed during a system on-chain upgrade, only internal storage
 * gets updated to store data for newly deployed/upgraded implementations contracts
 * throughout the system.
 */
contract Resolver is RoleAware {
    bytes32 private constant GOVERNOR_ROLE_NAME = "governor";
    // mapping between first 4 bytes of keccak and contract address
    mapping (bytes4 => address) internal pointers;

    /** @dev > IMPORTANT: This is a signature of the native Router function
     * that can NOT be shadowed by any implementation contract.
     * We check a keccak signature against it for every `register()` to make sure this doesn't happen.
     * In the case of shadowing, Resolver's `lookup()` will return an incorrect address,
     * since with any call in this case only {Router.setResolver()} will be called.
     */
    bytes32 internal constant SET_RESOLVER_SIG = keccak256(
        bytes(
            "setResolver(address)"
        )
    );

    /**
     * @dev     Event fired for every newly registered function signature on Resolver.
     * @param   keccakSignature - registered keccak hashed function signature
     * @param   destination - address of the contract that has the function
    */
    event SignatureRegistered(
        bytes32 indexed keccakSignature,
        address indexed destination
    );

    /**
     * @dev     Event fired for every updated (e.g. arguments changed after upgrade) function signature
     *  on Resolver.
     * @param   keccakSignature - updated keccak hashed function signature
     * @param   destination - address of the contract that has the function
    */
    event SignatureUpdated(
        bytes32 indexed keccakSignature,
        address indexed destination
    );

    /**
     * @dev     Event fired for every updated (e.g. arguments changed after upgrade) function signature
     *  on Resolver.
     * @param   keccakSignature - removed keccak hashed function signature
    */
    event SignatureRemoved(
        bytes32 indexed keccakSignature
    );

    /**
     * @dev Constructor setting {RoleManager} contract to storage
     * @param roleManager address of {RoleManager} contract
     */
    constructor(address roleManager) {
        setRoleManager(roleManager);
    }

    /**
     * @dev Function to register mapping of multiple signatures to
     * corresponding smart contract addresses.
     * @param keccakSignatures array of signatures to be registered
     * @param destinations array of contract addresses that signatures will point to
     */
    function bulkRegister(
        bytes32[] memory keccakSignatures,
        address[] memory destinations
    ) public onlyRole(GOVERNOR_ROLE_NAME) {
        require(
            keccakSignatures.length == destinations.length,
            "keccak signatures should have same length as destinations"
        );

        for (uint256 i = 0; i < keccakSignatures.length; i++) {
            _register(keccakSignatures[i], destinations[i]);
        }
    }

    /**
     * @dev Function to register single `keccakSignature` to address mapping
     * @param keccakSignature signature to be registered
     * @param destination contract address that signature will point to
     * See {_register}
     */
    function register(bytes32 keccakSignature, address destination) public onlyRole(GOVERNOR_ROLE_NAME) {
        _register(keccakSignature, destination);
    }

    /**
    * @dev Function to update existing signatures in bulk during a SC upgrade
    * @param keccakSignatures signatures to be updated
    * @param destinations contract addresses that signatures will point to
    */
    function bulkUpdate(
        bytes32[] memory keccakSignatures,
        address[] memory destinations
    ) public onlyRole(GOVERNOR_ROLE_NAME) {
        require(
            keccakSignatures.length == destinations.length,
            "keccak signatures should have same length as destinations"
        );

        for (uint256 i = 0; i < keccakSignatures.length; i++) {
            _updateSignature(keccakSignatures[i], destinations[i]);
        }
    }

    /**
     * @dev Function to update existing `keccakSignature` to address mapping, used during SC upgrade
     * @param keccakSignature signature to be updated
     * @param destination contract address that signature will point to
     */
    function updateSignature(bytes32 keccakSignature, address destination) public onlyRole(GOVERNOR_ROLE_NAME) {
        _updateSignature(keccakSignature, destination);
    }

    /**
     * @dev Function to remove single `keccakSignature`.
     * @param keccakSignature signature to be removed
     */
    function removeSignature(bytes32 keccakSignature) public onlyRole(GOVERNOR_ROLE_NAME) {
        bytes4 sig = bytes4(keccakSignature);
        if (pointers[sig] != address(0)) {
            pointers[sig] = address(0);

            emit SignatureRemoved(keccakSignature);
        }
    }

    /**
     * @dev View to check address of contract for given first 4 bytes of keccak `signature`.
     */
    function lookup(bytes4 signature) public view returns(address) {
        return pointers[signature];
    }

    /**
     * @dev Converts string signature to first 4 bytes of keccak `signature`.
     */
    function stringToSig(string memory signature) public pure returns(bytes4) {
        return bytes4(keccak256(abi.encodePacked(signature)));
    }

    /**
     * @dev Function to register single `keccakSignature` to address mapping
     * and emit a `SignatureRegistered` event that can be found in the transaction events.
     */
    function _register(bytes32 keccakSignature, address destination) internal {
        assertSignatureAndDestination(keccakSignature, destination);

        bytes4 sig = bytes4(keccakSignature);
        require(pointers[sig] == address(0), "Signature conflict");

        pointers[sig] = destination;

        emit SignatureRegistered(
            keccakSignature,
            destination
        );
    }

    function _updateSignature(bytes32 keccakSignature, address destination) internal {
        assertSignatureAndDestination(keccakSignature, destination);
        bytes4 sig = bytes4(keccakSignature);
        require(pointers[sig] != address(0), "Only registered signatures can be updated");
        require(pointers[sig] != destination, "New destination address has to be different than registered address");

        pointers[sig] = destination;

        emit SignatureUpdated(
            keccakSignature,
            destination
        );
    }

    function assertSignatureAndDestination(bytes32 keccakSignature, address destination) internal view {
        // IMPORTANT: This contract existence check will not protect from a contract
        // that is selfdestructable. When adding new contracts that use {Resolver}, always be aware of it!
        assembly {
            let size := extcodesize(destination)
            if iszero(size) { revert(0, 0) }
        }

        require(
            keccakSignature != 0x0,
            "Empty (0x0) signature can not be registered."
        );
        require(
            keccakSignature != SET_RESOLVER_SIG,
            "Function setResolver(address) can NOT be registered for implementation contracts! It is a Router native function."
        );
    }
}

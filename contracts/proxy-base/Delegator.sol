// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;


/**
 * @title Delegator
 * @dev Contract contains extracted common logic for call delegation.
 * Contracts that are delegating calls are extending Delegator contract
 */
contract Delegator {

    /**
     * @dev Delegates call to specified contract. If delegatecall fails, transaction is reverted
     * Additional check is done to verify that contract to call exists
     * @param calleeContract address of contract to delegate call to
     * @param parameters function signature and parameters encoded to bytes
     * @param errorMsg error message to revert in case of failed delegatecall execution
     * @return result of delegatecall as bytes array. Those bytes can be used in contract that is delegating call
     */
    function delegate(
        address calleeContract,
        bytes memory parameters,
        string memory errorMsg
    ) internal returns (bytes memory) {
        assembly {
            let size := extcodesize(calleeContract)
            if iszero(size) { revert(0, 0) }
        }

        (
            bool success,
            bytes memory result
        ) = calleeContract.delegatecall(parameters);

        require(success, errorMsg);
        return result;
    }
}

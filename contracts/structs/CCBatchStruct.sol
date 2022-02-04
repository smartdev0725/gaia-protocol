// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;


interface CCBatchStruct {
    // TODO: which fields do we need here ??
    struct CCBatch {
        string serialNumber;
        uint256 projectId;
        string vintage;
        string creditType;
        uint256 quantity;
        address initialRgtOwner;
        bool created;
    }
}

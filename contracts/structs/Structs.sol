// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;


interface Structs {
    struct CCBatch {
        string serialNumber;
        uint256 projectId;
        string vintage;
        string creditType;
        uint256 quantity;
        address initialRgtOwner;
        bool created;
    }

    struct CCProject {
        string name;
        string projectType;
        string certifications;
        bool created;
    }
}

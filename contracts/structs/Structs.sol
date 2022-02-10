// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;


interface Structs {
    struct CCBatch {
        string serialNumber;
        uint256 projectId;
        string vintageEnd;
        string creditType;
        uint256 quantity;
        string certificationsOrObjectives;
        address initialRgtOwner;
        bool created;
    }

    struct CCProject {
        string name;
        string projectType;
        bool created;
    }
}

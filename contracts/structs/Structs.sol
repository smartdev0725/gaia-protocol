// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;


interface Structs {
    struct CCBatch {
        string serialNumber;
        uint256 projectId;
        string vintageStart;
        string vintageEnd;
        string creditType;
        uint256 quantity;
        string certificationsOrObjectives;
        address tokenAddress;
        address initialOwner;
        bool created;
    }

    struct CCProject {
        string projectName;
        string projectType;
        bool created;
    }
}

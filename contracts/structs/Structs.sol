// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;


interface Structs {
    struct CCBatch {
        string serialNumber;
        uint256 projectId;
        uint256 vintageStart;
        uint256 vintageEnd;
        string creditType;
        uint256 quantity;
        string certificationsOrObjectives;
        address tokenAddress;
        address initialOwner;
        bool created;
    }

    struct CCProject {
        string projectName;
        string projectCountry;
        string projectType;
        string projectMethodology;
        bool created;
    }
}

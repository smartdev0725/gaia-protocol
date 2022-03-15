// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;


contract StructsTestMock {
    struct GenerateBatchParams {
        string serialNumber;
        uint256 projectId;
        string vintage;
        string creditType;
        uint256 quantity;
        string certifications;
        address tokenAddress;
        address initialOwner;
    }

    struct AddProjectParams {
        uint256 projectId;
        string projectName;
        string projectType; // what else needed here?
        string methodology;
        string country;
    }

    struct CCProject {
        string projectName;
        string projectType;
        string methodology;
        string country;
        bool created;
    }

    struct CCBatch {
        string serialNumber;
        uint256 projectId;
        string vintage;
        string creditType;
        uint256 quantity;
        string certifications;
        address initialOwner;
        address tokenAddress;
        bool created;
    }

    mapping(address => mapping(string => CCBatch)) public batches;
    mapping(uint256 => CCProject) public projects;

    function generateBatch(GenerateBatchParams memory params) external returns (CCBatch memory) {
        batches[params.tokenAddress][params.serialNumber].serialNumber = params.serialNumber;
        batches[params.tokenAddress][params.serialNumber].projectId = params.projectId;
        batches[params.tokenAddress][params.serialNumber].vintage = params.vintage;
        batches[params.tokenAddress][params.serialNumber].creditType = params.creditType;
        batches[params.tokenAddress][params.serialNumber].quantity = params.quantity;
        batches[params.tokenAddress][params.serialNumber].certifications = params.certifications;
        batches[params.tokenAddress][params.serialNumber].tokenAddress = params.tokenAddress;
        batches[params.tokenAddress][params.serialNumber].initialOwner = params.initialOwner;
        batches[params.tokenAddress][params.serialNumber].created = true;

        return batches[params.tokenAddress][params.serialNumber];
    }

    function generateBatches(GenerateBatchParams[] memory params) external returns (CCBatch[] memory result) {
        result = new CCBatch[](params.length);

        for (uint256 i = 0; i < params.length; i++) {
            batches[params[i].tokenAddress][params[i].serialNumber].serialNumber = params[i].serialNumber;
            batches[params[i].tokenAddress][params[i].serialNumber].projectId = params[i].projectId;
            batches[params[i].tokenAddress][params[i].serialNumber].vintage = params[i].vintage;
            batches[params[i].tokenAddress][params[i].serialNumber].creditType = params[i].creditType;
            batches[params[i].tokenAddress][params[i].serialNumber].quantity = params[i].quantity;
            batches[params[i].tokenAddress][params[i].serialNumber].certifications = params[i].certifications;
            batches[params[i].tokenAddress][params[i].serialNumber].tokenAddress = params[i].tokenAddress;
            batches[params[i].tokenAddress][params[i].serialNumber].initialOwner = params[i].initialOwner;
            batches[params[i].tokenAddress][params[i].serialNumber].created = true;

            result[i] = batches[params[i].tokenAddress][params[i].serialNumber];
        }
    }

    function addProject(AddProjectParams memory params) external returns (CCProject memory) {
        projects[params.projectId].projectName = params.projectName;
        projects[params.projectId].projectType = params.projectType;
        projects[params.projectId].methodology = params.methodology;
        projects[params.projectId].country = params.country;
        projects[params.projectId].created = true;

        return projects[params.projectId];
    }

    function addProjects(AddProjectParams[] memory params) external returns (CCProject[] memory result) {
        result = new CCProject[](params.length);
        for (uint256 i = 0; i < params.length; i++) {
            projects[params[i].projectId].projectName = params[i].projectName;
            projects[params[i].projectId].projectType = params[i].projectType;
            projects[params[i].projectId].methodology = params[i].methodology;
            projects[params[i].projectId].country = params[i].country;
            projects[params[i].projectId].created = true;

            result[i] = projects[params[i].projectId];
        }
    }

    function getBatchAsSepVars(address token, string calldata serial) external view returns (
        string memory serialNumber,
        uint256 projectId,
        string memory vintage,
        string memory creditType,
        uint256 quantity,
        string memory certifications,
        address initialOwner,
        address tokenAddress,
        bool created
    ) {
        serialNumber = batches[token][serial].serialNumber;
        projectId = batches[token][serial].projectId;
        vintage = batches[token][serial].vintage;
        creditType = batches[token][serial].creditType;
        quantity = batches[token][serial].quantity;
        certifications = batches[token][serial].certifications;
        initialOwner = batches[token][serial].initialOwner;
        tokenAddress = batches[token][serial].tokenAddress;
        created = batches[token][serial].created;
    }

    function getProjectAsSepVars(uint256 id) external view returns (
        string memory projectName,
        string memory projectType,
        string memory methodology,
        string memory country,
        bool created
    ) {
        projectName = projects[id].projectName;
        projectType = projects[id].projectType;
        methodology = projects[id].methodology;
        country = projects[id].country;
        created = projects[id].created;
    }
}

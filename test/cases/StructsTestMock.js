const StructsTestMock = artifacts.require('./StructsTestMock.sol');


contract('StructsTestsMock Test', ([
  address1,
  address2,
  address3,
  tokenAddress,
]) => {
  const mockBatches = [
    {
      serialNumber: '1234567-D81FA-3772',
      projectId: '1111',
      vintage: '01-12-2019',
      creditType: 'VCU',
      quantity: '100000',
      certifications: '01: No Poverty; 02: Zero Hunger; 03: Good Health and Well-being;',
      tokenAddress,
      initialOwner: address1,
    },
    {
      serialNumber: '816235123-D81FA-2311',
      projectId: '2222',
      vintage: '01-12-2020',
      creditType: 'VCU',
      quantity: '153000000000000000000',
      certifications: '01: No Poverty;',
      tokenAddress,
      initialOwner: address2,
    },
    {
      serialNumber: '6128934453-D81FA-1111',
      projectId: '3333',
      vintage: '01-12-2021',
      creditType: 'VCU',
      quantity: '322000000000000000000000',
      certifications: '02: Zero Hunger; 03: Good Health and Well-being;',
      tokenAddress,
      initialOwner: address3,
    },
  ];

  const mockProjects = [
    {
      projectId: '1111',
      projectName: 'Name1',
      projectType: 'Forestry',
      methodology: 'ZD3888',
      country: 'Zimbabwe',
    },
    {
      projectId: '2222',
      projectName: 'Name2',
      projectType: 'Energy',
      methodology: 'CF9000',
      country: 'Brazil',
    },
    {
      projectId: '3333',
      projectName: 'Name3',
      projectType: 'Agriculture',
      methodology: 'APA123',
      country: 'Kenya',
    },
  ];

  before(async function () {
    this.structsContract = await StructsTestMock.new();
  });

  it('#generateBatch()', async function () {
    await this.structsContract.generateBatch(mockBatches[0]);
    const singleBatchFromSC = await this.structsContract.batches(
      mockBatches[0].tokenAddress,
      mockBatches[0].serialNumber
    );

    assert.deepStrictEqual(mockBatches[0].serialNumber, singleBatchFromSC.serialNumber);
    assert.deepStrictEqual(mockBatches[0].projectId, singleBatchFromSC.projectId.toString());
    assert.deepStrictEqual(mockBatches[0].vintage, singleBatchFromSC.vintage);
    assert.deepStrictEqual(mockBatches[0].creditType, singleBatchFromSC.creditType);
    assert.deepStrictEqual(mockBatches[0].quantity, singleBatchFromSC.quantity.toString());
    assert.deepStrictEqual(mockBatches[0].certifications, singleBatchFromSC.certifications);
    assert.deepStrictEqual(mockBatches[0].tokenAddress, singleBatchFromSC.tokenAddress);
    assert.deepStrictEqual(mockBatches[0].initialOwner, singleBatchFromSC.initialOwner);
    assert.ok(singleBatchFromSC.created);
  });

  it('#generateBatches()', async function () {
    await this.structsContract.generateBatches(mockBatches);

    await mockBatches.reduce(
      async (acc, batchIn) => {
        const newAcc = await acc;
        const batchOut = await this.structsContract.batches(
          batchIn.tokenAddress,
          batchIn.serialNumber
        );

        assert.deepStrictEqual(batchIn.serialNumber, batchOut.serialNumber);
        assert.deepStrictEqual(batchIn.projectId, batchOut.projectId.toString());
        assert.deepStrictEqual(batchIn.vintage, batchOut.vintage);
        assert.deepStrictEqual(batchIn.creditType, batchOut.creditType);
        assert.deepStrictEqual(batchIn.quantity, batchOut.quantity.toString());
        assert.deepStrictEqual(batchIn.certifications, batchOut.certifications);
        assert.deepStrictEqual(batchIn.tokenAddress, batchOut.tokenAddress);
        assert.deepStrictEqual(batchIn.initialOwner, batchOut.initialOwner);
        assert.ok(batchOut.created);

        return newAcc;
      }, Promise.resolve()
    );
  });

  it('#addProject()', async function () {
    await this.structsContract.addProject(mockProjects[0]);

    const projectOut = await this.structsContract.projects(mockProjects[0].projectId);

    assert.deepStrictEqual(mockProjects[0].projectName, projectOut.projectName);
    assert.deepStrictEqual(mockProjects[0].projectType, projectOut.projectType);
    assert.deepStrictEqual(mockProjects[0].methodology, projectOut.methodology);
    assert.deepStrictEqual(mockProjects[0].country, projectOut.country);
    assert.ok(projectOut.created);
  });

  it('#addProjects()', async function () {
    await this.structsContract.addProjects(mockProjects);

    await mockProjects.reduce(
      async (acc, projectIn) => {
        const newAcc = await acc;
        const projectOut = await this.structsContract.projects(projectIn.projectId);

        assert.deepStrictEqual(projectIn.projectName, projectOut.projectName);
        assert.deepStrictEqual(projectIn.projectType, projectOut.projectType);
        assert.deepStrictEqual(projectIn.methodology, projectOut.methodology);
        assert.deepStrictEqual(projectIn.country, projectOut.country);
        assert.ok(projectOut.created);

        return newAcc;
      }, Promise.resolve()
    );
  });

  it('#getBatchAsSepVars()', async function () {
    const batchDataOut = await this.structsContract.getBatchAsSepVars(
      mockBatches[0].tokenAddress,
      mockBatches[0].serialNumber
    );

    assert.deepStrictEqual(batchDataOut[0], mockBatches[0].serialNumber);
    assert.deepStrictEqual(batchDataOut[1].toString(), mockBatches[0].projectId.toString());
    assert.deepStrictEqual(batchDataOut[2], mockBatches[0].vintage);
    assert.deepStrictEqual(batchDataOut[3], mockBatches[0].creditType);
    assert.deepStrictEqual(batchDataOut[4].toString(), mockBatches[0].quantity.toString());
    assert.deepStrictEqual(batchDataOut[5], mockBatches[0].certifications);
    assert.deepStrictEqual(batchDataOut[6], mockBatches[0].initialOwner);
    assert.deepStrictEqual(batchDataOut[7], mockBatches[0].tokenAddress);
    assert.ok(batchDataOut[8]);
  });

  it('#getProjectAsSepVars()', async function () {
    const projectDataOut = await this.structsContract.getProjectAsSepVars(mockProjects[0].projectId);

    assert.deepStrictEqual(mockProjects[0].projectName, projectDataOut[0]);
    assert.deepStrictEqual(mockProjects[0].projectType, projectDataOut[1]);
    assert.deepStrictEqual(mockProjects[0].methodology, projectDataOut[2]);
    assert.deepStrictEqual(mockProjects[0].country, projectDataOut[3]);
    assert.ok(projectDataOut[4]);
  });
});

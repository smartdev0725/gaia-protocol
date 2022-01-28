import { BigNumber } from '@nomisma/nomisma-smart-contract-helpers';


export const getDefBatch = (owner, units = new BigNumber(10000)) => ({
  serialNumber: '1234567',
  projectId: new BigNumber(777),
  vintage: 'vintage',
  creditType: 'creditType',
  units,
  batchOwner: owner,
});

import fs from 'fs';
import { strip0x } from '@nomisma/nomisma-smart-contract-helpers';

const DEPLOYMENT_SIZE_LIMIT = (2 ** 14) + (2 ** 13);

// eslint-disable-next-line no-useless-escape
const baseRegExStr = '^[I]\w*|Interface|Abstract|Proxy';

const getAllContractNames = ({
  dir,
  contractList = [],
}) => {
  const allContracts = fs.readdirSync(dir);

  // eslint-disable-next-line no-param-reassign
  if (dir[dir.length - 1] !== '/') dir = dir.concat('/');

  allContracts.forEach(
    cur => {
      if (fs.statSync(`${dir}/${cur}`).isDirectory()) {
        // eslint-disable-next-line no-param-reassign
        contractList = getAllContractNames({
          dir: `${dir + cur}/`,
          contractList,
        });
      } else {
        const ext = cur.split('.').pop().toLowerCase();
        if (ext === 'sol') {
          contractList.push(cur);
        }
      }
    }
  );

  return contractList;
};

const getCompiledContracts = (contractsPath, exclusions) => {
  const regexString = exclusions.reduce(
    (acc, cur) => acc.concat('|', cur),
    baseRegExStr
  );
  const regEx = new RegExp(regexString);

  const allContractNames = getAllContractNames({ dir: contractsPath });
  const contractNamesForTest = allContractNames.filter(
    cur => !regEx.test(cur)
  );

  return contractNamesForTest.map(
    cur => artifacts.require(cur)
  );
};

export const runSizeCheck = (contractsPath, exclusions) => {
  const contracts = getCompiledContracts(contractsPath, exclusions);

  contracts.forEach(contract => {
    it(`Size of ${contract.contractName} contract is less than 24 kb`, async () => {
      const contractSize = Buffer.from(strip0x(contract.deployedBytecode), 'hex').length;
      assert.isAtMost(
        contractSize,
        DEPLOYMENT_SIZE_LIMIT,
        `Contract ${contract.contractName} is too large, size = ${contractSize} bytes`
      );
    });
  });
};

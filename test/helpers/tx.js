import { BigNumber } from '@nomisma/nomisma-smart-contract-helpers';


export const getTxCostInETH = async (txResult) => {
  const tx = await web3.eth.getTransaction(txResult.tx);
  return new BigNumber(tx.gasPrice)
    .mul(
      new BigNumber(txResult.receipt.gasUsed)
    );
};

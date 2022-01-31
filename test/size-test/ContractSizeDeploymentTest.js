import path from 'path';
import { runSizeCheck } from './helpers';

const contractsPath = path.resolve(__dirname, '../../contracts');
const exclusions = [
  'ERC20Mock',
];


contract('Contract Size Deployment Test', () => {
  runSizeCheck(contractsPath, exclusions);
});

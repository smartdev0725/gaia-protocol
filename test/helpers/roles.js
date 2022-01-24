import {
  asciiToHex,
  strip0x,
  toSizeHexPadRight,
  add0x,
} from '@nomisma/nomisma-smart-contract-helpers';


export const getRoleBytes32 = (roleName) => {
  const hexName = strip0x(
    asciiToHex(roleName)
  );
  const bytesName = toSizeHexPadRight(hexName, 32);
  return add0x(bytesName);
};

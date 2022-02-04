import {
  asciiToHex,
  strip0x,
  toSizeHexPadRight,
  add0x,
} from '@nomisma/nomisma-smart-contract-helpers';


const rolesMap = {
  GOVERNOR_ROLE: 'GOVERNOR_ROLE',
  MINTER_ROLE: 'MINTER_ROLE',
  CERTIFIER_ROLE: 'CERTIFIER_ROLE',
  BURNER_ROLE: 'BURNER_ROLE',
};

export const getRoleBytes32 = (roleName) => {
  const hexName = strip0x(
    asciiToHex(roleName)
  );
  const bytesName = toSizeHexPadRight(hexName, 32);
  return add0x(bytesName);
};

export const roleNames = new Proxy({}, {
  get (_, propName) {
    const roleName = !!rolesMap[propName] ? rolesMap[propName] : '';
    return getRoleBytes32(roleName);
  },
});

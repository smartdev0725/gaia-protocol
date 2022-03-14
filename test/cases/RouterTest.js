/* eslint-disable import/no-extraneous-dependencies */
import {
  getChaiBN,
  BigNumber,
} from '@nomisma/nomisma-smart-contract-helpers';
import { deployImplementationMock } from '../helpers/implementationMock';

require('chai')
  .use(require('chai-as-promised'))
  .use(getChaiBN())
  .should();

const RoleManager = artifacts.require('./RoleManager.sol');

contract('Router tests', ([ governor, ...accounts ]) => {
  before(async function () {
    const confirmationsRequired = 1;
    this.roleManager = await RoleManager.new([ governor ], confirmationsRequired);
  });

  it('should construct without initialization needed', async function () {
    const initSignature = '';
    const { proxy, implementation } = await deployImplementationMock(
      initSignature,
      '0x0',
      this.roleManager.address,
      governor,
    );

    const scProxyConstant = await proxy.STRING_CONSTANT();
    const scImplementationConstant = await implementation.STRING_CONSTANT();
    const scStringVar = await proxy.stringVar();

    scProxyConstant.should.equals('TEST_VALUE');
    scProxyConstant.should.equals(scImplementationConstant);
    scStringVar.should.equals('');
  });

  it('should initialize using init1() signature', async function () {
    const initSignature = 'init1()';

    const { proxy, implementation } = await deployImplementationMock(
      initSignature,
      '0x0',
      this.roleManager.address,
      governor,
    );

    const scConstantValue = await implementation.STRING_CONSTANT();
    scConstantValue.should.not.equals('');

    const scInitString = await proxy.stringVar();
    scInitString.should.equals(scConstantValue);
    (await implementation.stringVar()).should.not.equals(scConstantValue);

    await implementation.init1();
    scInitString.should.equals(await implementation.stringVar());
  });

  it('should initialize using init2(address) signature', async function () {
    const initSignature = 'init2(address)';

    const initAddressArg = accounts[0];
    const encodedArguments = web3.eth.abi.encodeParameters(
      [ 'address' ],
      [ initAddressArg ]
    );

    const { proxy, implementation } = await deployImplementationMock(
      initSignature,
      encodedArguments,
      this.roleManager.address,
      governor,
    );

    const scInitAddress = await proxy.addressVar1();
    scInitAddress.should.equals(initAddressArg);
    (await implementation.addressVar1()).should.not.equals(initAddressArg);

    await implementation.init2(initAddressArg);
    scInitAddress.should.equals(await implementation.addressVar1());
  });

  it('should initialize using init3(address,uint256[]) signature', async function () {
    const initSignature = 'init3(address,uint256[])';

    const initAddressArg = accounts[0];
    const initUintArrayArg = [
      new BigNumber('23'),
      new BigNumber('7438765743955245'),
      new BigNumber('734'),
    ];
    const encodedArguments = web3.eth.abi.encodeParameters(
      [ 'address', 'uint256[]' ],
      [ initAddressArg, initUintArrayArg ]
    );

    const { proxy, implementation } = await deployImplementationMock(
      initSignature,
      encodedArguments,
      this.roleManager.address,
      governor,
    );

    const scInitAddress = await proxy.addressVar1();
    scInitAddress.should.equals(initAddressArg);

    await implementation.init3(initAddressArg, initUintArrayArg);
    for (const [ index, uintArgument ] of initUintArrayArg.entries()) {
      const scInitUint = (await proxy.uintArrayVar1(index)).toString();
      scInitUint.should.deep.equals(uintArgument.toString());

      scInitUint.should.deep.equals((await implementation.uintArrayVar1(index)).toString());
    }

    scInitAddress.should.equals(await implementation.addressVar1());
  });

  it('should initialize using init4(uint256[],address) signature: swapping types', async function () {
    const initSignature = 'init4(uint256[],address)';

    const initAddressArg = accounts[0];
    const initUintArrayArg = [
      new BigNumber('23'),
      new BigNumber('7438765743955245'),
      new BigNumber('734'),
    ];
    const encodedArguments = web3.eth.abi.encodeParameters(
      [ 'uint256[]', 'address' ],
      [ initUintArrayArg, initAddressArg ]
    );

    const { proxy, implementation } = await deployImplementationMock(
      initSignature,
      encodedArguments,
      this.roleManager.address,
      governor,
    );

    const scInitAddress = await proxy.addressVar1();
    scInitAddress.should.equals(initAddressArg);

    await implementation.init4(initUintArrayArg, initAddressArg);
    for (const [ index, uintArgument ] of initUintArrayArg.entries()) {
      const scInitUint = (await proxy.uintArrayVar1(index)).toString();
      scInitUint.should.deep.equals(uintArgument.toString());

      scInitUint.should.deep.equals((await implementation.uintArrayVar1(index)).toString());
    }

    scInitAddress.should.equals(await implementation.addressVar1());
  });

  it(
    // eslint-disable-next-line max-len
    'should initialize using init5(uint256[],uint16,uint256[],address,uint256[],uint16,uint24,(address,uint256[]),address) signature: complex encoding',
    async function () {
      // eslint-disable-next-line max-len
      const initSignature = 'init5(uint256[],uint16,uint256[],address,uint256[],uint16,uint24,(address,uint256[]),address)';


      const initUintArray1Arg = [
        new BigNumber('23'),
        new BigNumber('7438765743955245'),
        new BigNumber('734'),
      ];
      const initUint1Arg = '3';

      const initUintArray2Arg = [
        new BigNumber('547634765382851325455325'),
        new BigNumber('1'),
        new BigNumber('743765843254358957436584325874353425'),
      ];
      const initAddress1Arg = accounts[0];

      const initUintArray3Arg = [
        new BigNumber('34'),
        new BigNumber('1985'),
        new BigNumber('3456546524245432524366'),
      ];
      const initUint2Arg = '4';
      const initUint3Arg = '24';

      const initStructArg = {
        structAddress: accounts[1],
        structUintArray: [
          '34',
          '1985',
          '3456546524245432524366',
        ],
      };

      const initAddress2Arg = accounts[2];

      const encodedArguments = web3.eth.abi.encodeParameters(
        [
          'uint256[]',
          'uint16',
          'uint256[]',
          'address',
          'uint256[]',
          'uint16',
          'uint24',
          {
            'MockStruct': {
              'structAddress': 'address',
              'structUintArray': 'uint256[]',
            },
          },
          'address',
        ],
        [
          initUintArray1Arg,
          initUint1Arg,
          initUintArray2Arg,
          initAddress1Arg,
          initUintArray3Arg,
          initUint2Arg,
          initUint3Arg,
          initStructArg,
          initAddress2Arg,
        ]
      );

      const { proxy, implementation } = await deployImplementationMock(
        initSignature,
        encodedArguments,
        this.roleManager.address,
        governor,
      );

      await implementation.init5(
        initUintArray1Arg,
        initUint1Arg,
        initUintArray2Arg,
        initAddress1Arg,
        initUintArray3Arg,
        initUint2Arg,
        initUint3Arg,
        initStructArg,
        initAddress2Arg,
      );

      const scInitAddress1 = await proxy.addressVar1();
      scInitAddress1.should.equals(initAddress1Arg);
      scInitAddress1.should.equals(await implementation.addressVar1());

      const scInitAddress2 = await proxy.addressVar2();
      scInitAddress2.should.equals(initAddress2Arg);
      scInitAddress2.should.equals(await implementation.addressVar2());

      for (const [ index, uintArgument ] of initUintArray1Arg.entries()) {
        const scInitUint = (await proxy.uintArrayVar1(index)).toString();
        scInitUint.should.deep.equals(uintArgument.toString());

        scInitUint.should.deep.equals((await implementation.uintArrayVar1(index)).toString());
      }

      for (const [ index, uintArgument ] of initUintArray2Arg.entries()) {
        const scInitUint = (await proxy.uintArrayVar2(index)).toString();
        scInitUint.should.deep.equals(uintArgument.toString());

        scInitUint.should.deep.equals((await implementation.uintArrayVar2(index)).toString());
      }

      for (const [ index, uintArgument ] of initUintArray3Arg.entries()) {
        const scInitUint = (await proxy.uintArrayVar3(index)).toString();
        scInitUint.should.deep.equals(uintArgument.toString());

        scInitUint.should.deep.equals((await implementation.uintArrayVar3(index)).toString());
      }

      const scInitUint1 = (await proxy.uintVar1()).toString();
      scInitUint1.should.equals(initUint1Arg);
      scInitUint1.should.equals((await implementation.uintVar1()).toString());

      const scInitUint2 = (await proxy.uintVar2()).toString();
      scInitUint2.should.equals(initUint2Arg);
      scInitUint2.should.equals((await implementation.uintVar2()).toString());

      const scInitUint3 = (await proxy.uintVar3()).toString();
      scInitUint3.should.equals(initUint3Arg);
      scInitUint3.should.equals((await implementation.uintVar3()).toString());

      const scInitStruct = await proxy.getStruct();
      scInitStruct.structAddress.should.equals(initStructArg.structAddress);
      scInitStruct.structUintArray.should.deep.equals(initStructArg.structUintArray);
      scInitStruct.should.deep.equals(await implementation.getStruct());
    }
  );
});

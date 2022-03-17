// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../../access/RoleAware.sol";
import "../../proxy-base/Resolvable.sol";
import "../../utils/OnlyRouterAccess.sol";

contract ImplementationMock is RoleAware, Resolvable, Initializable, OnlyRouterAccess {

  string public constant STRING_CONSTANT = "TEST_VALUE";

  struct MockStruct {
    address structAddress;
    uint256[] structUintArray;
  }

  address public addressVar1;
  address public addressVar2;
  uint256[] public uintArrayVar1;
  uint256[] public uintArrayVar2;
  uint256[] public uintArrayVar3;
  uint16 public uintVar1;
  uint16 public uintVar2;
  uint24 public uintVar3;
  MockStruct public structVar;
  string public stringVar;

  function init1() external initializer {
    stringVar = STRING_CONSTANT;
  }

  function init2(address address_) external initializer {
    addressVar1 = address_;
  }

  function init3(address address_, uint256[] memory uintArray_) external initializer {
    addressVar1 = address_;
    uintArrayVar1 = uintArray_;
  }

  function init4(uint256[] memory uintArray_, address address_) external initializer {
    addressVar1 = address_;
    uintArrayVar1 = uintArray_;
  }

  function init5(
    uint256[] memory uintArray1_,
    uint16 uint1_,
    uint256[] memory uintArray2_,
    address address1_,
    uint256[] memory uintArray3_,
    uint16 uint2_,
    uint24 uint3_,
    MockStruct memory struct_,
    address address2_
  ) external initializer {
    addressVar1 = address1_;
    addressVar2 = address2_;
    uintArrayVar1 = uintArray1_;
    uintArrayVar2 = uintArray2_;
    uintArrayVar3 = uintArray3_;
    uintVar1 = uint1_;
    uintVar2 = uint2_;
    uintVar3 = uint3_;
    structVar = struct_;
  }

  function getStruct() external view returns(MockStruct memory) {
    return structVar;
  }
}
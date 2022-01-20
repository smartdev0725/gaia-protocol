// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/access/AccessControl.sol";


// TODO: should this be separate like RoleManager and not inherited
// TODO: so we don't have to assign roles for each contract separately ??
contract AccessManager is AccessControl {
    bytes32 public constant MINTER_ROLE = "MINTER_ROLE";
    bytes32 public constant BURNER_ROLE = "BURNER_ROLE";
    bytes32 public constant OPERATOR_ROLE = "OPERATOR_ROLE";
    bytes32 public constant GOVERNOR_ROLE = "GOVERNOR_ROLE";
}

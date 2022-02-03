// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "./IRoleManager.sol";
import "./Roles.sol";


/**
 * @title RoleManager
 * Central contract in the system that keeps and manages account roles and access to the system.
 * Most crucial logic like setting address, changing {Resolver}'s signatures,
 * contract initizlizing logic, trade settlement are restricted to accounts that
 * have valid roles. See docs/SystemAccess.md for more details about roles
 */
contract RoleManager is IRoleManager {
    using Roles for Roles.Role;

    /**
     * @dev > Important: these have to match with the ones on RoleAware.sol
    */
    bytes32 public constant GOVERNOR_ROLE = "GOVERNOR_ROLE";
    bytes32 public constant MINTER_ROLE = "MINTER_ROLE";
    bytes32 public constant BURNER_ROLE = "BURNER_ROLE";

    /**
     * @notice Event fired upon adding a role for an address.
     * @param roleName - bytes32 representation of a role name
     * @param user - address of a user that is assigned a role above
    */
    event RoleAdded(
        bytes32 roleName,
        address user
    );

    /**
     * @notice Event fired upon removing a role for an address.
     * @param roleName - bytes32 representation of a role name
     * @param user - address of a user that for which the above role is removed
    */
    event RoleRemoved(
        bytes32 roleName,
        address user
    );

    /**
     * @notice Event fired upon submission/confirmation of a governor addition/removal request.
     * @dev See {submitGovernorRequest}.
     * @param sender - person who called {submitGovernorRequest} and sent the request
     * @param govAddress - address of the governor candidate to appoint/remove the role for
     * @param operationType - an {OperationType} enum value representing if it's an addition or removal call
    */
    event RequestConfirmed(address sender, address govAddress, OperationType operationType);

    /**
     * @notice Event fired upon revoking a request for addition/removal of a governor.
     * @dev See {revokeGovernorRequestConfirmation}.
     * @param sender - person who called {revokeGovernorRequestConfirmation} and sent the request
     * @param govAddress - address of a governor candidate for whom request is being revoked
    */
    event ConfirmationRevoked(address sender, address govAddress);

    /**
     * @notice Event fired upon successful addition of a new governor.
     * @param govAddress - address of a new governor added
    */
    event GovernorAdded(address govAddress);

    /**
     * @notice Event fired upon successful removal of a governor.
     * @param govAddress - address of a new governor removed
    */
    event GovernorRemoved(address govAddress);

    /**
     * @notice Enumeration representing type of a request for governor management used by {submitGovernorRequest}.
    */
    enum OperationType {
        AddGovernor,
        RemoveGovernor
    }

    /**
     * @notice Struct holding data for governor requests. Used in {govRequests} mapping.
     * @dev Lets us know about previous requests saved in the system.
     * @param confirmationCount - number of confirmations (requests) for a particular governor already sumbitted
     * @param confirmations - array holding addresses for each governor who sent request for a particular new governor
    */
    struct GovernorRequest {
        uint confirmationCount;
        address[] confirmations;
    }

    /**
     * @dev Variable set upon construction representing how many request are required to assing a new governor
     *  for the system.
     * @dev New governor is assigned automatically when the number of submissions/requests reaches this value.
    */
    uint256 immutable private confirmationsRequired;

    /**
     * @dev All add-governor requests already sumbitted to the system.
     *  Maps governor candidate address to {GovernorRequest} struct holding data
     *  of all requests for a particular candidate.
    */
    mapping (address => GovernorRequest) public govRequests;

    /**
     * @dev Maps role name to {Roles} library to access all base role related functionality.
    */
    mapping (bytes32 => Roles.Role) private roles;

    /**
     * @dev     Modifier preventing unauthorized addresses from calling protected functions.
     * @param   roleName - bytes32 representation of a role name that has access to the protected function
    */
    modifier onlyRole(bytes32 roleName) {
        checkRole(msg.sender, roleName);
        _;
    }

    /**
     * @dev Constructor that assigns accounts with `governor` role
     * Governor role can be only added during contract construction and when {_confirmationsRequired}
     * number of governors {submitAddGovernorRequest}. Note that `governors.length >= _confirmationsRequired`
     * @param governors array of addresses to be added as governors
     * @param _confirmationsRequired number of confirmations required to add/remove governor
     */
    constructor (address[] memory governors, uint256 _confirmationsRequired) {
        require(
            _confirmationsRequired > 0,
            "_confirmationsRequired can NOT be 0! at RoleManager.constructor()"
        );
        require(
            governors.length >= _confirmationsRequired,
            "RoleManager: Not enough governors supplied for the amount of required confirmations"
        );
        confirmationsRequired = _confirmationsRequired;
        for (uint256 i = 0; i < governors.length; i++) {
            addGovernorRole(governors[i]);
        }
    }

    /**
     * @dev Function to assign a role to an address
     * @param addr address to add role to
     * @param roleName name of the role to add
     * @dev See {addRole}.
     */
    function addRoleForAddress(address addr, bytes32 roleName) external override onlyRole(GOVERNOR_ROLE) {
        require(addr != address(0), "Address is zero");
        addRole(addr, roleName);
    }

    /**
     * @dev Assigns multiple roles to addresses.
     * @param addresses array of user addresses for which roles should be added
     * @param rolesArr array of respective roles
     */
    function addRolesForAddresses(
        address[] calldata addresses,
        bytes32[] calldata rolesArr
    ) external override onlyRole(GOVERNOR_ROLE) {
        require(
            addresses.length == rolesArr.length,
            "RoleManager::addRolesForAddresses: addresses and rolesArr should be the same length"
        );
        require(
            addresses.length > 0,
            "RoleManager::addRolesForAddresses: no addresses provided"
        );
        for (uint256 i = 0; i < addresses.length; i++) {
            require(
                addresses[i] != address(0),
                "RoleManager::addRolesForAddresses: one of the addresses is zero"
            );
            addRole(addresses[i], rolesArr[i]);
        }
    }

    /**
     * @dev Removes a `roleName` for the provided `addr`.
     * @param addr address to remove role from
     * @param roleName name of the role to remove
     * See {removeRole}.
     */
    function removeRoleForAddress(address addr, bytes32 roleName) external override onlyRole(GOVERNOR_ROLE) {
        require(addr != address(0), "RoleManager::removeRoleForAddress: zero address passed");
        removeRole(addr, roleName);
    }

    /**
     * @dev Multisig implementation for adding new governor. In order to add new governor at least
     * `confirmationsRequired` amount of governors need to call this function for same `govAddress`.
     * For the first governor that calls this function with new `govAddress`, new `GovernorRequest` is created
     * and stored in RoleManager. Only after last governor executed this function, `governor` role is
     * added for `govAddress`.
     * @param govAddress account address for which `governor` role is requested to be added
     */
    function submitAddGovernorRequest(address govAddress) external override onlyRole(GOVERNOR_ROLE) {
        require(!hasRole(govAddress, GOVERNOR_ROLE), "Governor to add already has Governor role");
        submitGovernorRequest(govAddress, OperationType.AddGovernor);
    }

    /**
     * @dev Multisig implementation for removing governor. In order to remove governor at least
     * `confirmationsRequired` amount of governors need to call this function for same `govAddress`.
     * For the first governor that calls this function with new `govAddress`, new `GovernorRequest` is created
     * and stored in {RoleManager.govRequests}. Only after last governor executed this function, `governor` role is
     * removed for `govAddress`.
     * @param govAddress account address for which `governor` role is requested to be removed
     */
    function submitRemoveGovernorRequest(address govAddress) external override onlyRole(GOVERNOR_ROLE) {
        require(hasRole(govAddress, GOVERNOR_ROLE), "Governor to remove does not have Governor role");
        submitGovernorRequest(govAddress, OperationType.RemoveGovernor);
    }

    /**
     * @dev Function to provide ability for current governors to revoke previously granted confirmation
     * of adding or removing a new governor.
     * @param govAddress account address for which confirmation was granted before and needs to be removed
     */
    function revokeGovernorRequestConfirmation(address govAddress) external override onlyRole(GOVERNOR_ROLE){
        uint256 confirmationCount = govRequests[govAddress].confirmationCount;
        for (uint i = 0; i < confirmationCount; i++) {
            if (govRequests[govAddress].confirmations[i] == msg.sender) {
                govRequests[govAddress].confirmations[i] = govRequests[govAddress].confirmations[confirmationCount - 1];
                govRequests[govAddress].confirmationCount--;
                emit ConfirmationRevoked(msg.sender, govAddress);
                return;
            }
        }

        revert("Cannot revoke confirmation as Governor is not confirmed by this account");
    }

    /**
     * @dev Checks the existence of a `roleName` value for the given `addr`.
     * Function reverts if account does not have required role
     * @param addr address to check role for
     * @param roleName name of the role to be checked
     */
    function checkRole(address addr, bytes32 roleName) public view {
        require(roles[roleName].has(addr), "Account does not have required role");
    }

    /**
     * @dev See {Roles.has}.
     */
    function hasRole(address addr, bytes32 roleName) public view override returns (bool) {
        return roles[roleName].has(addr);
    }

    /**
     * @dev Adds a `roleName` for the provided `addr` and emits a `RoleAdded` event that
     * can be found in the transaction events.
     * See {Roles.add}.
     */
    function addRole(address addr, bytes32 roleName) internal {
        require(roleName != GOVERNOR_ROLE, "Cannot assign Governor role, please use submitAddGovernorRequest() instead");
        if (!hasRole(addr, roleName)) {
            roles[roleName].add(addr);
            emit RoleAdded(roleName, addr);
        }
    }

    /**
     * @dev Removes a role for the provided `addr` and emits a `RoleRemoved` event that
     * can be found in the transaction events.
     * See {Roles.remove}.
     */
    function removeRole(address addr, bytes32 roleName) internal {
        require(roleName != GOVERNOR_ROLE, "Cannot remove Governor role, please use submitRemoveGovernorRequest() instead");
        if (hasRole(addr, roleName)) {
            roles[roleName].remove(addr);
            emit RoleRemoved(roleName, addr);
        }
    }

    /**
     * @notice Internal function with base functionality for both adding and removing governors.
     * @dev Checks if this is a first request, in which case it would initialize new slot in {govRequests}
     *  adding request data or, in case of subsequent requests, would add new request to an existing mapping slot.
     *  Also fires an event and checks if the required number of requests reached, in which case it will
     *  add or remove new governor automatically.
     * @param govAddress - address of a governor candidate to add or remove
     * @param operationType - enum value signifying type of the operation (add or remove)
     */
    function submitGovernorRequest(address govAddress, OperationType operationType) internal
    {
        if (govRequests[govAddress].confirmationCount == 0) {
            GovernorRequest storage governorRequest = govRequests[govAddress];
            governorRequest.confirmations = new address[](confirmationsRequired);
            governorRequest.confirmations[0] = msg.sender;
            governorRequest.confirmationCount = 1;
        } else {
            require(isNotConfirmedBySender(govAddress), "Governor request is already confirmed by this account");
            govRequests[govAddress].confirmations[govRequests[govAddress].confirmationCount] = msg.sender;
            govRequests[govAddress].confirmationCount++;
        }

        emit RequestConfirmed(msg.sender, govAddress, operationType);
        if (isGovernorRequestConfirmed(govAddress)) {
            acceptGovernorRequest(govAddress, operationType);
        }
    }

    /**
     * @notice Function that adds/removes a governor.
     * @dev This function is launched automatically when the number of requests required is reached.
     * @param govAddress - address of a governor candidate to add or remove
     * @param operationType - enum value signifying type of the operation (add or remove)
     */
    function acceptGovernorRequest(address govAddress, OperationType operationType) internal {
        if (operationType == OperationType.AddGovernor) {
            addGovernorRole(govAddress);
            emit GovernorAdded(govAddress);
        } else {
            removeGovernorRole(govAddress);
            emit GovernorRemoved(govAddress);
        }

        delete govRequests[govAddress];
    }

    /**
     * @dev Adds a `GOVERNOR_ROLE_NAME` for the provided `addr` and emit a `RoleAdded` event that
     * can be found in the transaction events. Can only be run as a part of governor request/confirmation flow.
     * @param addr address to check governor role for
     * See {Roles.add}.
     */
    function addGovernorRole(address addr) internal {
        roles[GOVERNOR_ROLE].add(addr);
        emit RoleAdded(GOVERNOR_ROLE, addr);
    }

    /**
     * @dev Removes a `GOVERNOR_ROLE_NAME` for the provided `addr` and emit a `RoleRemoved` event that
     * can be found in the transaction events. Can only be run as a part of governor request/confirmation flow.
     * @param addr address to check governor role for
     * See {Roles.remove}.
     */
    function removeGovernorRole(address addr) internal {
        roles[GOVERNOR_ROLE].remove(addr);
        emit RoleRemoved(GOVERNOR_ROLE, addr);
    }

    /**
     * @dev Function to check if governor request for `govAddress` has enough confirmations to be executed
     * @param govAddress address identifier of governor requests
     * @return true if at least confirmationsRequired number of requests are confirmed for `govAddress`
     */
    function isGovernorRequestConfirmed(address govAddress) internal view returns (bool) {
        return govRequests[govAddress].confirmationCount >= confirmationsRequired;
    }

    /**
     * @dev Function to check if governor request has been already confirmed by this `msg.sender`
     * @param govAddress address identifier of governor requests
     * @return true if `govAddress` is not already confirmed by `msg.sender`
     */
    function isNotConfirmedBySender(address govAddress) internal view returns (bool) {
        uint256 confirmationCount = govRequests[govAddress].confirmationCount;
        for (uint i = 0; i < confirmationCount; i++) {
            if (govRequests[govAddress].confirmations[i] == msg.sender) {
                return false;
            }
        }

        return true;
    }
}

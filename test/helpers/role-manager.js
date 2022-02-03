const RoleManager = artifacts.require('./RoleManager.sol');

export const setupRoleManager = async (
  governors, admins, confirmationsRequired = 1
) => {
  const roleManager = await RoleManager.new(governors, confirmationsRequired);
  if (typeof admins !== 'undefined' && admins.length > 0) {
    await roleManager.appointAdmins(admins, { from: governors[0] });
  }

  return roleManager;
};

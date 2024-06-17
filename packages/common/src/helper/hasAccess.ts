import { Role } from 'src/constants';

export const hasAccess = (
  userRoles: Role[] = [],
  allowedRoles: Role[] = [],
  and = false,
): boolean => {
  const condition = (allowedRole: Role) => {
    return userRoles.some(userRole => userRole === allowedRole);
  };

  return and ? allowedRoles.every(condition) : allowedRoles.some(condition);
};

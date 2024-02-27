export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export const RoleOptions: Array<{ label: string; value: Role }> = [
  {
    value: Role.ADMIN,
    label: 'Admin',
  },
  {
    value: Role.USER,
    label: 'User',
  },
];

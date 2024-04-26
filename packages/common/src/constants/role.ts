export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
  CONTENT_ADMIN = 'CONTENT_ADMIN',
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
  {
    value: Role.CONTENT_ADMIN,
    label: 'Content editor',
  },
];

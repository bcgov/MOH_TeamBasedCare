export enum UserStatus {
  INVITED = 'INVITED',
  ACTIVE = 'ACTIVE',
  REVOKED = 'REVOKED',
}

export const UserStatusOptions: Array<{
  label: string;
  value: UserStatus;
  color: 'red' | 'yellow' | 'green' | 'blue';
}> = [
  {
    value: UserStatus.INVITED,
    label: 'Invited',
    color: 'yellow',
  },
  {
    value: UserStatus.ACTIVE,
    label: 'Active',
    color: 'green',
  },
  {
    value: UserStatus.REVOKED,
    label: 'Revoked',
    color: 'red',
  },
];

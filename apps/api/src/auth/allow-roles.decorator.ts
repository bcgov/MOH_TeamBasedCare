import { SetMetadata } from '@nestjs/common';
import { Role } from '@tbcm/common';

export const AllowRoles = ({ roles }: { roles: Role[] }) => SetMetadata('roles', roles);

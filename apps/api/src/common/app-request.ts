import { KeycloakUser } from '@tbcm/common';
import { Request } from 'express';

export interface IRequest extends Request {
  accessTokenJWT?: string;
  user: KeycloakUser;
}

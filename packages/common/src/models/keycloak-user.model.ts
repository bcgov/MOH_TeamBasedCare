export interface KeycloakUser {
  email_verified: boolean;

  name: string;

  client_roles?: string[];

  preferred_username: string;

  given_name: string;

  family_name?: string;

  email?: string;
}

export interface KeycloakUser {
  email_verified: boolean;

  name: string;

  sub: string;

  resource_access?: {
    TBCM?: {
      roles?: string[];
    };
  };

  preferred_username: string;

  given_name: string;

  family_name?: string;

  email?: string;
}

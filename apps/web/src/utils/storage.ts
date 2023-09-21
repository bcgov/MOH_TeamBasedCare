export enum StorageKeys {
  ACCESS_TOKEN = 'accessToken',
  ACCESS_TOKEN_EXPIRY = 'accessTokenExpiry',
  REFRESH_TOKEN = 'refreshToken',
  REFRESH_TOKEN_EXPIRY = 'refreshTokenExpiry',
  TOKENS_LAST_REFRESHED_AT = 'tokensLastRefreshedAt',
  USERNAME = 'username',
  DISPLAY_NAME = 'displayName',
  ROLES = 'roles',
}

export class AppStorage {
  static setItem(key: string, value: any) {
    if (!key || value === null || value === undefined || typeof window === 'undefined') return;

    localStorage.setItem(key, JSON.stringify(value));

    return true;
  }

  static getItem<T = any>(key: string) {
    if (!key || typeof window === 'undefined') return;

    const value = localStorage.getItem(key);

    if (!value) return;

    const parsedValue = JSON.parse(value) as T;
    return parsedValue;
  }

  static removeItem(key: string) {
    if (!key || typeof window === 'undefined') return;

    localStorage.removeItem(key);

    return true;
  }

  static clear() {
    if (typeof window === 'undefined') return;

    localStorage.clear();
  }

  static addStorageListener(listener: (event: StorageEvent) => void) {
    window.addEventListener('storage', listener);
  }

  static removeStorageListener(listener: (event: StorageEvent) => void) {
    window.removeEventListener('storage', listener);
  }
}

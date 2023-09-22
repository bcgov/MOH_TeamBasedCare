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

const APP_STORAGE_KEY = 'tbcm';
type AppStorageType = Record<string, any>;

export class AppStorage {
  private static getStorage() {
    if (typeof window === 'undefined') {
      // Failed to get storage
      return;
    }

    const value = localStorage.getItem(APP_STORAGE_KEY);

    if (!value) return {};

    const parsedValue = JSON.parse(value) as AppStorageType;

    return parsedValue;
  }

  private static updateStorage(value: AppStorageType) {
    if (typeof window === 'undefined') {
      // Failed to update storage
      return;
    }

    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(value));
  }

  static clear() {
    this.updateStorage({});
  }

  static setItem(key: string, value: any) {
    if (!key || value === null || value === undefined) return;

    const storage = this.getStorage();
    if (!storage) return; // failed to get the storage

    Object.assign(storage, { [key]: value });

    this.updateStorage(storage);
  }

  static getItem(key: string) {
    if (!key) return;

    const storage = this.getStorage();
    if (!storage) return; // failed to get the storage

    return storage[key];
  }

  static removeItem(key: string) {
    if (!key) return;

    const storage = this.getStorage();
    if (!storage) return; // failed to get the storage

    delete storage[key];
    this.updateStorage(storage);
  }

  static addStorageListener(listener: (event: StorageEvent) => void) {
    window.addEventListener('storage', listener);
  }

  static removeStorageListener(listener: (event: StorageEvent) => void) {
    window.removeEventListener('storage', listener);
  }
}

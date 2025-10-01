export enum StorageKeys {
  ACCESS_TOKEN = 'accessToken',
  ACCESS_TOKEN_EXPIRY = 'accessTokenExpiry',
  REFRESH_TOKEN = 'refreshToken',
  REFRESH_TOKEN_EXPIRY = 'refreshTokenExpiry',
  TOKENS_LAST_REFRESHED_AT = 'tokensLastRefreshedAt',
  EMAIL = 'email',
  ID = 'id',
}

const APP_STORAGE_KEY = 'tbcm';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AppStorageType = Record<string, any>;

export class AppStorage {
  private static getStorage() {
    if (typeof window === 'undefined') {
      // Failed to get storage
      console.log('Unable to fetch local storage: window is undefined');
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
      console.log('Unable to fetch local storage: window is undefined');
      return;
    }

    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(value));
  }

  static clear() {
    this.updateStorage({});
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static setItem(key: string, value: any) {
    console.log('Setting [' + key + '] in local storage to value:' + value);
    if (!key || value === null || value === undefined) return;

    const storage = this.getStorage();
    if (!storage) {
      console.log('Unable to fetch local storage: storage is nil');
      return; // failed to get the storage
    }

    Object.assign(storage, { [key]: value });

    this.updateStorage(storage);
  }

  static getItem(key: string) {
    console.log('Fetching value [' + key + '] from local storage');
    if (!key) return;

    const storage = this.getStorage();
    if (!storage) {
      console.log('Unable to fetch local storage: storage is nil');
      return; // failed to get the storage
    }
    console.log('Value found: ' + storage[key]);
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

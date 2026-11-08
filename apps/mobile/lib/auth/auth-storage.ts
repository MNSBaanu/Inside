import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'inside.accessToken';
const REFRESH_KEY = 'inside.refreshToken';

// Tokens live in the device's encrypted store; this cache keeps reads synchronous.
let accessToken: string | null = null;
let refreshToken: string | null = null;

export const authStorage = {
  async load() {
    [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_KEY),
      SecureStore.getItemAsync(REFRESH_KEY),
    ]);
  },
  getAccessToken: () => accessToken,
  getRefreshToken: () => refreshToken,
  async save(access: string, refresh?: string) {
    accessToken = access;
    await SecureStore.setItemAsync(ACCESS_KEY, access);
    if (refresh !== undefined) {
      refreshToken = refresh;
      await SecureStore.setItemAsync(REFRESH_KEY, refresh);
    }
  },
  async clear() {
    accessToken = null;
    refreshToken = null;
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
    ]);
  },
};

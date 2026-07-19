import AsyncStorage from '@react-native-async-storage/async-storage';

type KvStore = {
  getString: (key: string) => string | undefined | null;
  set: (key: string, value: string) => void;
  delete: (key: string) => void;
  getAllKeys?: () => string[];
};

let mmkv: KvStore | null = null;
let mmkvTried = false;

function tryInitMmkv(): KvStore | null {
  if (mmkvTried) return mmkv;
  mmkvTried = true;
  try {
    // Prefer MMKV when native module is available (dev/production builds)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { MMKV } = require('react-native-mmkv');
    const instance = new MMKV({ id: 'mintorbit' });
    mmkv = {
      getString: (key) => instance.getString(key) ?? null,
      set: (key, value) => instance.set(key, value),
      delete: (key) => instance.delete(key),
      getAllKeys: () => instance.getAllKeys(),
    };
  } catch {
    mmkv = null;
  }
  return mmkv;
}

/** Unified key-value adapter: MMKV when available, AsyncStorage otherwise. */
export const kv = {
  async get(key: string): Promise<string | null> {
    const fast = tryInitMmkv();
    if (fast) {
      const v = fast.getString(key);
      return v ?? null;
    }
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },

  async set(key: string, value: string): Promise<boolean> {
    const fast = tryInitMmkv();
    if (fast) {
      try {
        fast.set(key, value);
        // Mirror to AsyncStorage for backup safety / migration portability
        AsyncStorage.setItem(key, value).catch(() => undefined);
        return true;
      } catch {
        // fall through
      }
    }
    try {
      await AsyncStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },

  async remove(key: string): Promise<boolean> {
    const fast = tryInitMmkv();
    if (fast) {
      try {
        fast.delete(key);
      } catch {
        // ignore
      }
    }
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },

  async multiGet(keys: string[]): Promise<Record<string, string | null>> {
    const out: Record<string, string | null> = {};
    await Promise.all(
      keys.map(async (k) => {
        out[k] = await kv.get(k);
      }),
    );
    return out;
  },
};

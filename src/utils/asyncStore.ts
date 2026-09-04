/**
 * Thin wrapper around `@react-native-async-storage/async-storage`.
 *
 * Web uses `localStorage` for things like passage progress and notes; on
 * mobile we use AsyncStorage instead. SecureStore is reserved for secrets
 * (tokens, refresh tokens). This wrapper exposes the SecureStore-shaped
 * API (`getItemAsync`/`setItemAsync`/`deleteItemAsync`) so callers can
 * swap stores without rewriting call sites.
 *
 * All methods are safe to call; errors are logged and swallowed (we don't
 * want a storage failure to crash the reading experience).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

export async function getItemAsync(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch (e) {
    console.warn(`[asyncStore] getItem(${key}) failed:`, e);
    return null;
  }
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (e) {
    console.warn(`[asyncStore] setItem(${key}) failed:`, e);
  }
}

export async function deleteItemAsync(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.warn(`[asyncStore] removeItem(${key}) failed:`, e);
  }
}

/**
 * Read a JSON value from storage. Returns `fallback` if missing or invalid.
 */
export async function getJSONAsync<T>(key: string, fallback: T): Promise<T> {
  const raw = await getItemAsync(key);
  if (raw === null || raw === undefined) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Write a JSON value to storage. Errors are swallowed by `setItemAsync`.
 */
export async function setJSONAsync<T>(key: string, value: T): Promise<void> {
  await setItemAsync(key, JSON.stringify(value));
}

/**
 * Keys used by the reading feature. Centralized to avoid typos.
 */
export const ReadingStorageKeys = {
  /** Per-passage progress percentage (0/40/75/100). */
  progress: (passageId: string) => `reading_progress_${passageId}`,
  /** Per-passage list of saved notes (highlights + comments). */
  notes: (passageId: string) => `reading_notes_${passageId}`,
} as const;

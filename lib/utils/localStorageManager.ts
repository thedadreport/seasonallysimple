/**
 * Enhanced localStorage management with expiration, error handling, and migration support
 */

const PREFIX = 'seasonallysimple_';
const VERSION = '1';

export interface StorageItem<T> {
  value: T;
  expires?: number; // Timestamp when this item expires
  version: string;
  updatedAt: number;
}

/**
 * Saves data to localStorage with optional expiration
 */
export function saveToStorage<T>(
  key: string,
  value: T,
  options: {
    expiresInMinutes?: number;
    prefix?: string;
  } = {}
): boolean {
  try {
    const fullKey = `${options.prefix || PREFIX}${key}`;
    const now = Date.now();
    
    const storageItem: StorageItem<T> = {
      value,
      version: VERSION,
      updatedAt: now,
    };
    
    if (options.expiresInMinutes) {
      storageItem.expires = now + options.expiresInMinutes * 60 * 1000;
    }
    
    localStorage.setItem(fullKey, JSON.stringify(storageItem));
    return true;
  } catch (error) {
    console.error(`Failed to save to localStorage: ${key}`, error);
    return false;
  }
}

/**
 * Retrieves data from localStorage and handles expiration
 */
export function getFromStorage<T>(
  key: string,
  options: {
    defaultValue?: T;
    prefix?: string;
  } = {}
): T | null {
  try {
    const fullKey = `${options.prefix || PREFIX}${key}`;
    const json = localStorage.getItem(fullKey);
    
    if (!json) {
      return options.defaultValue !== undefined ? options.defaultValue : null;
    }
    
    const storageItem = JSON.parse(json) as StorageItem<T>;
    const now = Date.now();
    
    // Check if the item has expired
    if (storageItem.expires && storageItem.expires < now) {
      localStorage.removeItem(fullKey);
      return options.defaultValue !== undefined ? options.defaultValue : null;
    }
    
    // Return the stored value
    return storageItem.value;
  } catch (error) {
    console.error(`Failed to retrieve from localStorage: ${key}`, error);
    return options.defaultValue !== undefined ? options.defaultValue : null;
  }
}

/**
 * Removes an item from localStorage
 */
export function removeFromStorage(
  key: string,
  options: {
    prefix?: string;
  } = {}
): boolean {
  try {
    const fullKey = `${options.prefix || PREFIX}${key}`;
    localStorage.removeItem(fullKey);
    return true;
  } catch (error) {
    console.error(`Failed to remove from localStorage: ${key}`, error);
    return false;
  }
}

/**
 * Checks if localStorage is available
 */
export function isStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Clears all items created by this app
 */
export function clearAppStorage(): boolean {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PREFIX)) {
        localStorage.removeItem(key);
      }
    }
    return true;
  } catch (error) {
    console.error('Failed to clear app storage', error);
    return false;
  }
}

/**
 * Gets all keys that match a prefix pattern
 */
export function getKeysWithPrefix(subPrefix: string): string[] {
  const fullPrefix = `${PREFIX}${subPrefix}`;
  const keys: string[] = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(fullPrefix)) {
        // Remove the app prefix to return only the relevant part
        keys.push(key.substring(PREFIX.length));
      }
    }
  } catch (error) {
    console.error(`Failed to get keys with prefix: ${subPrefix}`, error);
  }
  
  return keys;
}
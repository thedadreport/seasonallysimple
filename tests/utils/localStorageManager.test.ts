import {
  saveToStorage,
  getFromStorage,
  removeFromStorage,
  isStorageAvailable,
  clearAppStorage,
  getKeysWithPrefix
} from '@/lib/utils/localStorageManager';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => {
      return store[key] || null;
    }),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    key: jest.fn((index: number) => {
      return Object.keys(store)[index] || null;
    }),
    length: jest.fn(() => Object.keys(store).length)
  };
})();

// Replace the global localStorage with our mock
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('LocalStorageManager', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  describe('saveToStorage', () => {
    it('should save data to localStorage with the correct prefix', () => {
      const testData = { name: 'Test Item', value: 42 };
      saveToStorage('testKey', testData);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      // The key should have the default prefix
      expect(mockLocalStorage.setItem.mock.calls[0][0]).toContain('testKey');
      
      // The value should be a JSON string containing our data and metadata
      const savedValue = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedValue.value).toEqual(testData);
      expect(savedValue.version).toBeDefined();
      expect(savedValue.updatedAt).toBeDefined();
    });

    it('should save data with an expiration if specified', () => {
      const testData = { name: 'Expiring Item' };
      saveToStorage('expiringKey', testData, { expiresInMinutes: 30 });
      
      const savedValue = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedValue.expires).toBeDefined();
      
      // Expiration should be approximately 30 minutes in the future
      const expirationTime = new Date(savedValue.expires);
      const now = new Date();
      const minutesDiff = Math.round((expirationTime.getTime() - now.getTime()) / (1000 * 60));
      
      expect(minutesDiff).toBeCloseTo(30, 0);
    });

    it('should use a custom prefix if specified', () => {
      saveToStorage('testKey', 'value', { prefix: 'custom_' });
      
      expect(mockLocalStorage.setItem.mock.calls[0][0]).toEqual('custom_testKey');
    });

    it('should handle errors gracefully', () => {
      // Make localStorage throw an error
      mockLocalStorage.setItem.mockImplementationOnce(() => {
        throw new Error('Storage full');
      });
      
      // This should not throw
      const result = saveToStorage('errorKey', 'test');
      expect(result).toBe(false);
    });
  });

  describe('getFromStorage', () => {
    it('should retrieve previously saved data', () => {
      const testData = { name: 'Test Retrieval' };
      saveToStorage('retrieveKey', testData);
      
      const retrieved = getFromStorage('retrieveKey');
      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent keys', () => {
      const retrieved = getFromStorage('nonExistentKey');
      expect(retrieved).toBeNull();
    });

    it('should return the default value for non-existent keys if specified', () => {
      const defaultValue = { name: 'Default' };
      const retrieved = getFromStorage('nonExistentKey', { defaultValue });
      expect(retrieved).toEqual(defaultValue);
    });

    it('should check expiration and return null for expired items', () => {
      // Save an item that is already expired
      const expiredData = {
        value: 'expired data',
        version: '1',
        updatedAt: Date.now(),
        expires: Date.now() - 1000 // Expired 1 second ago
      };
      mockLocalStorage.setItem('seasonallysimple_expiredKey', JSON.stringify(expiredData));
      
      const retrieved = getFromStorage('expiredKey');
      expect(retrieved).toBeNull();
      
      // The expired item should be removed
      expect(mockLocalStorage.removeItem).toHaveBeenCalled();
    });

    it('should use a custom prefix if specified', () => {
      const testData = 'custom prefix test';
      mockLocalStorage.setItem('custom_prefixKey', JSON.stringify({
        value: testData,
        version: '1',
        updatedAt: Date.now()
      }));
      
      const retrieved = getFromStorage('prefixKey', { prefix: 'custom_' });
      expect(retrieved).toEqual(testData);
    });

    it('should handle malformed JSON gracefully', () => {
      mockLocalStorage.setItem('seasonallysimple_malformedKey', 'not valid json');
      
      const defaultValue = 'default for error';
      const retrieved = getFromStorage('malformedKey', { defaultValue });
      expect(retrieved).toEqual(defaultValue);
    });
  });

  describe('removeFromStorage', () => {
    it('should remove an item from storage', () => {
      saveToStorage('removeKey', 'to be removed');
      
      const result = removeFromStorage('removeKey');
      expect(result).toBe(true);
      expect(mockLocalStorage.removeItem).toHaveBeenCalled();
      
      // Verify the item is gone
      expect(getFromStorage('removeKey')).toBeNull();
    });

    it('should use a custom prefix if specified', () => {
      mockLocalStorage.setItem('custom_removeKey', 'value');
      
      removeFromStorage('removeKey', { prefix: 'custom_' });
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('custom_removeKey');
    });

    it('should handle errors gracefully', () => {
      mockLocalStorage.removeItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });
      
      const result = removeFromStorage('errorKey');
      expect(result).toBe(false);
    });
  });

  describe('isStorageAvailable', () => {
    it('should return true if localStorage is available', () => {
      const result = isStorageAvailable();
      expect(result).toBe(true);
      
      // Should have tested availability by writing and removing a test item
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      expect(mockLocalStorage.removeItem).toHaveBeenCalled();
    });

    it('should return false if localStorage throws an error', () => {
      mockLocalStorage.setItem.mockImplementationOnce(() => {
        throw new Error('Storage not available');
      });
      
      const result = isStorageAvailable();
      expect(result).toBe(false);
    });
  });

  describe('clearAppStorage', () => {
    it('should clear all items with the app prefix', () => {
      // Save items with app prefix
      saveToStorage('item1', 'value1');
      saveToStorage('item2', 'value2');
      
      // Save item with different prefix
      mockLocalStorage.setItem('other_item', 'value3');
      
      const result = clearAppStorage();
      expect(result).toBe(true);
      
      // App prefixed items should be removed
      expect(getFromStorage('item1')).toBeNull();
      expect(getFromStorage('item2')).toBeNull();
      
      // Other items should remain
      expect(mockLocalStorage.getItem('other_item')).toBe('value3');
    });

    it('should handle errors gracefully', () => {
      mockLocalStorage.key.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });
      
      const result = clearAppStorage();
      expect(result).toBe(false);
    });
  });

  describe('getKeysWithPrefix', () => {
    it('should return all keys that match a given subprefix', () => {
      // Save items with different prefixes
      saveToStorage('shopping_list1', 'data1');
      saveToStorage('shopping_list2', 'data2');
      saveToStorage('pantry_item1', 'data3');
      
      const shoppingKeys = getKeysWithPrefix('shopping_');
      expect(shoppingKeys).toHaveLength(2);
      expect(shoppingKeys).toContain('shopping_list1');
      expect(shoppingKeys).toContain('shopping_list2');
      
      const pantryKeys = getKeysWithPrefix('pantry_');
      expect(pantryKeys).toHaveLength(1);
      expect(pantryKeys).toContain('pantry_item1');
    });

    it('should return an empty array if no keys match', () => {
      const keys = getKeysWithPrefix('nonexistent_');
      expect(keys).toEqual([]);
    });

    it('should handle errors gracefully', () => {
      mockLocalStorage.key.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });
      
      const keys = getKeysWithPrefix('error_');
      expect(keys).toEqual([]);
    });
  });
});
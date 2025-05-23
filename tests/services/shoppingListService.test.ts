import { 
  fetchShoppingLists, 
  fetchShoppingList,
  createShoppingList,
  addItemsToShoppingList,
  updateShoppingListItems,
  bulkOperationOnItems,
  deleteShoppingListItem
} from '@/lib/services/shoppingListService';
import * as localStorageManager from '@/lib/utils/localStorageManager';

// Mock dependencies
jest.mock('@/lib/utils/localStorageManager');
jest.mock('@/lib/utils/networkState', () => ({
  createRetryHandler: jest.fn(() => jest.fn(async (fn) => fn()))
}));

// Mock global fetch
global.fetch = jest.fn();

describe('ShoppingListService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default to online
    Object.defineProperty(navigator, 'onLine', { 
      configurable: true,
      value: true
    });
    
    // Mock localStorage methods
    (localStorageManager.getFromStorage as jest.Mock).mockImplementation(() => null);
    (localStorageManager.saveToStorage as jest.Mock).mockImplementation(() => true);
  });
  
  afterEach(() => {
    jest.resetAllMocks();
  });
  
  describe('fetchShoppingLists', () => {
    it('should fetch shopping lists from the API when online', async () => {
      const mockLists = [{ id: '1', name: 'List 1', items: [] }];
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ lists: mockLists })
      });
      
      const result = await fetchShoppingLists();
      
      expect(global.fetch).toHaveBeenCalledWith('/api/shopping-lists');
      expect(localStorageManager.saveToStorage).toHaveBeenCalled();
      expect(result).toEqual(mockLists);
    });
    
    it('should return cached data if offline', async () => {
      const cachedLists = [{ id: '1', name: 'Cached List', items: [] }];
      (localStorageManager.getFromStorage as jest.Mock).mockReturnValueOnce(cachedLists);
      
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      const result = await fetchShoppingLists();
      
      expect(global.fetch).not.toHaveBeenCalled();
      expect(result).toEqual(cachedLists);
    });
    
    it('should return cached data if fetch fails and cache exists', async () => {
      const cachedLists = [{ id: '1', name: 'Fallback List', items: [] }];
      (localStorageManager.getFromStorage as jest.Mock).mockReturnValueOnce(cachedLists);
      
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      const result = await fetchShoppingLists();
      
      expect(global.fetch).toHaveBeenCalled();
      expect(result).toEqual(cachedLists);
    });
    
    it('should throw error if fetch fails and no cache exists', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      await expect(fetchShoppingLists()).rejects.toThrow('Network error');
    });
  });
  
  describe('fetchShoppingList', () => {
    it('should fetch a specific shopping list from the API when online', async () => {
      const mockList = { id: '123', name: 'Test List', items: [] };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockList
      });
      
      const result = await fetchShoppingList('123');
      
      expect(global.fetch).toHaveBeenCalledWith('/api/shopping-lists/123');
      expect(localStorageManager.saveToStorage).toHaveBeenCalled();
      expect(result).toEqual(mockList);
    });
    
    it('should return cached list if offline', async () => {
      const cachedList = { id: '123', name: 'Cached List', items: [] };
      (localStorageManager.getFromStorage as jest.Mock).mockReturnValueOnce(cachedList);
      
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      const result = await fetchShoppingList('123');
      
      expect(global.fetch).not.toHaveBeenCalled();
      expect(result).toEqual(cachedList);
    });
  });
  
  describe('createShoppingList', () => {
    it('should create a new shopping list when online', async () => {
      const newList = { id: 'new123', name: 'New List', items: [] };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ shoppingList: newList })
      });
      
      const result = await createShoppingList({ name: 'New List' });
      
      expect(global.fetch).toHaveBeenCalledWith('/api/shopping-lists', expect.any(Object));
      expect(localStorageManager.saveToStorage).toHaveBeenCalled();
      expect(result).toEqual(newList);
    });
    
    it('should create a temporary list and queue operation when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      const result = await createShoppingList({ name: 'Offline List' });
      
      expect(global.fetch).not.toHaveBeenCalled();
      expect(localStorageManager.saveToStorage).toHaveBeenCalledTimes(2); // Once for the list, once for the operation
      expect(result).toBeDefined();
      expect(result?.name).toBe('Offline List');
      expect(result?.id).toContain('temp_');
    });
  });
  
  describe('addItemsToShoppingList', () => {
    it('should add items to a shopping list when online', async () => {
      const newItems = [
        { id: 'item1', name: 'Item 1' },
        { id: 'item2', name: 'Item 2' }
      ];
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: newItems })
      });
      
      const result = await addItemsToShoppingList('list123', [
        { name: 'Item 1' },
        { name: 'Item 2' }
      ]);
      
      expect(global.fetch).toHaveBeenCalledWith('/api/shopping-lists/list123/items', expect.any(Object));
      expect(result).toEqual(newItems);
    });
    
    it('should update local cache and queue operation when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      const cachedList = { 
        id: 'list123', 
        name: 'Cached List', 
        items: [],
        userId: 'user1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      (localStorageManager.getFromStorage as jest.Mock).mockReturnValueOnce(cachedList);
      
      const result = await addItemsToShoppingList('list123', [
        { name: 'Offline Item' }
      ]);
      
      expect(global.fetch).not.toHaveBeenCalled();
      expect(localStorageManager.saveToStorage).toHaveBeenCalledTimes(2); // Once for updating list, once for queueing operation
      expect(result[0].name).toBe('Offline Item');
      expect(result[0].id).toContain('temp_');
    });
  });
  
  describe('updateShoppingListItems', () => {
    it('should update items in a shopping list when online', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Updated successfully' })
      });
      
      const result = await updateShoppingListItems('list123', [
        { id: 'item1', checked: true }
      ]);
      
      expect(global.fetch).toHaveBeenCalledWith('/api/shopping-lists/list123/items', expect.any(Object));
      expect(result).toBe(true);
    });
    
    it('should update local cache and queue operation when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      const cachedList = { 
        id: 'list123', 
        name: 'Test List', 
        items: [{ id: 'item1', name: 'Item 1', checked: false }],
        userId: 'user1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      (localStorageManager.getFromStorage as jest.Mock).mockReturnValueOnce(cachedList);
      
      const result = await updateShoppingListItems('list123', [
        { id: 'item1', checked: true }
      ]);
      
      expect(global.fetch).not.toHaveBeenCalled();
      expect(localStorageManager.saveToStorage).toHaveBeenCalledTimes(2); // Once for updating list, once for queueing operation
      
      // Verify the updated list was saved with the item checked
      const updatedListArg = (localStorageManager.saveToStorage as jest.Mock).mock.calls[0][1];
      expect(updatedListArg.items[0].checked).toBe(true);
      
      expect(result).toBe(true);
    });
  });
  
  describe('bulkOperationOnItems', () => {
    it('should perform a bulk operation on items when online', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Operation successful' })
      });
      
      const result = await bulkOperationOnItems('list123', 'check', ['item1', 'item2']);
      
      expect(global.fetch).toHaveBeenCalledWith('/api/shopping-lists/list123/items', expect.any(Object));
      expect(result).toBe(true);
    });
    
    it('should update local cache and queue operation when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      const cachedList = { 
        id: 'list123', 
        name: 'Test List', 
        items: [
          { id: 'item1', name: 'Item 1', checked: false },
          { id: 'item2', name: 'Item 2', checked: false }
        ],
        userId: 'user1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      (localStorageManager.getFromStorage as jest.Mock).mockReturnValueOnce(cachedList);
      
      const result = await bulkOperationOnItems('list123', 'check', ['item1', 'item2']);
      
      expect(global.fetch).not.toHaveBeenCalled();
      expect(localStorageManager.saveToStorage).toHaveBeenCalledTimes(2);
      
      // Verify the updated list was saved with the items checked
      const updatedListArg = (localStorageManager.saveToStorage as jest.Mock).mock.calls[0][1];
      expect(updatedListArg.items[0].checked).toBe(true);
      expect(updatedListArg.items[1].checked).toBe(true);
      
      expect(result).toBe(true);
    });
  });
  
  describe('deleteShoppingListItem', () => {
    it('should delete an item from a shopping list when online', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Item deleted' })
      });
      
      const result = await deleteShoppingListItem('list123', 'item1');
      
      expect(global.fetch).toHaveBeenCalledWith('/api/shopping-lists/list123/items?itemId=item1', expect.any(Object));
      expect(result).toBe(true);
    });
    
    it('should update local cache and queue operation when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      const cachedList = { 
        id: 'list123', 
        name: 'Test List', 
        items: [{ id: 'item1', name: 'Item to Delete' }],
        userId: 'user1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      (localStorageManager.getFromStorage as jest.Mock).mockReturnValueOnce(cachedList);
      
      const result = await deleteShoppingListItem('list123', 'item1');
      
      expect(global.fetch).not.toHaveBeenCalled();
      expect(localStorageManager.saveToStorage).toHaveBeenCalledTimes(2);
      
      // Verify the updated list was saved without the deleted item
      const updatedListArg = (localStorageManager.saveToStorage as jest.Mock).mock.calls[0][1];
      expect(updatedListArg.items).toHaveLength(0);
      
      expect(result).toBe(true);
    });
  });
});
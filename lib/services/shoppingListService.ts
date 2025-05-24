import { ShoppingList, ShoppingListItem } from '@/types/shoppingList';
import { getFromStorage, saveToStorage, removeFromStorage, getKeysWithPrefix } from '@/lib/utils/localStorageManager';
import { parseApiError } from '@/lib/utils/errorHandling';
import { createRetryHandler } from '@/lib/utils/networkState';

// Constants
const PENDING_OPERATIONS_PREFIX = 'pendingOps_shoppingList_';
const CACHED_LISTS_PREFIX = 'cachedList_';
const CACHE_EXPIRY_MINUTES = 60; // 1 hour

// Types
export type OperationType = 'create' | 'update' | 'delete';

export interface PendingOperation {
  id: string;
  type: OperationType;
  payload: any;
  timestamp: number;
  endpoint: string;
  method: string;
  retry: number;
}

// Create a retry handler
const retryWithBackoff = createRetryHandler(3, 1000, 2);

/**
 * Fetch shopping lists with local caching and offline support
 */
export async function fetchShoppingLists(
  options: { 
    forceFresh?: boolean;
    showToast?: boolean;
  } = {}
): Promise<ShoppingList[]> {
  const cacheKey = `${CACHED_LISTS_PREFIX}all`;
  
  // Use cached data if offline or if not forcing fresh data
  const cachedLists = getFromStorage<ShoppingList[]>(cacheKey);
  if (cachedLists && (!navigator.onLine || !options.forceFresh)) {
    return cachedLists;
  }
  
  // If online, fetch fresh data
  if (navigator.onLine) {
    try {
      const response = await retryWithBackoff(async () => {
        const res = await fetch('/api/shopping-lists');
        if (!res.ok) {
          const errorData = await parseApiError(res);
          throw new Error(errorData.message || errorData.error || 'Failed to fetch shopping lists');
        }
        return res;
      });
      
      const data = await response.json();
      const lists = data.lists || [];
      
      // Store in cache
      saveToStorage(cacheKey, lists, { expiresInMinutes: CACHE_EXPIRY_MINUTES });
      
      return lists;
    } catch (error) {
      // If we have cached data, return it as fallback
      if (cachedLists) {
        console.warn('Using cached shopping lists due to fetch error', error);
        return cachedLists;
      }
      throw error;
    }
  }
  
  // If offline and no cache, return empty array
  return [];
}

/**
 * Fetch a single shopping list by ID with caching
 */
export async function fetchShoppingList(
  listId: string,
  options: { 
    forceFresh?: boolean;
    showToast?: boolean;
  } = {}
): Promise<ShoppingList | null> {
  const cacheKey = `${CACHED_LISTS_PREFIX}${listId}`;
  
  // Use cached data if offline or if not forcing fresh data
  const cachedList = getFromStorage<ShoppingList>(cacheKey);
  if (cachedList && (!navigator.onLine || !options.forceFresh)) {
    return cachedList;
  }
  
  // If online, fetch fresh data
  if (navigator.onLine) {
    try {
      const response = await retryWithBackoff(async () => {
        const res = await fetch(`/api/shopping-lists/${listId}`);
        if (!res.ok) {
          const errorData = await parseApiError(res);
          throw new Error(errorData.message || errorData.error || 'Failed to fetch shopping list');
        }
        return res;
      });
      
      const list = await response.json();
      
      // Store in cache
      saveToStorage(cacheKey, list, { expiresInMinutes: CACHE_EXPIRY_MINUTES });
      
      return list;
    } catch (error) {
      // If we have cached data, return it as fallback
      if (cachedList) {
        console.warn(`Using cached shopping list data for list ${listId} due to fetch error`, error);
        return cachedList;
      }
      throw error;
    }
  }
  
  // If offline and no cache, return null
  return null;
}

/**
 * Create a new shopping list with offline support
 */
export async function createShoppingList(
  data: { name?: string; mealPlanId?: string; includePantryItems?: boolean },
  options: { 
    showToast?: boolean;
  } = {}
): Promise<ShoppingList | null> {
  // Generate a temporary ID for offline mode
  const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  // If offline, queue the operation for later
  if (!navigator.onLine) {
    const tempList: ShoppingList = {
      id: tempId,
      name: data.name || `Shopping List ${new Date().toLocaleDateString()}`,
      userId: 'current-user', // Will be replaced when synced
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: [],
      mealPlanId: data.mealPlanId || null
    };
    
    // Store the temp list in cache
    saveToStorage(`${CACHED_LISTS_PREFIX}${tempId}`, tempList);
    
    // Add to the pending operations queue
    queuePendingOperation({
      id: tempId,
      type: 'create',
      payload: data,
      timestamp: Date.now(),
      endpoint: '/api/shopping-lists',
      method: 'POST',
      retry: 0
    });
    
    return tempList;
  }
  
  // If online, create it directly
  try {
    const response = await retryWithBackoff(async () => {
      const res = await fetch('/api/shopping-lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const errorData = await parseApiError(res);
        throw new Error(errorData.message || errorData.error || 'Failed to create shopping list');
      }
      
      return res;
    });
    
    const result = await response.json();
    const newList = result.shoppingList;
    
    // Cache the new list
    if (newList) {
      saveToStorage(`${CACHED_LISTS_PREFIX}${newList.id}`, newList, { 
        expiresInMinutes: CACHE_EXPIRY_MINUTES 
      });
      
      // Update the all lists cache
      const allLists = getFromStorage<ShoppingList[]>(`${CACHED_LISTS_PREFIX}all`) || [];
      saveToStorage(`${CACHED_LISTS_PREFIX}all`, [...allLists, newList], {
        expiresInMinutes: CACHE_EXPIRY_MINUTES
      });
    }
    
    return newList;
  } catch (error) {
    throw error;
  }
}

/**
 * Add items to a shopping list with offline support
 */
export async function addItemsToShoppingList(
  listId: string,
  items: Partial<ShoppingListItem>[],
  options: { 
    showToast?: boolean;
  } = {}
): Promise<ShoppingListItem[]> {
  // Generate temporary IDs for each item
  const itemsWithTempIds = items.map(item => ({
    ...item,
    id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }));
  
  // If offline, queue the operation for later
  if (!navigator.onLine) {
    // Get the current list from cache
    const list = getFromStorage<ShoppingList>(`${CACHED_LISTS_PREFIX}${listId}`);
    
    if (list) {
      // Update the cached list with the new items
      const updatedList = {
        ...list,
        items: [
          ...list.items,
          ...itemsWithTempIds.map(item => ({
            id: item.id,
            name: item.name || '',
            quantity: item.quantity || '1',
            unit: item.unit || null,
            category: item.category || 'other',
            checked: item.checked || false,
            orderPosition: item.orderPosition || list.items.length + 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }))
        ]
      };
      
      // Update the cache
      saveToStorage(`${CACHED_LISTS_PREFIX}${listId}`, updatedList, {
        expiresInMinutes: CACHE_EXPIRY_MINUTES
      });
      
      // Queue the operation
      queuePendingOperation({
        id: `add_items_${listId}_${Date.now()}`,
        type: 'update',
        payload: { items },
        timestamp: Date.now(),
        endpoint: `/api/shopping-lists/${listId}/items`,
        method: 'POST',
        retry: 0
      });
      
      return itemsWithTempIds as ShoppingListItem[];
    }
    
    throw new Error('Shopping list not found in offline cache');
  }
  
  // If online, add items directly
  try {
    const response = await retryWithBackoff(async () => {
      const res = await fetch(`/api/shopping-lists/${listId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items
        }),
      });
      
      if (!res.ok) {
        const errorData = await parseApiError(res);
        throw new Error(errorData.message || errorData.error || 'Failed to add items');
      }
      
      return res;
    });
    
    const result = await response.json();
    
    // Update the cached list
    await fetchShoppingList(listId, { forceFresh: true });
    
    return result.items || [];
  } catch (error) {
    throw error;
  }
}

/**
 * Update shopping list items (like checking/unchecking)
 */
export async function updateShoppingListItems(
  listId: string,
  updates: { id: string; checked?: boolean; name?: string; quantity?: string; unit?: string; category?: string }[],
  options: { 
    showToast?: boolean;
  } = {}
): Promise<boolean> {
  // If offline, queue the operation for later
  if (!navigator.onLine) {
    // Get the current list from cache
    const list = getFromStorage<ShoppingList>(`${CACHED_LISTS_PREFIX}${listId}`);
    
    if (list) {
      // Update the cached list
      const updatedList = {
        ...list,
        items: list.items.map(item => {
          const update = updates.find(u => u.id === item.id);
          if (update) {
            return {
              ...item,
              ...update,
              updatedAt: new Date().toISOString()
            };
          }
          return item;
        })
      };
      
      // Update the cache
      saveToStorage(`${CACHED_LISTS_PREFIX}${listId}`, updatedList, {
        expiresInMinutes: CACHE_EXPIRY_MINUTES
      });
      
      // Queue the operation
      queuePendingOperation({
        id: `update_items_${listId}_${Date.now()}`,
        type: 'update',
        payload: { items: updates },
        timestamp: Date.now(),
        endpoint: `/api/shopping-lists/${listId}/items`,
        method: 'PUT',
        retry: 0
      });
      
      return true;
    }
    
    return false;
  }
  
  // If online, update directly
  try {
    const response = await retryWithBackoff(async () => {
      const res = await fetch(`/api/shopping-lists/${listId}/items`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: updates
        }),
      });
      
      if (!res.ok) {
        const errorData = await parseApiError(res);
        throw new Error(errorData.message || errorData.error || 'Failed to update items');
      }
      
      return res;
    });
    
    // Update the cache with the latest data
    await fetchShoppingList(listId, { forceFresh: true });
    
    return true;
  } catch (error) {
    throw error;
  }
}

/**
 * Perform bulk operations on shopping list items
 */
export async function bulkOperationOnItems(
  listId: string,
  operation: 'check' | 'uncheck' | 'delete' | 'reorder',
  itemIds: string[],
  options: { 
    showToast?: boolean;
  } = {}
): Promise<boolean> {
  // If offline, queue the operation for later
  if (!navigator.onLine) {
    // Get the current list from cache
    const list = getFromStorage<ShoppingList>(`${CACHED_LISTS_PREFIX}${listId}`);
    
    if (list) {
      let updatedList: ShoppingList;
      
      // Update the cached list based on operation
      switch (operation) {
        case 'check':
        case 'uncheck':
          updatedList = {
            ...list,
            items: list.items.map(item => {
              if (itemIds.includes(item.id)) {
                return {
                  ...item,
                  checked: operation === 'check',
                  updatedAt: new Date().toISOString()
                };
              }
              return item;
            })
          };
          break;
          
        case 'delete':
          updatedList = {
            ...list,
            items: list.items.filter(item => !itemIds.includes(item.id))
          };
          break;
          
        default:
          updatedList = list;
      }
      
      // Update the cache
      saveToStorage(`${CACHED_LISTS_PREFIX}${listId}`, updatedList, {
        expiresInMinutes: CACHE_EXPIRY_MINUTES
      });
      
      // Queue the operation
      queuePendingOperation({
        id: `bulk_${operation}_${listId}_${Date.now()}`,
        type: 'update',
        payload: { operation, itemIds },
        timestamp: Date.now(),
        endpoint: `/api/shopping-lists/${listId}/items`,
        method: 'PUT',
        retry: 0
      });
      
      return true;
    }
    
    return false;
  }
  
  // If online, perform operation directly
  try {
    const response = await retryWithBackoff(async () => {
      const res = await fetch(`/api/shopping-lists/${listId}/items`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation,
          itemIds
        }),
      });
      
      if (!res.ok) {
        const errorData = await parseApiError(res);
        throw new Error(errorData.message || errorData.error || 'Failed to perform bulk operation');
      }
      
      return res;
    });
    
    // Update the cache with the latest data
    await fetchShoppingList(listId, { forceFresh: true });
    
    return true;
  } catch (error) {
    throw error;
  }
}

/**
 * Delete a shopping list item
 */
export async function deleteShoppingListItem(
  listId: string,
  itemId: string,
  options: { 
    showToast?: boolean;
  } = {}
): Promise<boolean> {
  // If offline, queue the operation for later
  if (!navigator.onLine) {
    // Get the current list from cache
    const list = getFromStorage<ShoppingList>(`${CACHED_LISTS_PREFIX}${listId}`);
    
    if (list) {
      // Update the cached list
      const updatedList = {
        ...list,
        items: list.items.filter(item => item.id !== itemId)
      };
      
      // Update the cache
      saveToStorage(`${CACHED_LISTS_PREFIX}${listId}`, updatedList, {
        expiresInMinutes: CACHE_EXPIRY_MINUTES
      });
      
      // Queue the operation
      queuePendingOperation({
        id: `delete_item_${listId}_${itemId}`,
        type: 'delete',
        payload: { itemId },
        timestamp: Date.now(),
        endpoint: `/api/shopping-lists/${listId}/items?itemId=${itemId}`,
        method: 'DELETE',
        retry: 0
      });
      
      return true;
    }
    
    return false;
  }
  
  // If online, delete directly
  try {
    const response = await retryWithBackoff(async () => {
      const res = await fetch(`/api/shopping-lists/${listId}/items?itemId=${itemId}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const errorData = await parseApiError(res);
        throw new Error(errorData.message || errorData.error || 'Failed to delete item');
      }
      
      return res;
    });
    
    // Update the cache with the latest data
    await fetchShoppingList(listId, { forceFresh: true });
    
    return true;
  } catch (error) {
    throw error;
  }
}

/**
 * Queue a pending operation for when we're back online
 */
function queuePendingOperation(operation: PendingOperation): void {
  const operationKey = `${PENDING_OPERATIONS_PREFIX}${operation.id}`;
  saveToStorage(operationKey, operation);
}

/**
 * Process pending operations when coming back online
 */
export async function processPendingOperations(): Promise<{
  succeeded: number;
  failed: number;
}> {
  if (!navigator.onLine) {
    return { succeeded: 0, failed: 0 };
  }
  
  const pendingKeys = getKeysWithPrefix(PENDING_OPERATIONS_PREFIX);
  let succeeded = 0;
  let failed = 0;
  
  for (const key of pendingKeys) {
    const operation = getFromStorage<PendingOperation>(key);
    if (!operation) continue;
    
    try {
      // Process based on operation type
      switch (operation.type) {
        case 'create':
          await fetch(operation.endpoint, {
            method: operation.method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(operation.payload),
          });
          break;
          
        case 'update':
          await fetch(operation.endpoint, {
            method: operation.method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(operation.payload),
          });
          break;
          
        case 'delete':
          await fetch(operation.endpoint, {
            method: operation.method,
          });
          break;
      }
      
      // Remove the pending operation if successful
      removeFromStorage(key);
      succeeded++;
    } catch (error) {
      console.error(`Failed to process pending operation: ${key}`, error);
      
      // Update retry count
      const updatedOperation = {
        ...operation,
        retry: operation.retry + 1
      };
      
      // If we've tried too many times, give up
      if (updatedOperation.retry >= 5) {
        removeFromStorage(key);
      } else {
        saveToStorage(key, updatedOperation);
      }
      
      failed++;
    }
  }
  
  // Refresh all cached data after syncing
  try {
    await fetchShoppingLists({ forceFresh: true });
  } catch (error) {
    console.error('Failed to refresh lists after sync', error);
  }
  
  return { succeeded, failed };
}

/**
 * Set up event listeners for online/offline events
 */
export function setupNetworkListeners(): () => void {
  const handleOnline = async () => {
    console.log('Online - processing pending operations');
    const { succeeded, failed } = await processPendingOperations();
    if (succeeded > 0) {
      console.log(`Synced ${succeeded} offline changes`);
    }
    if (failed > 0) {
      console.error(`Failed to sync ${failed} offline changes`);
    }
  };
  
  window.addEventListener('online', handleOnline);
  
  // Return a cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
  };
}
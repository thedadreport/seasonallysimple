'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

// Define types for shopping list data
interface ShoppingListItem {
  id: string;
  name: string;
  quantity: string;
  unit?: string | null;
  category: string;
  checked: boolean;
  orderPosition?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface ShoppingList {
  id: string;
  name: string;
  userId: string;
  mealPlanId?: string | null;
  createdAt: string;
  updatedAt: string;
  items: ShoppingListItem[];
  mealPlan?: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  } | null;
  itemCounts?: {
    total: number;
    checked: number;
    unchecked: number;
  };
}

interface PaginatedResponse {
  lists: ShoppingList[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

interface ApiError {
  error: string;
  message?: string;
  details?: any;
}

interface Suggestion {
  name: string;
  category: string;
}

export default function ShoppingListPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State for shopping lists
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [loadingLists, setLoadingLists] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for new item form
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('other');
  
  // State for suggestions
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Authentication check
  useEffect(() => {
    if (status === 'unauthenticated') {
      // Redirect to login if not authenticated
      router.push('/login?callbackUrl=/shopping-list');
    }
  }, [status, router]);
  
  // Fetch shopping lists
  const fetchShoppingLists = useCallback(async () => {
    if (status !== 'authenticated') return;
    
    setLoadingLists(true);
    setError(null);
    
    try {
      const response = await fetch('/api/shopping-lists');
      
      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to fetch shopping lists');
      }
      
      const data: PaginatedResponse = await response.json();
      setLists(data.lists);
      
      // Set the first list as selected if none is selected
      if (data.lists.length > 0 && !selectedListId) {
        setSelectedListId(data.lists[0].id);
      }
      
    } catch (err) {
      console.error('Error fetching shopping lists:', err);
      setError(err instanceof Error ? err.message : 'Failed to load shopping lists');
      toast.error('Failed to load shopping lists');
    } finally {
      setLoadingLists(false);
      setLoading(false);
    }
  }, [status, selectedListId]);
  
  // Fetch a single shopping list
  const fetchShoppingList = useCallback(async (listId: string) => {
    if (!listId || status !== 'authenticated') return;
    
    setLoadingItems(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/shopping-lists/${listId}`);
      
      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to fetch shopping list');
      }
      
      const data: ShoppingList = await response.json();
      
      // Update the list in our state
      setLists(prevLists => {
        const updatedLists = [...prevLists];
        const index = updatedLists.findIndex(list => list.id === listId);
        
        if (index !== -1) {
          updatedLists[index] = data;
        } else {
          updatedLists.push(data);
        }
        
        return updatedLists;
      });
      
    } catch (err) {
      console.error('Error fetching shopping list:', err);
      setError(err instanceof Error ? err.message : 'Failed to load shopping list');
      toast.error('Failed to load shopping list details');
    } finally {
      setLoadingItems(false);
    }
  }, [status]);
  
  // Initial data fetch
  useEffect(() => {
    if (status === 'authenticated') {
      fetchShoppingLists();
    }
  }, [status, fetchShoppingLists]);
  
  // Fetch selected list details when it changes
  useEffect(() => {
    if (selectedListId) {
      fetchShoppingList(selectedListId);
    }
  }, [selectedListId, fetchShoppingList]);
  
  // Get item suggestions
  const getItemSuggestions = useCallback(async (partialName: string) => {
    if (!partialName || partialName.length < 2 || !selectedListId) return;
    
    try {
      const response = await fetch(`/api/shopping-lists/${selectedListId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ partialName, limit: 5 }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get suggestions');
      }
      
      const data = await response.json();
      setSuggestions(data.suggestions || []);
      setShowSuggestions(data.suggestions && data.suggestions.length > 0);
      
    } catch (err) {
      console.error('Error getting suggestions:', err);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [selectedListId]);
  
  // Debounced suggestions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (newItemName && newItemName.length >= 2) {
        getItemSuggestions(newItemName);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [newItemName, getItemSuggestions]);
  
  // Get currently selected list
  const selectedList = lists.find(list => list.id === selectedListId) || null;
  
  // Group items by category
  const groupedItems = selectedList ? 
    Object.entries(
      selectedList.items.reduce((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
      }, {} as Record<string, ShoppingListItem[]>)
    ).sort() : [];
  
  // Apply suggestion to form
  const applySuggestion = (suggestion: Suggestion) => {
    setNewItemName(suggestion.name);
    setNewItemCategory(suggestion.category);
    setSuggestions([]);
    setShowSuggestions(false);
  };
  
  // Handle item check/uncheck
  const handleToggleItem = async (itemId: string) => {
    if (!selectedListId) return;
    
    // Find the item
    const item = selectedList?.items.find(i => i.id === itemId);
    if (!item) return;
    
    // Optimistic update
    setLists(prevLists => 
      prevLists.map(list => {
        if (list.id === selectedListId) {
          return {
            ...list,
            items: list.items.map(i => {
              if (i.id === itemId) {
                return { ...i, checked: !i.checked };
              }
              return i;
            })
          };
        }
        return list;
      })
    );
    
    try {
      // Update the item on the server
      const response = await fetch(`/api/shopping-lists/${selectedListId}/items`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [{ id: itemId, checked: !item.checked }]
        }),
      });
      
      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to update item');
      }
      
    } catch (err) {
      console.error('Error updating item:', err);
      toast.error('Failed to update item');
      
      // Revert the optimistic update
      setLists(prevLists => 
        prevLists.map(list => {
          if (list.id === selectedListId) {
            return {
              ...list,
              items: list.items.map(i => {
                if (i.id === itemId) {
                  return { ...i, checked: item.checked };
                }
                return i;
              })
            };
          }
          return list;
        })
      );
    }
  };
  
  // Handle bulk operations
  const handleBulkOperation = async (operation: 'check' | 'uncheck' | 'delete') => {
    if (!selectedListId || !selectedList) return;
    
    // Get all item IDs for the operation
    const itemIds = selectedList.items
      .filter(item => operation !== 'check' || !item.checked)  // For 'check', only include unchecked items
      .filter(item => operation !== 'uncheck' || item.checked) // For 'uncheck', only include checked items
      .map(item => item.id);
    
    if (itemIds.length === 0) {
      toast.info('No items to update');
      return;
    }
    
    // Confirm deletion
    if (operation === 'delete' && !window.confirm(`Are you sure you want to delete ${itemIds.length} items?`)) {
      return;
    }
    
    // Optimistic update
    setLists(prevLists => 
      prevLists.map(list => {
        if (list.id === selectedListId) {
          return {
            ...list,
            items: operation === 'delete'
              ? list.items.filter(item => !itemIds.includes(item.id))
              : list.items.map(item => {
                  if (itemIds.includes(item.id)) {
                    return { ...item, checked: operation === 'check' };
                  }
                  return item;
                })
          };
        }
        return list;
      })
    );
    
    try {
      // Send the operation to the server
      const response = await fetch(`/api/shopping-lists/${selectedListId}/items`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation,
          itemIds
        }),
      });
      
      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.message || errorData.error || `Failed to ${operation} items`);
      }
      
      const data = await response.json();
      toast.success(data.message || `Successfully ${operation === 'check' ? 'checked' : operation === 'uncheck' ? 'unchecked' : 'deleted'} items`);
      
    } catch (err) {
      console.error(`Error performing ${operation} operation:`, err);
      toast.error(`Failed to ${operation} items`);
      
      // Revert the optimistic update by refreshing the list
      fetchShoppingList(selectedListId);
    }
  };
  
  // Handle deleting a single item
  const handleDeleteItem = async (itemId: string) => {
    if (!selectedListId) return;
    
    // Optimistic update
    setLists(prevLists => 
      prevLists.map(list => {
        if (list.id === selectedListId) {
          return {
            ...list,
            items: list.items.filter(item => item.id !== itemId)
          };
        }
        return list;
      })
    );
    
    try {
      // Delete the item on the server
      const response = await fetch(`/api/shopping-lists/${selectedListId}/items?itemId=${itemId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to delete item');
      }
      
      toast.success('Item deleted successfully');
      
    } catch (err) {
      console.error('Error deleting item:', err);
      toast.error('Failed to delete item');
      
      // Revert the optimistic update by refreshing the list
      fetchShoppingList(selectedListId);
    }
  };
  
  // Handle adding a new item
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newItemName.trim() || !selectedListId) return;
    
    setSubmitLoading(true);
    
    const newItem: Partial<ShoppingListItem> = {
      name: newItemName.trim(),
      quantity: newItemQuantity || '1',
      unit: newItemUnit || null,
      category: newItemCategory,
      checked: false
    };
    
    try {
      // Add the item to the server
      const response = await fetch(`/api/shopping-lists/${selectedListId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItem),
      });
      
      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to add item');
      }
      
      const data = await response.json();
      
      // Update state with the newly created item
      setLists(prevLists => 
        prevLists.map(list => {
          if (list.id === selectedListId) {
            return {
              ...list,
              items: [...list.items, data.item]
            };
          }
          return list;
        })
      );
      
      // Reset form
      setNewItemName('');
      setNewItemQuantity('');
      setNewItemUnit('');
      setNewItemCategory('other');
      
      toast.success('Item added successfully');
      
    } catch (err) {
      console.error('Error adding item:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to add item');
    } finally {
      setSubmitLoading(false);
    }
  };
  
  // Handle creating a new shopping list
  const handleCreateShoppingList = async (mealPlanId: string) => {
    try {
      const response = await fetch('/api/shopping-lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mealPlanId,
          name: `Shopping List for Meal Plan`
        }),
      });
      
      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to create shopping list');
      }
      
      const data = await response.json();
      toast.success('Shopping list created successfully');
      
      // Refresh lists and select the new list
      await fetchShoppingLists();
      setSelectedListId(data.shoppingList.id);
      
    } catch (err) {
      console.error('Error creating shopping list:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to create shopping list');
    }
  };
  
  // Export shopping list as text
  const handleExportList = () => {
    if (!selectedList) return;
    
    const { name, items } = selectedList;
    
    // Group items by category
    const groupedForExport = items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, ShoppingListItem[]>);
    
    // Format the export content
    let exportContent = `${name}\n`;
    exportContent += `${new Date().toLocaleDateString()}\n\n`;
    
    Object.entries(groupedForExport).forEach(([category, categoryItems]) => {
      exportContent += `--- ${category.toUpperCase()} ---\n`;
      categoryItems.forEach(item => {
        exportContent += `${item.checked ? '[x]' : '[ ]'} ${item.name} - ${item.quantity} ${item.unit || ''}\n`;
      });
      exportContent += '\n';
    });
    
    // Create a downloadable file
    const blob = new Blob([exportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Render loading state
  if (status === 'loading' || (loading && loadingLists)) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sage"></div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    return null; // useEffect will handle the redirect
  }
  
  // Render error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-3xl font-serif font-bold text-navy mb-8">Shopping Lists</h1>
        
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-lg mb-6 text-red-600">{error}</p>
          <button onClick={() => fetchShoppingLists()} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  // Render empty state
  if (lists.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-3xl font-serif font-bold text-navy mb-8">Shopping Lists</h1>
        
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-lg mb-6">You don't have any shopping lists yet.</p>
          <Link href="/meal-plan" className="btn-primary">
            Create a Meal Plan First
          </Link>
        </div>
      </div>
    );
  }
  
  // Render empty list state
  if (!selectedList) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-3xl font-serif font-bold text-navy mb-8">Shopping Lists</h1>
        
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-lg mb-6">Select a shopping list to view.</p>
          {lists.length > 0 && (
            <div className="mb-8">
              <label className="block text-gray-700 mb-2 font-medium">Select a shopping list:</label>
              <select 
                value={selectedListId || ''} 
                onChange={(e) => setSelectedListId(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sage focus:border-sage"
              >
                <option value="">-- Select a list --</option>
                {lists.map(list => (
                  <option key={list.id} value={list.id}>{list.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Main content render
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-navy mb-2">
            Shopping List
          </h1>
          <p className="text-gray-600">
            {new Date(selectedList.createdAt).toLocaleDateString()}
          </p>
        </div>
        
        <div className="flex gap-4">
          <Link href="/meal-plan" className="btn-secondary">
            Back to Meal Plan
          </Link>
          <button 
            className="btn-primary"
            onClick={handleExportList}
          >
            Export List
          </button>
        </div>
      </div>
      
      {/* Lists selector (if more than one) */}
      {lists.length > 1 && (
        <div className="mb-8">
          <label className="block text-gray-700 mb-2 font-medium">Select a shopping list:</label>
          <select 
            value={selectedListId || ''} 
            onChange={(e) => setSelectedListId(e.target.value)}
            className="w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sage focus:border-sage"
          >
            {lists.map(list => (
              <option key={list.id} value={list.id}>
                {list.name} {list.mealPlan ? `(${new Date(list.mealPlan.startDate).toLocaleDateString()})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {/* Add new item form */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-lg font-medium text-navy mb-4">Add Item</h2>
        <form onSubmit={handleAddItem} className="flex flex-col md:flex-row gap-3">
          <div className="flex-grow relative">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Item name"
              className="w-full input-field"
              required
              onFocus={() => newItemName.length >= 2 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center justify-between"
                    onClick={() => applySuggestion(suggestion)}
                  >
                    <span>{suggestion.name}</span>
                    <span className="text-xs text-gray-500 capitalize">{suggestion.category}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <input
            type="text"
            value={newItemQuantity}
            onChange={(e) => setNewItemQuantity(e.target.value)}
            placeholder="Quantity (e.g., 2)"
            className="w-full md:w-24 input-field"
          />
          <input
            type="text"
            value={newItemUnit}
            onChange={(e) => setNewItemUnit(e.target.value)}
            placeholder="Unit (e.g., cups)"
            className="w-full md:w-32 input-field"
          />
          <select
            value={newItemCategory}
            onChange={(e) => setNewItemCategory(e.target.value)}
            className="w-full md:w-40 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sage focus:border-sage"
          >
            <option value="produce">Produce</option>
            <option value="dairy">Dairy</option>
            <option value="meat">Meat</option>
            <option value="seafood">Seafood</option>
            <option value="grains">Grains</option>
            <option value="pantry">Pantry</option>
            <option value="other">Other</option>
          </select>
          <button 
            type="submit" 
            className="btn-primary whitespace-nowrap"
            disabled={submitLoading}
          >
            {submitLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding...
              </span>
            ) : (
              'Add Item'
            )}
          </button>
        </form>
      </div>
      
      {/* Bulk operations */}
      {selectedList.items.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-md mb-8">
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => handleBulkOperation('check')} 
              className="btn-secondary btn-sm"
            >
              Check All
            </button>
            <button 
              onClick={() => handleBulkOperation('uncheck')} 
              className="btn-secondary btn-sm"
            >
              Uncheck All
            </button>
            <button 
              onClick={() => handleBulkOperation('delete')} 
              className="btn-danger btn-sm"
            >
              Clear Checked Items
            </button>
          </div>
        </div>
      )}
      
      {/* Shopping list */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-serif font-bold text-navy">
              {selectedList.name}
            </h2>
            <div>
              <span className="text-gray-600">
                {selectedList.items.filter(item => item.checked).length} of {selectedList.items.length} items checked
              </span>
            </div>
          </div>
        </div>
        
        {loadingItems ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sage mx-auto mb-4"></div>
            <p className="text-gray-500">Loading items...</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {groupedItems.map(([category, items]) => (
              <div key={category} className="p-6">
                <h3 className="text-lg font-medium text-navy capitalize mb-4">
                  {category}
                </h3>
                <ul className="space-y-3">
                  {items.map(item => (
                    <li 
                      key={item.id} 
                      className="flex items-start gap-3"
                    >
                      <div className="flex-shrink-0 pt-1">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => handleToggleItem(item.id)}
                          className="h-5 w-5 text-sage rounded focus:ring-sage"
                        />
                      </div>
                      <div className={`flex-grow ${item.checked ? 'line-through text-gray-400' : ''}`}>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-600">
                          {item.quantity} {item.unit}
                        </div>
                      </div>
                      <button 
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteItem(item.id)}
                        aria-label="Delete item"
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="h-5 w-5" 
                          viewBox="0 0 20 20" 
                          fill="currentColor"
                        >
                          <path 
                            fillRule="evenodd" 
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" 
                            clipRule="evenodd" 
                          />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            
            {selectedList.items.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <p>No items in this shopping list yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
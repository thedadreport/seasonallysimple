'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { ShoppingList, ShoppingListItem } from '@/types/shoppingList';
import ShoppingListShareModal from '@/app/components/ShoppingListShareModal';
import { useNetwork } from '@/app/components/NetworkStatusProvider';
import { handleError } from '@/lib/utils/errorHandling';
import * as shoppingListService from '@/lib/services/shoppingListService';
import LoadingSkeleton from '@/app/components/ui/LoadingSkeleton';
import ErrorDisplay from '@/app/components/ui/ErrorDisplay';

interface Suggestion {
  name: string;
  category: string;
}

export default function ShoppingListPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { online } = useNetwork();
  
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
  
  // State for share modal
  const [showShareModal, setShowShareModal] = useState(false);
  
  // Authentication check
  useEffect(() => {
    if (status === 'unauthenticated') {
      // Redirect to login if not authenticated
      router.push('/login?callbackUrl=/shopping-list');
    }
  }, [status, router]);
  
  // Fetch shopping lists
  const fetchShoppingLists = useCallback(async (options?: { forceFresh?: boolean }) => {
    if (status !== 'authenticated') return;
    
    setLoadingLists(true);
    setError(null);
    
    try {
      const lists = await shoppingListService.fetchShoppingLists({
        forceFresh: options?.forceFresh || false,
        showToast: false
      });
      
      setLists(lists);
      
      // Check if there's a listId in the URL
      const url = new URL(window.location.href);
      const listIdParam = url.searchParams.get('listId');
      
      if (listIdParam && lists.some(list => list.id === listIdParam)) {
        // If the listId from URL exists in our lists, select it
        setSelectedListId(listIdParam);
      } else if (lists.length > 0 && !selectedListId) {
        // Otherwise select the first list
        setSelectedListId(lists[0].id);
      }
      
    } catch (err) {
      console.error('Error fetching shopping lists:', err);
      setError(err instanceof Error ? err.message : 'Failed to load shopping lists');
      handleError(err, 'Failed to load shopping lists');
    } finally {
      setLoadingLists(false);
      setLoading(false);
    }
  }, [status, selectedListId]);
  
  // Fetch a single shopping list
  const fetchShoppingList = useCallback(async (listId: string, options?: { forceFresh?: boolean }) => {
    if (!listId || status !== 'authenticated') return;
    
    setLoadingItems(true);
    setError(null);
    
    try {
      const list = await shoppingListService.fetchShoppingList(listId, {
        forceFresh: options?.forceFresh || false,
        showToast: false
      });
      
      if (list) {
        // Update the list in our state
        setLists(prevLists => {
          const updatedLists = [...prevLists];
          const index = updatedLists.findIndex(l => l.id === listId);
          
          if (index !== -1) {
            updatedLists[index] = list;
          } else {
            updatedLists.push(list);
          }
          
          return updatedLists;
        });
      }
      
    } catch (err) {
      console.error('Error fetching shopping list:', err);
      setError(err instanceof Error ? err.message : 'Failed to load shopping list');
      handleError(err, 'Failed to load shopping list details');
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
  
  // State for expanded/collapsed category sections
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  
  // Group items by category with improved ordering
  const groupedItems = selectedList ? 
    Object.entries(
      selectedList.items.reduce((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
      }, {} as Record<string, ShoppingListItem[]>)
    ).sort((a, b) => {
      // Custom category ordering
      const categoryOrder = [
        'produce', 
        'dairy', 
        'meat', 
        'seafood', 
        'grains', 
        'Fresh Herbs',
        'Herbs & Spices', 
        'Spices',
        'Baking',
        'Canned Goods', 
        'Oils & Vinegars',
        'Condiments',
        'pantry', 
        'other'
      ];
      
      const indexA = categoryOrder.indexOf(a[0]);
      const indexB = categoryOrder.indexOf(b[0]);
      
      if (indexA === -1 && indexB === -1) {
        // If neither category is in our ordering, sort alphabetically
        return a[0].localeCompare(b[0]);
      }
      
      if (indexA === -1) return 1; // Unknown categories go to the end
      if (indexB === -1) return -1;
      
      return indexA - indexB;
    }) : [];
    
  // Initialize expanded state for all categories
  useEffect(() => {
    if (selectedList) {
      const categories = groupedItems.map(([category]) => category);
      const initialExpandedState = categories.reduce((acc, category) => {
        acc[category] = true; // Start with all categories expanded
        return acc;
      }, {} as Record<string, boolean>);
      setExpandedCategories(initialExpandedState);
    }
  }, [selectedList?.id]); // Only when the selected list changes
  
  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };
  
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
      await shoppingListService.updateShoppingListItems(
        selectedListId,
        [{ id: itemId, checked: !item.checked }]
      );
    } catch (err) {
      handleError(err, 'Failed to update item');
      
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
      toast('No items to update');
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
      await shoppingListService.bulkOperationOnItems(
        selectedListId, 
        operation, 
        itemIds
      );
      
      toast.success(`Successfully ${operation === 'check' ? 'checked' : operation === 'uncheck' ? 'unchecked' : 'deleted'} items`);
    } catch (err) {
      handleError(err, `Failed to ${operation} items`);
      
      // Revert the optimistic update by refreshing the list
      fetchShoppingList(selectedListId, { forceFresh: online });
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
      await shoppingListService.deleteShoppingListItem(selectedListId, itemId);
      toast.success('Item deleted successfully');
    } catch (err) {
      handleError(err, 'Failed to delete item');
      
      // Revert the optimistic update by refreshing the list
      fetchShoppingList(selectedListId, { forceFresh: online });
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
      const items = await shoppingListService.addItemsToShoppingList(
        selectedListId,
        [newItem]
      );
      
      if (items && items.length > 0) {
        // Reset form
        setNewItemName('');
        setNewItemQuantity('');
        setNewItemUnit('');
        setNewItemCategory('other');
        
        toast.success('Item added successfully');
        
        // Refresh the list to get the most up-to-date data
        fetchShoppingList(selectedListId, { forceFresh: online });
      }
    } catch (err) {
      handleError(err, 'Failed to add item');
    } finally {
      setSubmitLoading(false);
    }
  };
  
  // Handle creating a new shopping list
  const handleCreateShoppingList = async (mealPlanId: string) => {
    try {
      const newList = await shoppingListService.createShoppingList({
        name: `Shopping List for Meal Plan`,
        mealPlanId
      });
      
      if (newList) {
        toast.success('Shopping list created successfully');
        
        // Refresh lists and select the new list
        await fetchShoppingLists({ forceFresh: true });
        setSelectedListId(newList.id);
      }
    } catch (err) {
      handleError(err, 'Failed to create shopping list');
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
    return <LoadingSkeleton type="shopping-list" />;
  }
  
  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    return null; // useEffect will handle the redirect
  }
  
  // Render error state
  if (error) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={() => fetchShoppingLists({ forceFresh: true })}
        title="Shopping Lists"
      />
    );
  }
  
  // Handle creating an empty shopping list
  const handleCreateEmptyShoppingList = async () => {
    try {
      const newList = await shoppingListService.createShoppingList({
        name: `Shopping List ${new Date().toLocaleDateString()}`
      });
      
      if (newList) {
        toast.success('Shopping list created successfully');
        
        // Refresh lists and select the new list
        await fetchShoppingLists({ forceFresh: true });
        setSelectedListId(newList.id);
      }
    } catch (err) {
      handleError(err, 'Failed to create shopping list');
    }
  };

  // Render empty state
  if (lists.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-3xl font-serif font-bold text-navy mb-8">Shopping Lists</h1>
        
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-lg mb-6">You don't have any shopping lists yet.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleCreateEmptyShoppingList}
              className="btn-primary"
            >
              Create Empty Shopping List
            </button>
            <Link href="/meal-plan" className="btn-secondary">
              Create from Meal Plan
            </Link>
          </div>
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
            onClick={() => setShowShareModal(true)}
          >
            Share & Export
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
                <div className="flex items-center justify-between cursor-pointer mb-2" onClick={() => toggleCategory(category)}>
                  <h3 className="text-lg font-medium text-navy capitalize">
                    {category}
                    <span className="ml-2 text-sm text-gray-600">({items.length} items)</span>
                  </h3>
                  <div className="text-gray-500">
                    {expandedCategories[category] ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                {expandedCategories[category] && (
                  <ul className="space-y-3 mt-2">
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
                        <div className="font-medium relative group">
                          {item.name}
                          {item.originalIngredients && typeof item.originalIngredients !== 'string' && item.originalIngredients.length > 1 && (
                            <div className="hidden group-hover:block absolute z-10 bg-white p-3 rounded-lg shadow-lg w-60 border border-gray-200 left-0 top-6">
                              <div className="text-xs font-semibold text-gray-500 mb-1">Consolidated from:</div>
                              <ul className="text-xs text-gray-600">
                                {item.originalIngredients.map((orig, idx) => (
                                  <li key={idx} className="mb-1 pb-1 border-b border-gray-100 last:border-0">
                                    {orig.name}: {orig.quantity} {orig.unit}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {item.originalIngredients && typeof item.originalIngredients !== 'string' && item.originalIngredients.length > 1 && (
                            <span className="ml-2 text-xs text-blue-500 align-text-top cursor-help">
                              (combined)
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {item.quantity} {item.unit}
                        </div>
                        {item.name.includes('bulk') && (
                          <div className="text-xs mt-1 text-green-600 font-medium bg-green-50 rounded-full px-2 py-0.5 inline-block">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1z" clipRule="evenodd" />
                              <path d="M12 2a2 2 0 12 0v8a2 2 0 11-2 0V4z" />
                            </svg>
                            Bulk savings
                          </div>
                        )}
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
                )}
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
      
      {/* Share Modal */}
      <ShoppingListShareModal 
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shoppingList={selectedList}
      />
    </div>
  );
}
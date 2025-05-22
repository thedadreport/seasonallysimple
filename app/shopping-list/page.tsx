'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Define types for shopping list data
interface ShoppingListItem {
  id: string;
  name: string;
  quantity: string;
  unit?: string;
  category: string;
  checked: boolean;
}

interface ShoppingList {
  id: string;
  name: string;
  userId: string;
  mealPlanId?: string;
  createdAt: string;
  updatedAt: string;
  items: ShoppingListItem[];
}

export default function ShoppingListPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  
  // Mock data for now, we'll replace with actual API call
  const mockLists: ShoppingList[] = [
    {
      id: '1',
      name: 'Weekly Grocery List',
      userId: 'user123',
      mealPlanId: 'meal-plan-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: [
        { id: '101', name: 'Chicken breast', quantity: '2 lbs', category: 'meat', checked: false },
        { id: '102', name: 'Brown rice', quantity: '1 cup', category: 'grains', checked: false },
        { id: '103', name: 'Broccoli', quantity: '1 head', category: 'produce', checked: false },
        { id: '104', name: 'Olive oil', quantity: '2 tbsp', category: 'pantry', checked: true },
        { id: '105', name: 'Garlic', quantity: '3 cloves', category: 'produce', checked: false },
        { id: '106', name: 'Salt', quantity: '1 tsp', category: 'pantry', checked: true },
        { id: '107', name: 'Black pepper', quantity: '1/2 tsp', category: 'pantry', checked: true },
        { id: '108', name: 'Asparagus', quantity: '1 bunch', category: 'produce', checked: false },
        { id: '109', name: 'Arborio rice', quantity: '1 1/2 cups', category: 'grains', checked: false },
        { id: '110', name: 'Parmesan cheese', quantity: '1/2 cup', category: 'dairy', checked: false },
        { id: '111', name: 'Avocado', quantity: '2', category: 'produce', checked: false },
        { id: '112', name: 'Eggs', quantity: '4', category: 'dairy', checked: true },
        { id: '113', name: 'Bread', quantity: '1 loaf', category: 'grains', checked: false },
        { id: '114', name: 'Spring vegetables', quantity: '2 cups mixed', category: 'produce', checked: false },
      ]
    }
  ];
  
  // Load shopping lists
  useEffect(() => {
    // In a real app, we would fetch data from API
    // For now, just use mock data
    setLists(mockLists);
    setSelectedListId(mockLists[0]?.id || null);
    setLoading(false);
  }, []);
  
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
    ) : [];
    
  // Handle item check/uncheck
  const handleToggleItem = (itemId: string) => {
    setLists(prevLists => 
      prevLists.map(list => {
        if (list.id === selectedListId) {
          return {
            ...list,
            items: list.items.map(item => {
              if (item.id === itemId) {
                return { ...item, checked: !item.checked };
              }
              return item;
            })
          };
        }
        return list;
      })
    );
    
    // In a real app, we would update the item in the database
    // api.put(`/shopping-lists/${selectedListId}/items`, { items: [{ id: itemId, checked: !item.checked }] })
  };
  
  // Handle adding a new item
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('other');
  
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newItemName.trim()) return;
    
    const newItem: ShoppingListItem = {
      id: `new-${Date.now()}`, // temporary ID
      name: newItemName,
      quantity: newItemQuantity || '1',
      category: newItemCategory,
      checked: false
    };
    
    setLists(prevLists => 
      prevLists.map(list => {
        if (list.id === selectedListId) {
          return {
            ...list,
            items: [...list.items, newItem]
          };
        }
        return list;
      })
    );
    
    // Reset form
    setNewItemName('');
    setNewItemQuantity('');
    setNewItemCategory('other');
    
    // In a real app, we would add the item to the database
    // api.post(`/shopping-lists/${selectedListId}/items`, { name, quantity, category })
  };
  
  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sage"></div>
      </div>
    );
  }
  
  // The shopping list doesn't require authentication for now.
  // Auth will be re-enabled after testing and final deployment.
  
  if (!selectedList) {
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
          <button className="btn-primary">
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
              <option key={list.id} value={list.id}>{list.name}</option>
            ))}
          </select>
        </div>
      )}
      
      {/* Add new item form */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-lg font-medium text-navy mb-4">Add Item</h2>
        <form onSubmit={handleAddItem} className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Item name"
            className="flex-grow input-field"
            required
          />
          <input
            type="text"
            value={newItemQuantity}
            onChange={(e) => setNewItemQuantity(e.target.value)}
            placeholder="Quantity (e.g., 2 cups)"
            className="w-full md:w-40 input-field"
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
          <button type="submit" className="btn-primary whitespace-nowrap">
            Add Item
          </button>
        </form>
      </div>
      
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
                      <div className="text-sm text-gray-600">{item.quantity} {item.unit}</div>
                    </div>
                    <button className="text-red-500 hover:text-red-700">
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
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface Ingredient {
  name: string;
  quantity: string;
  unit?: string | null;
  category: string;
  recipeTitle?: string;
}

interface ShoppingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealPlanId: string;
  mealPlanName: string;
  onSuccess: (shoppingListId: string) => void;
}

export default function ShoppingListModal({
  isOpen,
  onClose,
  mealPlanId,
  mealPlanName,
  onSuccess
}: ShoppingListModalProps) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'loading' | 'review' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [listName, setListName] = useState(`Shopping List for ${mealPlanName}`);
  
  // Fetch ingredients when the modal opens
  useEffect(() => {
    if (isOpen) {
      fetchIngredients();
    }
  }, [isOpen, mealPlanId]);
  
  // Reset the modal state when it closes
  useEffect(() => {
    if (!isOpen) {
      setStep('loading');
      setError(null);
      setIngredients([]);
    }
  }, [isOpen]);
  
  // Fetch ingredients from the meal plan
  const fetchIngredients = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/meal-plans/${mealPlanId}/ingredients`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to fetch ingredients');
      }
      
      const data = await response.json();
      
      if (data.ingredients && data.ingredients.length > 0) {
        // Process and consolidate ingredients
        const consolidatedIngredients = consolidateIngredients(data.ingredients);
        setIngredients(consolidatedIngredients);
        setStep('review');
      } else {
        setError('No ingredients found in this meal plan. Make sure you have added recipes with ingredients.');
        setStep('error');
      }
    } catch (err) {
      console.error('Error fetching ingredients:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch ingredients');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };
  
  // Consolidate duplicate ingredients
  const consolidateIngredients = (ingredients: Ingredient[]): Ingredient[] => {
    const ingredientMap = new Map<string, Ingredient>();
    
    ingredients.forEach(ingredient => {
      const key = `${ingredient.name.toLowerCase().trim()}|${ingredient.unit || ''}`.toLowerCase();
      
      if (ingredientMap.has(key)) {
        const existing = ingredientMap.get(key)!;
        
        // Try to parse and add quantities if they have the same unit
        try {
          const existingQty = parseFloat(existing.quantity);
          const newQty = parseFloat(ingredient.quantity);
          
          if (!isNaN(existingQty) && !isNaN(newQty)) {
            const total = existingQty + newQty;
            existing.quantity = total.toString();
          } else {
            // If we can't parse the quantities, just append them
            existing.quantity = `${existing.quantity}, ${ingredient.quantity}`;
          }
          
          // Add the recipe title to track source
          if (ingredient.recipeTitle && !existing.recipeTitle?.includes(ingredient.recipeTitle)) {
            existing.recipeTitle = existing.recipeTitle 
              ? `${existing.recipeTitle}, ${ingredient.recipeTitle}` 
              : ingredient.recipeTitle;
          }
        } catch (e) {
          // If there's any error in parsing, just append the quantities
          existing.quantity = `${existing.quantity}, ${ingredient.quantity}`;
        }
      } else {
        ingredientMap.set(key, { ...ingredient });
      }
    });
    
    // Convert the map back to an array and sort by category and name
    return Array.from(ingredientMap.values())
      .sort((a, b) => {
        if (a.category === b.category) {
          return a.name.localeCompare(b.name);
        }
        return a.category.localeCompare(b.category);
      });
  };
  
  // Remove an ingredient from the list
  const removeIngredient = (index: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  };
  
  // Add a new ingredient to the list
  const addIngredient = () => {
    setIngredients(prev => [
      ...prev,
      {
        name: '',
        quantity: '1',
        category: 'other',
        unit: null
      }
    ]);
  };
  
  // Update an ingredient in the list
  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    setIngredients(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      return updated;
    });
  };
  
  // State management
  // Note: pantry integration has been removed
  
  // Create the shopping list
  const createShoppingList = async () => {
    if (ingredients.length === 0) {
      toast.error('Cannot create an empty shopping list');
      return;
    }
    
    setLoading(true);
    console.log("Creating shopping list with ingredients:", ingredients);
    
    try {
      // First create the shopping list
      const createResponse = await fetch('/api/shopping-lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mealPlanId,
          name: listName,
          // Include the ingredients directly in the shopping list creation
          ingredients: ingredients.map(ingredient => ({
            name: ingredient.name,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            category: ingredient.category
          }))
        }),
      });
      
      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.message || errorData.error || 'Failed to create shopping list');
      }
      
      const createData = await createResponse.json();
      const shoppingListId = createData.shoppingList.id;
      
      // We're already sending ingredients with the initial creation request,
      // so we don't need to make a separate API call to add items
      // unless the shopping list was created but has no items
      if (!createData.shoppingList.items || createData.shoppingList.items.length === 0) {
        console.log("Shopping list was created but has no items. Adding items manually...");
        
        // Then add the ingredients as items
        const addItemsResponse = await fetch(`/api/shopping-lists/${shoppingListId}/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: ingredients.map(ingredient => ({
              name: ingredient.name,
              quantity: ingredient.quantity,
              unit: ingredient.unit,
              category: ingredient.category
            }))
          }),
        });
        
        if (!addItemsResponse.ok) {
          const errorData = await addItemsResponse.json();
          throw new Error(errorData.message || errorData.error || 'Failed to add items to shopping list');
        }
      }
      
      toast.success('Shopping list created successfully');
      onSuccess(shoppingListId);
      onClose();
      
    } catch (err) {
      console.error('Error creating shopping list:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to create shopping list');
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-medium">Create Shopping List</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {step === 'loading' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sage mb-4"></div>
            <p className="text-gray-600">Extracting ingredients from meal plan...</p>
          </div>
        )}
        
        {step === 'error' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-4 max-w-lg text-center">
              <p>{error}</p>
            </div>
            <button 
              onClick={fetchIngredients}
              className="btn-primary"
              disabled={loading}
            >
              Try Again
            </button>
          </div>
        )}
        
        {step === 'review' && (
          <>
            <div className="p-4 border-b">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shopping List Name
              </label>
              <input
                type="text"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                className="input-field w-full"
                disabled={loading}
                required
              />
              
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              <div className="mb-4 flex justify-between">
                <h3 className="text-lg font-medium">Review Ingredients</h3>
                <button
                  onClick={addIngredient}
                  className="btn-secondary btn-sm"
                  disabled={loading}
                >
                  Add Item
                </button>
              </div>
              
              {ingredients.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No ingredients found. Click "Add Item" to add manually.
                </div>
              ) : (
                <div className="divide-y">
                  {ingredients.map((ingredient, index) => (
                    <div key={index} className="py-3 flex items-start gap-4">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={ingredient.name}
                          onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                          className="input-field w-full mb-2"
                          placeholder="Ingredient name"
                          disabled={loading}
                          required
                        />
                        
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={ingredient.quantity}
                            onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                            className="input-field w-24"
                            placeholder="Qty"
                            disabled={loading}
                          />
                          
                          <input
                            type="text"
                            value={ingredient.unit || ''}
                            onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                            className="input-field w-24"
                            placeholder="Unit"
                            disabled={loading}
                          />
                          
                          <select
                            value={ingredient.category}
                            onChange={(e) => updateIngredient(index, 'category', e.target.value)}
                            className="input-field flex-1"
                            disabled={loading}
                          >
                            <option value="produce">Produce</option>
                            <option value="dairy">Dairy</option>
                            <option value="meat">Meat</option>
                            <option value="seafood">Seafood</option>
                            <option value="grains">Grains</option>
                            <option value="pantry">Pantry</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        
                        {ingredient.recipeTitle && (
                          <div className="text-xs text-gray-500 mt-1">
                            From: {ingredient.recipeTitle}
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => removeIngredient(index)}
                        className="text-red-500 hover:text-red-700"
                        disabled={loading}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t flex justify-end gap-4">
              <button
                onClick={onClose}
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={createShoppingList}
                className="btn-primary"
                disabled={loading || ingredients.length === 0}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </span>
                ) : (
                  'Create Shopping List'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
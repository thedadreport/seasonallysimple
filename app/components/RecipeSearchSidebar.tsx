'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Mock data for saved recipes (in a real app, this would come from API)
const mockSavedRecipes = [
  {
    id: '1',
    title: 'Mediterranean Lemon Herb Chicken with Spring Vegetables',
    prepTime: 10,
    cookTime: 20,
    totalTime: 30,
    servings: 4,
    estimatedCostPerServing: 3.75,
    tags: ['dinner', 'healthy', 'spring']
  },
  {
    id: '2',
    title: 'Spring Asparagus Risotto',
    prepTime: 15,
    cookTime: 30,
    totalTime: 45,
    servings: 4,
    estimatedCostPerServing: 2.50,
    tags: ['dinner', 'vegetarian', 'spring']
  },
  {
    id: '101',
    title: 'Avocado Toast with Poached Eggs',
    prepTime: 5,
    cookTime: 10,
    totalTime: 15,
    servings: 2,
    estimatedCostPerServing: 2.25,
    tags: ['breakfast', 'quick', 'vegetarian']
  },
  {
    id: '102',
    title: 'Spring Vegetable Soup',
    prepTime: 10,
    cookTime: 20,
    totalTime: 30,
    servings: 4,
    estimatedCostPerServing: 1.75,
    tags: ['lunch', 'soup', 'spring', 'vegetarian']
  },
  {
    id: '103',
    title: 'Berry Breakfast Smoothie Bowl',
    prepTime: 5,
    cookTime: 0,
    totalTime: 5,
    servings: 1,
    estimatedCostPerServing: 3.00,
    tags: ['breakfast', 'quick', 'vegetarian']
  },
  {
    id: '104',
    title: 'Grilled Salmon with Spring Pea Puree',
    prepTime: 10,
    cookTime: 15,
    totalTime: 25,
    servings: 2,
    estimatedCostPerServing: 5.50,
    tags: ['dinner', 'seafood', 'spring']
  }
];

interface Recipe {
  id: string;
  title: string;
  prepTime: number;
  cookTime: number;
  totalTime: number;
  servings: number;
  estimatedCostPerServing?: number;
  tags?: string[];
}

interface RecipeSearchSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRecipe: (recipe: Recipe, mealType: string, dayId: string) => void;
  selectedMealType?: string;
  selectedDayId?: string;
}

export default function RecipeSearchSidebar({
  isOpen,
  onClose,
  onSelectRecipe,
  selectedMealType,
  selectedDayId
}: RecipeSearchSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>(mockSavedRecipes);

  // All unique tags from recipes
  const allTags = Array.from(new Set(mockSavedRecipes.flatMap(recipe => recipe.tags || [])));

  useEffect(() => {
    // Filter recipes based on search term and selected tag
    const filtered = mockSavedRecipes.filter(recipe => {
      const matchesSearch = searchTerm === '' || 
        recipe.title.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTag = selectedTag === '' || 
        (recipe.tags && recipe.tags.includes(selectedTag));
      
      return matchesSearch && matchesTag;
    });
    
    setFilteredRecipes(filtered);
  }, [searchTerm, selectedTag]);

  // Calculate the estimated cost for the total recipe
  const getEstimatedTotalCost = (recipe: Recipe) => {
    return recipe.estimatedCostPerServing 
      ? (recipe.estimatedCostPerServing * recipe.servings).toFixed(2)
      : 'N/A';
  };

  // This would actually come from the meal type in a real implementation
  const getMealTypeTitle = () => {
    return selectedMealType 
      ? `Add to ${selectedMealType}` 
      : 'Select a Recipe';
  };

  return (
    <div className={`fixed inset-y-0 right-0 w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-medium text-navy">{getMealTypeTitle()}</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              placeholder="Search recipes..."
              className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTag('')}
              className={`text-xs px-2 py-1 rounded-full ${
                selectedTag === '' 
                  ? 'bg-sage text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`text-xs px-2 py-1 rounded-full ${
                  selectedTag === tag 
                    ? 'bg-sage text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {filteredRecipes.length > 0 ? (
            <div className="space-y-4">
              {filteredRecipes.map(recipe => (
                <div 
                  key={recipe.id} 
                  className="bg-cream rounded-lg p-3 cursor-pointer hover:bg-sage hover:bg-opacity-10 transition"
                  onClick={() => selectedDayId && selectedMealType 
                    ? onSelectRecipe(recipe, selectedMealType, selectedDayId)
                    : null
                  }
                >
                  <h3 className="font-medium text-navy text-sm mb-1">{recipe.title}</h3>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{recipe.totalTime} min</span>
                    <span>${recipe.estimatedCostPerServing?.toFixed(2)}/serving</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {recipe.tags?.map(tag => (
                      <span key={tag} className="text-xs bg-white bg-opacity-50 px-1.5 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-right">
                    Est. total: ${getEstimatedTotalCost(recipe)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <p>No recipes found</p>
              <p className="text-sm mt-1">Try adjusting your search</p>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <Link href="/recipe-generator" className="btn-secondary w-full text-center block">
            Generate New Recipe
          </Link>
        </div>
      </div>
    </div>
  );
}
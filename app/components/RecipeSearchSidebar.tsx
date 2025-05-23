'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Recipe {
  id: string;
  title: string;
  prepTime: number;
  cookTime: number;
  totalTime: number;
  servings: number;
  estimatedCostPerServing?: number;
  dietaryTags?: string[];
  difficulty?: string;
  season?: string;
  cuisineType?: string;
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
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);

  // Fetch recipes from API when sidebar opens
  useEffect(() => {
    const fetchRecipes = async () => {
      if (!isOpen) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/recipes');
        
        if (!response.ok) {
          throw new Error('Failed to fetch recipes');
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
          // Transform the data to match our Recipe interface
          const transformedRecipes: Recipe[] = data.data.map((recipe: any) => ({
            id: recipe.id,
            title: recipe.title,
            prepTime: recipe.timings?.prep || 0,
            cookTime: recipe.timings?.cook || 0,
            totalTime: recipe.timings?.total || 0,
            servings: recipe.servings || 4,
            estimatedCostPerServing: 3.50, // Default value since the API doesn't provide this
            dietaryTags: recipe.dietaryTags ? 
              (typeof recipe.dietaryTags === 'string' ? recipe.dietaryTags.split(',') : recipe.dietaryTags) : 
              [],
            difficulty: recipe.difficulty,
            season: recipe.season,
            cuisineType: recipe.cuisineType
          }));
          
          setRecipes(transformedRecipes);
          
          // Extract all unique tags
          const tags = Array.from(new Set(
            transformedRecipes.flatMap((recipe: Recipe) => 
              recipe.dietaryTags || []
            ).filter((tag: string) => tag && tag.trim() !== '')
          ));
          
          // Add additional category tags based on recipe properties
          const categoryTags = [
            ...new Set([
              ...transformedRecipes.map((r: Recipe) => r.difficulty || ''),
              ...transformedRecipes.map((r: Recipe) => r.season || ''),
              ...transformedRecipes.map((r: Recipe) => r.cuisineType || '')
            ].filter((tag: string) => tag && tag.trim() !== ''))
          ];
          
          setAllTags([...tags, ...categoryTags]);
          
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching recipes:', err);
        setError('Failed to load recipes. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecipes();
  }, [isOpen]);

  // Filter recipes based on search term and selected tag
  useEffect(() => {
    if (recipes.length === 0) {
      setFilteredRecipes([]);
      return;
    }
    
    const filtered = recipes.filter(recipe => {
      const matchesSearch = searchTerm === '' || 
        recipe.title.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTag = selectedTag === '' || 
        (recipe.dietaryTags && recipe.dietaryTags.includes(selectedTag)) ||
        recipe.difficulty === selectedTag ||
        recipe.season === selectedTag ||
        recipe.cuisineType === selectedTag;
      
      return matchesSearch && matchesTag;
    });
    
    setFilteredRecipes(filtered);
  }, [searchTerm, selectedTag, recipes]);

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
              disabled={isLoading}
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
          
          {!isLoading && (
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
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="flex justify-between mb-2">
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                  <div className="flex gap-1 mb-2">
                    <div className="h-3 bg-gray-200 rounded w-12"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-24 ml-auto"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p>{error}</p>
              <button 
                onClick={() => setIsOpen(true)} // This will trigger the useEffect to refetch
                className="mt-3 text-sage underline text-sm"
              >
                Try again
              </button>
            </div>
          ) : filteredRecipes.length > 0 ? (
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
                    {recipe.dietaryTags && recipe.dietaryTags.map(tag => (
                      <span key={tag} className="text-xs bg-white bg-opacity-50 px-1.5 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                    {recipe.difficulty && (
                      <span className="text-xs bg-white bg-opacity-50 px-1.5 py-0.5 rounded">
                        {recipe.difficulty}
                      </span>
                    )}
                    {recipe.season && (
                      <span className="text-xs bg-white bg-opacity-50 px-1.5 py-0.5 rounded">
                        {recipe.season}
                      </span>
                    )}
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
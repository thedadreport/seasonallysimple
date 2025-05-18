'use client';

import { useState } from 'react';
import Link from 'next/link';

// Mock recipe data - in a real implementation, this would come from an API
const mockRecipes = [
  {
    id: '1',
    title: 'Mediterranean Lemon Herb Chicken',
    description: 'A bright, family-friendly dish featuring tender chicken and seasonal spring vegetables.',
    prepTime: 10,
    cookTime: 20,
    totalTime: 30,
    servings: 4,
    difficulty: 'EASY',
    season: 'SPRING',
    cuisineType: 'Mediterranean',
    dietaryTags: [],
    imageUrl: null,
    isAIGenerated: true
  },
  {
    id: '2',
    title: 'Spring Asparagus Risotto',
    description: 'Creamy risotto showcasing fresh spring asparagus and sweet peas.',
    prepTime: 15,
    cookTime: 30,
    totalTime: 45,
    servings: 4,
    difficulty: 'MEDIUM',
    season: 'SPRING',
    cuisineType: 'Italian',
    dietaryTags: ['vegetarian'],
    imageUrl: null,
    isAIGenerated: false
  },
  {
    id: '3',
    title: 'Strawberry Spinach Salad',
    description: 'A refreshing salad featuring sweet strawberries and tender spinach.',
    prepTime: 15,
    cookTime: 0,
    totalTime: 15,
    servings: 2,
    difficulty: 'EASY',
    season: 'SPRING',
    cuisineType: 'American',
    dietaryTags: ['vegetarian', 'gluten-free'],
    imageUrl: null,
    isAIGenerated: false
  },
  {
    id: '4',
    title: 'Herb-Crusted Rack of Lamb',
    description: 'Elegant rack of lamb with a flavorful herb crust, perfect for special occasions.',
    prepTime: 20,
    cookTime: 25,
    totalTime: 45,
    servings: 4,
    difficulty: 'MEDIUM',
    season: 'SPRING',
    cuisineType: 'French',
    dietaryTags: [],
    imageUrl: null,
    isAIGenerated: true
  },
  {
    id: '5',
    title: 'Spring Pea Soup with Mint',
    description: 'Light and vibrant soup highlighting the sweetness of fresh spring peas.',
    prepTime: 10,
    cookTime: 20,
    totalTime: 30,
    servings: 4,
    difficulty: 'EASY',
    season: 'SPRING',
    cuisineType: 'French',
    dietaryTags: ['vegetarian', 'gluten-free'],
    imageUrl: null,
    isAIGenerated: false
  },
  {
    id: '6',
    title: 'Lemon Garlic Shrimp Pasta',
    description: 'Quick and flavorful pasta dish with succulent shrimp and bright lemon flavor.',
    prepTime: 10,
    cookTime: 15,
    totalTime: 25,
    servings: 4,
    difficulty: 'EASY',
    season: 'SPRING',
    cuisineType: 'Italian',
    dietaryTags: [],
    imageUrl: null,
    isAIGenerated: true
  }
];

// Filter options
const difficulties = ['EASY', 'MEDIUM', 'HARD'];
const cuisines = ['All', 'Mediterranean', 'Italian', 'French', 'American'];
const dietaryOptions = ['vegetarian', 'gluten-free', 'dairy-free', 'vegan'];
const timeOptions = ['Under 30 min', 'Under 45 min', 'Under 60 min'];

export default function RecipesPage() {
  const [filters, setFilters] = useState({
    difficulty: '',
    cuisine: '',
    dietary: '',
    time: ''
  });
  
  // Apply filters to recipes
  const filteredRecipes = mockRecipes.filter(recipe => {
    if (filters.difficulty && recipe.difficulty !== filters.difficulty) return false;
    if (filters.cuisine && filters.cuisine !== 'All' && recipe.cuisineType !== filters.cuisine) return false;
    if (filters.dietary && !recipe.dietaryTags.includes(filters.dietary)) return false;
    if (filters.time) {
      if (filters.time === 'Under 30 min' && recipe.totalTime > 30) return false;
      if (filters.time === 'Under 45 min' && recipe.totalTime > 45) return false;
      if (filters.time === 'Under 60 min' && recipe.totalTime > 60) return false;
    }
    return true;
  });
  
  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType as keyof typeof prev] === value ? '' : value
    }));
  };
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-navy">
          Spring Recipes
        </h1>
        <Link href="/recipe-generator" className="btn-primary">
          Generate New Recipe
        </Link>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8 mb-12">
        <aside className="md:w-1/4 space-y-6">
          <div>
            <h3 className="font-serif font-semibold text-lg mb-3">Difficulty</h3>
            <div className="space-y-2">
              {difficulties.map(difficulty => (
                <button
                  key={difficulty}
                  onClick={() => handleFilterChange('difficulty', difficulty)}
                  className={`px-3 py-1 rounded-full text-sm mr-2 ${
                    filters.difficulty === difficulty
                      ? 'bg-sage text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {difficulty.charAt(0) + difficulty.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-serif font-semibold text-lg mb-3">Cuisine</h3>
            <div className="space-y-2">
              {cuisines.map(cuisine => (
                <button
                  key={cuisine}
                  onClick={() => handleFilterChange('cuisine', cuisine)}
                  className={`px-3 py-1 rounded-full text-sm mr-2 ${
                    filters.cuisine === cuisine
                      ? 'bg-sage text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {cuisine}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-serif font-semibold text-lg mb-3">Dietary</h3>
            <div className="space-y-2">
              {dietaryOptions.map(option => (
                <button
                  key={option}
                  onClick={() => handleFilterChange('dietary', option)}
                  className={`px-3 py-1 rounded-full text-sm mr-2 ${
                    filters.dietary === option
                      ? 'bg-sage text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-serif font-semibold text-lg mb-3">Time</h3>
            <div className="space-y-2">
              {timeOptions.map(option => (
                <button
                  key={option}
                  onClick={() => handleFilterChange('time', option)}
                  className={`px-3 py-1 rounded-full text-sm mr-2 ${
                    filters.time === option
                      ? 'bg-sage text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </aside>
        
        <div className="md:w-3/4">
          <p className="mb-4">
            {filteredRecipes.length} {filteredRecipes.length === 1 ? 'recipe' : 'recipes'} found
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            {filteredRecipes.map(recipe => (
              <div key={recipe.id} className="card">
                <div className="h-48 bg-sage bg-opacity-20 flex items-center justify-center">
                  {/* This would be an image in the real implementation */}
                  <span className="font-handwritten text-2xl">{recipe.title.charAt(0)}</span>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-serif font-semibold">{recipe.title}</h3>
                    {recipe.isAIGenerated && (
                      <span className="bg-honey bg-opacity-20 text-honey text-xs px-2 py-1 rounded-full">AI Generated</span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-4 line-clamp-2">{recipe.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-xs bg-cream px-2 py-1 rounded-full">
                      {recipe.totalTime} min
                    </span>
                    <span className="text-xs bg-cream px-2 py-1 rounded-full">
                      {recipe.difficulty.charAt(0) + recipe.difficulty.slice(1).toLowerCase()}
                    </span>
                    <span className="text-xs bg-cream px-2 py-1 rounded-full">
                      {recipe.cuisineType}
                    </span>
                    {recipe.dietaryTags.map(tag => (
                      <span key={tag} className="text-xs bg-cream px-2 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <Link href={`/recipes/${recipe.id}`} className="text-sage font-medium hover:underline">
                    View Recipe
                  </Link>
                </div>
              </div>
            ))}
          </div>
          
          {filteredRecipes.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-xl font-serif font-semibold mb-2">No recipes found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your filters or generate a new recipe.</p>
              <Link href="/recipe-generator" className="btn-primary">
                Generate New Recipe
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
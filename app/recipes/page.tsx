'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

// Define types for recipe data
type Recipe = {
  id: string;
  title: string;
  description: string;
  timings: {
    prep: number;
    cook: number;
    total: number;
  };
  servings: number;
  difficulty: string;
  season: string;
  cuisineType: string;
  dietaryTags: string[];
  imageUrl: string | null;
  isAIGenerated: boolean;
  createdAt: string;
  updatedAt: string;
};

// Filter options
const difficulties = ['EASY', 'MEDIUM', 'HARD'];
const seasons = ['ALL', 'SPRING', 'SUMMER', 'FALL', 'WINTER'];
const cuisines = ['All', 'Mediterranean', 'Italian', 'French', 'American', 'Asian', 'Mexican', 'Indian', 'Other'];
const dietaryOptions = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'low-carb', 'keto', 'paleo'];
const timeOptions = ['Under 30 min', 'Under 45 min', 'Under 60 min'];

export default function RecipesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State for recipes and loading
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalRecipes, setTotalRecipes] = useState(0);
  
  // Get filter values from URL or default to empty
  const [filters, setFilters] = useState({
    difficulty: searchParams.get('difficulty') || '',
    season: searchParams.get('season') || '',
    cuisine: searchParams.get('cuisine') || '',
    dietary: searchParams.get('dietary') || '',
    time: searchParams.get('time') || '',
    search: searchParams.get('search') || '',
  });
  
  // Pagination state
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [limit] = useState(10);
  
  // Fetch recipes when filters or pagination change
  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true);
      try {
        // Build query string from filters
        const queryParams = new URLSearchParams();
        if (filters.difficulty) queryParams.append('difficulty', filters.difficulty);
        if (filters.season) queryParams.append('season', filters.season);
        if (filters.cuisine && filters.cuisine !== 'All') queryParams.append('cuisine', filters.cuisine);
        if (filters.dietary) queryParams.append('dietary', filters.dietary);
        if (filters.search) queryParams.append('search', filters.search);
        
        // Add time filter
        if (filters.time) {
          let maxTime = 0;
          if (filters.time === 'Under 30 min') maxTime = 30;
          if (filters.time === 'Under 45 min') maxTime = 45;
          if (filters.time === 'Under 60 min') maxTime = 60;
          if (maxTime > 0) queryParams.append('maxTime', maxTime.toString());
        }
        
        // Add pagination
        queryParams.append('page', page.toString());
        queryParams.append('limit', limit.toString());
        
        // Fetch recipes from API
        const response = await fetch(`/api/recipes?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch recipes');
        }
        
        const data = await response.json();
        
        setRecipes(data.data);
        setTotalRecipes(data.pagination.total);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching recipes:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecipes();
  }, [filters, page, limit]);
  
  // Update URL and state when filters change
  const handleFilterChange = (filterType: string, value: string) => {
    // Toggle filter value
    const newValue = filters[filterType as keyof typeof filters] === value ? '' : value;
    
    // Update state
    setFilters(prev => ({
      ...prev,
      [filterType]: newValue
    }));
    
    // Reset to page 1 when filters change
    setPage(1);
    
    // Update URL with new filters
    const params = new URLSearchParams(searchParams.toString());
    if (newValue) {
      params.set(filterType, newValue);
    } else {
      params.delete(filterType);
    }
    params.set('page', '1');
    
    // Update URL without full reload
    router.push(`/recipes?${params.toString()}`, { scroll: false });
  };
  
  // Handle search input
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Update URL with search term
    const params = new URLSearchParams(searchParams.toString());
    if (filters.search) {
      params.set('search', filters.search);
    } else {
      params.delete('search');
    }
    params.set('page', '1');
    
    // Update URL without full reload
    router.push(`/recipes?${params.toString()}`, { scroll: false });
  };
  
  // Handle pagination
  const goToPage = (newPage: number) => {
    setPage(newPage);
    
    // Update URL with new page
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    
    // Update URL without full reload
    router.push(`/recipes?${params.toString()}`, { scroll: false });
  };
  
  // Calculate total pages
  const totalPages = Math.ceil(totalRecipes / limit);
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-navy">
          Recipes
        </h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/recipes/add" className="btn-primary">
            Add Recipe
          </Link>
          <Link href="/recipe-generator" className="btn-secondary">
            Generate New Recipe
          </Link>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8 mb-12">
        <aside className="md:w-1/4 space-y-6">
          {/* Search Box */}
          <div className="mb-6">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search recipes..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full p-2 pl-3 pr-10 border border-gray-300 rounded-md"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                >
                  🔍
                </button>
              </div>
            </form>
          </div>
          
          {/* Season Filter */}
          <div>
            <h3 className="font-serif font-semibold text-lg mb-3">Season</h3>
            <div className="flex flex-wrap gap-2">
              {seasons.map(season => (
                <button
                  key={season}
                  onClick={() => handleFilterChange('season', season)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    filters.season === season
                      ? 'bg-sage text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {season.charAt(0) + season.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
          
          {/* Difficulty Filter */}
          <div>
            <h3 className="font-serif font-semibold text-lg mb-3">Difficulty</h3>
            <div className="flex flex-wrap gap-2">
              {difficulties.map(difficulty => (
                <button
                  key={difficulty}
                  onClick={() => handleFilterChange('difficulty', difficulty)}
                  className={`px-3 py-1 rounded-full text-sm ${
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
          
          {/* Cuisine Filter */}
          <div>
            <h3 className="font-serif font-semibold text-lg mb-3">Cuisine</h3>
            <div className="flex flex-wrap gap-2">
              {cuisines.map(cuisine => (
                <button
                  key={cuisine}
                  onClick={() => handleFilterChange('cuisine', cuisine)}
                  className={`px-3 py-1 rounded-full text-sm ${
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
          
          {/* Dietary Filter */}
          <div>
            <h3 className="font-serif font-semibold text-lg mb-3">Dietary</h3>
            <div className="flex flex-wrap gap-2">
              {dietaryOptions.map(option => (
                <button
                  key={option}
                  onClick={() => handleFilterChange('dietary', option)}
                  className={`px-3 py-1 rounded-full text-sm ${
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
          
          {/* Time Filter */}
          <div>
            <h3 className="font-serif font-semibold text-lg mb-3">Time</h3>
            <div className="flex flex-wrap gap-2">
              {timeOptions.map(option => (
                <button
                  key={option}
                  onClick={() => handleFilterChange('time', option)}
                  className={`px-3 py-1 rounded-full text-sm ${
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
          
          {/* Clear Filters Button */}
          {(filters.difficulty || filters.cuisine || filters.dietary || filters.time || filters.search || filters.season) && (
            <button
              onClick={() => {
                setFilters({
                  difficulty: '',
                  season: '',
                  cuisine: '',
                  dietary: '',
                  time: '',
                  search: '',
                });
                setPage(1);
                router.push('/recipes', { scroll: false });
              }}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Clear All Filters
            </button>
          )}
        </aside>
        
        {/* Main Content */}
        <div className="md:w-3/4">
          {/* Recipe Count */}
          <div className="flex justify-between items-center mb-4">
            <p>
              {totalRecipes} {totalRecipes === 1 ? 'recipe' : 'recipes'} found
            </p>
            
            {/* Applied Filters Tags */}
            <div className="flex flex-wrap gap-2">
              {filters.search && (
                <span className="bg-sage bg-opacity-20 text-sage text-xs px-2 py-1 rounded-full flex items-center">
                  Search: {filters.search}
                  <button 
                    onClick={() => handleFilterChange('search', filters.search)} 
                    className="ml-1 text-sage hover:text-sage-dark"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          </div>
          
          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading recipes...</p>
            </div>
          )}
          
          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <h3 className="text-xl font-serif font-semibold mb-2">Error</h3>
              <p className="text-red-600 mb-6">{error}</p>
            </div>
          )}
          
          {/* Recipes Grid */}
          {!loading && !error && (
            <div className="grid md:grid-cols-2 gap-6">
              {recipes.map(recipe => (
                <div key={recipe.id} className="card">
                  <div className="h-48 bg-sage bg-opacity-20 flex items-center justify-center">
                    {recipe.imageUrl ? (
                      <img 
                        src={recipe.imageUrl} 
                        alt={recipe.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-handwritten text-2xl">{recipe.title.charAt(0)}</span>
                    )}
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
                        {recipe.timings.total} min
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
          )}
          
          {/* No Results State */}
          {!loading && !error && recipes.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-xl font-serif font-semibold mb-2">No recipes found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your filters or add a new recipe.</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/recipes/add" className="btn-primary">
                  Add Recipe
                </Link>
                <Link href="/recipe-generator" className="btn-secondary">
                  Generate New Recipe
                </Link>
              </div>
            </div>
          )}
          
          {/* Pagination */}
          {!loading && !error && totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <nav className="flex items-center gap-2" aria-label="Pagination">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1}
                  className={`px-3 py-1 rounded-md ${
                    page === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-sage hover:bg-sage-50'
                  }`}
                >
                  Previous
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Show first page, last page, current page, and pages around current
                  let pageNum;
                  
                  if (totalPages <= 5) {
                    // Show all pages if 5 or fewer
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    // Near the start
                    if (i < 4) {
                      pageNum = i + 1;
                    } else {
                      pageNum = totalPages;
                    }
                  } else if (page >= totalPages - 2) {
                    // Near the end
                    if (i === 0) {
                      pageNum = 1;
                    } else {
                      pageNum = totalPages - 4 + i;
                    }
                  } else {
                    // In the middle
                    if (i === 0) {
                      pageNum = 1;
                    } else if (i === 4) {
                      pageNum = totalPages;
                    } else {
                      pageNum = page - 1 + i;
                    }
                  }
                  
                  // Show ellipsis instead of page number
                  if ((i === 1 && pageNum !== 2 && totalPages > 5) || 
                      (i === 3 && pageNum !== totalPages - 1 && totalPages > 5)) {
                    return (
                      <span key={`ellipsis-${i}`} className="px-3 py-1">
                        ...
                      </span>
                    );
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`px-3 py-1 rounded-md ${
                        page === pageNum 
                          ? 'bg-sage text-white' 
                          : 'text-sage hover:bg-sage-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages}
                  className={`px-3 py-1 rounded-md ${
                    page === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-sage hover:bg-sage-50'
                  }`}
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
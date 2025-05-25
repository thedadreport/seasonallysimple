'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { RecipeVisibility, ModerationStatus } from '@prisma/client';

type Recipe = {
  id: string;
  title: string;
  description: string;
  timings: {
    prep: number;
    cook: number;
    total: number;
  };
  imageUrl: string | null;
  isAIGenerated: boolean;
  visibility: RecipeVisibility;
  moderationStatus: ModerationStatus;
  publishedAt: string | null;
  moderationNotes: string | null;
  isPublic: boolean;
  isPending: boolean;
  isRejected: boolean;
  isApproved: boolean;
  isCurated: boolean;
};

type PaginationData = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export default function MyRecipesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Redirect if not logged in
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/recipes/my');
    }
  }, [status, router]);

  // Fetch recipes based on filters
  const fetchRecipes = async (page = 1, status: string | null = null, search = '') => {
    try {
      setLoading(true);
      
      let url = `/api/recipes/my?page=${page}&limit=${pagination.limit}`;
      if (status) url += `&status=${status}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch recipes');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setRecipes(data.data);
        setPagination(data.pagination);
      } else {
        throw new Error(data.error?.message || 'Something went wrong');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (status === 'authenticated') {
      const statusMap: Record<string, string | null> = {
        'all': null,
        'private': 'PRIVATE',
        'pending': 'PENDING',
        'approved': 'APPROVED',
        'rejected': 'REJECTED'
      };
      
      fetchRecipes(1, statusMap[activeTab], searchTerm);
    }
  }, [status, activeTab, searchTerm]);

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRecipes(1, null, searchTerm);
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    const statusMap: Record<string, string | null> = {
      'all': null,
      'private': 'PRIVATE',
      'pending': 'PENDING',
      'approved': 'APPROVED',
      'rejected': 'REJECTED'
    };
    
    fetchRecipes(newPage, statusMap[activeTab], searchTerm);
  };

  // Handle publish recipe
  const handlePublishRecipe = async (recipeId: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/recipes/${recipeId}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      
      if (!response.ok) {
        throw new Error('Failed to publish recipe');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh the recipes list
        const statusMap: Record<string, string | null> = {
          'all': null,
          'private': 'PRIVATE',
          'pending': 'PENDING',
          'approved': 'APPROVED',
          'rejected': 'REJECTED'
        };
        
        fetchRecipes(pagination.page, statusMap[activeTab], searchTerm);
      } else {
        throw new Error(data.error?.message || 'Something went wrong');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Recipes</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Recipes</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <button 
            className="mt-2 text-sm underline"
            onClick={() => {
              setError(null);
              fetchRecipes(1);
            }}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-3xl font-bold">My Recipes</h1>
        
        <Link 
          href="/recipes/add"
          className="mt-4 md:mt-0 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition"
        >
          Create New Recipe
        </Link>
      </div>
      
      {/* Filter Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
          <li className="mr-2">
            <button
              className={`inline-block p-4 rounded-t-lg ${activeTab === 'all' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'border-transparent hover:text-gray-600 hover:border-gray-300'}`}
              onClick={() => handleTabChange('all')}
            >
              All Recipes
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block p-4 rounded-t-lg ${activeTab === 'private' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'border-transparent hover:text-gray-600 hover:border-gray-300'}`}
              onClick={() => handleTabChange('private')}
            >
              Private
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block p-4 rounded-t-lg ${activeTab === 'pending' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'border-transparent hover:text-gray-600 hover:border-gray-300'}`}
              onClick={() => handleTabChange('pending')}
            >
              Pending Review
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block p-4 rounded-t-lg ${activeTab === 'approved' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'border-transparent hover:text-gray-600 hover:border-gray-300'}`}
              onClick={() => handleTabChange('approved')}
            >
              Published
            </button>
          </li>
          <li>
            <button
              className={`inline-block p-4 rounded-t-lg ${activeTab === 'rejected' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'border-transparent hover:text-gray-600 hover:border-gray-300'}`}
              onClick={() => handleTabChange('rejected')}
            >
              Rejected
            </button>
          </li>
        </ul>
      </div>
      
      {/* Search */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search your recipes..."
            className="flex-grow px-4 py-2 border border-gray-300 rounded-l-md focus:ring-emerald-500 focus:border-emerald-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 text-white rounded-r-md hover:bg-emerald-700"
          >
            Search
          </button>
        </div>
      </form>
      
      {/* Recipes Grid */}
      {recipes.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-medium text-gray-600 mb-4">No recipes found</h3>
          <p className="text-gray-500 mb-6">
            {activeTab === 'all' 
              ? "You haven't created any recipes yet."
              : `You don't have any ${activeTab.toLowerCase()} recipes.`}
          </p>
          <Link
            href="/recipes/add"
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition"
          >
            Create Your First Recipe
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
              <div className="relative h-48 bg-gray-200">
                {recipe.imageUrl ? (
                  <Image
                    src={recipe.imageUrl}
                    alt={recipe.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-100">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  {recipe.visibility === 'PRIVATE' && (
                    <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded-full">
                      Private
                    </span>
                  )}
                  {recipe.visibility === 'PUBLIC' && recipe.moderationStatus === 'PENDING' && (
                    <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                      Pending Review
                    </span>
                  )}
                  {recipe.visibility === 'PUBLIC' && recipe.moderationStatus === 'APPROVED' && (
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      Published
                    </span>
                  )}
                  {recipe.visibility === 'CURATED' && (
                    <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                      Featured
                    </span>
                  )}
                  {recipe.moderationStatus === 'REJECTED' && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      Rejected
                    </span>
                  )}
                </div>
                
                {recipe.isAIGenerated && (
                  <div className="absolute top-2 left-2">
                    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                      AI Generated
                    </span>
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2 line-clamp-1">{recipe.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{recipe.description}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>Prep: {recipe.timings.prep} min</span>
                  <span>Cook: {recipe.timings.cook} min</span>
                  <span>Total: {recipe.timings.total} min</span>
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-between mt-4">
                  <Link
                    href={`/recipes/${recipe.id}`}
                    className="text-emerald-600 hover:text-emerald-800 font-medium text-sm"
                  >
                    View Recipe
                  </Link>
                  
                  <div className="flex space-x-2">
                    <Link
                      href={`/recipes/edit/${recipe.id}`}
                      className="text-gray-600 hover:text-gray-800 font-medium text-sm"
                    >
                      Edit
                    </Link>
                    
                    {recipe.visibility === 'PRIVATE' && (
                      <button
                        onClick={() => handlePublishRecipe(recipe.id)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        Publish
                      </button>
                    )}
                    
                    {recipe.moderationStatus === 'REJECTED' && (
                      <div className="group relative">
                        <button className="text-red-600 hover:text-red-800 font-medium text-sm">
                          See Feedback
                        </button>
                        {recipe.moderationNotes && (
                          <div className="absolute bottom-full mb-2 -left-20 w-64 bg-white border border-gray-200 rounded-md shadow-lg p-3 hidden group-hover:block z-10">
                            <h4 className="font-semibold mb-1">Moderation Feedback:</h4>
                            <p className="text-sm text-gray-600">{recipe.moderationNotes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <nav className="inline-flex rounded-md shadow">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className={`px-3 py-1 rounded-l-md border ${
                pagination.page === 1 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            
            {Array.from({ length: pagination.totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => handlePageChange(index + 1)}
                className={`px-3 py-1 border-t border-b ${
                  pagination.page === index + 1
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {index + 1}
              </button>
            ))}
            
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className={`px-3 py-1 rounded-r-md border ${
                pagination.page === pagination.totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
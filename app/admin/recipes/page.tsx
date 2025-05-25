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
  createdBy: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  createdAt: string;
};

type PaginationData = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export default function AdminRecipesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Moderation state
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);
  const [moderationStatus, setModerationStatus] = useState<ModerationStatus>('APPROVED');
  const [moderationNotes, setModerationNotes] = useState<string>('');
  const [visibility, setVisibility] = useState<RecipeVisibility>('PUBLIC');
  const [moderating, setModerating] = useState(false);

  // Redirect if not logged in or not admin
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin/recipes');
    } else if (status === 'authenticated') {
      // Check if user is admin or moderator
      const userRole = session?.user?.role;
      if (userRole !== 'ADMIN' && userRole !== 'MODERATOR') {
        router.push('/');
      }
    }
  }, [status, router, session]);

  // Fetch pending recipes
  const fetchRecipes = async (page = 1, search = '') => {
    try {
      setLoading(true);
      
      let url = `/api/admin/recipes/pending?page=${page}&limit=${pagination.limit}`;
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
      fetchRecipes(1, searchTerm);
    }
  }, [status, searchTerm]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRecipes(1, searchTerm);
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    fetchRecipes(newPage, searchTerm);
  };

  // Open moderation modal
  const openModerationModal = (recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (recipe) {
      setSelectedRecipe(recipeId);
      setModerationStatus('APPROVED'); // Default to approving
      setModerationNotes('');
      setVisibility(recipe.visibility);
    }
  };

  // Close moderation modal
  const closeModerationModal = () => {
    setSelectedRecipe(null);
    setModerationStatus('APPROVED');
    setModerationNotes('');
    setVisibility('PUBLIC');
  };

  // Handle moderation submission
  const handleModerate = async () => {
    if (!selectedRecipe) return;
    
    try {
      setModerating(true);
      
      const response = await fetch(`/api/admin/recipes/${selectedRecipe}/moderate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moderationStatus,
          moderationNotes: moderationNotes.trim() ? moderationNotes : undefined,
          visibility,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to moderate recipe');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh the recipes list
        fetchRecipes(pagination.page, searchTerm);
        closeModerationModal();
      } else {
        throw new Error(data.error?.message || 'Something went wrong');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setModerating(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Recipe Moderation</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Recipe Moderation</h1>
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
      <h1 className="text-3xl font-bold mb-6">Recipe Moderation</h1>
      
      {/* Search */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search recipes pending moderation..."
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
      
      {/* Recipes Table */}
      {recipes.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-medium text-gray-600 mb-4">No recipes pending moderation</h3>
          <p className="text-gray-500">
            There are currently no recipes waiting for review.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recipe
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created By
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Submitted
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recipes.map((recipe) => (
                <tr key={recipe.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      <div className="h-16 w-16 flex-shrink-0 mr-4 bg-gray-200 rounded overflow-hidden">
                        {recipe.imageUrl ? (
                          <Image
                            src={recipe.imageUrl}
                            alt={recipe.title}
                            width={64}
                            height={64}
                            className="object-cover h-full w-full"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full w-full bg-gray-100">
                            <span className="text-xs text-gray-400">No image</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{recipe.title}</div>
                        <div className="text-sm text-gray-500 line-clamp-1">{recipe.description}</div>
                        {recipe.isAIGenerated && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                            AI Generated
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      <div className="h-8 w-8 flex-shrink-0 mr-2 rounded-full overflow-hidden bg-gray-200">
                        {recipe.createdBy.image ? (
                          <Image
                            src={recipe.createdBy.image}
                            alt={recipe.createdBy.name || 'User'}
                            width={32}
                            height={32}
                            className="object-cover h-full w-full"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full w-full bg-emerald-100 text-emerald-800">
                            <span className="text-xs font-medium">
                              {recipe.createdBy.name?.charAt(0) || recipe.createdBy.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{recipe.createdBy.name || 'User'}</div>
                        <div className="text-xs text-gray-500">{recipe.createdBy.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-500">
                    {new Date(recipe.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4 text-sm">
                    <div className="flex space-x-2">
                      <Link
                        href={`/recipes/${recipe.id}`}
                        className="text-emerald-600 hover:text-emerald-800 font-medium"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => openModerationModal(recipe.id)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Moderate
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
      
      {/* Moderation Modal */}
      {selectedRecipe && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Moderate Recipe</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={moderationStatus}
                onChange={(e) => setModerationStatus(e.target.value as ModerationStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="APPROVED">Approve</option>
                <option value="REJECTED">Reject</option>
                <option value="FLAGGED">Flag for Further Review</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Visibility
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as RecipeVisibility)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={moderationStatus === 'REJECTED'}
              >
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
                <option value="CURATED">Curated/Featured</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Moderation Notes {moderationStatus === 'REJECTED' && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={moderationNotes}
                onChange={(e) => setModerationNotes(e.target.value)}
                placeholder={moderationStatus === 'REJECTED' ? "Please provide feedback about why this recipe was rejected" : "Optional notes about this moderation decision"}
                className="w-full px-3 py-2 border border-gray-300 rounded-md h-32"
                required={moderationStatus === 'REJECTED'}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={closeModerationModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={moderating}
              >
                Cancel
              </button>
              <button
                onClick={handleModerate}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
                disabled={moderating || (moderationStatus === 'REJECTED' && !moderationNotes.trim())}
              >
                {moderating ? 'Submitting...' : 'Submit Decision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
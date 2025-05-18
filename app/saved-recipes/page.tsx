'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SavedRecipesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      setIsLoading(false);
    }
  }, [status, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sage"></div>
      </div>
    );
  }

  // Mock saved recipes (in the real app, this would come from API)
  const savedRecipes = [];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-navy mb-2">
          Your Saved Recipes
        </h1>
        <p className="text-gray-600">
          Access your favorite recipes anytime
        </p>
      </div>

      {savedRecipes.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Recipe cards would go here */}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-xl shadow-md text-center">
          <div className="mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          
          <h2 className="text-xl font-medium text-navy mb-2">
            No Saved Recipes Yet
          </h2>
          
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            You haven't saved any recipes yet. Explore our seasonal recipes and save your favorites for easy access later.
          </p>
          
          <Link href="/recipes" className="btn-primary">
            Browse Recipes
          </Link>
        </div>
      )}
    </div>
  );
}
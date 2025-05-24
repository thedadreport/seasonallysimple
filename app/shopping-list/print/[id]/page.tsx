'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ShoppingList } from '@/types/shoppingList';

interface PrintPageProps {
  params: {
    id: string;
  };
}

export default function PrintShoppingListPage({ params }: PrintPageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Authentication check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/shopping-list');
    }
  }, [status, router]);

  // Fetch shopping list data
  useEffect(() => {
    const fetchShoppingList = async () => {
      if (!params.id) return;

      try {
        console.log("Fetching shopping list:", params.id);
        const response = await fetch(`/api/shopping-lists/${params.id}`, {
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Important for authentication cookies
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch shopping list');
        }
        
        const data = await response.json();
        console.log("Shopping list data received:", data);
        
        // Process originalIngredients JSON if needed
        const processedData = {
          ...data,
          items: data.items ? data.items.map(item => {
            if (item.originalIngredients && typeof item.originalIngredients === 'string') {
              try {
                return {
                  ...item,
                  originalIngredients: JSON.parse(item.originalIngredients)
                };
              } catch (e) {
                console.error('Error parsing originalIngredients:', e);
              }
            }
            return item;
          }) : []
        };
        
        console.log("Processed shopping list data:", processedData);
        setShoppingList(processedData);
        
        // Auto-print after loading - longer delay to ensure rendering
        setTimeout(() => {
          if (document.querySelector('.print-content')) {
            console.log("Printing now...");
            window.print();
          } else {
            console.error("Print content not found in DOM");
          }
        }, 2000);
        
      } catch (err) {
        console.error('Error fetching shopping list:', err);
        setError(err instanceof Error ? err.message : 'Failed to load shopping list');
      } finally {
        setLoading(false);
      }
    };

    fetchShoppingList();
  }, [status, params.id]);

  // Group items by category with custom ordering
  const groupedItems = shoppingList ? 
    Object.entries(
      shoppingList.items.reduce((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
      }, {} as Record<string, any[]>)
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
        return a[0].localeCompare(b[0]);
      }
      
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      
      return indexA - indexB;
    }) : [];

  // Handle loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sage"></div>
        <p className="ml-3">Preparing printable shopping list...</p>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-lg mb-6 text-red-600">{error}</p>
          <button onClick={() => router.back()} className="btn-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Render empty state
  if (!shoppingList) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-lg mb-6">Shopping list not found.</p>
          <button onClick={() => router.push('/shopping-list')} className="btn-primary">
            View All Shopping Lists
          </button>
        </div>
      </div>
    );
  }

  // Main print view
  return (
    <div className="print-container max-w-4xl mx-auto py-8 print-preview">
      <div className="no-print mb-4 flex justify-between items-center">
        <button 
          onClick={() => router.push('/shopping-list')}
          className="btn-secondary"
        >
          Back to Shopping Lists
        </button>
        <button 
          onClick={() => window.print()}
          className="btn-primary"
        >
          Print Now
        </button>
      </div>
      
      <div className="print-content">
        <h2 className="text-2xl font-serif font-bold text-navy mb-2">{shoppingList.name}</h2>
        <p className="text-gray-600 mb-4">{new Date().toLocaleDateString()}</p>
        
        {groupedItems.length > 0 ? (
          groupedItems.map(([category, items]) => (
            <div key={category} className="mb-6">
              <h3 className="text-lg font-medium text-navy capitalize border-b border-gray-200 pb-1 mb-2">
                {category}
              </h3>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.id} className="flex items-start gap-2">
                    <div className="print-checkbox border border-gray-300 w-4 h-4 mt-1 flex-shrink-0"></div>
                    <div>
                      <span className="font-medium">{item.name}</span>
                      {(item.quantity || item.unit) && (
                        <span className="text-gray-600 ml-2">
                          {item.quantity} {item.unit}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-4">No items in this shopping list.</p>
          </div>
        )}

        <div className="text-center text-gray-400 text-sm mt-8 print-footer">
          Generated with Seasonally Simple • {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
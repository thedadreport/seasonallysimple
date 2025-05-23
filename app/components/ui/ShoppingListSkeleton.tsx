import React from 'react';
import LoadingSkeleton from './LoadingSkeleton';

interface ShoppingListSkeletonProps {
  categoryCount?: number;
  itemsPerCategory?: number;
}

/**
 * Specialized skeleton loader for shopping lists
 */
export default function ShoppingListSkeleton({
  categoryCount = 3,
  itemsPerCategory = 4
}: ShoppingListSkeletonProps) {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="bg-gray-200 h-8 w-48 rounded mb-2"></div>
          <div className="bg-gray-200 h-4 w-32 rounded"></div>
        </div>
        <div className="flex gap-4">
          <div className="bg-gray-200 h-10 w-32 rounded"></div>
          <div className="bg-gray-200 h-10 w-32 rounded"></div>
        </div>
      </div>
      
      {/* Add item form skeleton */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="bg-gray-200 h-6 w-32 rounded mb-4"></div>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-grow">
            <div className="bg-gray-200 h-10 w-full rounded"></div>
          </div>
          <div className="w-full md:w-24">
            <div className="bg-gray-200 h-10 w-full rounded"></div>
          </div>
          <div className="w-full md:w-32">
            <div className="bg-gray-200 h-10 w-full rounded"></div>
          </div>
          <div className="w-full md:w-40">
            <div className="bg-gray-200 h-10 w-full rounded"></div>
          </div>
          <div className="bg-gray-200 h-10 w-24 rounded"></div>
        </div>
      </div>
      
      {/* Bulk operations skeleton */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-8">
        <div className="flex flex-wrap gap-3">
          <div className="bg-gray-200 h-8 w-24 rounded"></div>
          <div className="bg-gray-200 h-8 w-24 rounded"></div>
          <div className="bg-gray-200 h-8 w-36 rounded"></div>
        </div>
      </div>
      
      {/* Shopping list skeleton */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="bg-gray-200 h-6 w-56 rounded"></div>
            <div className="bg-gray-200 h-4 w-32 rounded"></div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {Array(categoryCount).fill(0).map((_, catIndex) => (
            <div key={catIndex} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gray-200 h-6 w-32 rounded"></div>
                <div className="bg-gray-200 h-5 w-5 rounded"></div>
              </div>
              
              <ul className="space-y-4">
                {Array(itemsPerCategory).fill(0).map((_, itemIndex) => (
                  <li key={itemIndex} className="flex items-start gap-3">
                    <div className="flex-shrink-0 pt-1">
                      <div className="bg-gray-200 h-5 w-5 rounded"></div>
                    </div>
                    <div className="flex-grow">
                      <div className="bg-gray-200 h-5 w-3/4 rounded mb-1"></div>
                      <div className="bg-gray-200 h-4 w-16 rounded"></div>
                    </div>
                    <div className="bg-gray-200 h-5 w-5 rounded"></div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
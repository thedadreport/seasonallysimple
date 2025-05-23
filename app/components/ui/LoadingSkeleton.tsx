import React from 'react';

export type SkeletonType = 'list' | 'card' | 'text' | 'circle' | 'custom' | 'shopping-list' | 'meal-plan' | 'recipe';

interface LoadingSkeletonProps {
  type?: SkeletonType;
  count?: number;
  width?: string;
  height?: string;
  className?: string;
  children?: React.ReactNode;
  rows?: number;
}

/**
 * Reusable loading skeleton component for showing placeholder UI while content loads
 */
export default function LoadingSkeleton({
  type = 'text',
  count = 1,
  width,
  height,
  className = '',
  children,
  rows = 3
}: LoadingSkeletonProps) {
  // Base animation and background classes
  const baseClasses = 'animate-pulse bg-gray-200 rounded';
  
  // Generate custom styles based on dimensions props
  const customStyles: React.CSSProperties = {};
  if (width) customStyles.width = width;
  if (height) customStyles.height = height;
  
  // Predefined styles for different types
  const typeStyles = {
    text: 'h-4 w-3/4 my-2',
    circle: 'rounded-full h-12 w-12',
    card: 'h-32 w-full rounded-lg',
    list: 'space-y-3 w-full',
    custom: ''
  };
  
  // Generate a skeleton block with optional height
  const SkeletonBlock = ({ height = 'h-4', className = '' }: { height?: string, className?: string }) => (
    <div className={`${baseClasses} ${height} ${className}`}></div>
  );
  
  // Generate multiple skeleton rows
  const SkeletonRows = ({ count = 3, gap = 'gap-3' }: { count?: number, gap?: string }) => (
    <div className={`flex flex-col ${gap}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBlock key={i} />
      ))}
    </div>
  );
  
  // Shopping list skeleton
  if (type === 'shopping-list') {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <SkeletonBlock height="h-8 w-40" />
          <div className="flex gap-3">
            <SkeletonBlock height="h-10 w-32" />
            <SkeletonBlock height="h-10 w-32" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <SkeletonBlock height="h-6 w-32 mb-4" />
          <div className="flex gap-3 mt-4">
            <SkeletonBlock height="h-10 flex-grow" />
            <SkeletonBlock height="h-10 w-24" />
            <SkeletonBlock height="h-10 w-32" />
            <SkeletonBlock height="h-10 w-40" />
            <SkeletonBlock height="h-10 w-24" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <SkeletonBlock height="h-6 w-48" />
              <SkeletonBlock height="h-4 w-32" />
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <SkeletonBlock height="h-6 w-32" />
                  <SkeletonBlock height="h-6 w-6" />
                </div>
                <div className="mt-4 space-y-4">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="flex items-start gap-3">
                      <SkeletonBlock height="h-5 w-5" />
                      <div className="flex-grow">
                        <SkeletonBlock height="h-5 w-full max-w-xs mb-1" />
                        <SkeletonBlock height="h-4 w-20" />
                      </div>
                      <SkeletonBlock height="h-5 w-5" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  // Recipe card skeleton
  if (type === 'recipe') {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className={`${baseClasses} h-48 w-full`}></div>
        <div className="p-4">
          <SkeletonBlock height="h-6 mb-3 w-3/4" />
          <SkeletonBlock height="h-4 mb-2 w-1/2" />
          <div className="my-4">
            <SkeletonRows count={3} />
          </div>
          <div className="flex justify-between mt-4">
            <SkeletonBlock height="h-8 w-24" />
            <SkeletonBlock height="h-8 w-24" />
          </div>
        </div>
      </div>
    );
  }
  
  // Meal plan skeleton
  if (type === 'meal-plan') {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <SkeletonBlock height="h-8 w-40" />
          <SkeletonBlock height="h-10 w-32" />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="bg-gray-50 p-4 rounded-lg">
                <SkeletonBlock height="h-5 w-20 mb-3" />
                <div className="space-y-4">
                  <SkeletonBlock height="h-24 w-full" />
                  <SkeletonBlock height="h-24 w-full" />
                  <SkeletonBlock height="h-24 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-end">
          <SkeletonBlock height="h-10 w-48" />
        </div>
      </div>
    );
  }
  
  // For list type, render multiple skeleton items
  if (type === 'list') {
    return (
      <div className={`${typeStyles.list} ${className}`}>
        {Array(count).fill(0).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <div className={`${baseClasses} rounded-full h-10 w-10`}></div>
            <div className="flex-1 space-y-2 py-1">
              <div className={`${baseClasses} h-4 w-3/4`}></div>
              <div className={`${baseClasses} h-4 w-1/2`}></div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  // For custom type, render children inside the skeleton container
  if (type === 'custom' && children) {
    return (
      <div className={`${baseClasses} ${className}`} style={customStyles}>
        {children}
      </div>
    );
  }
  
  // For other types, render the appropriate skeleton
  return (
    <div className={`${baseClasses} ${typeStyles[type]} ${className}`} style={customStyles}></div>
  );
}
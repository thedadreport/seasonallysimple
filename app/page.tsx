import Link from 'next/link';
import SessionDebug from '@/app/components/SessionDebug';
import { auth } from '@/auth';

export default function Home() {
  // We would normally fetch current season from an API or determine it based on hemisphere and date
  const currentSeason = 'SPRING';
  
  return (
    <div className="space-y-12">
      <section className="text-center py-12">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-navy mb-4">
          Making wholesome, seasonal cooking <span className="text-terracotta">deliciously simple</span>
        </h1>
        <p className="text-xl max-w-2xl mx-auto mb-8">
          AI-powered recipe suggestions based on what's in season, 
          your dietary preferences, and how much time you have to cook.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/recipe-generator" className="btn-primary">Generate a Recipe</Link>
          <Link href="/recipes" className="btn-secondary">Browse Recipes</Link>
        </div>
      </section>

      <section className="bg-white rounded-xl p-8 shadow-md">
        <h2 className="text-3xl font-serif font-bold text-navy mb-6">What's in Season: {currentSeason.charAt(0) + currentSeason.slice(1).toLowerCase()}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* This would be populated from the database in a real implementation */}
          {['Asparagus', 'Strawberries', 'Peas', 'Radishes', 'Rhubarb', 'Artichokes', 'Spring Onions', 'Fresh Herbs'].map((ingredient) => (
            <div key={ingredient} className="text-center">
              <div className="w-24 h-24 bg-sage bg-opacity-20 rounded-full mx-auto mb-3 flex items-center justify-center">
                {/* In a real implementation, this would be an image */}
                <span className="font-handwritten text-xl">{ingredient.charAt(0)}</span>
              </div>
              <p className="font-medium">{ingredient}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Debug session information */}
      <SessionDebug />
      
      <section>
        <h2 className="text-3xl font-serif font-bold text-navy mb-6">Featured Collections</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="card">
            <div className="h-48 bg-sage bg-opacity-20 flex items-center justify-center">
              {/* This would be an image in the real implementation */}
              <span className="font-handwritten text-2xl">Spring Greens</span>
            </div>
            <div className="p-4">
              <h3 className="text-xl font-serif font-semibold mb-2">Spring Greens</h3>
              <p className="text-gray-600 mb-4">Fresh, vibrant dishes featuring spring's best greens.</p>
              <Link href="/collections/spring-greens" className="text-sage font-medium hover:underline">View Collection</Link>
            </div>
          </div>
          
          <div className="card">
            <div className="h-48 bg-terracotta bg-opacity-20 flex items-center justify-center">
              <span className="font-handwritten text-2xl">Quick Weeknight Meals</span>
            </div>
            <div className="p-4">
              <h3 className="text-xl font-serif font-semibold mb-2">Quick Weeknight Meals</h3>
              <p className="text-gray-600 mb-4">Delicious meals ready in 30 minutes or less.</p>
              <Link href="/collections/quick-meals" className="text-sage font-medium hover:underline">View Collection</Link>
            </div>
          </div>
          
          <div className="card">
            <div className="h-48 bg-honey bg-opacity-20 flex items-center justify-center">
              <span className="font-handwritten text-2xl">Family Favorites</span>
            </div>
            <div className="p-4">
              <h3 className="text-xl font-serif font-semibold mb-2">Family Favorites</h3>
              <p className="text-gray-600 mb-4">Kid-approved recipes the whole family will love.</p>
              <Link href="/collections/family-favorites" className="text-sage font-medium hover:underline">View Collection</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
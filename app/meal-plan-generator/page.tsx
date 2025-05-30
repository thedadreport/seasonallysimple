'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { generateWeeklyMealPlan, WeeklyMealPlanResponse, WeeklyMealPlanDay } from '@/lib/services/claudeService';

export default function MealPlanGeneratorPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    dietaryRestrictions: [] as string[],
    servings: 4,
    season: 'Spring',
    weeklyBudget: 120,
    quickMealsNeeded: true,
    familyFriendly: true,
    preferredCuisines: [] as string[],
    includeBreakfast: true,
    includeLunch: true,
    includeDinner: true,
    mealPrepFriendly: true,
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [mealPlan, setMealPlan] = useState<WeeklyMealPlanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const dietaryOptions = [
    'Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free', 
    'Keto', 'Paleo', 'Low-sodium', 'Low-carb'
  ];
  
  const cuisineOptions = [
    'Italian', 'Mexican', 'Asian', 'Mediterranean', 
    'American', 'Indian', 'French', 'Middle Eastern'
  ];
  
  const seasonOptions = ['Spring', 'Summer', 'Fall', 'Winter'];
  
  const toggleDietaryRestriction = (diet: string) => {
    setFormData(prev => {
      const current = [...prev.dietaryRestrictions];
      if (current.includes(diet)) {
        return { ...prev, dietaryRestrictions: current.filter(d => d !== diet) };
      } else {
        return { ...prev, dietaryRestrictions: [...current, diet] };
      }
    });
  };
  
  const toggleCuisine = (cuisine: string) => {
    setFormData(prev => {
      const current = [...prev.preferredCuisines];
      if (current.includes(cuisine)) {
        return { ...prev, preferredCuisines: current.filter(c => c !== cuisine) };
      } else {
        return { ...prev, preferredCuisines: [...current, cuisine] };
      }
    });
  };
  
  const handleServingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value >= 1 && value <= 10) {
      setFormData(prev => ({ ...prev, servings: value }));
    }
  };
  
  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value >= 50 && value <= 300) {
      setFormData(prev => ({ ...prev, weeklyBudget: value }));
    }
  };
  
  const handleSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, season: e.target.value }));
  };
  
  const handleCheckboxChange = (field: string) => {
    setFormData(prev => ({ ...prev, [field]: !prev[field as keyof typeof prev] }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);
    
    try {
      const result = await generateWeeklyMealPlan({
        dietaryRestrictions: formData.dietaryRestrictions,
        servings: formData.servings,
        season: formData.season,
        weeklyBudget: formData.weeklyBudget,
        quickMealsNeeded: formData.quickMealsNeeded,
        familyFriendly: formData.familyFriendly,
        preferredCuisines: formData.preferredCuisines.length > 0 ? formData.preferredCuisines : undefined,
        includeBreakfast: formData.includeBreakfast,
        includeLunch: formData.includeLunch,
        includeDinner: formData.includeDinner,
        mealPrepFriendly: formData.mealPrepFriendly,
      });
      
      setMealPlan(result);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error generating meal plan:', err);
      setError('Failed to generate meal plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const saveMealPlan = () => {
    // In a real implementation, this would save the meal plan to the database
    // and redirect to the meal plan page
    router.push('/meal-plan');
  };
  
  const getMealDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-navy mb-2">
          Weekly Meal Plan Generator
        </h1>
        <p className="text-gray-600">
          Create a personalized weekly meal plan based on your preferences, dietary needs, and seasonal ingredients.
        </p>
      </div>
      
      {mealPlan ? (
        <div className="mb-12">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-serif font-medium text-navy">
                  Your Custom Weekly Meal Plan
                </h2>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setMealPlan(null)} 
                    className="btn-secondary"
                  >
                    Create New Plan
                  </button>
                  <button 
                    onClick={saveMealPlan} 
                    className="btn-primary"
                  >
                    Save Plan
                  </button>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-cream rounded-lg">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Season:</span> {formData.season}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Servings:</span> {formData.servings}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Budget:</span> ${mealPlan.totalCost.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Avg. Daily Calories:</span> {mealPlan.nutritionSummary.averageDailyCalories}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Protein:</span> {mealPlan.nutritionSummary.proteinPercentage}%
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Carbs:</span> {mealPlan.nutritionSummary.carbsPercentage}%
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Fat:</span> {mealPlan.nutritionSummary.fatPercentage}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {mealPlan.weeklyPlan.map((day: WeeklyMealPlanDay, index: number) => (
                <div key={index} className="mb-8 last:mb-0">
                  <h3 className="text-xl font-medium text-navy mb-4 pb-2 border-b border-gray-200">
                    {day.day}
                  </h3>
                  
                  <div className="grid md:grid-cols-3 gap-6">
                    {day.breakfast && formData.includeBreakfast && (
                      <div className="bg-cream rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <h4 className="text-lg font-medium text-navy">Breakfast</h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${getMealDifficultyColor(day.breakfast.cookingDifficulty)}`}>
                            {day.breakfast.cookingDifficulty}
                          </span>
                        </div>
                        <h5 className="font-medium mt-2">{day.breakfast.title}</h5>
                        <p className="text-sm text-gray-600 mt-1">{day.breakfast.description}</p>
                        <div className="flex justify-between mt-4 text-xs text-gray-600">
                          <span>{day.breakfast.timings.total} min</span>
                          <span>${day.breakfast.estimatedCostPerServing.toFixed(2)}/serving</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {day.breakfast.tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="text-xs bg-white py-1 px-2 rounded-full text-gray-600">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {day.lunch && formData.includeLunch && (
                      <div className="bg-cream rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <h4 className="text-lg font-medium text-navy">Lunch</h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${getMealDifficultyColor(day.lunch.cookingDifficulty)}`}>
                            {day.lunch.cookingDifficulty}
                          </span>
                        </div>
                        <h5 className="font-medium mt-2">{day.lunch.title}</h5>
                        <p className="text-sm text-gray-600 mt-1">{day.lunch.description}</p>
                        <div className="flex justify-between mt-4 text-xs text-gray-600">
                          <span>{day.lunch.timings.total} min</span>
                          <span>${day.lunch.estimatedCostPerServing.toFixed(2)}/serving</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {day.lunch.tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="text-xs bg-white py-1 px-2 rounded-full text-gray-600">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {day.dinner && formData.includeDinner && (
                      <div className="bg-cream rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <h4 className="text-lg font-medium text-navy">Dinner</h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${getMealDifficultyColor(day.dinner.cookingDifficulty)}`}>
                            {day.dinner.cookingDifficulty}
                          </span>
                        </div>
                        <h5 className="font-medium mt-2">{day.dinner.title}</h5>
                        <p className="text-sm text-gray-600 mt-1">{day.dinner.description}</p>
                        <div className="flex justify-between mt-4 text-xs text-gray-600">
                          <span>{day.dinner.timings.total} min</span>
                          <span>${day.dinner.estimatedCostPerServing.toFixed(2)}/serving</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {day.dinner.tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="text-xs bg-white py-1 px-2 rounded-full text-gray-600">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-6 border-t border-gray-200">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-medium text-navy mb-3">Shopping Tips</h3>
                  <p className="text-gray-600 whitespace-pre-line">{mealPlan.shoppingTips}</p>
                </div>
                
                {mealPlan.mealPrepTips && (
                  <div>
                    <h3 className="text-xl font-medium text-navy mb-3">Meal Prep Tips</h3>
                    <p className="text-gray-600 whitespace-pre-line">{mealPlan.mealPrepTips}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-medium text-navy mb-2">
              Your Preferences
            </h2>
            <p className="text-sm text-gray-600">
              Customize your meal plan to fit your needs and preferences
            </p>
          </div>
          
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-medium text-navy mb-4">General Information</h3>
                
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">
                    Season
                  </label>
                  <select
                    value={formData.season}
                    onChange={handleSeasonChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-sage focus:ring focus:ring-sage focus:ring-opacity-50"
                  >
                    {seasonOptions.map(season => (
                      <option key={season} value={season}>{season}</option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">
                    Number of Servings
                  </label>
                  <div className="flex items-center">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={formData.servings}
                      onChange={handleServingsChange}
                      className="flex-grow h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="ml-4 w-8 text-center">{formData.servings}</span>
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">
                    Weekly Budget (USD)
                  </label>
                  <div className="flex items-center">
                    <span className="text-gray-600 mr-2">$</span>
                    <input
                      type="range"
                      min="50"
                      max="300"
                      step="10"
                      value={formData.weeklyBudget}
                      onChange={handleBudgetChange}
                      className="flex-grow h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="ml-4 w-12 text-center">${formData.weeklyBudget}</span>
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">
                    Meal Types to Include
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="includeBreakfast"
                        checked={formData.includeBreakfast}
                        onChange={() => handleCheckboxChange('includeBreakfast')}
                        className="h-4 w-4 text-sage focus:ring-sage border-gray-300 rounded"
                      />
                      <label htmlFor="includeBreakfast" className="ml-2 text-gray-700">
                        Breakfast
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="includeLunch"
                        checked={formData.includeLunch}
                        onChange={() => handleCheckboxChange('includeLunch')}
                        className="h-4 w-4 text-sage focus:ring-sage border-gray-300 rounded"
                      />
                      <label htmlFor="includeLunch" className="ml-2 text-gray-700">
                        Lunch
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="includeDinner"
                        checked={formData.includeDinner}
                        onChange={() => handleCheckboxChange('includeDinner')}
                        className="h-4 w-4 text-sage focus:ring-sage border-gray-300 rounded"
                      />
                      <label htmlFor="includeDinner" className="ml-2 text-gray-700">
                        Dinner
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-navy mb-4">Preferences & Restrictions</h3>
                
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">
                    Dietary Restrictions
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {dietaryOptions.map(diet => (
                      <button
                        key={diet}
                        type="button"
                        onClick={() => toggleDietaryRestriction(diet)}
                        className={`px-3 py-2 rounded-lg text-sm ${
                          formData.dietaryRestrictions.includes(diet)
                            ? 'bg-sage text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {diet}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">
                    Preferred Cuisines
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {cuisineOptions.map(cuisine => (
                      <button
                        key={cuisine}
                        type="button"
                        onClick={() => toggleCuisine(cuisine)}
                        className={`px-3 py-2 rounded-lg text-sm ${
                          formData.preferredCuisines.includes(cuisine)
                            ? 'bg-sage text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {cuisine}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty for a variety of cuisines
                  </p>
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">
                    Additional Options
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="quickMealsNeeded"
                        checked={formData.quickMealsNeeded}
                        onChange={() => handleCheckboxChange('quickMealsNeeded')}
                        className="h-4 w-4 text-sage focus:ring-sage border-gray-300 rounded"
                      />
                      <label htmlFor="quickMealsNeeded" className="ml-2 text-gray-700">
                        Include quick meals for busy weeknights
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="familyFriendly"
                        checked={formData.familyFriendly}
                        onChange={() => handleCheckboxChange('familyFriendly')}
                        className="h-4 w-4 text-sage focus:ring-sage border-gray-300 rounded"
                      />
                      <label htmlFor="familyFriendly" className="ml-2 text-gray-700">
                        Family-friendly meals
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="mealPrepFriendly"
                        checked={formData.mealPrepFriendly}
                        onChange={() => handleCheckboxChange('mealPrepFriendly')}
                        className="h-4 w-4 text-sage focus:ring-sage border-gray-300 rounded"
                      />
                      <label htmlFor="mealPrepFriendly" className="ml-2 text-gray-700">
                        Include meal prep opportunities
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 border-t border-gray-200 flex justify-between items-center">
            <Link href="/meal-plan" className="text-gray-600 hover:text-navy">
              Back to Meal Plan
            </Link>
            <button
              type="submit"
              disabled={isGenerating}
              className="btn-primary min-w-[200px]"
            >
              {isGenerating ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Generating...
                </div>
              ) : (
                'Generate Meal Plan'
              )}
            </button>
          </div>
          
          {error && (
            <div className="p-4 bg-red-50 text-red-700 border-t border-red-200">
              {error}
            </div>
          )}
        </form>
      )}
    </div>
  );
}
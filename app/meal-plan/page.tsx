'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import RecipeSearchSidebar from '../components/RecipeSearchSidebar';
import ShoppingListModal from '../components/ShoppingListModal';

// Define interfaces for our data model
interface Recipe {
  id: string;
  title: string;
  prepTime: number;
  cookTime: number;
  totalTime: number;
  servings: number;
  estimatedCostPerServing?: number;
  tags?: string[];
}

interface Meal {
  id: string;
  type: string;
  recipe: Recipe | null;
}

interface DayPlan {
  id: string;
  day: string;
  date: Date;
  meals: Meal[];
}

interface MealPlan {
  id?: string;
  name?: string;
  startDate: Date;
  endDate: Date;
  meals: DayPlan[];
}

// Mock data for meal plan - in a real app, this would come from an API
const mockMealPlan = {
  startDate: new Date('2025-05-20'),
  endDate: new Date('2025-05-26'),
  meals: [
    {
      id: '1',
      day: 'Monday',
      date: new Date('2025-05-20'),
      meals: [
        {
          id: 'breakfast-1',
          type: 'BREAKFAST',
          recipe: {
            id: '101',
            title: 'Avocado Toast with Poached Eggs',
            prepTime: 5,
            cookTime: 10,
            totalTime: 15,
            servings: 2,
            estimatedCostPerServing: 2.25,
            tags: ['breakfast', 'quick', 'vegetarian']
          }
        },
        {
          id: 'lunch-1',
          type: 'LUNCH',
          recipe: null
        },
        {
          id: 'dinner-1',
          type: 'DINNER',
          recipe: {
            id: '1',
            title: 'Mediterranean Lemon Herb Chicken with Spring Vegetables',
            prepTime: 10,
            cookTime: 20,
            totalTime: 30,
            servings: 4,
            estimatedCostPerServing: 3.75,
            tags: ['dinner', 'healthy', 'spring']
          }
        }
      ]
    },
    {
      id: '2',
      day: 'Tuesday',
      date: new Date('2025-05-21'),
      meals: [
        {
          id: 'breakfast-2',
          type: 'BREAKFAST',
          recipe: null
        },
        {
          id: 'lunch-2',
          type: 'LUNCH',
          recipe: {
            id: '102',
            title: 'Spring Vegetable Soup',
            prepTime: 10,
            cookTime: 20,
            totalTime: 30,
            servings: 4,
            estimatedCostPerServing: 1.75,
            tags: ['lunch', 'soup', 'spring', 'vegetarian']
          }
        },
        {
          id: 'dinner-2',
          type: 'DINNER',
          recipe: {
            id: '2',
            title: 'Spring Asparagus Risotto',
            prepTime: 15,
            cookTime: 30,
            totalTime: 45,
            servings: 4,
            estimatedCostPerServing: 2.50,
            tags: ['dinner', 'vegetarian', 'spring']
          }
        }
      ]
    },
    {
      id: '3',
      day: 'Wednesday',
      date: new Date('2025-05-22'),
      meals: [
        {
          id: 'breakfast-3',
          type: 'BREAKFAST',
          recipe: null
        },
        {
          id: 'lunch-3',
          type: 'LUNCH',
          recipe: null
        },
        {
          id: 'dinner-3',
          type: 'DINNER',
          recipe: null
        }
      ]
    },
    {
      id: '4',
      day: 'Thursday',
      date: new Date('2025-05-23'),
      meals: [
        {
          id: 'breakfast-4',
          type: 'BREAKFAST',
          recipe: null
        },
        {
          id: 'lunch-4',
          type: 'LUNCH',
          recipe: null
        },
        {
          id: 'dinner-4',
          type: 'DINNER',
          recipe: null
        }
      ]
    },
    {
      id: '5',
      day: 'Friday',
      date: new Date('2025-05-24'),
      meals: [
        {
          id: 'breakfast-5',
          type: 'BREAKFAST',
          recipe: null
        },
        {
          id: 'lunch-5',
          type: 'LUNCH',
          recipe: null
        },
        {
          id: 'dinner-5',
          type: 'DINNER',
          recipe: null
        }
      ]
    },
    {
      id: '6',
      day: 'Saturday',
      date: new Date('2025-05-25'),
      meals: [
        {
          id: 'breakfast-6',
          type: 'BREAKFAST',
          recipe: null
        },
        {
          id: 'lunch-6',
          type: 'LUNCH',
          recipe: null
        },
        {
          id: 'dinner-6',
          type: 'DINNER',
          recipe: null
        }
      ]
    },
    {
      id: '7',
      day: 'Sunday',
      date: new Date('2025-05-26'),
      meals: [
        {
          id: 'breakfast-7',
          type: 'BREAKFAST',
          recipe: null
        },
        {
          id: 'lunch-7',
          type: 'LUNCH',
          recipe: null
        },
        {
          id: 'dinner-7',
          type: 'DINNER',
          recipe: null
        }
      ]
    }
  ]
};

// Helper functions for date manipulation
const addWeeks = (date: Date, weeks: number): Date => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + weeks * 7);
  return newDate;
};

const getWeekDates = (startDate: Date): { startDate: Date, endDate: Date, weekDays: DayPlan[] } => {
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  
  const weekDays: DayPlan[] = [];
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + i);
    
    weekDays.push({
      id: `${i + 1}`,
      day: dayNames[i],
      date: dayDate,
      meals: [
        {
          id: `breakfast-${i + 1}`,
          type: 'BREAKFAST',
          recipe: null
        },
        {
          id: `lunch-${i + 1}`,
          type: 'LUNCH',
          recipe: null
        },
        {
          id: `dinner-${i + 1}`,
          type: 'DINNER',
          recipe: null
        }
      ]
    });
  }
  
  return { startDate, endDate, weekDays };
};

// Function to generate an empty meal plan for a given week
const generateEmptyMealPlan = (startDate: Date): MealPlan => {
  const { endDate, weekDays } = getWeekDates(startDate);
  
  return {
    startDate,
    endDate,
    meals: weekDays
  };
};

// In a real app, this would be a cache of meal plans keyed by start date
const mealPlanCache = new Map<string, MealPlan>();

export default function MealPlanPage() {
  const router = useRouter();
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(mockMealPlan.startDate);
  const [mealPlan, setMealPlan] = useState<MealPlan>(mockMealPlan);
  const [activeDay, setActiveDay] = useState(mockMealPlan.meals[0].id);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<string | undefined>();
  const [selectedDayId, setSelectedDayId] = useState<string | undefined>();
  const [removeFeedback, setRemoveFeedback] = useState<{ dayId: string; mealType: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Load meal plan data for the current week
  useEffect(() => {
    const loadMealPlanForWeek = async () => {
      setIsLoading(true);
      
      // Generate a cache key based on the week start date
      const cacheKey = currentWeekStart.toISOString().split('T')[0];
      
      // Check if we already have this week's data in our cache
      if (mealPlanCache.has(cacheKey)) {
        setMealPlan(mealPlanCache.get(cacheKey)!);
        setActiveDay(mealPlanCache.get(cacheKey)!.meals[0].id);
        setIsLoading(false);
        return;
      }
      
      try {
        // Format the date range for the API
        const startDateStr = currentWeekStart.toISOString().split('T')[0];
        const endDate = new Date(currentWeekStart);
        endDate.setDate(endDate.getDate() + 6);
        const endDateStr = endDate.toISOString().split('T')[0];
        
        // Make an API call to fetch the meal plan
        const response = await fetch(`/api/meal-plans?startDate=${startDateStr}&endDate=${endDateStr}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch meal plan');
        }
        
        const data = await response.json();
        
        if (data && data.length > 0) {
          // Convert API data to our frontend format
          const apiMealPlan = data[0];
          const formattedMealPlan = formatApiMealPlan(apiMealPlan, currentWeekStart);
          setMealPlan(formattedMealPlan);
          setActiveDay(formattedMealPlan.meals[0].id);
          mealPlanCache.set(cacheKey, formattedMealPlan);
        } else {
          // No meal plan found in the database, use an empty one
          const newMealPlan = generateEmptyMealPlan(currentWeekStart);
          setMealPlan(newMealPlan);
          setActiveDay(newMealPlan.meals[0].id);
          mealPlanCache.set(cacheKey, newMealPlan);
        }
      } catch (error) {
        console.error('Error loading meal plan:', error);
        // Fallback to an empty meal plan
        const newMealPlan = generateEmptyMealPlan(currentWeekStart);
        setMealPlan(newMealPlan);
        setActiveDay(newMealPlan.meals[0].id);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMealPlanForWeek();
  }, [currentWeekStart]);
  
  // Helper function to format API meal plan data to our frontend format
  const formatApiMealPlan = (apiMealPlan: any, startDate: Date): MealPlan => {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    
    // Get empty meal plan structure with the same date range
    const emptyMealPlan = generateEmptyMealPlan(startDate);
    
    // Add id and name from the API response
    emptyMealPlan.id = apiMealPlan.id;
    emptyMealPlan.name = apiMealPlan.name;
    
    // Fill in recipes from API data
    if (apiMealPlan.items && apiMealPlan.items.length > 0) {
      for (const item of apiMealPlan.items) {
        const itemDate = new Date(item.date);
        const dayIndex = Math.floor((itemDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (dayIndex >= 0 && dayIndex < 7) {
          const day = emptyMealPlan.meals[dayIndex];
          const meal = day.meals.find(m => m.type === item.mealType);
          
          if (meal) {
            meal.recipe = {
              id: item.recipe.id,
              title: item.recipe.title,
              prepTime: item.recipe.prepTime,
              cookTime: item.recipe.cookTime,
              totalTime: item.recipe.totalTime,
              servings: item.recipe.servings,
              estimatedCostPerServing: 3.75, // Placeholder until API provides this
            };
          }
        }
      }
    }
    
    return emptyMealPlan;
  };
  
  // Save changes to the meal plan database and local cache
  useEffect(() => {
    const saveMealPlan = async () => {
      if (isLoading) return; // Don't save during initial load
      
      const cacheKey = currentWeekStart.toISOString().split('T')[0];
      mealPlanCache.set(cacheKey, mealPlan);
      
      try {
        // Format data for API
        const mealPlanData = {
          name: `Meal Plan ${formatDate(mealPlan.startDate)} - ${formatDate(mealPlan.endDate)}`,
          startDate: mealPlan.startDate.toISOString(),
          endDate: mealPlan.endDate.toISOString(),
          meals: mealPlan.meals
        };
        
        // Save to API
        const response = await fetch('/api/meal-plans', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mealPlanData),
        });
        
        if (!response.ok) {
          throw new Error('Failed to save meal plan');
        }
        
        // Successfully saved
        console.log('Meal plan saved successfully');
      } catch (error) {
        console.error('Error saving meal plan:', error);
        // We still keep the local cache even if API save fails
      }
    };
    
    // Use a debounce to avoid too many API calls
    const timeoutId = setTimeout(saveMealPlan, 1000);
    return () => clearTimeout(timeoutId);
  }, [mealPlan, currentWeekStart, isLoading]);
  
  const handleNavigateWeek = (direction: 'prev' | 'next') => {
    const weeksToAdd = direction === 'next' ? 1 : -1;
    const newWeekStart = addWeeks(currentWeekStart, weeksToAdd);
    setCurrentWeekStart(newWeekStart);
    
    // Optionally update the URL with the new week
    // This would be implemented in a real app, using router.push with query parameters
  };
  
  const [isShoppingListModalOpen, setShoppingListModalOpen] = useState(false);
  
  const handleGenerateShoppingList = () => {
    // Open the shopping list modal
    setShoppingListModalOpen(true);
  };
  
  const handleShoppingListCreated = (shoppingListId: string) => {
    // Navigate to the shopping list page
    router.push(`/shopping-list?listId=${shoppingListId}`);
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  const handleAddRecipe = (dayId: string, mealType: string) => {
    // Open sidebar and set the selected day and meal type
    setSelectedDayId(dayId);
    setSelectedMealType(mealType);
    setSidebarOpen(true);
  };
  
  const handleSelectRecipe = (recipe: Recipe, mealType: string, dayId: string) => {
    // Find the day and update the recipe for the specified meal type
    setMealPlan((prevMealPlan: MealPlan): MealPlan => {
      const updatedMeals = prevMealPlan.meals.map(day => {
        if (day.id === dayId) {
          const updatedDayMeals = day.meals.map(meal => {
            if (meal.type === mealType.toUpperCase()) {
              return { ...meal, recipe };
            }
            return meal;
          });
          return { ...day, meals: updatedDayMeals };
        }
        return day;
      });
      
      return { ...prevMealPlan, meals: updatedMeals };
    });
    
    // Close the sidebar after selecting a recipe
    setSidebarOpen(false);
  };
  
  const handleRemoveMeal = (dayId: string, mealType: string) => {
    // Find the day and set the recipe to null for the specified meal type
    setMealPlan((prevMealPlan: MealPlan): MealPlan => {
      const updatedMeals = prevMealPlan.meals.map(day => {
        if (day.id === dayId) {
          const updatedDayMeals = day.meals.map(meal => {
            if (meal.type === mealType.toUpperCase()) {
              return { ...meal, recipe: null };
            }
            return meal;
          });
          return { ...day, meals: updatedDayMeals };
        }
        return day;
      });
      
      return { ...prevMealPlan, meals: updatedMeals };
    });
    
    // Show feedback that meal was removed
    setRemoveFeedback({ dayId, mealType });
    
    // Clear feedback after 2 seconds
    setTimeout(() => {
      setRemoveFeedback(null);
    }, 2000);
  };
  
  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    setSelectedMealType(undefined);
    setSelectedDayId(undefined);
  };
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-navy mb-2">
            Meal Plan
          </h1>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleNavigateWeek('prev')}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Previous week"
              disabled={isLoading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            
            <p className="text-lg text-gray-600 font-medium">
              {isLoading ? (
                <span className="inline-block w-32 animate-pulse bg-gray-200 h-6 rounded"></span>
              ) : (
                <span>Week of {formatDate(mealPlan.startDate)} - {formatDate(mealPlan.endDate)}</span>
              )}
            </p>
            
            <button 
              onClick={() => handleNavigateWeek('next')}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Next week"
              disabled={isLoading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex gap-4">
          <Link href="/recipes" className="btn-secondary">
            Browse Recipes
          </Link>
          <button onClick={handleGenerateShoppingList} className="btn-primary">
            Generate Shopping List
          </button>
        </div>
      </div>
      
      {isLoading ? (
        // Loading skeleton for week days
        <div className="grid md:grid-cols-8 gap-2 mb-8">
          <div className="md:col-span-1"></div>
          {Array.from({ length: 7 }).map((_, index) => (
            <div
              key={index}
              className="p-2 text-center rounded-t-lg bg-gray-100 animate-pulse h-12"
            ></div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-8 gap-2 mb-8">
          <div className="md:col-span-1"></div>
          {mealPlan.meals.map(day => (
            <button
              key={day.id}
              onClick={() => setActiveDay(day.id)}
              className={`p-2 text-center rounded-t-lg transition ${
                activeDay === day.id
                  ? 'bg-sage text-white font-medium'
                  : 'bg-cream hover:bg-gray-200'
              }`}
            >
              <div className="text-sm">{day.day.substring(0, 3)}</div>
              <div className="text-xs">{formatDate(day.date)}</div>
            </button>
          ))}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {isLoading ? (
          // Loading skeleton for meal grid
          <div className="animate-pulse">
            <div className="grid md:grid-cols-8 border-b border-gray-200">
              <div className="md:col-span-1 py-3 px-4 bg-gray-50 font-medium">Meal</div>
              {Array.from({ length: 7 }).map((_, index) => (
                <div key={index} className="py-3 px-4 h-12 bg-gray-100"></div>
              ))}
            </div>
            
            {/* Skeletons for breakfast, lunch, dinner rows */}
            {Array.from({ length: 3 }).map((_, rowIndex) => (
              <div key={rowIndex} className="grid md:grid-cols-8 border-b border-gray-200">
                <div className="md:col-span-1 py-3 px-4 bg-gray-50 h-24"></div>
                {Array.from({ length: 7 }).map((_, colIndex) => (
                  <div key={colIndex} className="py-3 px-4 min-h-24">
                    <div className="h-full bg-gray-100 rounded"></div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-8 border-b border-gray-200">
              <div className="md:col-span-1 py-3 px-4 bg-gray-50 font-medium">Meal</div>
              {mealPlan.meals.map(day => (
                <div 
                  key={day.id} 
                  className={`py-3 px-4 ${activeDay === day.id ? 'bg-sage bg-opacity-5' : ''}`}
                >
                  {day.day}
                </div>
              ))}
            </div>
        
            {/* Breakfast row */}
            <div className="grid md:grid-cols-8 border-b border-gray-200">
              <div className="md:col-span-1 py-3 px-4 bg-gray-50 font-medium">Breakfast</div>
              {mealPlan.meals.map(day => (
            <div 
              key={day.id} 
              className={`py-3 px-4 min-h-24 ${activeDay === day.id ? 'bg-sage bg-opacity-5' : ''} relative`}
            >
              {removeFeedback && removeFeedback.dayId === day.id && removeFeedback.mealType.toUpperCase() === 'BREAKFAST' && (
                <div className="absolute z-10 inset-0 flex items-center justify-center bg-sage bg-opacity-20 rounded">
                  <div className="bg-white p-2 rounded shadow text-sm text-sage font-medium">
                    Meal removed
                  </div>
                </div>
              )}
              
              {day.meals.find(meal => meal.type === 'BREAKFAST')?.recipe ? (
                <div className="p-2 bg-cream rounded relative group">
                  <button 
                    onClick={() => handleRemoveMeal(day.id, 'BREAKFAST')}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white bg-opacity-0 group-hover:bg-opacity-90 flex items-center justify-center text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove meal"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="font-medium text-sm mb-1">
                    {day.meals.find(meal => meal.type === 'BREAKFAST')?.recipe?.title}
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{day.meals.find(meal => meal.type === 'BREAKFAST')?.recipe?.totalTime} min</span>
                    <span>${day.meals.find(meal => meal.type === 'BREAKFAST')?.recipe?.estimatedCostPerServing?.toFixed(2)}/serving</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleAddRecipe(day.id, 'Breakfast')}
                  className="w-full h-full flex items-center justify-center text-sm text-gray-400 hover:text-sage"
                >
                  + Add Recipe
                </button>
              )}
            </div>
          ))}
        </div>
        
        {/* Lunch row */}
        <div className="grid md:grid-cols-8 border-b border-gray-200">
          <div className="md:col-span-1 py-3 px-4 bg-gray-50 font-medium">Lunch</div>
          {mealPlan.meals.map(day => (
            <div 
              key={day.id} 
              className={`py-3 px-4 min-h-24 ${activeDay === day.id ? 'bg-sage bg-opacity-5' : ''} relative`}
            >
              {removeFeedback && removeFeedback.dayId === day.id && removeFeedback.mealType.toUpperCase() === 'LUNCH' && (
                <div className="absolute z-10 inset-0 flex items-center justify-center bg-sage bg-opacity-20 rounded">
                  <div className="bg-white p-2 rounded shadow text-sm text-sage font-medium">
                    Meal removed
                  </div>
                </div>
              )}
              
              {day.meals.find(meal => meal.type === 'LUNCH')?.recipe ? (
                <div className="p-2 bg-cream rounded relative group">
                  <button 
                    onClick={() => handleRemoveMeal(day.id, 'LUNCH')}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white bg-opacity-0 group-hover:bg-opacity-90 flex items-center justify-center text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove meal"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="font-medium text-sm mb-1">
                    {day.meals.find(meal => meal.type === 'LUNCH')?.recipe?.title}
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{day.meals.find(meal => meal.type === 'LUNCH')?.recipe?.totalTime} min</span>
                    <span>${day.meals.find(meal => meal.type === 'LUNCH')?.recipe?.estimatedCostPerServing?.toFixed(2)}/serving</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleAddRecipe(day.id, 'Lunch')}
                  className="w-full h-full flex items-center justify-center text-sm text-gray-400 hover:text-sage"
                >
                  + Add Recipe
                </button>
              )}
            </div>
          ))}
        </div>
        
        {/* Dinner row */}
            <div className="grid md:grid-cols-8">
              <div className="md:col-span-1 py-3 px-4 bg-gray-50 font-medium">Dinner</div>
              {mealPlan.meals.map(day => (
                <div 
                  key={day.id} 
                  className={`py-3 px-4 min-h-24 ${activeDay === day.id ? 'bg-sage bg-opacity-5' : ''} relative`}
                >
                  {removeFeedback && removeFeedback.dayId === day.id && removeFeedback.mealType.toUpperCase() === 'DINNER' && (
                    <div className="absolute z-10 inset-0 flex items-center justify-center bg-sage bg-opacity-20 rounded">
                      <div className="bg-white p-2 rounded shadow text-sm text-sage font-medium">
                        Meal removed
                      </div>
                    </div>
                  )}
                  
                  {day.meals.find(meal => meal.type === 'DINNER')?.recipe ? (
                    <div className="p-2 bg-cream rounded relative group">
                      <button 
                        onClick={() => handleRemoveMeal(day.id, 'DINNER')}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white bg-opacity-0 group-hover:bg-opacity-90 flex items-center justify-center text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove meal"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <div className="font-medium text-sm mb-1">
                        {day.meals.find(meal => meal.type === 'DINNER')?.recipe?.title}
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>{day.meals.find(meal => meal.type === 'DINNER')?.recipe?.totalTime} min</span>
                        <span>${day.meals.find(meal => meal.type === 'DINNER')?.recipe?.estimatedCostPerServing?.toFixed(2)}/serving</span>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAddRecipe(day.id, 'Dinner')}
                      className="w-full h-full flex items-center justify-center text-sm text-gray-400 hover:text-sage"
                    >
                      + Add Recipe
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      
      <div className="mt-12">
        <h2 className="text-2xl font-serif font-bold text-navy mb-6">Cost Estimate</h2>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          {isLoading ? (
            // Loading skeleton for cost estimate
            <div className="animate-pulse">
              <div className="grid md:grid-cols-7 gap-4">
                {Array.from({ length: 7 }).map((_, index) => (
                  <div key={index} className="bg-gray-100 p-4 rounded-lg h-24"></div>
                ))}
              </div>
              <div className="mt-6 p-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="h-6 bg-gray-100 rounded w-32"></div>
                  <div className="h-8 bg-gray-100 rounded w-24"></div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-7 gap-4">
                {mealPlan.meals.map(day => {
                  // Calculate total cost for the day
                  const dayCost = day.meals.reduce((total, meal) => {
                    if (meal.recipe?.estimatedCostPerServing) {
                      return total + (meal.recipe.estimatedCostPerServing * meal.recipe.servings);
                    }
                    return total;
                  }, 0);
                  
                  return (
                    <div key={day.id} className="bg-cream p-4 rounded-lg">
                      <h3 className="font-medium mb-2">{day.day.substring(0, 3)}</h3>
                      <div className="text-2xl font-medium text-navy">${dayCost.toFixed(2)}</div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-6 p-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">Weekly Total:</span>
                  <span className="text-2xl font-medium text-navy">
                    $
                    {mealPlan.meals.reduce((total, day) => {
                      return total + day.meals.reduce((dayTotal, meal) => {
                        if (meal.recipe?.estimatedCostPerServing) {
                          return dayTotal + (meal.recipe.estimatedCostPerServing * meal.recipe.servings);
                        }
                        return dayTotal;
                      }, 0);
                    }, 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="mt-12">
        <h2 className="text-2xl font-serif font-bold text-navy mb-6">Nutritional Balance</h2>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          {isLoading ? (
            // Loading skeleton for nutritional balance
            <div className="animate-pulse">
              <div className="h-5 bg-gray-100 rounded w-3/4 mb-6"></div>
              <div className="grid md:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="bg-gray-100 p-4 rounded-lg h-20"></div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-6">
                This feature will show nutritional information for your planned meals in the full version.
              </p>
              
              <div className="grid md:grid-cols-4 gap-6">
                <div className="bg-cream p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Calories</h3>
                  <div className="h-4 bg-gray-200 rounded-full">
                    <div 
                      className="h-4 bg-sage rounded-full" 
                      style={{ width: '45%' }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs">
                    <span>0</span>
                    <span className="font-medium">1200 / 2000</span>
                  </div>
                </div>
                
                <div className="bg-cream p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Protein</h3>
                  <div className="h-4 bg-gray-200 rounded-full">
                    <div 
                      className="h-4 bg-sage rounded-full" 
                      style={{ width: '60%' }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs">
                    <span>0</span>
                    <span className="font-medium">75g / 125g</span>
                  </div>
                </div>
                
                <div className="bg-cream p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Carbs</h3>
                  <div className="h-4 bg-gray-200 rounded-full">
                    <div 
                      className="h-4 bg-sage rounded-full" 
                      style={{ width: '30%' }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs">
                    <span>0</span>
                    <span className="font-medium">90g / 300g</span>
                  </div>
                </div>
                
                <div className="bg-cream p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Fat</h3>
                  <div className="h-4 bg-gray-200 rounded-full">
                    <div 
                      className="h-4 bg-sage rounded-full" 
                      style={{ width: '50%' }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs">
                    <span>0</span>
                    <span className="font-medium">40g / 80g</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <Link 
          href="/recipe-generator" 
          className="inline-flex items-center text-sage hover:underline"
        >
          Need inspiration? Generate new recipe ideas
          <svg 
            className="ml-1 w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 5l7 7-7 7" 
            />
          </svg>
        </Link>
      </div>
      
      {/* Recipe Search Sidebar */}
      <RecipeSearchSidebar
        isOpen={sidebarOpen}
        onClose={handleCloseSidebar}
        onSelectRecipe={handleSelectRecipe}
        selectedMealType={selectedMealType}
        selectedDayId={selectedDayId}
      />
      
      {/* Shopping List Modal */}
      {mealPlan && (
        <ShoppingListModal
          isOpen={isShoppingListModalOpen}
          onClose={() => setShoppingListModalOpen(false)}
          mealPlanId={mealPlan.id || ''} // Make sure mealPlan has an id property
          mealPlanName={mealPlan.name || `Meal Plan ${formatDate(mealPlan.startDate)} - ${formatDate(mealPlan.endDate)}`}
          onSuccess={handleShoppingListCreated}
        />
      )}
    </div>
  );
}
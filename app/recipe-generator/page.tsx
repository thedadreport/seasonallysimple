'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { z } from 'zod';

// Define the form schema
const recipeFormSchema = z.object({
  dietaryRestrictions: z.array(z.string()).optional(),
  cookingTime: z.enum(['FIFTEEN_MINUTES_OR_LESS', 'THIRTY_MINUTES_OR_LESS', 'UP_TO_1_HOUR', 'MORE_THAN_1_HOUR']),
  season: z.enum(['SPRING', 'SUMMER', 'FALL', 'WINTER']),
  servings: z.number().min(1).max(12),
  skillLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  cuisineType: z.string().min(1),
  specialRequests: z.string().optional(),
});

type RecipeFormValues = z.infer<typeof recipeFormSchema>;

const cuisineOptions = [
  'Mediterranean', 'Italian', 'Mexican', 'Japanese', 'Chinese', 
  'Indian', 'Thai', 'American', 'French', 'Middle Eastern'
];

const dietaryRestrictionOptions = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 
  'Nut-Free', 'Low-Carb', 'Keto', 'Paleo'
];

export default function RecipeGenerator() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [generatedRecipe, setGeneratedRecipe] = useState<any>(null);
  
  const { register, handleSubmit, formState: { errors } } = useForm<RecipeFormValues>({
    defaultValues: {
      cookingTime: 'THIRTY_MINUTES_OR_LESS',
      season: 'SPRING', // We would get this dynamically in a real implementation
      servings: 4,
      skillLevel: 'BEGINNER',
      cuisineType: 'Mediterranean',
      dietaryRestrictions: [],
    }
  });

  const onSubmit = async (data: RecipeFormValues) => {
    setIsGenerating(true);
    setSaveStatus('idle');
    
    try {
      // Call our API endpoint for recipe generation
      const response = await fetch('/api/recipes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to generate recipe');
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setGeneratedRecipe(result.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error("Error generating recipe:", error);
      alert('Failed to generate recipe. Please try again later.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartOver = () => {
    setGeneratedRecipe(null);
    setSaveStatus('idle');
  };

  const handleSaveRecipe = async () => {
    // Check if user is logged in
    if (status !== 'authenticated') {
      router.push('/login?returnUrl=/recipe-generator');
      return;
    }

    setIsSaving(true);
    setSaveStatus('idle');
    
    // Log the original generated recipe for debugging
    console.log('Generated recipe data:', generatedRecipe);

    try {
      // Format the recipe data according to the API schema
      const recipeData = {
        title: generatedRecipe.title,
        description: generatedRecipe.description,
        timings: {
          prep: parseInt(generatedRecipe.timings.prep, 10),
          cook: parseInt(generatedRecipe.timings.cook, 10),
          total: parseInt(generatedRecipe.timings.total, 10),
        },
        ingredients: generatedRecipe.ingredients.map((ing: any) => ({
          amount: ing.amount.toString(),
          unit: ing.unit || null,
          name: ing.name,
        })),
        instructions: generatedRecipe.instructions.map((ins: any) => ({
          stepNumber: ins.stepNumber,
          text: ins.text,
        })),
        nutritionInfo: {
          calories: parseInt(generatedRecipe.nutritionInfo.calories, 10),
          protein: parseInt(generatedRecipe.nutritionInfo.protein, 10),
          carbs: parseInt(generatedRecipe.nutritionInfo.carbs, 10),
          fat: parseInt(generatedRecipe.nutritionInfo.fat, 10),
          fiber: generatedRecipe.nutritionInfo.fiber ? parseInt(generatedRecipe.nutritionInfo.fiber, 10) : null,
          sodium: generatedRecipe.nutritionInfo.sodium ? parseInt(generatedRecipe.nutritionInfo.sodium, 10) : null,
        },
        difficulty: generatedRecipe.skillLevel || 'BEGINNER',
        season: generatedRecipe.season || 'ALL',
        cuisineType: generatedRecipe.cuisineType,
        dietaryTags: Array.isArray(generatedRecipe.dietaryTags) 
          ? generatedRecipe.dietaryTags.join(',') 
          : (generatedRecipe.dietaryTags || ''),
        servings: parseInt(generatedRecipe.servings || '4', 10),
        tips: generatedRecipe.tips || null,
        imageUrl: generatedRecipe.imageUrl || null,
        isAIGenerated: true,
      };
      
      // Log the formatted recipe data for debugging
      console.log('Formatted recipe data:', recipeData);

      // Call the API to save the recipe
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipeData),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('API error response:', result);
        if (result.error?.code === 'VALIDATION_ERROR') {
          console.error('Validation errors:', result.error.details);
          throw new Error('Invalid recipe data: ' + JSON.stringify(result.error.details));
        } else {
          throw new Error(result.error?.message || 'Failed to save recipe');
        }
      }

      setSaveStatus('success');
      
      // Optionally redirect to the saved recipe
      setTimeout(() => {
        router.push(`/recipes/${result.data.id}`);
      }, 1500);
      
    } catch (error: any) {
      console.error('Error saving recipe:', error);
      // Set a more specific error message if available
      setSaveStatus('error');
      // Display detailed error in UI
      if (error.message && error.message.includes('Invalid recipe data')) {
        alert('Failed to save recipe due to validation errors. Check console for details.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const cookingTimeDisplay = {
    FIFTEEN_MINUTES_OR_LESS: '15 minutes or less',
    THIRTY_MINUTES_OR_LESS: '30 minutes or less',
    UP_TO_1_HOUR: 'Up to 1 hour',
    MORE_THAN_1_HOUR: 'More than 1 hour'
  };

  const skillLevelDisplay = {
    BEGINNER: 'Beginner',
    INTERMEDIATE: 'Intermediate',
    ADVANCED: 'Advanced'
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-serif font-bold text-navy mb-8 text-center">
        AI Recipe Generator
      </h1>

      {!generatedRecipe ? (
        <div className="bg-white p-8 rounded-xl shadow-md">
          <p className="text-lg mb-6">
            Tell us what you're looking for, and we'll create a personalized recipe just for you.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-navy font-medium mb-2">Cooking Time</label>
              <select 
                {...register('cookingTime')}
                className="w-full input-field"
              >
                {Object.entries(cookingTimeDisplay).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              {errors.cookingTime && <p className="text-red-500 mt-1">{errors.cookingTime.message}</p>}
            </div>

            <div>
              <label className="block text-navy font-medium mb-2">Number of Servings</label>
              <input 
                type="number" 
                {...register('servings', { valueAsNumber: true })}
                min={1}
                max={12}
                className="w-full input-field"
              />
              {errors.servings && <p className="text-red-500 mt-1">{errors.servings.message}</p>}
            </div>

            <div>
              <label className="block text-navy font-medium mb-2">Cuisine Type</label>
              <select 
                {...register('cuisineType')}
                className="w-full input-field"
              >
                {cuisineOptions.map(cuisine => (
                  <option key={cuisine} value={cuisine}>{cuisine}</option>
                ))}
              </select>
              {errors.cuisineType && <p className="text-red-500 mt-1">{errors.cuisineType.message}</p>}
            </div>

            <div>
              <label className="block text-navy font-medium mb-2">Skill Level</label>
              <select 
                {...register('skillLevel')}
                className="w-full input-field"
              >
                {Object.entries(skillLevelDisplay).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              {errors.skillLevel && <p className="text-red-500 mt-1">{errors.skillLevel.message}</p>}
            </div>

            <div>
              <label className="block text-navy font-medium mb-2">Dietary Restrictions</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {dietaryRestrictionOptions.map(restriction => (
                  <div key={restriction} className="flex items-center">
                    <input
                      type="checkbox"
                      id={restriction}
                      value={restriction}
                      {...register('dietaryRestrictions')}
                      className="mr-2"
                    />
                    <label htmlFor={restriction}>{restriction}</label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-navy font-medium mb-2">Special Requests or Ingredients</label>
              <textarea 
                {...register('specialRequests')}
                className="w-full input-field h-24"
                placeholder="E.g., using chicken, one-pot meal, kid-friendly..."
              />
            </div>

            <button 
              type="submit" 
              className="btn-primary w-full py-3"
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating Recipe...' : 'Generate Recipe'}
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-xl shadow-md">
          <h2 className="text-3xl font-serif font-bold text-navy mb-2">{generatedRecipe.title}</h2>
          <p className="text-gray-600 mb-6">{generatedRecipe.description}</p>
          
          <div className="flex flex-wrap gap-6 mb-8">
            <div className="flex items-center">
              <span className="font-medium mr-2">Prep:</span> 
              <span>{generatedRecipe.timings.prep} min</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium mr-2">Cook:</span> 
              <span>{generatedRecipe.timings.cook} min</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium mr-2">Total:</span> 
              <span>{generatedRecipe.timings.total} min</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium mr-2">Servings:</span> 
              <span>4</span>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-serif font-semibold mb-4 text-sage">Ingredients</h3>
              <ul className="space-y-2">
                {generatedRecipe.ingredients.map((ingredient: any, index: number) => (
                  <li key={index} className="flex">
                    <span className="font-medium mr-2 min-w-16">{ingredient.amount} {ingredient.unit}</span>
                    <span>{ingredient.name}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-serif font-semibold mb-4 text-sage">Nutrition (per serving)</h3>
              <ul className="space-y-2">
                <li className="flex justify-between">
                  <span>Calories:</span>
                  <span className="font-medium">{generatedRecipe.nutritionInfo.calories}</span>
                </li>
                <li className="flex justify-between">
                  <span>Protein:</span>
                  <span className="font-medium">{generatedRecipe.nutritionInfo.protein}g</span>
                </li>
                <li className="flex justify-between">
                  <span>Carbs:</span>
                  <span className="font-medium">{generatedRecipe.nutritionInfo.carbs}g</span>
                </li>
                <li className="flex justify-between">
                  <span>Fat:</span>
                  <span className="font-medium">{generatedRecipe.nutritionInfo.fat}g</span>
                </li>
                <li className="flex justify-between">
                  <span>Fiber:</span>
                  <span className="font-medium">{generatedRecipe.nutritionInfo.fiber}g</span>
                </li>
                <li className="flex justify-between">
                  <span>Sodium:</span>
                  <span className="font-medium">{generatedRecipe.nutritionInfo.sodium}mg</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mb-8">
            <h3 className="text-xl font-serif font-semibold mb-4 text-sage">Instructions</h3>
            <ol className="space-y-4">
              {generatedRecipe.instructions.map((instruction: any) => (
                <li key={instruction.stepNumber} className="flex">
                  <span className="font-semibold text-sage mr-3">{instruction.stepNumber}.</span>
                  <span>{instruction.text}</span>
                </li>
              ))}
            </ol>
          </div>
          
          <div className="mb-8 bg-cream p-4 rounded-lg">
            <h3 className="text-xl font-serif font-semibold mb-2 text-sage">Chef's Tips</h3>
            <p>{generatedRecipe.tips}</p>
          </div>
          
          {saveStatus === 'success' && (
            <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-md">
              Recipe saved successfully! Redirecting to recipe page...
            </div>
          )}
          
          {saveStatus === 'error' && (
            <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
              Failed to save recipe. Please try again.
            </div>
          )}
          
          <div className="flex gap-4">
            <button 
              onClick={handleStartOver} 
              className="btn-secondary"
              disabled={isSaving}
            >
              Generate Another Recipe
            </button>
            <button 
              onClick={handleSaveRecipe} 
              className="btn-primary"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save This Recipe'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
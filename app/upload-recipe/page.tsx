'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Define the form schema using Zod
const recipeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  timings: z.object({
    prep: z.number().min(0, "Prep time can't be negative"),
    cook: z.number().min(0, "Cook time can't be negative"),
    total: z.number().min(0, "Total time can't be negative"),
  }),
  ingredients: z.array(
    z.object({
      amount: z.string(),
      unit: z.string(),
      name: z.string().min(1, "Ingredient name is required"),
    })
  ).min(1, "At least one ingredient is required"),
  instructions: z.array(
    z.object({
      stepNumber: z.number(),
      text: z.string().min(1, "Instruction text is required"),
    })
  ).min(1, "At least one instruction step is required"),
  nutritionInfo: z.object({
    calories: z.number().min(0),
    protein: z.number().min(0),
    carbs: z.number().min(0),
    fat: z.number().min(0),
    fiber: z.number().min(0),
    sodium: z.number().min(0),
  }).optional(),
  tips: z.string().optional(),
  cuisineType: z.string().optional(),
  servings: z.number().min(1).default(4),
  estimatedCostPerServing: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

type RecipeFormValues = z.infer<typeof recipeSchema>;

export default function UploadRecipePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultValues: RecipeFormValues = {
    title: '',
    description: '',
    timings: {
      prep: 0,
      cook: 0,
      total: 0,
    },
    ingredients: [{ amount: '', unit: '', name: '' }],
    instructions: [{ stepNumber: 1, text: '' }],
    nutritionInfo: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sodium: 0,
    },
    tips: '',
    cuisineType: '',
    servings: 4,
    estimatedCostPerServing: undefined,
    tags: [],
  };

  const { 
    register, 
    handleSubmit, 
    control, 
    watch, 
    setValue,
    formState: { errors } 
  } = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeSchema),
    defaultValues,
  });

  const { fields: ingredientFields, append: appendIngredient, remove: removeIngredient } = 
    useFieldArray({ control, name: 'ingredients' });
  
  const { fields: instructionFields, append: appendInstruction, remove: removeInstruction } = 
    useFieldArray({ control, name: 'instructions' });

  // Auto-update total time when prep or cook time change
  const prepTime = watch('timings.prep');
  const cookTime = watch('timings.cook');

  // Update total time whenever prep or cook time changes
  useEffect(() => {
    setValue('timings.total', prepTime + cookTime);
  }, [prepTime, cookTime, setValue]);

  // Handle form submission
  const onSubmit = async (data: RecipeFormValues) => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Update total time one more time to ensure it's correct
      data.timings.total = data.timings.prep + data.timings.cook;
      
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to save recipe');
      }

      // Navigate to the saved recipes page
      router.push('/saved-recipes');
      
    } catch (err) {
      console.error('Error saving recipe:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add handlers for adding/removing ingredients and instructions
  const handleAddIngredient = () => {
    appendIngredient({ amount: '', unit: '', name: '' });
  };

  const handleAddInstruction = () => {
    const nextStepNumber = instructionFields.length + 1;
    appendInstruction({ stepNumber: nextStepNumber, text: '' });
  };

  // Handle tags input
  const [tagInput, setTagInput] = useState('');
  const tags = watch('tags') || [];

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setValue('tags', [...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setValue('tags', tags.filter(t => t !== tag));
  };

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sage"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-serif font-bold text-navy mb-8">Upload Your Recipe</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white p-6 rounded-lg shadow-md">
        {/* Recipe Basics */}
        <div className="space-y-4">
          <h2 className="text-xl font-medium text-navy">Recipe Basics</h2>
          
          <div>
            <label className="block text-gray-700 mb-1">Recipe Title *</label>
            <input
              type="text"
              {...register('title')}
              className="w-full input-field"
              placeholder="e.g., Homemade Pasta Carbonara"
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
          </div>
          
          <div>
            <label className="block text-gray-700 mb-1">Description</label>
            <textarea
              {...register('description')}
              className="w-full input-field h-24"
              placeholder="A brief description of your recipe..."
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700 mb-1">Prep Time (minutes) *</label>
              <input
                type="number"
                {...register('timings.prep', { valueAsNumber: true })}
                className="w-full input-field"
                min="0"
              />
              {errors.timings?.prep && <p className="text-red-500 text-sm mt-1">{errors.timings.prep.message}</p>}
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1">Cook Time (minutes) *</label>
              <input
                type="number"
                {...register('timings.cook', { valueAsNumber: true })}
                className="w-full input-field"
                min="0"
              />
              {errors.timings?.cook && <p className="text-red-500 text-sm mt-1">{errors.timings.cook.message}</p>}
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1">Total Time (minutes)</label>
              <input
                type="number"
                {...register('timings.total', { valueAsNumber: true })}
                className="w-full input-field"
                readOnly
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-1">Servings *</label>
              <input
                type="number"
                {...register('servings', { valueAsNumber: true })}
                className="w-full input-field"
                min="1"
              />
              {errors.servings && <p className="text-red-500 text-sm mt-1">{errors.servings.message}</p>}
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1">Cuisine Type</label>
              <input
                type="text"
                {...register('cuisineType')}
                className="w-full input-field"
                placeholder="e.g., Italian, Mexican, etc."
              />
            </div>
          </div>
          
          <div>
            <label className="block text-gray-700 mb-1">Estimated Cost Per Serving ($)</label>
            <input
              type="number"
              step="0.01"
              {...register('estimatedCostPerServing', { valueAsNumber: true })}
              className="w-full input-field"
              min="0"
              placeholder="e.g., 3.50"
            />
          </div>
        </div>
        
        {/* Ingredients */}
        <div className="space-y-4">
          <h2 className="text-xl font-medium text-navy">Ingredients</h2>
          
          {ingredientFields.map((field, index) => (
            <div key={field.id} className="flex items-start space-x-2">
              <input
                {...register(`ingredients.${index}.amount`)}
                className="w-1/6 input-field"
                placeholder="Amount"
              />
              <input
                {...register(`ingredients.${index}.unit`)}
                className="w-1/6 input-field"
                placeholder="Unit"
              />
              <input
                {...register(`ingredients.${index}.name`)}
                className="w-3/6 input-field"
                placeholder="Ingredient name"
              />
              <button
                type="button"
                onClick={() => removeIngredient(index)}
                className="p-2 text-red-500 hover:text-red-700"
                disabled={ingredientFields.length === 1}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
          
          {errors.ingredients && (
            <p className="text-red-500 text-sm">{errors.ingredients.message}</p>
          )}
          
          <button
            type="button"
            onClick={handleAddIngredient}
            className="btn-secondary text-sm"
          >
            + Add Ingredient
          </button>
        </div>
        
        {/* Instructions */}
        <div className="space-y-4">
          <h2 className="text-xl font-medium text-navy">Instructions</h2>
          
          {instructionFields.map((field, index) => (
            <div key={field.id} className="flex items-start space-x-2">
              <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-sage text-white rounded-full font-bold">
                {index + 1}
              </div>
              <div className="flex-grow">
                <input type="hidden" {...register(`instructions.${index}.stepNumber`)} value={index + 1} />
                <textarea
                  {...register(`instructions.${index}.text`)}
                  className="w-full input-field h-20"
                  placeholder={`Step ${index + 1} instructions...`}
                />
                {errors.instructions?.[index]?.text && (
                  <p className="text-red-500 text-sm mt-1">{errors.instructions[index]?.text?.message}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeInstruction(index)}
                className="p-2 text-red-500 hover:text-red-700"
                disabled={instructionFields.length === 1}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
          
          {errors.instructions && (
            <p className="text-red-500 text-sm">{errors.instructions.message}</p>
          )}
          
          <button
            type="button"
            onClick={handleAddInstruction}
            className="btn-secondary text-sm"
          >
            + Add Instruction
          </button>
        </div>
        
        {/* Nutrition Information */}
        <div className="space-y-4">
          <h2 className="text-xl font-medium text-navy">Nutrition Information</h2>
          <p className="text-gray-600 text-sm">Provide per serving if available (optional)</p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700 mb-1">Calories</label>
              <input
                type="number"
                {...register('nutritionInfo.calories', { valueAsNumber: true })}
                className="w-full input-field"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1">Protein (g)</label>
              <input
                type="number"
                step="0.1"
                {...register('nutritionInfo.protein', { valueAsNumber: true })}
                className="w-full input-field"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1">Carbs (g)</label>
              <input
                type="number"
                step="0.1"
                {...register('nutritionInfo.carbs', { valueAsNumber: true })}
                className="w-full input-field"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1">Fat (g)</label>
              <input
                type="number"
                step="0.1"
                {...register('nutritionInfo.fat', { valueAsNumber: true })}
                className="w-full input-field"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1">Fiber (g)</label>
              <input
                type="number"
                step="0.1"
                {...register('nutritionInfo.fiber', { valueAsNumber: true })}
                className="w-full input-field"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1">Sodium (mg)</label>
              <input
                type="number"
                step="1"
                {...register('nutritionInfo.sodium', { valueAsNumber: true })}
                className="w-full input-field"
                min="0"
              />
            </div>
          </div>
        </div>
        
        {/* Tags */}
        <div className="space-y-4">
          <h2 className="text-xl font-medium text-navy">Tags</h2>
          
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map(tag => (
              <div key={tag} className="bg-cream px-3 py-1 rounded-full flex items-center">
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-2 text-gray-500 hover:text-red-500"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
          
          <div className="flex">
            <input
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              className="input-field flex-grow"
              placeholder="e.g., vegetarian, quick, dinner"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="ml-2 btn-secondary"
            >
              Add Tag
            </button>
          </div>
        </div>
        
        {/* Chef's Tips */}
        <div>
          <label className="block text-gray-700 mb-1">Chef's Tips</label>
          <textarea
            {...register('tips')}
            className="w-full input-field h-24"
            placeholder="Share any special tips or variations for this recipe..."
          />
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Recipe'}
          </button>
        </div>
      </form>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

// Define types for recipe data
type Ingredient = {
  amount: string;
  unit: string;
  name: string;
};

type Instruction = {
  stepNumber: number;
  text: string;
};

type NutritionInfo = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sodium?: number;
};

type RecipeFormData = {
  title: string;
  description: string;
  timings: {
    prep: number;
    cook: number;
    total: number;
  };
  ingredients: Ingredient[];
  instructions: Instruction[];
  nutritionInfo?: NutritionInfo;
  difficulty: string;
  season: string;
  cuisineType: string;
  dietaryTags: string[];
  servings: number;
  tips?: string;
  imageUrl?: string;
  isAIGenerated: boolean;
};

// Component for adding a new recipe
export default function AddRecipePage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  // Initialize form state
  const [formData, setFormData] = useState<RecipeFormData>({
    title: '',
    description: '',
    timings: {
      prep: 0,
      cook: 0,
      total: 0,
    },
    ingredients: [{ amount: '', unit: '', name: '' }],
    instructions: [{ stepNumber: 1, text: '' }],
    difficulty: 'EASY',
    season: 'ALL',
    cuisineType: '',
    dietaryTags: [],
    servings: 4,
    tips: '',
    isAIGenerated: false,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Available options for selects
  const difficultyOptions = ['EASY', 'MEDIUM', 'HARD'];
  const seasonOptions = ['ALL', 'SPRING', 'SUMMER', 'FALL', 'WINTER'];
  const cuisineOptions = ['Mediterranean', 'Italian', 'French', 'American', 'Asian', 'Mexican', 'Indian', 'Other'];
  const dietaryOptions = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'low-carb', 'keto', 'paleo'];
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties
      const [parent, child] = name.split('.');
      setFormData(prev => {
        const parentKey = parent as keyof RecipeFormData;
        const parentValue = prev[parentKey] || {};
        
        if (typeof parentValue !== 'object') {
          console.error(`Expected ${parent} to be an object, but got ${typeof parentValue}`);
          return prev;
        }
        
        return {
          ...prev,
          [parent]: {
            ...parentValue,
            [child]: value,
          },
        };
      });
    } else {
      // Handle top-level properties
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };
  
  // Handle number input changes
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties
      const [parent, child] = name.split('.');
      setFormData(prev => {
        const parentKey = parent as keyof RecipeFormData;
        const parentValue = prev[parentKey] || {};
        
        if (typeof parentValue !== 'object') {
          console.error(`Expected ${parent} to be an object, but got ${typeof parentValue}`);
          return prev;
        }
        
        return {
          ...prev,
          [parent]: {
            ...parentValue,
            [child]: parseInt(value) || 0,
          },
        };
      });
    } else {
      // Handle top-level properties
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 0,
      }));
    }
  };
  
  // Handle dietary tags changes
  const handleDietaryChange = (tag: string) => {
    setFormData(prev => {
      const currentTags = [...prev.dietaryTags];
      
      if (currentTags.includes(tag)) {
        // Remove tag if already selected
        return {
          ...prev,
          dietaryTags: currentTags.filter(t => t !== tag),
        };
      } else {
        // Add tag if not selected
        return {
          ...prev,
          dietaryTags: [...currentTags, tag],
        };
      }
    });
  };
  
  // Handle ingredient changes
  const handleIngredientChange = (index: number, field: keyof Ingredient, value: string) => {
    setFormData(prev => {
      const updatedIngredients = [...prev.ingredients];
      updatedIngredients[index] = {
        ...updatedIngredients[index],
        [field]: value,
      };
      return {
        ...prev,
        ingredients: updatedIngredients,
      };
    });
  };
  
  // Add a new ingredient
  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { amount: '', unit: '', name: '' }],
    }));
  };
  
  // Remove an ingredient
  const removeIngredient = (index: number) => {
    if (formData.ingredients.length > 1) {
      setFormData(prev => ({
        ...prev,
        ingredients: prev.ingredients.filter((_, i) => i !== index),
      }));
    }
  };
  
  // Handle instruction changes
  const handleInstructionChange = (index: number, field: keyof Instruction, value: any) => {
    setFormData(prev => {
      const updatedInstructions = [...prev.instructions];
      updatedInstructions[index] = {
        ...updatedInstructions[index],
        [field]: field === 'stepNumber' ? parseInt(value) || 0 : value,
      };
      return {
        ...prev,
        instructions: updatedInstructions,
      };
    });
  };
  
  // Add a new instruction
  const addInstruction = () => {
    const nextStepNumber = formData.instructions.length > 0 
      ? Math.max(...formData.instructions.map(i => i.stepNumber)) + 1 
      : 1;
    
    setFormData(prev => ({
      ...prev,
      instructions: [...prev.instructions, { stepNumber: nextStepNumber, text: '' }],
    }));
  };
  
  // Remove an instruction
  const removeInstruction = (index: number) => {
    if (formData.instructions.length > 1) {
      setFormData(prev => ({
        ...prev,
        instructions: prev.instructions.filter((_, i) => i !== index),
      }));
    }
  };
  
  // Handle nutrition info changes
  const handleNutritionChange = (field: keyof NutritionInfo, value: string) => {
    setFormData(prev => ({
      ...prev,
      nutritionInfo: {
        ...prev.nutritionInfo,
        [field]: parseFloat(value) || 0,
      } as NutritionInfo,
    }));
  };
  
  // Calculate total time when prep or cook time changes
  const updateTotalTime = () => {
    setFormData(prev => ({
      ...prev,
      timings: {
        ...prev.timings,
        total: prev.timings.prep + prev.timings.cook,
      },
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Create recipe object from form data
      const recipeData = {
        ...formData,
        dietaryTags: formData.dietaryTags.join(','),
      };
      
      // Send API request to create recipe
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recipeData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create recipe');
      }
      
      setSuccess('Recipe created successfully!');
      
      // Redirect to the recipe page
      setTimeout(() => {
        router.push(`/recipes/${data.data.id}`);
      }, 1500);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Check if user is authenticated
  if (!session) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-serif font-semibold mb-4">Please Sign In</h2>
          <p className="mb-6">You need to be logged in to create recipes.</p>
          <Link href="/login" className="btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl md:text-4xl font-serif font-bold text-navy mb-8">
        Create New Recipe
      </h1>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-md mb-6">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info Section */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-xl font-serif font-semibold mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Recipe Title*
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Enter recipe title"
              />
            </div>
            
            <div className="col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description*
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Brief description of the recipe"
              />
            </div>
            
            <div>
              <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty*
              </label>
              <select
                id="difficulty"
                name="difficulty"
                value={formData.difficulty}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {difficultyOptions.map(option => (
                  <option key={option} value={option}>
                    {option.charAt(0) + option.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="season" className="block text-sm font-medium text-gray-700 mb-1">
                Season*
              </label>
              <select
                id="season"
                name="season"
                value={formData.season}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {seasonOptions.map(option => (
                  <option key={option} value={option}>
                    {option.charAt(0) + option.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="cuisineType" className="block text-sm font-medium text-gray-700 mb-1">
                Cuisine Type*
              </label>
              <select
                id="cuisineType"
                name="cuisineType"
                value={formData.cuisineType}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select cuisine</option>
                {cuisineOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="servings" className="block text-sm font-medium text-gray-700 mb-1">
                Servings*
              </label>
              <input
                type="number"
                id="servings"
                name="servings"
                min="1"
                value={formData.servings}
                onChange={handleNumberChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dietary Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {dietaryOptions.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleDietaryChange(tag)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    formData.dietaryTags.includes(tag)
                      ? 'bg-sage text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </section>
        
        {/* Timing Section */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-xl font-serif font-semibold mb-4">Timing</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="timings.prep" className="block text-sm font-medium text-gray-700 mb-1">
                Prep Time (minutes)*
              </label>
              <input
                type="number"
                id="timings.prep"
                name="timings.prep"
                min="0"
                value={formData.timings.prep}
                onChange={handleNumberChange}
                onBlur={updateTotalTime}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label htmlFor="timings.cook" className="block text-sm font-medium text-gray-700 mb-1">
                Cook Time (minutes)*
              </label>
              <input
                type="number"
                id="timings.cook"
                name="timings.cook"
                min="0"
                value={formData.timings.cook}
                onChange={handleNumberChange}
                onBlur={updateTotalTime}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label htmlFor="timings.total" className="block text-sm font-medium text-gray-700 mb-1">
                Total Time (minutes)
              </label>
              <input
                type="number"
                id="timings.total"
                name="timings.total"
                value={formData.timings.total}
                readOnly
                className="w-full p-2 border border-gray-200 bg-gray-50 rounded-md"
              />
            </div>
          </div>
        </section>
        
        {/* Ingredients Section */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-xl font-serif font-semibold mb-4">Ingredients</h2>
          
          {formData.ingredients.map((ingredient, index) => (
            <div key={index} className="grid grid-cols-12 gap-4 mb-4">
              <div className="col-span-2">
                <label className={index === 0 ? "block text-sm font-medium text-gray-700 mb-1" : "sr-only"}>
                  Amount*
                </label>
                <input
                  type="text"
                  value={ingredient.amount}
                  onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="1/2"
                />
              </div>
              
              <div className="col-span-2">
                <label className={index === 0 ? "block text-sm font-medium text-gray-700 mb-1" : "sr-only"}>
                  Unit
                </label>
                <input
                  type="text"
                  value={ingredient.unit}
                  onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="cup"
                />
              </div>
              
              <div className="col-span-7">
                <label className={index === 0 ? "block text-sm font-medium text-gray-700 mb-1" : "sr-only"}>
                  Ingredient*
                </label>
                <input
                  type="text"
                  value={ingredient.name}
                  onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="flour"
                />
              </div>
              
              <div className="col-span-1 flex items-end">
                <button
                  type="button"
                  onClick={() => removeIngredient(index)}
                  className="p-2 text-red-600 hover:text-red-800"
                  disabled={formData.ingredients.length <= 1}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          
          <button
            type="button"
            onClick={addIngredient}
            className="mt-2 text-sage hover:text-sage-dark font-medium"
          >
            + Add Ingredient
          </button>
        </section>
        
        {/* Instructions Section */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-xl font-serif font-semibold mb-4">Instructions</h2>
          
          {formData.instructions.map((instruction, index) => (
            <div key={index} className="grid grid-cols-12 gap-4 mb-4">
              <div className="col-span-1">
                <label className={index === 0 ? "block text-sm font-medium text-gray-700 mb-1" : "sr-only"}>
                  Step
                </label>
                <input
                  type="number"
                  min="1"
                  value={instruction.stepNumber}
                  onChange={(e) => handleInstructionChange(index, 'stepNumber', e.target.value)}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div className="col-span-10">
                <label className={index === 0 ? "block text-sm font-medium text-gray-700 mb-1" : "sr-only"}>
                  Instruction*
                </label>
                <input
                  type="text"
                  value={instruction.text}
                  onChange={(e) => handleInstructionChange(index, 'text', e.target.value)}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Mix all ingredients in a bowl"
                />
              </div>
              
              <div className="col-span-1 flex items-end">
                <button
                  type="button"
                  onClick={() => removeInstruction(index)}
                  className="p-2 text-red-600 hover:text-red-800"
                  disabled={formData.instructions.length <= 1}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          
          <button
            type="button"
            onClick={addInstruction}
            className="mt-2 text-sage hover:text-sage-dark font-medium"
          >
            + Add Instruction
          </button>
        </section>
        
        {/* Nutrition Section (Optional) */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-xl font-serif font-semibold mb-4">Nutrition Information (Optional)</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="calories" className="block text-sm font-medium text-gray-700 mb-1">
                Calories
              </label>
              <input
                type="number"
                id="calories"
                min="0"
                value={formData.nutritionInfo?.calories || ''}
                onChange={(e) => handleNutritionChange('calories', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="0"
              />
            </div>
            
            <div>
              <label htmlFor="protein" className="block text-sm font-medium text-gray-700 mb-1">
                Protein (g)
              </label>
              <input
                type="number"
                id="protein"
                min="0"
                step="0.1"
                value={formData.nutritionInfo?.protein || ''}
                onChange={(e) => handleNutritionChange('protein', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="0"
              />
            </div>
            
            <div>
              <label htmlFor="carbs" className="block text-sm font-medium text-gray-700 mb-1">
                Carbs (g)
              </label>
              <input
                type="number"
                id="carbs"
                min="0"
                step="0.1"
                value={formData.nutritionInfo?.carbs || ''}
                onChange={(e) => handleNutritionChange('carbs', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="0"
              />
            </div>
            
            <div>
              <label htmlFor="fat" className="block text-sm font-medium text-gray-700 mb-1">
                Fat (g)
              </label>
              <input
                type="number"
                id="fat"
                min="0"
                step="0.1"
                value={formData.nutritionInfo?.fat || ''}
                onChange={(e) => handleNutritionChange('fat', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="0"
              />
            </div>
            
            <div>
              <label htmlFor="fiber" className="block text-sm font-medium text-gray-700 mb-1">
                Fiber (g)
              </label>
              <input
                type="number"
                id="fiber"
                min="0"
                step="0.1"
                value={formData.nutritionInfo?.fiber || ''}
                onChange={(e) => handleNutritionChange('fiber', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="0"
              />
            </div>
            
            <div>
              <label htmlFor="sodium" className="block text-sm font-medium text-gray-700 mb-1">
                Sodium (mg)
              </label>
              <input
                type="number"
                id="sodium"
                min="0"
                step="1"
                value={formData.nutritionInfo?.sodium || ''}
                onChange={(e) => handleNutritionChange('sodium', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="0"
              />
            </div>
          </div>
        </section>
        
        {/* Additional Info Section */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-xl font-serif font-semibold mb-4">Additional Information</h2>
          
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="tips" className="block text-sm font-medium text-gray-700 mb-1">
                Tips & Notes
              </label>
              <textarea
                id="tips"
                name="tips"
                value={formData.tips || ''}
                onChange={handleInputChange}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Any tips or additional notes for making this recipe"
              />
            </div>
            
            <div>
              <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <input
                type="url"
                id="imageUrl"
                name="imageUrl"
                value={formData.imageUrl || ''}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isAIGenerated"
                name="isAIGenerated"
                checked={formData.isAIGenerated}
                onChange={(e) => 
                  setFormData(prev => ({
                    ...prev,
                    isAIGenerated: e.target.checked,
                  }))
                }
                className="h-4 w-4 text-sage focus:ring-sage border-gray-300 rounded"
              />
              <label htmlFor="isAIGenerated" className="ml-2 block text-sm text-gray-700">
                This recipe was generated with AI assistance
              </label>
            </div>
          </div>
        </section>
        
        {/* Submit Button */}
        <div className="flex justify-between">
          <Link href="/recipes" className="btn-secondary">
            Cancel
          </Link>
          
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Creating...' : 'Create Recipe'}
          </button>
        </div>
      </form>
    </div>
  );
}
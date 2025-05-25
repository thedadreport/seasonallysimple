'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Define Recipe interface with optional userNotes
interface Recipe {
  id: string;
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  totalTime: number;
  servings: number;
  difficulty: string;
  season: string;
  cuisineType: string;
  dietaryTags: string[];
  isAIGenerated: boolean;
  ingredients: { amount: string; unit: string; name: string }[];
  instructions: { stepNumber: number; text: string }[];
  nutritionInfo: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sodium: number;
  };
  tips: string;
  userNotes?: string; // Optional user notes field
  
  // Privacy and ownership fields
  visibility: 'PRIVATE' | 'PUBLIC' | 'CURATED';
  moderationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED';
  publishedAt?: string;
  moderatedAt?: string;
  moderationNotes?: string;
  
  // Ownership info
  createdBy?: {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
  };
  isOwner: boolean;
  canModerate: boolean;
}

// Mock recipe data - in a real app, this would come from an API call
const mockRecipes: Record<string, Recipe> = {
  '1': {
    id: '1',
    title: 'Mediterranean Lemon Herb Chicken with Spring Vegetables',
    description: 'A bright, family-friendly dish featuring tender chicken and seasonal spring vegetables with Mediterranean herbs. This one-pan meal is perfect for busy weeknights while still delivering fresh flavors that celebrate the season.',
    prepTime: 10,
    cookTime: 20,
    totalTime: 30,
    servings: 4,
    difficulty: 'EASY',
    season: 'SPRING',
    cuisineType: 'Mediterranean',
    dietaryTags: [],
    isAIGenerated: true,
    ingredients: [
      { amount: "1.5", unit: "pounds", name: "boneless, skinless chicken breasts, cut into 1-inch pieces" },
      { amount: "3", unit: "tablespoons", name: "olive oil, divided" },
      { amount: "2", unit: "tablespoons", name: "fresh lemon juice" },
      { amount: "2", unit: "cloves", name: "garlic, minced" },
      { amount: "1", unit: "teaspoon", name: "dried oregano" },
      { amount: "1", unit: "teaspoon", name: "paprika" },
      { amount: "1/2", unit: "teaspoon", name: "salt" },
      { amount: "1/4", unit: "teaspoon", name: "black pepper" },
      { amount: "1", unit: "bunch", name: "asparagus (about 1 pound), tough ends removed, cut into 2-inch pieces" },
      { amount: "1", unit: "cup", name: "cherry tomatoes, halved" },
      { amount: "1", unit: "medium", name: "zucchini, diced into 1/2-inch pieces" },
      { amount: "1/4", unit: "cup", name: "fresh parsley, chopped" },
      { amount: "1", unit: "", name: "lemon, cut into wedges for serving" }
    ],
    instructions: [
      { stepNumber: 1, text: "In a large bowl, combine 2 tablespoons olive oil, lemon juice, garlic, oregano, paprika, salt, and pepper." },
      { stepNumber: 2, text: "Add chicken pieces to the bowl and toss to coat evenly. Let marinate while you prepare the vegetables." },
      { stepNumber: 3, text: "Heat the remaining 1 tablespoon olive oil in a large skillet over medium-high heat." },
      { stepNumber: 4, text: "Add the chicken to the skillet and cook for 5-6 minutes, stirring occasionally, until almost cooked through." },
      { stepNumber: 5, text: "Add the asparagus and zucchini to the skillet and continue cooking for 3-4 minutes until vegetables begin to soften." },
      { stepNumber: 6, text: "Add the cherry tomatoes and cook for an additional 2 minutes, just until they begin to burst." },
      { stepNumber: 7, text: "Remove from heat and sprinkle with fresh parsley." },
      { stepNumber: 8, text: "Serve immediately with lemon wedges on the side." }
    ],
    nutritionInfo: {
      calories: 320,
      protein: 35,
      carbs: 10,
      fat: 16,
      fiber: 3,
      sodium: 380
    },
    tips: "For extra flavor, marinate the chicken for up to 30 minutes before cooking if time allows. This dish pairs well with cooked quinoa or rice for a more filling meal. Leftovers can be stored in an airtight container in the refrigerator for up to 3 days.",
    
    // Privacy and moderation fields
    visibility: 'PUBLIC',
    moderationStatus: 'APPROVED',
    publishedAt: '2023-05-01T00:00:00Z',
    moderatedAt: '2023-05-01T00:00:00Z',
    
    // Ownership
    createdBy: {
      id: 'user1',
      name: 'Jane Smith',
      email: 'jane@example.com',
      image: null
    },
    isOwner: false,
    canModerate: false
  },
  '2': {
    id: '2',
    title: 'Spring Asparagus Risotto',
    description: 'A creamy Italian risotto highlighting fresh spring asparagus. This comforting dish balances rich creaminess with the bright flavors of seasonal vegetables.',
    prepTime: 15,
    cookTime: 30,
    totalTime: 45,
    servings: 4,
    difficulty: 'MEDIUM',
    season: 'SPRING',
    cuisineType: 'Italian',
    dietaryTags: ['vegetarian'],
    isAIGenerated: false,
    ingredients: [
      { amount: "6", unit: "cups", name: "vegetable broth" },
      { amount: "2", unit: "tablespoons", name: "olive oil" },
      { amount: "1", unit: "medium", name: "onion, finely diced" },
      { amount: "2", unit: "cloves", name: "garlic, minced" },
      { amount: "1.5", unit: "cups", name: "Arborio rice" },
      { amount: "1/2", unit: "cup", name: "dry white wine" },
      { amount: "1", unit: "bunch", name: "asparagus, woody ends removed, cut into 1-inch pieces" },
      { amount: "1", unit: "cup", name: "fresh or frozen peas" },
      { amount: "1/2", unit: "cup", name: "grated Parmesan cheese" },
      { amount: "2", unit: "tablespoons", name: "butter" },
      { amount: "2", unit: "tablespoons", name: "fresh lemon juice" },
      { amount: "1", unit: "tablespoon", name: "lemon zest" },
      { amount: "1/4", unit: "cup", name: "fresh basil, chopped" },
      { amount: "", unit: "", name: "Salt and pepper to taste" }
    ],
    instructions: [
      { stepNumber: 1, text: "In a saucepan, bring the vegetable broth to a simmer, then keep warm over low heat." },
      { stepNumber: 2, text: "In a large, heavy-bottomed pot, heat olive oil over medium heat. Add onion and cook until translucent, about 3-4 minutes." },
      { stepNumber: 3, text: "Add garlic and cook for 30 seconds until fragrant. Add Arborio rice and stir to coat with oil, toasting for 1-2 minutes." },
      { stepNumber: 4, text: "Pour in white wine and stir until absorbed." },
      { stepNumber: 5, text: "Begin adding warm broth, one ladle at a time, stirring frequently. Wait until each addition is absorbed before adding more." },
      { stepNumber: 6, text: "After about 15 minutes, add the asparagus pieces. Continue adding broth and stirring." },
      { stepNumber: 7, text: "When rice is nearly done (about 5 minutes later), add the peas and cook until rice is creamy but still al dente." },
      { stepNumber: 8, text: "Remove from heat and stir in Parmesan, butter, lemon juice, and zest. Season with salt and pepper to taste." },
      { stepNumber: 9, text: "Let rest for 2 minutes, then serve garnished with fresh basil." }
    ],
    nutritionInfo: {
      calories: 380,
      protein: 10,
      carbs: 52,
      fat: 14,
      fiber: 4,
      sodium: 290
    },
    tips: "For a vegan version, omit the Parmesan and use additional nutritional yeast or vegan cheese. The key to perfect risotto is adding the broth slowly and stirring frequently. Don't rush this process!",
    
    // Privacy and moderation fields
    visibility: 'PRIVATE',
    moderationStatus: 'PENDING',
    
    // Ownership
    createdBy: {
      id: 'current-user',
      name: 'Current User',
      email: 'user@example.com',
      image: null
    },
    isOwner: true,
    canModerate: false
  }
};

export default function RecipeDetail({ params }: { params: { id: string } }) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [servings, setServings] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [userNotes, setUserNotes] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  
  // State for publishing modals
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishNotes, setPublishNotes] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  
  useEffect(() => {
    // Fetch the recipe details from the API
    const fetchRecipe = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/recipes/${params.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch recipe');
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
          const recipeData = data.data;
          setRecipe(recipeData);
          setServings(recipeData.servings);
          setUserNotes(recipeData.userNotes || '');
          
          // For now, we'll use mock comments
          // In the future, we would fetch comments from a separate API endpoint
          const mockComments = [
            {
              id: '1',
              content: 'I added a bit more garlic and it was delicious!',
              createdAt: new Date().toISOString(),
              user: {
                id: '123',
                name: 'Jane Smith',
                image: null,
              }
            },
            {
              id: '2',
              content: 'My family loved this recipe. Will definitely make it again!',
              createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
              user: {
                id: '456',
                name: 'John Doe',
                image: null,
              }
            }
          ];
          setComments(mockComments);
        }
      } catch (error) {
        console.error('Error fetching recipe:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecipe();
  }, [params.id]);
  
  const handleSaveRecipe = () => {
    // In a real app, this would be an API call to save the recipe
    setIsSaved(!isSaved);
  };
  
  const handleAddToMealPlan = () => {
    // In a real app, this would open a modal to add to meal plan
    alert('This feature will be available in the full version!');
  };
  
  const handlePrintRecipe = () => {
    window.print();
  };
  
  const handleEditNotes = () => {
    setIsEditing(true);
  };
  
  const handleOpenPublishModal = () => {
    setShowPublishModal(true);
  };
  
  const handleClosePublishModal = () => {
    setShowPublishModal(false);
    setPublishNotes('');
  };
  
  const handlePublishRecipe = async () => {
    if (!recipe) return;
    
    try {
      setIsPublishing(true);
      
      const response = await fetch(`/api/recipes/${recipe.id}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: publishNotes.trim() || undefined,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to publish recipe');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh the recipe to show updated status
        const updatedRecipe = {
          ...recipe,
          visibility: 'PUBLIC',
          moderationStatus: data.data.moderationStatus,
          needsReview: data.data.needsReview,
        };
        
        setRecipe(updatedRecipe);
        setShowPublishModal(false);
        setPublishNotes('');
        
        // Show success message
        alert('Your recipe has been submitted for publication!');
      } else {
        throw new Error(data.error?.message || 'Something went wrong');
      }
    } catch (error) {
      console.error('Error publishing recipe:', error);
      alert('Failed to publish recipe. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };
  
  const handleSaveNotes = async () => {
    if (!recipe) return;
    
    try {
      // Call the API to update the recipe with new notes
      const response = await fetch(`/api/recipes/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userNotes: userNotes,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save notes');
      }
      
      // Update the recipe object locally
      setRecipe({
        ...recipe,
        userNotes: userNotes
      });
      
      setIsEditing(false);
      
      // Success message
      alert('Your notes have been saved!');
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save notes. Please try again.');
    }
  };
  
  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    
    setIsSubmittingComment(true);
    
    // In a real app, this would be an API call to add a comment
    setTimeout(() => {
      const newCommentObj = {
        id: `comment-${Date.now()}`,
        content: newComment,
        createdAt: new Date().toISOString(),
        user: {
          id: 'current-user',
          name: 'You',
          image: null,
        }
      };
      
      setComments([newCommentObj, ...comments]);
      setNewComment('');
      setIsSubmittingComment(false);
    }, 500);
  };
  
  const updateServings = (newServings: number) => {
    if (newServings >= 1 && newServings <= 12) {
      setServings(newServings);
    }
  };
  
  // Calculate ingredient amounts based on servings
  const calculateAmount = (original: string, originalServings: number) => {
    if (!original || !originalServings || originalServings === servings) return original;
    
    // Handle fractions
    const fractionMap: Record<string, number> = {
      '1/4': 0.25,
      '1/3': 0.33,
      '1/2': 0.5,
      '2/3': 0.67,
      '3/4': 0.75,
    };
    
    let numericValue = 0;
    
    // Parse the amount string to a numeric value
    if (fractionMap[original]) {
      numericValue = fractionMap[original];
    } else if (original.includes('/')) {
      const [numerator, denominator] = original.split('/').map(Number);
      numericValue = numerator / denominator;
    } else {
      numericValue = parseFloat(original);
    }
    
    if (isNaN(numericValue)) return original;
    
    // Calculate new amount
    const newAmount = (numericValue / originalServings) * servings;
    
    // Format back to a readable string
    if (newAmount < 1 && newAmount > 0) {
      // Convert back to a fraction for small amounts
      if (Math.abs(newAmount - 0.25) < 0.05) return '1/4';
      if (Math.abs(newAmount - 0.33) < 0.05) return '1/3';
      if (Math.abs(newAmount - 0.5) < 0.05) return '1/2';
      if (Math.abs(newAmount - 0.67) < 0.05) return '2/3';
      if (Math.abs(newAmount - 0.75) < 0.05) return '3/4';
    }
    
    // Round to 2 decimal places
    return newAmount % 1 === 0 ? newAmount.toString() : newAmount.toFixed(1);
  };
  
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-6"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-8"></div>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
            <div>
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!recipe) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-serif font-bold text-navy mb-4">Recipe Not Found</h1>
        <p className="mb-6">The recipe you're looking for doesn't exist or has been removed.</p>
        <Link href="/recipes" className="btn-primary">
          Browse All Recipes
        </Link>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center gap-2 text-sage mb-4 print:hidden">
        <Link href="/recipes" className="hover:underline">Recipes</Link>
        <span>/</span>
        <span className="text-navy">{recipe.title}</span>
      </div>
      
      {/* Recipe URL (only visible when printing) */}
      <div className="hidden print:block print:mb-4 print:text-sm print:text-gray-500">
        www.seasonallysimple.com/recipes/{recipe.id}
      </div>
      
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-navy print:print-recipe-title mb-2">{recipe.title}</h1>
            
            {/* Recipe Status Indicators */}
            <div className="flex flex-wrap gap-2 mb-2">
              {recipe.isOwner && (
                <div className="text-sm px-2 py-1 rounded-full border border-blue-400 text-blue-600 bg-blue-50">
                  Your Recipe
                </div>
              )}
              
              {recipe.visibility === 'PRIVATE' && (
                <div className="text-sm px-2 py-1 rounded-full border border-gray-400 text-gray-600 bg-gray-50">
                  Private
                </div>
              )}
              
              {recipe.visibility === 'PUBLIC' && recipe.moderationStatus === 'PENDING' && (
                <div className="text-sm px-2 py-1 rounded-full border border-yellow-400 text-yellow-600 bg-yellow-50">
                  Pending Review
                </div>
              )}
              
              {recipe.visibility === 'PUBLIC' && recipe.moderationStatus === 'APPROVED' && (
                <div className="text-sm px-2 py-1 rounded-full border border-green-400 text-green-600 bg-green-50">
                  Published
                </div>
              )}
              
              {recipe.visibility === 'CURATED' && (
                <div className="text-sm px-2 py-1 rounded-full border border-purple-400 text-purple-600 bg-purple-50">
                  Featured
                </div>
              )}
              
              {recipe.moderationStatus === 'REJECTED' && (
                <div className="text-sm px-2 py-1 rounded-full border border-red-400 text-red-600 bg-red-50">
                  Rejected
                </div>
              )}
            </div>
            
            {/* Creator info */}
            {recipe.createdBy && !recipe.isOwner && (
              <div className="text-sm text-gray-600 mb-2">
                Created by: {recipe.createdBy.name || recipe.createdBy.email}
              </div>
            )}
            
            {/* Publication date for public recipes */}
            {(recipe.visibility === 'PUBLIC' || recipe.visibility === 'CURATED') && 
             recipe.moderationStatus === 'APPROVED' && recipe.publishedAt && (
              <div className="text-sm text-gray-600">
                Published: {new Date(recipe.publishedAt).toLocaleDateString()}
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {/* Publishing buttons for owner's private recipes */}
            {recipe.isOwner && recipe.visibility === 'PRIVATE' && (
              <button
                onClick={handleOpenPublishModal}
                className="px-3 py-1 rounded-full text-sm bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1"
              >
                Publish Recipe
              </button>
            )}
            
            {/* Show moderation feedback for rejected recipes */}
            {recipe.isOwner && recipe.moderationStatus === 'REJECTED' && recipe.moderationNotes && (
              <div className="relative group">
                <button
                  className="px-3 py-1 rounded-full text-sm bg-red-100 text-red-700 hover:bg-red-200 flex items-center gap-1"
                >
                  View Feedback
                </button>
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg p-4 hidden group-hover:block z-10">
                  <h4 className="font-semibold mb-2">Moderation Feedback:</h4>
                  <p className="text-sm text-gray-700">{recipe.moderationNotes}</p>
                </div>
              </div>
            )}
            
            <button 
              onClick={handleSaveRecipe} 
              className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                isSaved ? 'bg-sage text-white' : 'bg-cream hover:bg-gray-200'
              }`}
            >
              {isSaved ? 'Saved' : 'Save'}
            </button>
            
            <button 
              onClick={handlePrintRecipe}
              className="px-3 py-1 rounded-full text-sm bg-cream hover:bg-gray-200 flex items-center gap-1 print:hidden"
            >
              <span>Print</span>
            </button>
          </div>
        </div>
        
        <p className="text-lg text-gray-700 mb-6 print:print-recipe-description">{recipe.description}</p>
        
        <div className="bg-sage bg-opacity-10 p-6 rounded-lg flex flex-wrap gap-8 justify-between mb-8 print:print-recipe-meta">
          <div>
            <p className="text-sm text-gray-500 mb-1">Prep Time</p>
            <p className="font-medium">{recipe.prepTime} min</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Cook Time</p>
            <p className="font-medium">{recipe.cookTime} min</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Total Time</p>
            <p className="font-medium">{recipe.totalTime} min</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Servings</p>
            <div className="flex items-center">
              <button 
                onClick={() => updateServings(servings - 1)}
                disabled={servings <= 1}
                className="w-6 h-6 flex items-center justify-center bg-white rounded border border-gray-300 disabled:opacity-50"
              >
                -
              </button>
              <span className="font-medium mx-2">{servings}</span>
              <button 
                onClick={() => updateServings(servings + 1)}
                disabled={servings >= 12}
                className="w-6 h-6 flex items-center justify-center bg-white rounded border border-gray-300 disabled:opacity-50"
              >
                +
              </button>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Difficulty</p>
            <p className="font-medium">{recipe.difficulty.charAt(0) + recipe.difficulty.slice(1).toLowerCase()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Cuisine</p>
            <p className="font-medium">{recipe.cuisineType}</p>
          </div>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-12 mb-12">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-sage mb-4">Ingredients</h2>
          
          <ul className="space-y-3">
            {recipe.ingredients.map((ingredient: any, index: number) => (
              <li key={index} className="flex">
                <span className="font-medium mr-2 min-w-16">
                  {calculateAmount(ingredient.amount, recipe.servings)} {ingredient.unit}
                </span>
                <span>{ingredient.name}</span>
              </li>
            ))}
          </ul>
          
          <div className="mt-8 print:hidden">
            <button 
              onClick={handleAddToMealPlan}
              className="btn-secondary w-full"
            >
              Add to Meal Plan
            </button>
          </div>
        </div>
        
        <div>
          <h2 className="text-2xl font-serif font-semibold text-sage mb-4">Nutrition (per serving)</h2>
          
          <div className="bg-white shadow-sm rounded-lg p-4 mb-8">
            <div className="flex justify-between border-b border-gray-100 py-2">
              <span>Calories</span>
              <span className="font-semibold">{recipe.nutritionInfo.calories}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 py-2">
              <span>Protein</span>
              <span className="font-semibold">{recipe.nutritionInfo.protein}g</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 py-2">
              <span>Carbs</span>
              <span className="font-semibold">{recipe.nutritionInfo.carbs}g</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 py-2">
              <span>Fat</span>
              <span className="font-semibold">{recipe.nutritionInfo.fat}g</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 py-2">
              <span>Fiber</span>
              <span className="font-semibold">{recipe.nutritionInfo.fiber}g</span>
            </div>
            <div className="flex justify-between py-2">
              <span>Sodium</span>
              <span className="font-semibold">{recipe.nutritionInfo.sodium}mg</span>
            </div>
          </div>
          
          {recipe.dietaryTags && recipe.dietaryTags.length > 0 && (
            <div className="mb-8">
              <h3 className="font-medium mb-2">Dietary</h3>
              <div className="flex flex-wrap gap-2">
                {recipe.dietaryTags.map((tag: string) => (
                  <span 
                    key={tag}
                    className="bg-cream text-navy text-xs px-2 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {recipe.isAIGenerated && (
            <div className="bg-honey bg-opacity-10 text-honey text-sm px-4 py-3 rounded-lg mb-8">
              This recipe was generated by AI based on seasonal ingredients and cooking preferences.
            </div>
          )}
        </div>
      </div>
      
      <div className="mb-12 print:mt-6">
        <h2 className="text-2xl font-serif font-semibold text-sage mb-4 print:page-break-before">Instructions</h2>
        
        <ol className="space-y-6">
          {recipe.instructions.map((instruction: any) => (
            <li key={instruction.stepNumber} className="flex">
              <span className="font-semibold text-sage text-xl mr-4">{instruction.stepNumber}</span>
              <div>
                <p>{instruction.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      
      {recipe.tips && (
        <div className="bg-cream p-6 rounded-lg mb-8">
          <h2 className="text-2xl font-serif font-semibold text-sage mb-2">Chef's Tips</h2>
          <p>{recipe.tips}</p>
        </div>
      )}
      
      {/* User Notes Section */}
      <div className="border border-gray-200 p-6 rounded-lg mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-serif font-semibold text-sage">Your Notes</h2>
          {!isEditing && (
            <button 
              onClick={handleEditNotes}
              className="text-sm text-sage hover:underline print:hidden"
            >
              {userNotes ? 'Edit Notes' : 'Add Notes'}
            </button>
          )}
        </div>
        
        {isEditing ? (
          <div>
            <textarea
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="Add your own notes, modifications, or tips for this recipe..."
              className="w-full h-32 p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
            />
            <div className="flex justify-end">
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-500 mr-4 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                className="btn-primary"
              >
                Save Notes
              </button>
            </div>
          </div>
        ) : (
          <div>
            {userNotes ? (
              <p className="text-gray-700">{userNotes}</p>
            ) : (
              <p className="text-gray-500 italic">No notes yet. Click 'Add Notes' to add your own modifications or tips.</p>
            )}
          </div>
        )}
      </div>
      
      {/* Comments Section */}
      <div className="print:hidden">
        <h2 className="text-2xl font-serif font-semibold text-sage mb-4">Comments</h2>
        
        {/* Add Comment Form */}
        <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your experience with this recipe..."
            className="w-full h-24 p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
          />
          <div className="flex justify-end">
            <button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isSubmittingComment}
              className={`btn-primary ${(!newComment.trim() || isSubmittingComment) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSubmittingComment ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </div>
        
        {/* Comments List */}
        {comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-white shadow-sm rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-sage text-white rounded-full flex items-center justify-center mr-2">
                    <span className="font-medium">{comment.user.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-medium">{comment.user.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <p className="text-gray-700">{comment.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 italic py-4">
            No comments yet. Be the first to share your experience with this recipe!
          </p>
        )}
      </div>
      
      <div className="border-t border-gray-200 pt-8 print:hidden">
        <h2 className="text-2xl font-serif font-semibold text-navy mb-6">You might also like</h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          {Object.values(mockRecipes)
            .filter(r => r.id !== params.id)
            .map((relatedRecipe: any) => (
              <Link href={`/recipes/${relatedRecipe.id}`} key={relatedRecipe.id} className="card hover:shadow-lg transition duration-200">
                <div className="h-40 bg-sage bg-opacity-20 flex items-center justify-center">
                  <span className="font-handwritten text-2xl">{relatedRecipe.title.charAt(0)}</span>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-serif font-semibold mb-2">{relatedRecipe.title}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-2">{relatedRecipe.description}</p>
                  <span className="text-xs bg-cream px-2 py-1 rounded-full">
                    {relatedRecipe.totalTime} min
                  </span>
                </div>
              </Link>
            ))}
        </div>
      </div>
      
      {/* Publish Recipe Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Publish Your Recipe</h2>
            
            <p className="text-gray-700 mb-4">
              By publishing your recipe, you're making it available for the community to discover and enjoy. 
              All recipes go through a brief moderation process before becoming public.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes for Moderators (Optional)
              </label>
              <textarea
                value={publishNotes}
                onChange={(e) => setPublishNotes(e.target.value)}
                placeholder="Add any context or notes for the moderators reviewing your recipe..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md h-32"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleClosePublishModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={isPublishing}
              >
                Cancel
              </button>
              <button
                onClick={handlePublishRecipe}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={isPublishing}
              >
                {isPublishing ? 'Publishing...' : 'Submit for Publication'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Moderation UI for Admins/Moderators */}
      {recipe.canModerate && recipe.moderationStatus === 'PENDING' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-between items-center shadow-lg print:hidden">
          <div>
            <h3 className="font-semibold text-lg">Moderation Required</h3>
            <p className="text-gray-600">This recipe is awaiting moderation</p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/admin/recipes?recipeId=${recipe.id}`}
              className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
            >
              Moderate Now
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
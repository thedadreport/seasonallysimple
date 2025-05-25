import { RecipeVisibility, ModerationStatus, UserRole } from '@prisma/client';

export type Recipe = {
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
  dietaryTags: string;
  imageUrl?: string | null;
  isAIGenerated: boolean;
  tips?: string | null;
  createdAt: Date;
  updatedAt: Date;
  
  // Privacy and ownership fields
  createdById: string;
  visibility: RecipeVisibility;
  
  // Moderation fields
  moderationStatus: ModerationStatus;
  publishedAt?: Date | null;
  moderatedAt?: Date | null;
  moderatedById?: string | null;
  moderationNotes?: string | null;
  
  // Optional expanded relations
  createdBy?: {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
  };
  moderatedBy?: {
    id: string;
    name?: string | null;
    email: string;
  } | null;
  ingredients?: Ingredient[];
  instructions?: Instruction[];
  nutritionInfo?: NutritionInfo | null;
  savedCount?: number;
};

export type Ingredient = {
  id: string;
  recipeId: string;
  amount: string;
  unit?: string | null;
  name: string;
};

export type Instruction = {
  id: string;
  recipeId: string;
  stepNumber: number;
  text: string;
};

export type NutritionInfo = {
  id: string;
  recipeId: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number | null;
  sodium?: number | null;
};

export type RecipeFormData = {
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: string;
  season: string;
  cuisineType: string;
  dietaryTags: string;
  imageUrl?: string;
  isAIGenerated: boolean;
  tips?: string;
  ingredients: Omit<Ingredient, 'id' | 'recipeId'>[];
  instructions: Omit<Instruction, 'id' | 'recipeId'>[];
  nutritionInfo?: Omit<NutritionInfo, 'id' | 'recipeId'>;
  visibility?: RecipeVisibility;
};

export type PublishRecipeData = {
  notes?: string;
};

export type ModerateRecipeData = {
  moderationStatus: ModerationStatus;
  moderationNotes?: string;
  visibility?: RecipeVisibility;
};

export type RecipeFilters = {
  search?: string;
  difficulty?: string[];
  season?: string[];
  cuisineType?: string[];
  dietaryTags?: string[];
  maxTime?: number;
  visibility?: RecipeVisibility[];
  createdById?: string;
  moderationStatus?: ModerationStatus[];
  isAIGenerated?: boolean;
  page?: number;
  limit?: number;
};
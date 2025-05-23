export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: string;
  unit?: string | null;
  category: string;
  checked: boolean;
  orderPosition?: number;
  createdAt?: string;
  updatedAt?: string;
  bulkBuying?: boolean;
  originalIngredients?: {
    name: string;
    quantity: string;
    unit?: string | null;
  }[] | string;
}

export interface ShoppingList {
  id: string;
  name: string;
  userId: string;
  mealPlanId?: string | null;
  createdAt: string;
  updatedAt: string;
  items: ShoppingListItem[];
  mealPlan?: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  } | null;
  itemCounts?: {
    total: number;
    checked: number;
    unchecked: number;
  };
}
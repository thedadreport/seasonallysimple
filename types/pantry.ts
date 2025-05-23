export interface PantryItem {
  id: string;
  name: string;
  quantity: string;
  unit?: string | null;
  category: string;
  usuallyHaveOnHand: boolean;
  currentAmount: string;
  minimumAmount?: string | null;
  expirationDate?: Date | null;
  needsRestock: boolean;
  notifyWhenLow: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface CreatePantryItemRequest {
  name: string;
  quantity?: string;
  unit?: string | null;
  category?: string;
  usuallyHaveOnHand?: boolean;
  currentAmount?: string;
  minimumAmount?: string | null;
  expirationDate?: Date | null;
  notifyWhenLow?: boolean;
}

export interface UpdatePantryItemRequest {
  id: string;
  name?: string;
  quantity?: string;
  unit?: string | null;
  category?: string;
  usuallyHaveOnHand?: boolean;
  currentAmount?: string;
  minimumAmount?: string | null;
  expirationDate?: Date | null;
  needsRestock?: boolean;
  notifyWhenLow?: boolean;
}

export interface PantryNotification {
  id: string;
  itemId: string;
  itemName: string;
  notificationType: 'low_stock' | 'expiring_soon' | 'expired';
  message: string;
  createdAt: Date;
  read: boolean;
}
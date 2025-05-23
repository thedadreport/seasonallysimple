import { PantryItem } from '@/types/pantry';
import { ConsolidatedIngredient } from './ingredientUtils';
import { compareQuantities, convertToNumber } from './quantityUtils';

/**
 * Determines if a shopping list item should be excluded based on pantry items
 */
export function shouldExcludeFromShoppingList(
  ingredient: ConsolidatedIngredient,
  pantryItems: PantryItem[]
): boolean {
  // Find matching pantry item by name
  const matchingPantryItem = pantryItems.find(
    item => item.name.toLowerCase() === ingredient.name.toLowerCase() && item.usuallyHaveOnHand
  );

  if (!matchingPantryItem) {
    return false; // No matching pantry item, don't exclude
  }

  // If we don't have current amount or minimum amount info, just use the "usually have on hand" flag
  if (!matchingPantryItem.currentAmount || !matchingPantryItem.minimumAmount) {
    return matchingPantryItem.usuallyHaveOnHand;
  }

  // If we have enough of this item in the pantry, exclude it from the shopping list
  const ingredientQuantity = convertToNumber(ingredient.quantity);
  const currentAmount = convertToNumber(matchingPantryItem.currentAmount);
  
  // Only exclude if we have more than we need
  return currentAmount >= ingredientQuantity;
}

/**
 * Determines if a pantry item needs to be restocked
 */
export function checkNeedsRestock(pantryItem: PantryItem): boolean {
  if (!pantryItem.minimumAmount || !pantryItem.currentAmount) {
    return false;
  }

  const currentAmount = convertToNumber(pantryItem.currentAmount);
  const minimumAmount = convertToNumber(pantryItem.minimumAmount);

  return currentAmount <= minimumAmount;
}

/**
 * Checks if a pantry item is expired or expiring soon
 */
export function checkExpirationStatus(
  pantryItem: PantryItem
): { isExpired: boolean; isExpiringSoon: boolean } {
  if (!pantryItem.expirationDate) {
    return { isExpired: false, isExpiringSoon: false };
  }

  const now = new Date();
  const expirationDate = new Date(pantryItem.expirationDate);
  
  // Check if expired
  const isExpired = expirationDate < now;
  
  // Check if expiring within 7 days
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(now.getDate() + 7);
  const isExpiringSoon = !isExpired && expirationDate <= sevenDaysFromNow;

  return { isExpired, isExpiringSoon };
}

/**
 * Update pantry quantities after shopping
 * This is used when items are marked as bought on a shopping list
 */
export function updatePantryAfterShopping(
  pantryItems: PantryItem[],
  boughtItems: Array<{ name: string; quantity: string; unit: string | null }>
): PantryItem[] {
  return pantryItems.map(pantryItem => {
    // Find matching bought item
    const matchingBoughtItem = boughtItems.find(
      item => item.name.toLowerCase() === pantryItem.name.toLowerCase()
    );

    if (!matchingBoughtItem) {
      return pantryItem;
    }

    // Update current amount by adding the bought quantity
    const currentAmount = convertToNumber(pantryItem.currentAmount);
    const boughtQuantity = convertToNumber(matchingBoughtItem.quantity);
    const newAmount = currentAmount + boughtQuantity;

    // Check if it still needs restocking
    const minimumAmount = pantryItem.minimumAmount ? convertToNumber(pantryItem.minimumAmount) : 0;
    const needsRestock = newAmount <= minimumAmount;

    return {
      ...pantryItem,
      currentAmount: newAmount.toString(),
      needsRestock
    };
  });
}

/**
 * Generate notifications for pantry items
 */
export function generatePantryNotifications(pantryItems: PantryItem[]): Array<{
  itemId: string;
  itemName: string;
  notificationType: 'low_stock' | 'expiring_soon' | 'expired';
  message: string;
}> {
  const notifications: Array<{
    itemId: string;
    itemName: string;
    notificationType: 'low_stock' | 'expiring_soon' | 'expired';
    message: string;
  }> = [];

  for (const item of pantryItems) {
    // Check if needs restocking and notifications are enabled
    if (item.needsRestock && item.notifyWhenLow) {
      notifications.push({
        itemId: item.id,
        itemName: item.name,
        notificationType: 'low_stock',
        message: `${item.name} is running low. Current: ${item.currentAmount} ${item.unit || ''}. Minimum: ${item.minimumAmount} ${item.unit || ''}.`
      });
    }

    // Check expiration status
    if (item.expirationDate) {
      const { isExpired, isExpiringSoon } = checkExpirationStatus(item);
      
      if (isExpired) {
        notifications.push({
          itemId: item.id,
          itemName: item.name,
          notificationType: 'expired',
          message: `${item.name} expired on ${new Date(item.expirationDate).toLocaleDateString()}.`
        });
      } else if (isExpiringSoon) {
        notifications.push({
          itemId: item.id,
          itemName: item.name,
          notificationType: 'expiring_soon',
          message: `${item.name} will expire on ${new Date(item.expirationDate).toLocaleDateString()}.`
        });
      }
    }
  }

  return notifications;
}
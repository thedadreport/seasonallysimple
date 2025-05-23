# Pantry Management System for Seasonally Simple

## Overview

The Pantry Management System helps users keep track of items they typically have on hand, prevents adding unnecessary items to shopping lists, monitors expiration dates, and alerts users when staples are running low.

## Key Features

### 1. Pantry Item Tracking
- Maintain a database of pantry items with current quantities and status
- Mark items as "usually have on hand" to exclude from shopping lists
- Set minimum quantities for automatic restock alerts
- Track expiration dates for perishable items

### 2. Shopping List Integration
- Automatically exclude pantry staples from generated shopping lists
- Option to include pantry items when creating a shopping list
- Update pantry quantities when items are checked off shopping lists

### 3. Smart Notifications
- Alerts for items running low (below minimum quantity)
- Warnings for items nearing expiration date
- Notifications for expired items

### 4. Easy Management
- Intuitive interface for adding and updating pantry items
- Filter and search functionality to find items quickly
- Category organization for better inventory management

## Technical Implementation

### Database Schema
```prisma
model PantryItem {
  id               String    @id @default(uuid())
  name             String
  quantity         String    @default("1")
  unit             String?
  category         String    @default("other")
  usuallyHaveOnHand Boolean   @default(true)
  currentAmount    String    @default("0")
  minimumAmount    String?
  expirationDate   DateTime?
  needsRestock     Boolean   @default(false)
  notifyWhenLow    Boolean   @default(false)
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  userId           String
  user             User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### API Endpoints

#### GET /api/pantry
- Fetches all pantry items for the current user
- Supports filtering by category, search term, and restock status
- Returns notification data for items needing attention

#### POST /api/pantry
- Creates a new pantry item
- Automatically calculates if the item needs restocking

#### GET /api/pantry/[id]
- Fetches a specific pantry item

#### PUT /api/pantry/[id]
- Updates a pantry item
- Recalculates restock status when quantities change

#### DELETE /api/pantry/[id]
- Removes a pantry item

### Shopping List Integration

The pantry system integrates with shopping lists via:

- ShoppingListModal.tsx - Added option to include/exclude pantry items
- Modified shopping list API endpoints to filter out pantry items by default
- Added the `shouldExcludeFromShoppingList` utility function to determine when an item should be excluded

## Usage Instructions

### Adding Pantry Items
1. Navigate to the Pantry page
2. Use the "Add New Pantry Item" form at the top of the page
3. Enter the item name, quantity, category, and other details
4. Check "Usually have on hand" if this is a staple you normally keep stocked
5. Set a minimum amount to be notified when running low
6. Add an expiration date for perishable items

### Updating Pantry Items
1. Click the edit button on any pantry item
2. Update current quantity, minimum amount, or other details
3. Save changes

### Creating Shopping Lists Without Pantry Items
1. When creating a shopping list from a meal plan, the pantry items marked as "usually have on hand" will be excluded by default
2. To include these items, check the "Include pantry items I usually have on hand" box

## Future Enhancements
- Barcode scanning for adding items
- Automated quantity tracking based on recipe usage
- Intelligent suggestions for pantry staples based on cooking habits
- Integration with smart kitchen devices and inventory systems
-- Add new fields to ShoppingListItem
ALTER TABLE "ShoppingListItem" ADD COLUMN "bulkBuying" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ShoppingListItem" ADD COLUMN "originalIngredients" JSONB;
ALTER TABLE "ShoppingListItem" ADD COLUMN "orderPosition" INTEGER NOT NULL DEFAULT 0;
-- Add excludedFromPantry field to ShoppingListItem table
ALTER TABLE "ShoppingListItem" ADD COLUMN "excludedFromPantry" BOOLEAN NOT NULL DEFAULT false;

-- Create PantryItem table
CREATE TABLE "PantryItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" TEXT NOT NULL DEFAULT '1',
    "unit" TEXT,
    "category" TEXT NOT NULL DEFAULT 'other',
    "usuallyHaveOnHand" BOOLEAN NOT NULL DEFAULT true,
    "currentAmount" TEXT NOT NULL DEFAULT '0',
    "minimumAmount" TEXT,
    "expirationDate" TIMESTAMP(3),
    "needsRestock" BOOLEAN NOT NULL DEFAULT false,
    "notifyWhenLow" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "PantryItem_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
ALTER TABLE "PantryItem" ADD CONSTRAINT "PantryItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
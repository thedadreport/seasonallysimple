// Smart ingredient consolidation system for shopping lists

// Unit conversion factors for common cooking measurements
const unitConversions: Record<string, Record<string, number>> = {
  volume: {
    // Base unit: cups
    'cup': 1,
    'cups': 1,
    'c': 1,
    'tablespoon': 0.0625, // 1 tbsp = 1/16 cup
    'tablespoons': 0.0625,
    'tbsp': 0.0625,
    'tbs': 0.0625,
    'tbsps': 0.0625,
    'teaspoon': 0.0208333, // 1 tsp = 1/48 cup
    'teaspoons': 0.0208333,
    'tsp': 0.0208333,
    'tsps': 0.0208333,
    'fluid ounce': 0.125, // 1 fl oz = 1/8 cup
    'fluid ounces': 0.125,
    'fl oz': 0.125,
    'fl oz.': 0.125,
    'fl. oz.': 0.125,
    'ounce': 0.125, // Assuming fluid ounce context
    'ounces': 0.125,
    'oz': 0.125,
    'oz.': 0.125,
    'pint': 2, // 1 pint = 2 cups
    'pints': 2,
    'pt': 2,
    'quart': 4, // 1 quart = 4 cups
    'quarts': 4,
    'qt': 4,
    'gallon': 16, // 1 gallon = 16 cups
    'gallons': 16,
    'gal': 16,
    'milliliter': 0.00423, // 1 ml ≈ 0.00423 cup
    'milliliters': 0.00423,
    'ml': 0.00423,
    'liter': 4.22675, // 1 liter ≈ 4.22675 cups
    'liters': 4.22675,
    'l': 4.22675
  },
  weight: {
    // Base unit: ounces
    'ounce': 1,
    'ounces': 1,
    'oz': 1,
    'oz.': 1,
    'pound': 16, // 1 lb = 16 oz
    'pounds': 16,
    'lb': 16,
    'lbs': 16,
    'gram': 0.03527, // 1 g ≈ 0.03527 oz
    'grams': 0.03527,
    'g': 0.03527,
    'kilogram': 35.27, // 1 kg ≈ 35.27 oz
    'kilograms': 35.27,
    'kg': 35.27
  }
};

// Common ingredient synonyms
const ingredientSynonyms: Record<string, string[]> = {
  // Produce
  'tomato': ['tomato', 'tomatoes', 'roma tomato', 'roma tomatoes', 'cherry tomato', 'cherry tomatoes', 'grape tomato', 'grape tomatoes'],
  'onion': ['onion', 'onions', 'yellow onion', 'yellow onions', 'white onion', 'white onions', 'red onion', 'red onions'],
  'potato': ['potato', 'potatoes', 'russet potato', 'russet potatoes', 'gold potato', 'gold potatoes', 'yukon gold'],
  'carrot': ['carrot', 'carrots', 'baby carrot', 'baby carrots'],
  'bell pepper': ['bell pepper', 'bell peppers', 'green pepper', 'green peppers', 'red pepper', 'red peppers', 'yellow pepper', 'yellow peppers'],
  'green onion': ['green onion', 'green onions', 'scallion', 'scallions', 'spring onion', 'spring onions'],
  'lettuce': ['lettuce', 'romaine', 'romaine lettuce', 'iceberg lettuce', 'iceberg'],
  'cucumber': ['cucumber', 'cucumbers', 'english cucumber', 'english cucumbers'],
  'garlic': ['garlic', 'garlic clove', 'garlic cloves', 'minced garlic'],
  'lemon': ['lemon', 'lemons', 'lemon juice'],
  'lime': ['lime', 'limes', 'lime juice'],
  
  // Herbs & Spices
  'basil': ['basil', 'fresh basil', 'dried basil', 'basil leaves'],
  'parsley': ['parsley', 'fresh parsley', 'dried parsley', 'parsley leaves'],
  'cilantro': ['cilantro', 'fresh cilantro', 'coriander leaves'],
  'oregano': ['oregano', 'dried oregano', 'fresh oregano'],
  'thyme': ['thyme', 'dried thyme', 'fresh thyme'],
  'rosemary': ['rosemary', 'dried rosemary', 'fresh rosemary'],
  'cinnamon': ['cinnamon', 'ground cinnamon', 'cinnamon stick', 'cinnamon sticks'],
  
  // Dairy
  'milk': ['milk', 'whole milk', 'skim milk', '2% milk', '1% milk'],
  'butter': ['butter', 'unsalted butter', 'salted butter'],
  'cheese': ['cheese', 'cheddar', 'cheddar cheese', 'mozzarella', 'mozzarella cheese', 'parmesan', 'parmesan cheese'],
  'cream': ['cream', 'heavy cream', 'whipping cream', 'light cream'],
  'yogurt': ['yogurt', 'greek yogurt', 'plain yogurt'],
  
  // Meat & Protein
  'chicken': ['chicken', 'chicken breast', 'chicken breasts', 'chicken thigh', 'chicken thighs', 'chicken leg', 'chicken legs'],
  'beef': ['beef', 'ground beef', 'beef chuck', 'beef stew meat', 'steak', 'sirloin'],
  'pork': ['pork', 'pork chop', 'pork chops', 'pork tenderloin', 'pork loin'],
  'egg': ['egg', 'eggs', 'large egg', 'large eggs'],
  
  // Baking & Pantry
  'flour': ['flour', 'all-purpose flour', 'all purpose flour', 'whole wheat flour', 'bread flour'],
  'sugar': ['sugar', 'granulated sugar', 'white sugar', 'brown sugar', 'powdered sugar', 'confectioners sugar'],
  'oil': ['oil', 'olive oil', 'vegetable oil', 'canola oil', 'cooking oil'],
  'vinegar': ['vinegar', 'white vinegar', 'apple cider vinegar', 'balsamic vinegar', 'red wine vinegar'],
  'salt': ['salt', 'kosher salt', 'sea salt', 'table salt'],
  'pepper': ['pepper', 'black pepper', 'white pepper', 'ground pepper', 'ground black pepper'],
  'rice': ['rice', 'white rice', 'brown rice', 'jasmine rice', 'basmati rice'],
  'pasta': ['pasta', 'spaghetti', 'penne', 'fettuccine', 'linguine', 'macaroni', 'noodles']
};

// Ingredient groups for organizing the shopping list
const ingredientGroups: Record<string, string[]> = {
  'Fresh Herbs': ['basil', 'parsley', 'cilantro', 'mint', 'dill', 'thyme', 'rosemary', 'sage', 'oregano', 'chives'],
  'Spices': ['pepper', 'cinnamon', 'cumin', 'paprika', 'turmeric', 'nutmeg', 'ginger', 'garlic powder', 'onion powder', 'chili powder'],
  'Baking': ['flour', 'sugar', 'baking powder', 'baking soda', 'yeast', 'cornstarch', 'vanilla', 'chocolate chips'],
  'Canned Goods': ['canned', 'tomato sauce', 'tomato paste', 'beans', 'soup', 'broth', 'stock', 'tuna'],
  'Oils & Vinegars': ['oil', 'vinegar', 'cooking spray'],
  'Condiments': ['ketchup', 'mustard', 'mayonnaise', 'soy sauce', 'hot sauce', 'salsa', 'bbq sauce', 'honey', 'maple syrup']
};

// Helper function to normalize ingredient names for comparison
export function normalizeIngredientName(name: string): string {
  return name.toLowerCase().trim();
}

// Helper function to find the canonical name for an ingredient
export function getCanonicalName(ingredientName: string): string {
  const normalized = normalizeIngredientName(ingredientName);
  
  // Find if this ingredient matches any of our known synonyms
  for (const [canonical, synonyms] of Object.entries(ingredientSynonyms)) {
    if (synonyms.some(synonym => normalized.includes(synonym))) {
      return canonical;
    }
  }
  
  // If no synonym match, return the original
  return normalized;
}

// Helper function to identify the measurement unit system
function identifyUnitSystem(unit: string): 'volume' | 'weight' | null {
  const normalizedUnit = unit.toLowerCase().trim();
  
  if (unitConversions.volume[normalizedUnit] !== undefined) {
    return 'volume';
  }
  
  if (unitConversions.weight[normalizedUnit] !== undefined) {
    return 'weight';
  }
  
  return null;
}

// Helper function to standardize unit
function standardizeUnit(unit: string, system: 'volume' | 'weight'): string {
  const normalizedUnit = unit.toLowerCase().trim();
  
  // Convert to base unit
  if (system === 'volume') {
    return 'cup';
  } else if (system === 'weight') {
    return 'oz';
  }
  
  return normalizedUnit;
}

// Helper function to convert quantity to base unit
function convertToBaseUnit(quantity: string | number, unit: string, system: 'volume' | 'weight'): number {
  let numericQuantity: number;
  
  // Handle fraction strings (e.g., "1/2")
  if (typeof quantity === 'string') {
    if (quantity.includes('/')) {
      const [numerator, denominator] = quantity.split('/').map(num => parseFloat(num.trim()));
      numericQuantity = numerator / denominator;
    } else {
      numericQuantity = parseFloat(quantity);
    }
  } else {
    numericQuantity = quantity;
  }
  
  if (isNaN(numericQuantity)) {
    return 0;
  }
  
  const normalizedUnit = unit.toLowerCase().trim();
  const conversionFactor = unitConversions[system][normalizedUnit] || 1;
  
  return numericQuantity * conversionFactor;
}

// Helper function to format the quantity as a fraction or decimal
function formatQuantity(quantity: number): string {
  // For whole numbers
  if (quantity === Math.floor(quantity)) {
    return quantity.toString();
  }
  
  // Common fractions to use
  const fractions: Record<number, string> = {
    0.25: '1/4',
    0.33: '1/3',
    0.5: '1/2',
    0.67: '2/3',
    0.75: '3/4'
  };
  
  // Round to 2 decimal places
  const rounded = Math.round(quantity * 100) / 100;
  
  // Check for common fractions
  for (const [decimal, fraction] of Object.entries(fractions)) {
    if (Math.abs(rounded - parseFloat(decimal)) < 0.01) {
      return fraction;
    }
  }
  
  // For whole numbers with fractions
  const wholePart = Math.floor(rounded);
  const fractionPart = rounded - wholePart;
  
  if (wholePart > 0 && fractionPart > 0) {
    // Find the closest fraction
    let closestDecimal = 0;
    let closestDiff = 1;
    
    for (const decimal of Object.keys(fractions)) {
      const diff = Math.abs(fractionPart - parseFloat(decimal));
      if (diff < closestDiff) {
        closestDiff = diff;
        closestDecimal = parseFloat(decimal);
      }
    }
    
    if (closestDiff < 0.05) {
      return `${wholePart} ${fractions[closestDecimal]}`;
    }
  }
  
  // Return as decimal if no good fraction match
  return rounded.toString();
}

// Helper function to determine if bulk buying is beneficial
function shouldSuggestBulkBuying(quantity: number, unit: string, system: 'volume' | 'weight' | null): boolean {
  if (!system) return false;
  
  // Thresholds for suggesting bulk buying
  const thresholds: { [key: string]: { [key: string]: number } } = {
    volume: { cup: 4 }, // More than 4 cups
    weight: { oz: 32 }  // More than 32 oz (2 lbs)
  };
  
  const standardUnit = system === 'volume' ? 'cup' : 'oz';
  const threshold = thresholds[system][standardUnit];
  
  return quantity >= threshold;
}

// Helper function to get the best unit for display
function getBestUnitForDisplay(quantity: number, system: 'volume' | 'weight'): { quantity: number, unit: string } {
  if (system === 'volume') {
    // Volume conversions
    if (quantity >= 4) {
      return { quantity: quantity / 4, unit: 'quart' };
    } else if (quantity >= 2) {
      return { quantity: quantity / 2, unit: 'pint' };
    } else if (quantity < 0.25) {
      return { quantity: quantity * 16, unit: 'tablespoon' };
    } else {
      return { quantity, unit: 'cup' };
    }
  } else if (system === 'weight') {
    // Weight conversions
    if (quantity >= 16) {
      return { quantity: quantity / 16, unit: 'pound' };
    } else {
      return { quantity, unit: 'oz' };
    }
  }
  
  return { quantity, unit: system === 'volume' ? 'cup' : 'oz' };
}

// Main function to consolidate ingredients from a list
export interface IngredientItem {
  name: string;
  quantity: string;
  unit?: string | null;
  category?: string;
}

export interface ConsolidatedIngredient extends IngredientItem {
  bulkBuying?: boolean;
  originalIngredients?: IngredientItem[];
}

export function consolidateIngredients(ingredients: IngredientItem[]): ConsolidatedIngredient[] {
  // Map to store consolidated ingredients by canonical name
  const consolidatedMap = new Map<string, ConsolidatedIngredient>();
  
  // Process each ingredient
  for (const ingredient of ingredients) {
    const name = ingredient.name;
    const quantity = ingredient.quantity || '1';
    const unit = ingredient.unit || null;
    
    // Get canonical name
    const canonicalName = getCanonicalName(name);
    
    // If this ingredient is already in our map
    if (consolidatedMap.has(canonicalName)) {
      const existing = consolidatedMap.get(canonicalName)!;
      
      // If both have units, try to convert and add
      if (unit && existing.unit) {
        const system = identifyUnitSystem(unit);
        const existingSystem = identifyUnitSystem(existing.unit);
        
        // If both are the same measurement system, convert and add
        if (system && existingSystem && system === existingSystem) {
          // Convert both to base units, add, then convert back to appropriate display unit
          const baseQuantity = convertToBaseUnit(quantity, unit, system);
          const existingBaseQuantity = convertToBaseUnit(existing.quantity, existing.unit, system);
          const totalBaseQuantity = baseQuantity + existingBaseQuantity;
          
          // Determine best unit for display
          const { quantity: displayQuantity, unit: displayUnit } = getBestUnitForDisplay(totalBaseQuantity, system);
          
          // Update the existing entry
          existing.quantity = formatQuantity(displayQuantity);
          existing.unit = displayUnit;
          
          // Check if bulk buying should be suggested
          existing.bulkBuying = shouldSuggestBulkBuying(totalBaseQuantity, displayUnit, system);
          
          // Track original ingredients
          if (!existing.originalIngredients) {
            existing.originalIngredients = [{ ...existing }];
          }
          existing.originalIngredients.push(ingredient);
          
          continue;
        }
      }
      
      // If conversion isn't possible, combine the descriptions
      if (!existing.originalIngredients) {
        existing.originalIngredients = [{ ...existing }];
      }
      existing.originalIngredients.push(ingredient);
      
      // Just append the new quantity if it's different
      if (quantity !== existing.quantity || unit !== existing.unit) {
        existing.quantity = `${existing.quantity}, ${quantity}${unit ? ' ' + unit : ''}`;
      }
    } else {
      // Create a new entry in the map
      consolidatedMap.set(canonicalName, {
        name: canonicalName,
        quantity,
        unit,
        category: ingredient.category || determineCategory(canonicalName)
      });
    }
  }
  
  // Convert the map to an array
  const consolidated = Array.from(consolidatedMap.values());
  
  // Sort by category and name
  return consolidated.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category?.localeCompare(b.category || 'other') || 0;
    }
    return a.name.localeCompare(b.name);
  });
}

// Helper function to determine the category of an ingredient
function determineCategory(name: string): string {
  // Check for ingredient group matches
  for (const [group, items] of Object.entries(ingredientGroups)) {
    if (items.some(item => name.includes(item))) {
      return group;
    }
  }
  
  // Default categorization logic based on common ingredients
  const normalizedName = name.toLowerCase();
  
  // Produce
  if (/apple|banana|berry|vegetable|fruit|tomato|potato|onion|carrot|lettuce|pepper|cucumber|broccoli|spinach|kale|avocado|garlic|lemon|lime|orange/i.test(normalizedName)) {
    return 'produce';
  }
  
  // Dairy
  if (/milk|cream|cheese|butter|yogurt|egg/i.test(normalizedName)) {
    return 'dairy';
  }
  
  // Meat
  if (/beef|chicken|pork|turkey|lamb|bacon|sausage|meat/i.test(normalizedName)) {
    return 'meat';
  }
  
  // Seafood
  if (/fish|salmon|tuna|shrimp|crab|lobster|seafood|tilapia|cod/i.test(normalizedName)) {
    return 'seafood';
  }
  
  // Grains
  if (/bread|rice|pasta|flour|oat|cereal|grain|wheat|barley|corn/i.test(normalizedName)) {
    return 'grains';
  }
  
  // Herbs and spices
  if (/herb|spice|basil|oregano|thyme|rosemary|sage|parsley|cilantro|mint|pepper|salt|cinnamon|nutmeg|paprika/i.test(normalizedName)) {
    return 'herbs & spices';
  }
  
  // Canned goods
  if (/can|jar|preserved|sauce|paste/i.test(normalizedName)) {
    return 'canned goods';
  }
  
  // Pantry
  if (/oil|vinegar|sugar|honey|syrup|baking|vanilla/i.test(normalizedName)) {
    return 'pantry';
  }
  
  // Default
  return 'other';
}
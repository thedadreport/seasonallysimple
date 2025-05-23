import {
  consolidateIngredients,
  normalizeIngredientName,
  getCanonicalName,
  IngredientItem
} from '@/lib/utils/ingredientUtils';

describe('Ingredient Utilities', () => {
  describe('normalizeIngredientName', () => {
    it('should normalize ingredient names by converting to lowercase and trimming spaces', () => {
      expect(normalizeIngredientName('  Tomato  ')).toBe('tomato');
      expect(normalizeIngredientName('ONION')).toBe('onion');
      expect(normalizeIngredientName('Extra Virgin Olive Oil')).toBe('extra virgin olive oil');
      expect(normalizeIngredientName('')).toBe('');
    });
  });

  describe('getCanonicalName', () => {
    it('should return the canonical name for ingredients with known synonyms', () => {
      expect(getCanonicalName('roma tomatoes')).toBe('tomato');
      expect(getCanonicalName('yellow onion')).toBe('onion');
      expect(getCanonicalName('fresh basil leaves')).toBe('basil');
      expect(getCanonicalName('garlic cloves')).toBe('garlic');
    });

    it('should normalize and return the original name for unknown ingredients', () => {
      expect(getCanonicalName('dragon fruit')).toBe('dragon fruit');
      expect(getCanonicalName('Himalayan pink salt')).toBe('himalayan pink salt');
    });
  });

  describe('consolidateIngredients', () => {
    it('should combine duplicate ingredients with the same unit', () => {
      const ingredients: IngredientItem[] = [
        { name: 'tomato', quantity: '2', unit: 'cups' },
        { name: 'tomato', quantity: '1', unit: 'cups' }
      ];

      const consolidated = consolidateIngredients(ingredients);
      
      expect(consolidated).toHaveLength(1);
      expect(consolidated[0].quantity).toBe('3');
      expect(consolidated[0].unit).toBe('cup');
    });

    it('should handle different forms of the same ingredient', () => {
      const ingredients: IngredientItem[] = [
        { name: 'roma tomatoes', quantity: '2', unit: null },
        { name: 'cherry tomatoes', quantity: '1', unit: 'cup' }
      ];

      const consolidated = consolidateIngredients(ingredients);
      
      expect(consolidated).toHaveLength(1);
      expect(consolidated[0].name).toBe('tomato');
      expect(consolidated[0].originalIngredients).toHaveLength(2);
    });

    it('should not combine ingredients with different units that cannot be converted', () => {
      const ingredients: IngredientItem[] = [
        { name: 'tomato', quantity: '2', unit: 'cups' },
        { name: 'tomato', quantity: '1', unit: 'each' }
      ];

      const consolidated = consolidateIngredients(ingredients);
      
      expect(consolidated).toHaveLength(1);
      expect(consolidated[0].quantity).toContain(',');
    });

    it('should convert units to appropriate display units when consolidating', () => {
      const ingredients: IngredientItem[] = [
        { name: 'flour', quantity: '3', unit: 'cups' },
        { name: 'flour', quantity: '1', unit: 'cups' }
      ];

      const consolidated = consolidateIngredients(ingredients);
      
      expect(consolidated).toHaveLength(1);
      expect(consolidated[0].quantity).toBe('4');
      expect(consolidated[0].unit).toBe('cup');
    });

    it('should assign appropriate categories to ingredients', () => {
      const ingredients: IngredientItem[] = [
        { name: 'apple', quantity: '2', unit: null },
        { name: 'milk', quantity: '1', unit: 'cup' },
        { name: 'chicken breast', quantity: '1', unit: 'pound' },
        { name: 'olive oil', quantity: '2', unit: 'tablespoons' }
      ];

      const consolidated = consolidateIngredients(ingredients);
      
      expect(consolidated.find(i => i.name === 'apple')?.category).toBe('produce');
      expect(consolidated.find(i => i.name === 'milk')?.category).toBe('dairy');
      expect(consolidated.find(i => i.name === 'chicken')?.category).toBe('meat');
      expect(consolidated.find(i => i.name === 'oil')?.category).toBe('pantry');
    });

    it('should respect existing categories if provided', () => {
      const ingredients: IngredientItem[] = [
        { name: 'apple', quantity: '2', unit: null, category: 'snacks' }
      ];

      const consolidated = consolidateIngredients(ingredients);
      
      expect(consolidated[0].category).toBe('snacks');
    });

    it('should flag ingredients for bulk buying when quantity exceeds thresholds', () => {
      const ingredients: IngredientItem[] = [
        { name: 'flour', quantity: '5', unit: 'cups' },
        { name: 'sugar', quantity: '4', unit: 'pounds' }
      ];

      const consolidated = consolidateIngredients(ingredients);
      
      expect(consolidated.find(i => i.name === 'flour')?.bulkBuying).toBe(true);
      expect(consolidated.find(i => i.name === 'sugar')?.bulkBuying).toBe(true);
    });

    it('should track original ingredients when consolidating', () => {
      const ingredients: IngredientItem[] = [
        { name: 'garlic', quantity: '2', unit: 'cloves' },
        { name: 'garlic cloves', quantity: '3', unit: 'cloves' }
      ];

      const consolidated = consolidateIngredients(ingredients);
      
      expect(consolidated).toHaveLength(1);
      expect(consolidated[0].originalIngredients).toHaveLength(2);
    });

    it('should handle empty input', () => {
      const ingredients: IngredientItem[] = [];
      const consolidated = consolidateIngredients(ingredients);
      
      expect(consolidated).toHaveLength(0);
    });
  });
});
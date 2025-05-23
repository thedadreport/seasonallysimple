/**
 * Converts a quantity string to a number
 * Handles fractions (e.g., "1/2") and mixed numbers (e.g., "1 1/2")
 */
export function convertToNumber(quantity: string): number {
  // Handle empty or null
  if (!quantity) return 0;

  // Remove any extra spaces
  const trimmed = quantity.trim();

  // Check if it's a simple number
  if (!isNaN(Number(trimmed))) {
    return Number(trimmed);
  }

  // Check for a mixed number (e.g., "1 1/2")
  if (/\d+\s+\d+\/\d+/.test(trimmed)) {
    const [whole, fraction] = trimmed.split(/\s+/);
    const [numerator, denominator] = fraction.split('/').map(Number);
    return Number(whole) + (numerator / denominator);
  }

  // Check for a fraction (e.g., "1/2")
  if (/\d+\/\d+/.test(trimmed)) {
    const [numerator, denominator] = trimmed.split('/').map(Number);
    return numerator / denominator;
  }

  // If all else fails, return 0
  return 0;
}

/**
 * Compares two quantities to determine if quantity1 is greater than, equal to, or less than quantity2
 * Returns: 1 if quantity1 > quantity2, 0 if equal, -1 if quantity1 < quantity2
 */
export function compareQuantities(quantity1: string, quantity2: string): number {
  const num1 = convertToNumber(quantity1);
  const num2 = convertToNumber(quantity2);

  if (num1 > num2) return 1;
  if (num1 < num2) return -1;
  return 0;
}

/**
 * Formats a numeric quantity as a fraction string when appropriate
 */
export function formatQuantity(quantity: number): string {
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
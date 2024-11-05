import ingredientsTaxonomy from '../assets/taxonomies/ingredients.json';
import additivesTaxonomy from '../assets/taxonomies/additives.json';
import * as Localization from 'expo-localization';
import { IngredientsProfile } from '../config/firebase';
import { findIngredientIdsWithLang } from './ingredientDetection';

// Combine both taxonomies
const combinedTaxonomy = { ...ingredientsTaxonomy, ...additivesTaxonomy };

export const getIngredientName = (ingredientId: string, preferredLang?: string): string => {
  const data = combinedTaxonomy[ingredientId];
  if (!data) {
    // Try to clean up the ID by removing language prefix if present
    const cleanId = ingredientId.replace(/^[a-z]{2}:/, '');
    return cleanId;
  }

  // If a specific language is provided, use it
  if (preferredLang && data.labels[preferredLang]) {
    return data.labels[preferredLang][0];
  }

  // If no specific language is provided, fallback to English
  if (data.labels['en']) {
    return data.labels['en'][0];
  }

  // If no English label is available, use any available language
  const availableLangs = Object.keys(data.labels);
  if (availableLangs.length > 0) {
    return data.labels[availableLangs[0]][0];
  }

  return ingredientId;
};

// Add a new function to check if an item is an additive
export const isAdditive = (id: string): boolean => {
  return id in additivesTaxonomy;
};

// Add a function to get the E number of an additive
export const getENumber = (id: string): string | undefined => {
  const data = additivesTaxonomy[id];
  return data ? data.e_number : undefined;
};

// Function to determine which category an ingredient belongs to
export const getIngredientCategories = (ingredientId: string, checkedIngredients: IngredientsProfile): string[] => {
  // First check if the ingredient has a specific category assigned
  if (checkedIngredients[ingredientId]?.category) {
    return [checkedIngredients[ingredientId].category];
  }
  
  // If no specific category, check for automatic categorization
  const categories: string[] = [];
  
  // Check if it's an additive
  if (isAdditive(ingredientId)) {
    categories.push('eNumbers');
  }

  // Get the ingredient data from the taxonomy
  const ingredientData = combinedTaxonomy[ingredientId];
  if (ingredientData) {
    // Check for allergens
    if (ingredientData.allergen) {
      categories.push('allergens');
    }

    // Check for animal-derived ingredients
    if (ingredientData.animal_derived) {
      categories.push('vegan');
    }

    // Check for pregnancy warnings
    if (ingredientData.pregnancy_warning) {
      categories.push('pregnancy');
    }

    // Check for environmental impact
    if (ingredientData.environmental_impact) {
      categories.push('environment');
    }

    // Check for gluten
    if (ingredientData.contains_gluten) {
      categories.push('glutenFree');
    }

    // Check for high carbs
    if (ingredientData.high_carb) {
      categories.push('ketoFriendly');
    }

    // Check for high sodium
    if (ingredientData.high_sodium) {
      categories.push('lowSodium');
    }

    // Check for dairy
    if (ingredientData.contains_dairy) {
      categories.push('dairyFree');
    }

    // Check for sugar
    if (ingredientData.contains_sugar) {
      categories.push('sugarFree');
    }

    // Check for halal/kosher status
    if (ingredientData.not_halal_kosher) {
      categories.push('halalKosher');
    }
  }

  // If no categories were assigned, put in 'other'
  return categories.length > 0 ? categories : ['other'];
};

// Add this new function
export const findIngredientsByName = (
  query: string,
  locale: string = 'en'
): Array<{ id: string; name: string; lang?: string }> => {
  const normalizedQuery = query.toLowerCase();
  
  // Get all ingredients that match the query
  const matchedIngredients = Object.entries(combinedTaxonomy)
    .filter(([id, data]) => {
      // Check all language labels
      return Object.entries(data.labels).some(([lang, labels]) => {
        return labels.some(label => 
          label.toLowerCase().includes(normalizedQuery)
        );
      });
    })
    .map(([id, data]) => {
      // Find the best matching language
      let bestLang = locale;
      if (!data.labels[locale]) {
        bestLang = data.labels['en'] ? 'en' : Object.keys(data.labels)[0];
      }
      
      return {
        id,
        name: getIngredientName(id, bestLang),
        lang: bestLang
      };
    });

  // Sort results so exact matches appear first
  return matchedIngredients.sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();
    
    if (aName === normalizedQuery) return -1;
    if (bName === normalizedQuery) return 1;
    
    if (aName.startsWith(normalizedQuery) && !bName.startsWith(normalizedQuery)) return -1;
    if (!aName.startsWith(normalizedQuery) && bName.startsWith(normalizedQuery)) return 1;
    
    return aName.localeCompare(bName);
  });
};

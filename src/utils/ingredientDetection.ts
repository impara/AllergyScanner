// src/utils/ingredientDetection.ts

import { IngredientsProfile as IngredientProfile } from '../config/firebase';
import ingredientsTaxonomyData from '../assets/taxonomies/ingredients.json';
import additivesTaxonomyData from '../assets/taxonomies/additives.json';
import i18n from '../localization/i18n';

interface TaxonomyData {
  id: string;
  labels?: { [lang: string]: string[] };
  synonyms?: { [lang: string]: string[] };
  parents?: string[];
  wikidata?: string;
  wikipedia?: string;
  e_number?: string;
}

const ingredientsTaxonomy: { [key: string]: TaxonomyData } = ingredientsTaxonomyData as {
  [key: string]: TaxonomyData;
};

const additivesTaxonomy: { [key: string]: TaxonomyData } = additivesTaxonomyData as {
  [key: string]: TaxonomyData;
};

// Combine both taxonomies
const combinedTaxonomy: { [key: string]: TaxonomyData } = {
  ...ingredientsTaxonomy,
  ...additivesTaxonomy
};

// Helper function to find matches in a specific language
const findInLanguage = (name: string, lang: string): { id: string; lang: string }[] => {
  const matches: { id: string; lang: string }[] = [];
  const words = name.split(/\s+/);
  
  Object.entries(combinedTaxonomy).forEach(([id, data]) => {
    if (data.labels?.[lang]) {
      const labels = data.labels[lang];
      // Check if any label matches exactly or contains all words in sequence
      if (labels.some(label => {
        const normalizedLabel = label.toLowerCase();
        // Try exact match first
        if (normalizedLabel === name) return true;
        
        // Try partial matches for compound words (common in German)
        if (words.length > 1) {
          // Check if all words appear in the label in order
          let lastIndex = -1;
          return words.every(word => {
            const idx = normalizedLabel.indexOf(word, lastIndex + 1);
            if (idx === -1) return false;
            lastIndex = idx;
            return true;
          });
        }
        
        // For single words, check if it's a complete word match
        return new RegExp(`\\b${name}\\b`).test(normalizedLabel);
      })) {
        matches.push({ id, lang });
      }
    }
  });
  
  return matches;
};

// Helper function to find matches in all languages
const findInAllLanguages = (name: string): { id: string; lang: string }[] => {
  const matches: { id: string; lang: string }[] = [];
  const languages = new Set(
    Object.values(combinedTaxonomy).flatMap(data => 
      Object.keys(data.labels || {})
    )
  );
  
  languages.forEach(lang => {
    const langMatches = findInLanguage(name, lang);
    matches.push(...langMatches);
  });
  
  return matches;
};

/**
 * Function to find the standardized ingredient IDs given an ingredient name.
 * @param ingredientName - The ingredient name to find.
 * @returns An array of standardized ingredient IDs.
 */
export const findIngredientIdsWithLang = (
  ingredientName: string,
  preferredLang: string = i18n.locale
): { id: string; lang: string }[] => {
  const lowerName = ingredientName.toLowerCase().trim();
  
  // First try preferred language
  const preferredMatches = findInLanguage(lowerName, preferredLang);
  if (preferredMatches.length > 0) {
    return preferredMatches;
  }
  
  // Then try English as fallback
  if (preferredLang !== 'en') {
    const englishMatches = findInLanguage(lowerName, 'en');
    if (englishMatches.length > 0) {
      return englishMatches;
    }
  }
  
  // Finally try other languages
  return findInAllLanguages(lowerName);
};

/**
 * Helper function to get phrases to remove for a specific language
 */
const getPhrasesToRemove = (lang: string): string[] => {
  try {
    const translations = i18n.translations[lang];
    if (!translations?.ingredients?.phrasesToRemove) {
      return [];
    }
    return Object.values(translations.ingredients.phrasesToRemove)
      .flat()
      .filter(phrase => typeof phrase === 'string');
  } catch (error) {
    console.warn('Error getting phrases to remove:', error);
    return [];
  }
};

/**
 * Parse and normalize ingredients text into a list of individual ingredients
 */
export const parseIngredients = (ingredientsText: string, productLang?: string): string[] => {
  if (!ingredientsText) return [];

  if (Array.isArray(ingredientsText)) {
    return ingredientsText.map(ingredient => ingredient.trim());
  }

  // Normalize text: remove special characters, convert to lowercase
  const normalizedText = ingredientsText
    .toLowerCase()
    .replace(/[\(\)\[\]]/g, ' ')
    .replace(/[^a-zA-ZÀ-ÿ0-9,\s]/g, ' '); // Keep accented characters

  // Get language-specific phrases to remove
  const phrasesToRemove = [
    // Common phrases across all languages
    'www',
    '@',
    'http',
    // Get language-specific phrases
    ...getPhrasesToRemove(productLang || 'en'),
    // Add English phrases as fallback
    ...(productLang !== 'en' ? getPhrasesToRemove('en') : [])
  ];

  let cleanedText = normalizedText;
  phrasesToRemove.forEach((phrase) => {
    if (phrase) {
      const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
      cleanedText = cleanedText.replace(regex, ' ');
    }
  });

  // Remove content within parentheses
  cleanedText = cleanedText.replace(/\([^)]*\)/g, ' ');

  // Remove percentage values
  cleanedText = cleanedText.replace(/\d+([.,]\d+)?%/g, ' ');

  // Collapse multiple spaces into one
  cleanedText = cleanedText.replace(/\s+/g, ' ');

  // Split ingredients by common delimiters
  const ingredientsList = cleanedText
    .split(/[,;]/)
    .map((ingredient) => ingredient.trim())
    .filter((ingredient) => {
      if (ingredient.length === 0) return false;
      if (ingredient.length === 1) return false;
      if (/^\d+$/.test(ingredient)) return false; // Remove pure numbers
      return true;
    });

  // Remove duplicates
  return Array.from(new Set(ingredientsList));
};

/**
 * Detect ingredients from various sources and match against user's enabled ingredients
 */
export const unifiedDetectIngredients = (
  ingredientsList: string[],
  userIngredientsData: IngredientProfile,
  apiIngredientTags: string[],
  productData?: any
): { id: string; lang?: string }[] => {
  const detectedIds = new Set<string>();

  // Detect product language from API response
  const productLang = productData?.product?.lang || 
                     (productData?.product?.languages_codes ? 
                       Object.entries(productData.product.languages_codes)
                         .sort(([,a], [,b]) => Number(b) - Number(a))[0][0] 
                       : 'en');

  // Map user ingredients to IDs with language
  const userIngredientIds = new Map<string, { lang?: string; originalId: string }>();
  for (const [id, data] of Object.entries(userIngredientsData)) {
    if (data.selected) {
      // Store both the full ID and the base ingredient name
      const normalizedId = id.toLowerCase()
        .replace(/^[a-z]{2}:/, '')  // Remove language prefix
        .split(',')[0];             // Take only the first part before comma
      
      userIngredientIds.set(normalizedId, { 
        lang: data.lang,
        originalId: id 
      });
    }
  }

  // Helper function to check if an ingredient matches any enabled ingredients
  const checkForMatch = (ingredientId: string, ingredient: string) => {
    // Normalize the ingredient ID to match how we stored user ingredients
    const normalizedId = ingredientId.toLowerCase()
      .replace(/^[a-z]{2}:/, '')
      .split(',')[0];  // Take only the first part before comma
    
    // Also get the base ingredient name without qualifiers
    const baseIngredient = ingredient.toLowerCase().split(' ')[0];
    
    for (const [enabledId, enabledData] of userIngredientIds.entries()) {
      // Try exact matches first
      if (normalizedId === enabledId || 
          baseIngredient === enabledId ||
          normalizedId.includes(enabledId) || 
          enabledId.includes(normalizedId)) {
        detectedIds.add(enabledData.originalId);
        return true;
      }

      // Try matching against all labels in the taxonomy
      const enabledIngredient = combinedTaxonomy[enabledData.originalId];
      if (enabledIngredient?.labels) {
        for (const labels of Object.values(enabledIngredient.labels)) {
          for (const label of labels) {
            const normalizedLabel = label.toLowerCase().split(',')[0];
            if (normalizedLabel === baseIngredient ||
                normalizedId.includes(normalizedLabel) ||
                normalizedLabel.includes(normalizedId) ||
                ingredient.includes(normalizedLabel) ||
                normalizedLabel.includes(ingredient)) {
              detectedIds.add(enabledData.originalId);
              return true;
            }
          }
        }
      }
    }
    return false;
  };

  // First try to detect ingredients in the product's language
  ingredientsList.forEach((ingredient) => {
    const productLangMatches = findInLanguage(ingredient, productLang);
    productLangMatches.forEach(({ id: ingredientId }) => {
      checkForMatch(ingredientId, ingredient);
    });
  });

  // Try English as a fallback for unmatched ingredients
  if (productLang !== 'en') {
    ingredientsList.forEach((ingredient) => {
      const englishMatches = findInLanguage(ingredient, 'en');
      englishMatches.forEach(({ id: ingredientId }) => {
        checkForMatch(ingredientId, ingredient);
      });
    });
  }

  // Process API tags
  apiIngredientTags.forEach((tag) => {
    const normalizedTag = tag.toLowerCase()
      .replace(/^[a-z]{2}:/, '')
      .replace(/-/g, ' ');

    checkForMatch(normalizedTag, normalizedTag);
  });

  return Array.from(detectedIds).map(id => ({ id }));
};







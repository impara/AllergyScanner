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
  
  Object.entries(combinedTaxonomy).forEach(([id, data]) => {
    if (data.labels?.[lang]) {
      const labels = data.labels[lang];
      if (labels.some(label => label.toLowerCase().includes(name))) {
        matches.push({ id, lang });
      }
    }
    
    if (data.synonyms?.[lang]) {
      const synonyms = data.synonyms[lang];
      if (synonyms.some(synonym => synonym.toLowerCase().includes(name))) {
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
 * Parses and normalizes the ingredients text.
 * Simplified parsing without using compromise.js
 * @param ingredientsText - The raw ingredients text from the product.
 * @returns An array of parsed ingredient terms.
 */
export const parseIngredients = (ingredientsText: string): string[] => {
  if (!ingredientsText) return [];

  // Normalize text: remove special characters, convert to lowercase
  const normalizedText = ingredientsText
    .toLowerCase()
    .replace(/[\(\)\[\]]/g, '')
    .replace(/[^a-zA-ZÀ-ÿ0-9,\s]/g, ''); // Keep accented characters

  // Remove phrases like "may contain", "contains", etc.
  const phrasesToRemove = [
    'may contain',
    'contains',
    'free from',
    'saattaa sisältää',
    'puede contener',
    'contiene',
    'peut contenir',
    'contient',
    'kann enthalten',
    'enthält',
  ];

  let cleanedText = normalizedText;
  phrasesToRemove.forEach((phrase) => {
    const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
    cleanedText = cleanedText.replace(regex, ' ');
  });

  // Remove content within parentheses
  cleanedText = cleanedText.replace(/\([^)]*\)/g, ' ');

  // Collapse multiple spaces into one
  cleanedText = cleanedText.replace(/\s+/g, ' ');

  // Split ingredients by common delimiters
  const ingredientsList = cleanedText
    .split(/[,;.-]/)
    .map((ingredient) => ingredient.trim())
    .filter((ingredient) => ingredient.length > 0);

  // Remove duplicates
  const uniqueIngredients = Array.from(new Set(ingredientsList));

  return uniqueIngredients;
};

export const unifiedDetectIngredients = (
  ingredientsList: string[],
  userIngredientsData: IngredientProfile,
  apiIngredientTags: string[]
): { id: string; lang?: string }[] => {
  const detectedIds = new Set<string>();

  // Map user ingredients to IDs with language, **only if selected**
  const userIngredientIds = new Map<string, { lang?: string; originalId: string }>();
  for (const [id, data] of Object.entries(userIngredientsData)) {
    if (data.selected) {
      // Normalize the ID by removing language prefix and cleaning up
      const normalizedId = id.toLowerCase()
        .replace(/^[a-z]{2}:/, '')  // Remove language prefix
        .replace(/,-.*$/, '');      // Remove variations after comma
      userIngredientIds.set(normalizedId, { 
        lang: data.lang,
        originalId: id 
      });
    }
  }

  // Detect ingredients from API tags
  apiIngredientTags.forEach((tag) => {
    // Normalize the API tag the same way
    const normalizedTag = tag.toLowerCase()
      .replace(/^[a-z]{2}:/, '')
      .replace(/,-.*$/, '');
    
    const userIngredient = userIngredientIds.get(normalizedTag);
    if (userIngredient) {
      detectedIds.add(userIngredient.originalId);
    }
  });

  // Detect ingredients from ingredients list
  ingredientsList.forEach((ingredient) => {
    const matchedIngredients = findIngredientIdsWithLang(ingredient);
    matchedIngredients.forEach(({ id: ingredientId }) => {
      const normalizedId = ingredientId.toLowerCase()
        .replace(/^[a-z]{2}:/, '')
        .replace(/,-.*$/, '');
      
      const userIngredient = userIngredientIds.get(normalizedId);
      if (userIngredient) {
        detectedIds.add(userIngredient.originalId);
      }
    });
  });

  // Build the final detected ingredients array with unique IDs and their languages
  const detectedIngredients: { id: string; lang?: string }[] = [];
  for (const id of detectedIds) {
    detectedIngredients.push({
      id,
      lang: userIngredientsData[id]?.lang, // Preserve the user's selected language
    });
  }

  return detectedIngredients;
};







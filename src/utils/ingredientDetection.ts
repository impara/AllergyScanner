// src/utils/ingredientDetection.ts

import { IngredientsProfile as IngredientProfile } from '../config/firebase';
import ingredientsTaxonomyData from '../assets/taxonomies/ingredients.json';
import additivesTaxonomyData from '../assets/taxonomies/additives.json';
import i18n from '../localization/i18n';
import { DetectedIngredient } from '../types';
import { getIngredientName } from './ingredientUtils';

interface TaxonomyData {
  id: string;
  labels?: { [lang: string]: string[] };
  synonyms?: { [lang: string]: string[] };
  parents?: string[];
  wikidata?: string;
  wikipedia?: string;
  e_number?: string;
}

// Combine both taxonomies
const combinedTaxonomy: { [key: string]: TaxonomyData } = {
  ...ingredientsTaxonomyData as { [key: string]: TaxonomyData },
  ...additivesTaxonomyData as { [key: string]: TaxonomyData }
};

// Helper to normalize text
const normalizeText = (text: string): string => {
  return text.toLowerCase()
    .replace(/^[a-z]{2}:/, '')  // Remove language prefix
    .replace(/[,\-]/g, ' ')     // Replace commas and hyphens with spaces
    .trim()
    .split(/\s+/)               // Split into words
    .filter(word => word.length > 2)  // Only keep words longer than 2 characters
    .join(' ');
};

// Main ingredient detection function
export const detectIngredients = (
  ingredientsList: string[],
  userIngredientsData: IngredientProfile,
  apiIngredientTags: string[] = [],
  productData?: any
): DetectedIngredient[] => {
  const detectedIngredients = new Map<string, DetectedIngredient>();
  const productLang = productData?.lang || i18n.locale;

  // Get enabled ingredients
  const enabledIngredients = Object.entries(userIngredientsData)
    .filter(([_, data]) => data.selected)
    .map(([id, data]) => ({
      id,
      taxonomyData: combinedTaxonomy[id],
      lang: data.lang || productLang,
      category: data.category
    }));

  console.log('Looking for ingredients:', enabledIngredients.map(ing => ({
    id: ing.id,
    name: getIngredientName(ing.id, ing.lang),
    lang: ing.lang
  })));

  // Process each ingredient from the list
  ingredientsList.forEach(ingredient => {
    // Skip ingredients that are too short
    if (ingredient.length <= 2) return;
    
    const normalizedIngredient = normalizeText(ingredient);
    if (!normalizedIngredient) return; // Skip if nothing left after normalization

    enabledIngredients.forEach(enabled => {
      if (!enabled.taxonomyData?.labels) return;

      // Check in ingredient's language first, then English as fallback
      const languages = [enabled.lang, 'en'];
      
      for (const lang of languages) {
        const labels = enabled.taxonomyData.labels[lang] || [];
        const synonyms = enabled.taxonomyData.synonyms?.[lang] || [];
        
        for (const term of [...labels, ...synonyms]) {
          const normalizedTerm = normalizeText(term);
          if (!normalizedTerm) continue;

          // Only match if:
          // 1. Exact match
          // 2. One is a complete word within the other
          const isMatch = 
            normalizedIngredient === normalizedTerm ||
            normalizedIngredient.split(' ').some(word => 
              normalizedTerm === word || 
              normalizedTerm.split(' ').includes(word)
            );

          if (isMatch) {
            console.log('Match found:', {
              ingredient: normalizedIngredient,
              term: normalizedTerm,
              lang,
              matchType: normalizedIngredient === normalizedTerm ? 'exact' : 'partial'
            });

            detectedIngredients.set(enabled.id, {
              id: enabled.id,
              name: getIngredientName(enabled.id, enabled.lang),
              lang: enabled.lang,
              category: enabled.category,
              isAdditive: enabled.taxonomyData.e_number !== undefined,
              eNumber: enabled.taxonomyData.e_number
            });
            
            return; // Stop after first match for this ingredient
          }
        }
      }
    });
  });

  // Process API tags with stricter matching
  apiIngredientTags.forEach(tag => {
    const normalizedTag = normalizeText(tag);
    if (!normalizedTag) return;

    enabledIngredients.forEach(enabled => {
      const normalizedId = normalizeText(enabled.id);
      if (normalizedTag === normalizedId) {
        detectedIngredients.set(enabled.id, {
          id: enabled.id,
          name: getIngredientName(enabled.id, enabled.lang),
          lang: enabled.lang,
          category: enabled.category,
          isAdditive: enabled.taxonomyData?.e_number !== undefined,
          eNumber: enabled.taxonomyData?.e_number
        });
      }
    });
  });

  return Array.from(detectedIngredients.values());
};

// Helper function to parse ingredients text
export const parseIngredients = (text: string, lang?: string): string[] => {
  const phrasesToRemove = i18n.t('ingredients.phrasesToRemove', { locale: lang || i18n.locale }) as {
    [key: string]: string[];
  };
  
  let cleanedText = text.toLowerCase();
  
  Object.values(phrasesToRemove).forEach(phrases => {
    (phrases as string[]).forEach(phrase => {
      cleanedText = cleanedText.replace(new RegExp(phrase, 'gi'), '');
    });
  });

  return cleanedText
    .split(/[,;()]/)
    .map(i => i.trim())
    .filter(i => i.length > 0);
};

// For backward compatibility
export const unifiedDetectIngredients = detectIngredients;

// Add this function export
export const findIngredientIdsWithLang = (
  query: string,
  lang: string = i18n.locale
): Array<{ id: string; lang: string }> => {
  const normalizedQuery = query.toLowerCase()
    .replace(/^[a-z]{2}:/, '')  // Remove language prefix
    .trim();

  const matches: Array<{ id: string; lang: string }> = [];

  // Search through taxonomy
  Object.entries(combinedTaxonomy).forEach(([id, data]) => {
    // Check labels in the specified language
    if (data.labels?.[lang]) {
      const labels = data.labels[lang];
      if (labels.some(label => 
        label.toLowerCase().includes(normalizedQuery) ||
        normalizedQuery.includes(label.toLowerCase())
      )) {
        matches.push({ id, lang });
        return;
      }
    }

    // Check synonyms in the specified language
    if (data.synonyms?.[lang]) {
      const synonyms = data.synonyms[lang];
      if (synonyms.some(synonym => 
        synonym.toLowerCase().includes(normalizedQuery) ||
        normalizedQuery.includes(synonym.toLowerCase())
      )) {
        matches.push({ id, lang });
        return;
      }
    }

    // If no match in preferred language and it's not English,
    // try English as fallback
    if (lang !== 'en' && data.labels?.['en']) {
      const englishLabels = data.labels['en'];
      if (englishLabels.some(label => 
        label.toLowerCase().includes(normalizedQuery) ||
        normalizedQuery.includes(label.toLowerCase())
      )) {
        matches.push({ id, lang: 'en' });
      }
    }
  });

  // Sort matches by relevance:
  // 1. Exact matches first
  // 2. Starts with query
  // 3. Contains query
  return matches.sort((a, b) => {
    const aLabels = combinedTaxonomy[a.id].labels?.[a.lang] || [];
    const bLabels = combinedTaxonomy[b.id].labels?.[b.lang] || [];

    const aHasExact = aLabels.some(label => 
      label.toLowerCase() === normalizedQuery);
    const bHasExact = bLabels.some(label => 
      label.toLowerCase() === normalizedQuery);

    if (aHasExact && !bHasExact) return -1;
    if (!aHasExact && bHasExact) return 1;

    const aStartsWith = aLabels.some(label => 
      label.toLowerCase().startsWith(normalizedQuery));
    const bStartsWith = bLabels.some(label => 
      label.toLowerCase().startsWith(normalizedQuery));

    if (aStartsWith && !bStartsWith) return -1;
    if (!aStartsWith && bStartsWith) return 1;

    return 0;
  });
};







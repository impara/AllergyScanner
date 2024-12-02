// src/utils/ingredientDetection.ts

import { IngredientsProfile as IngredientProfile } from '../config/firebase';
import ingredientsTaxonomyData from '../assets/taxonomies/ingredients.json';
import additivesTaxonomyData from '../assets/taxonomies/additives.json';
import i18n from '../localization/i18n';
import { DetectedIngredient } from '../types';
import { getIngredientName, getIngredientCategories } from './ingredientUtils';

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

// Add helper for compound ingredients
const isCompoundIngredient = (term: string): boolean => {
  return term.includes(' ') && !term.includes(',');
};

// Add helper for exact word matching
const isExactWordMatch = (word: string, text: string): boolean => {
  const words = text.toLowerCase().split(/\s+/);
  return words.includes(word.toLowerCase());
};

// Add debug logging helper
const logMatch = (match: {
  ingredient: string;
  term: string;
  lang: string;
  matchType: 'exact' | 'partial' | 'compound';
  matchScore: number;
}) => {
  // Uncomment the line below to enable detailed logging
  // console.log('Match found:', {
  //   ...match,
  //   quality: `${match.matchScore}/120` // Max score is 100 + 20 language bonus
  // });
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

  // Track best matches for deduplication
  const matchScores = new Map<string, number>();

  // Get enabled ingredients with their categories
  const enabledIngredients = Object.entries(userIngredientsData)
    .filter(([_, data]: [string, any]) => data.selected)
    .map(([id, data]: [string, any]) => ({
      id,
      taxonomyData: combinedTaxonomy[id],
      lang: data.lang || productLang,
      category: data.category,
      categories: getIngredientCategories(id, userIngredientsData)
    }));

  // Uncomment the line below to see which ingredients are being searched for
  // console.log('Looking for ingredients:', enabledIngredients.map(ing => ({
  //   id: ing.id,
  //   name: getIngredientName(ing.id, ing.lang),
  //   categories: ing.categories
  // })));

  // Process each ingredient from the list
  ingredientsList.forEach(ingredient => {
    if (ingredient.length <= 2) return;
    
    const normalizedIngredient = normalizeText(ingredient);
    if (!normalizedIngredient) return;

    enabledIngredients.forEach(enabled => {
      if (!enabled.taxonomyData?.labels) return;

      // Prioritize languages
      const languages = [
        productLang,
        enabled.lang,
        i18n.locale,
        'en'
      ].filter((lang, index, self) => 
        lang && self.indexOf(lang) === index
      );

      for (const lang of languages) {
        const labels = enabled.taxonomyData.labels[lang] || [];
        const synonyms = enabled.taxonomyData.synonyms?.[lang] || [];
        
        for (const term of [...labels, ...synonyms]) {
          const normalizedTerm = normalizeText(term);
          if (!normalizedTerm) continue;

          let matchScore = 0;
          let matchType: 'exact' | 'partial' | 'compound' = 'partial';

          // Handle compound ingredients
          if (isCompoundIngredient(normalizedTerm)) {
            const mainWord = normalizedTerm.split(' ').pop()!;
            if (normalizedIngredient === normalizedTerm) {
              matchScore = 100;
              matchType = 'exact';
            } else if (isExactWordMatch(mainWord, normalizedIngredient)) {
              matchScore = 50;
              matchType = 'compound';
            }
          } else {
            // Simple ingredient matching
            if (normalizedIngredient === normalizedTerm) {
              matchScore = 100;
              matchType = 'exact';
            } else if (isExactWordMatch(normalizedTerm, normalizedIngredient)) {
              // Special handling for oils and salts to prevent duplicates
              if ((enabled.id.includes('oil') || enabled.id.includes('salt')) && 
                  !normalizedIngredient.includes(normalizedTerm)) {
                continue;
              }
              matchScore = 75;
              matchType = 'partial';
            }
          }

          // Language priority bonus
          if (matchScore > 0) {
            if (lang === productLang) matchScore += 20;
            else if (lang === i18n.locale) matchScore += 15;
            else if (lang === 'en') matchScore += 10;

            // Log the match for debugging
            logMatch({
              ingredient: normalizedIngredient,
              term: normalizedTerm,
              lang,
              matchType,
              matchScore
            });

            // Only store if it's a better match than what we have
            const currentScore = matchScores.get(enabled.id) || 0;
            if (matchScore > currentScore) {
              matchScores.set(enabled.id, matchScore);
              if (matchScore >= 75) { // Increased threshold for higher confidence
                detectedIngredients.set(enabled.id, {
                  id: enabled.id,
                  name: getIngredientName(enabled.id, enabled.lang),
                  lang: enabled.lang,
                  category: enabled.category,
                  categories: enabled.categories,
                  isAdditive: enabled.taxonomyData.e_number !== undefined,
                  eNumber: enabled.taxonomyData.e_number,
                  matchType: matchType === 'partial' ? 'label' : 
                             matchType === 'compound' ? 'child' : 'exact',
                  matchScore
                });
              }
            }
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
          categories: enabled.categories,
          isAdditive: enabled.taxonomyData?.e_number !== undefined,
          eNumber: enabled.taxonomyData?.e_number,
          matchType: 'api_tag',
          matchScore: 100,
        });
      }
    });
  });

  // Utilize allergens, allergens_tags, traces, and traces_tags for allergen information
  const allergenTags = productData?.allergens_tags || [];
  const traceTags = productData?.traces_tags || [];

  [...allergenTags, ...traceTags].forEach(tag => {
    const normalizedTag = tag.replace(/^en:/, '').replace(/-/g, ' ').trim();
    enabledIngredients.forEach(enabled => {
      const normalizedId = enabled.id.replace(/^en:/, '').replace(/-/g, ' ').trim();
      if (normalizedTag === normalizedId) {
        detectedIngredients.set(enabled.id, {
          id: enabled.id,
          name: getIngredientName(enabled.id, enabled.lang),
          lang: enabled.lang,
          category: enabled.category,
          categories: enabled.categories,
          isAdditive: enabled.taxonomyData.e_number !== undefined,
          eNumber: enabled.taxonomyData.e_number,
          matchType: 'allergen_tag',
          matchScore: 100,
        });
      }
    });
  });

  // Check for ingredients_analysis_tags if available
  const analysisTags = productData?.ingredients_analysis_tags || [];

  analysisTags.forEach(tag => {
    const normalizedTag = tag.replace(/^en:/, '').replace(/-/g, ' ').trim();
    enabledIngredients.forEach(enabled => {
      const normalizedId = enabled.id.replace(/^en:/, '').replace(/-/g, ' ').trim();
      if (normalizedTag === normalizedId) {
        detectedIngredients.set(enabled.id, {
          id: enabled.id,
          name: getIngredientName(enabled.id, enabled.lang),
          lang: enabled.lang,
          category: enabled.category,
          categories: enabled.categories,
          isAdditive: enabled.taxonomyData.e_number !== undefined,
          eNumber: enabled.taxonomyData.e_number,
          matchType: 'analysis_tag',
          matchScore: 100,
        });
      }
    });
  });

  // Remove generic nutriment-based detection to avoid false positives
  // Only match nutriments to ingredients when the nutriment explicitly indicates a specific allergen
  // Since nutriments like 'proteins' are general, we skip this step

  // Sort detected ingredients by match score before returning
  return Array.from(detectedIngredients.values())
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
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

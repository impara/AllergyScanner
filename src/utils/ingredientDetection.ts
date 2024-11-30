// src/utils/ingredientDetection.ts

import { IngredientsProfile as IngredientProfile } from '../config/firebase';
import ingredientsTaxonomyData from '../assets/taxonomies/ingredients.json';
import additivesTaxonomyData from '../assets/taxonomies/additives.json';
import i18n from '../localization/i18n';
import { DetectedIngredient } from '../types';
import { getIngredientName, getIngredientCategories } from './ingredientUtils';

interface IngredientMatch {
  ingredientId: string;
  matchedTerm: string;
  score: number;
  matchType: 'exact' | 'label' | 'synonym' | 'parent' | 'child';
  language: string;
}

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

// Helper to check ingredient hierarchy matches
const checkHierarchyMatch = (
  ingredientId: string,
  normalizedIngredient: string,
  taxonomyData: any
): boolean => {
  // Check parent ingredients
  if (taxonomyData.parents?.length) {
    for (const parentId of taxonomyData.parents) {
      const parentData = combinedTaxonomy[parentId];
      if (parentData?.labels) {
        for (const [lang, labels] of Object.entries(parentData.labels)) {
          for (const label of labels) {
            const normalizedLabel = normalizeText(label);
            if (normalizedLabel === normalizedIngredient) {
              console.log('Hierarchy match found:', {
                ingredient: normalizedIngredient,
                parent: parentId,
                matchedLabel: label
              });
              return true;
            }
          }
        }
      }
    }
  }
  return false;
};

// Add a new helper function
const isCompleteWordMatch = (word: string, text: string): boolean => {
  const words = text.split(/\s+/);
  return words.includes(word) || 
         words.some(w => w === word || 
         (w.endsWith(',') && w.slice(0, -1) === word));
};

// Add priority scoring to matches
const getMatchPriority = (
  match: { type: 'exact' | 'partial' | 'hierarchy', lang: string }
): number => {
  let priority = 0;
  // Prefer exact matches
  if (match.type === 'exact') priority += 3;
  else if (match.type === 'hierarchy') priority += 2;
  else priority += 1;
  // Prefer matches in user's language
  if (match.lang === i18n.locale) priority += 2;
  else if (match.lang === 'en') priority += 1;
  return priority;
};

// Add helper for compound ingredients
const isCompoundIngredient = (term: string): boolean => {
  return term.includes(' ') && !term.includes(',');
};

const getLanguagePriority = (lang: string, productData?: any): number => {
  if (lang === i18n.locale) return 3;
  if (lang === 'en') return 2;
  if (lang === productData?.lang) return 1;
  return 0;
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
  // Log the match for debugging
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
    .filter(([_, data]) => data.selected)
    .map(([id, data]) => ({
      id,
      taxonomyData: combinedTaxonomy[id],
      lang: data.lang || productLang,
      category: data.category,
      categories: getIngredientCategories(id, userIngredientsData)
    }));

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
          eNumber: enabled.taxonomyData?.e_number
        });
      }
    });
  });

  // Add nutriments-based detection when ingredients are missing
  if (detectedIngredients.size === 0 && productData?.nutriments) {
    // console.log('Checking nutriments for sugar:', {
    //   hasNutriments: !!productData.nutriments,
    //   sugars: productData.nutriments.sugars,
    //   sugars_100g: productData.nutriments.sugars_100g
    // });

    const { sugars, sugars_100g } = productData.nutriments;
    if ((sugars || sugars_100g) > 0) {
      // console.log('Found sugar in nutriments:', { sugars, sugars_100g });
      
      const sugarEnabled = Object.entries(userIngredientsData)
        .find(([id, data]) => id.includes('sugar') && data.selected);
      
      // console.log('Sugar enabled check:', {
      //   sugarEnabled: !!sugarEnabled,
      //   enabledId: sugarEnabled?.[0],
      //   enabledData: sugarEnabled?.[1]
      // });
      
      if (sugarEnabled) {
        const [id, data] = sugarEnabled;
        const lang = data.lang || i18n.locale;
        
        // console.log('Adding sugar from nutriments:', {
        //   id,
        //   lang,
        //   name: getIngredientName(id, lang)
        // });
        
        detectedIngredients.set(id, {
          id,
          name: getIngredientName(id, lang),
          lang,
          category: data.category,
          categories: getIngredientCategories(id, userIngredientsData),
          isAdditive: false,
          matchType: 'nutriment',
          matchScore: 100
        });
      }
    } else {
      // console.log('No sugar found in nutriments');
    }
  } else {
    // console.log('Skipping nutriments check:', {
    //   hasDetectedIngredients: detectedIngredients.size > 0,
    //   hasNutriments: !!productData?.nutriments
    // });
  }

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

export class IngredientMatcher {
  private taxonomy: Record<string, TaxonomyData>;
  private parentChildMap: Map<string, Set<string>>;
  private ingredientTypeMap: Map<string, Set<string>>;
  
  constructor(taxonomy: Record<string, TaxonomyData>) {
    this.taxonomy = taxonomy;
    this.parentChildMap = this.buildParentChildMap();
    this.ingredientTypeMap = this.buildIngredientTypeMap();
  }

  private buildParentChildMap(): Map<string, Set<string>> {
    const map = new Map<string, Set<string>>();
    
    // Build parent->child and child->parent relationships
    Object.entries(this.taxonomy).forEach(([id, data]) => {
      data.parents?.forEach(parentId => {
        if (!map.has(parentId)) {
          map.set(parentId, new Set());
        }
        map.get(parentId)!.add(id);
      });
    });
    
    return map;
  }

  private buildIngredientTypeMap(): Map<string, Set<string>> {
    const map = new Map<string, Set<string>>();
    
    // Build map of base ingredients to their variations
    Object.entries(this.taxonomy).forEach(([id, data]) => {
      // Find the root parent (base type) for this ingredient
      const rootParent = this.findRootParent(id);
      if (rootParent) {
        if (!map.has(rootParent)) {
          map.set(rootParent, new Set());
        }
        map.get(rootParent)!.add(id);
      }
    });
    
    return map;
  }

  private findRootParent(ingredientId: string): string | null {
    const ingredient = this.taxonomy[ingredientId];
    if (!ingredient?.parents?.length) return ingredientId;

    // Find the topmost parent that still represents the same type
    let currentId = ingredientId;
    let rootParent = currentId;

    // Add null check for parents
    while (true) {
      const currentIngredient = this.taxonomy[currentId];
      if (!currentIngredient?.parents?.length) break;
      
      const parent = currentIngredient.parents[0];
      if (!parent || !this.taxonomy[parent]) break;

      // Check if parent is still the same type of ingredient
      if (this.areRelatedIngredients(rootParent, parent)) {
        rootParent = parent;
        currentId = parent;
      } else {
        break;
      }
    }

    return rootParent;
  }

  private areRelatedIngredients(id1: string, id2: string): boolean {
    // Check if ingredients share common labels or are in parent-child relationship
    const ing1 = this.taxonomy[id1];
    const ing2 = this.taxonomy[id2];
    if (!ing1 || !ing2) return false;

    // Check if they share any labels in any language
    for (const lang of Object.keys(ing1.labels || {})) {
      const labels1 = new Set(ing1.labels![lang].map(l => normalizeText(l)));
      const labels2 = new Set(ing2.labels?.[lang]?.map(l => normalizeText(l)) || []);
      
      // Check for any common base words
      for (const label1 of labels1) {
        for (const label2 of labels2) {
          const words1 = label1.split(' ');
          const words2 = label2.split(' ');
          if (words1.some(w => words2.includes(w))) {
            return true;
          }
        }
      }
    }

    return false;
  }

  private scoreMatch(
    term: string, 
    label: string, 
    matchType: IngredientMatch['matchType'],
    language: string,
    productLanguage: string,
    ingredientId: string
  ): number {
    let score = 0;

    // Base score by match type
    switch (matchType) {
      case 'exact': score = 100; break;
      case 'label': score = 90; break;
      case 'synonym': score = 80; break;
      case 'parent': score = 70; break;
      case 'child': score = 60; break;
    }

    // Language bonuses
    if (language === productLanguage) score += 20;
    else if (language === i18n.locale) score += 15;
    else if (language === 'en') score += 10;

    // Word match quality
    const termWords = normalizeText(term).split(/\s+/);
    const labelWords = normalizeText(label).split(/\s+/);

    // Penalize matches for variations of the same ingredient type
    const rootParent = this.findRootParent(ingredientId);
    if (rootParent && this.ingredientTypeMap.get(rootParent)?.has(ingredientId)) {
      if (this.isSubIngredient(label, term)) {
        score -= 30; // Penalty for being a variation
      }
    }

    // Bonus for exact word matches
    const commonWords = termWords.filter(w => labelWords.includes(w));
    const matchQuality = commonWords.length / Math.max(termWords.length, labelWords.length);
    score += matchQuality * 10;

    return score;
  }

  private findBestMatch(
    matches: IngredientMatch[],
    baseIngredient: string
  ): IngredientMatch | null {
    // Group matches by base ingredient
    const matchesByBase = matches.filter(m => 
      this.getBaseIngredient(m.ingredientId) === baseIngredient
    );

    // Return highest scoring match
    return matchesByBase.reduce((best, current) => {
      if (!best || current.score > best.score) return current;
      return best;
    }, null as IngredientMatch | null);
  }

  findMatches(
    term: string,
    productLanguage: string,
    enabledIngredients: Set<string>
  ): IngredientMatch[] {
    const matches: IngredientMatch[] = [];
    const seenBaseIngredients = new Set<string>();
    const allMatches: IngredientMatch[] = [];

    enabledIngredients.forEach(ingredientId => {
      const ingredient = this.taxonomy[ingredientId];
      if (!ingredient?.labels) return;

      const ingredientLabels = ingredient.labels;
      const languages = [
        productLanguage,
        i18n.locale,
        'en',
        ...Object.keys(ingredientLabels)
      ].filter((lang, i, arr) => arr.indexOf(lang) === i);

      // Explicitly type bestMatchForIngredient
      let bestMatchForIngredient: IngredientMatch | null = null;

      languages.forEach(lang => {
        const labels = ingredientLabels[lang];
        if (!labels) return;

        labels.forEach(label => {
          const normalizedLabel = normalizeText(label);
          let matchType: IngredientMatch['matchType'] = 'label';
          const normalizedTerm = normalizeText(term);
          if (normalizedLabel === normalizedTerm) {
            matchType = 'exact';
          } else if (!this.isSubIngredient(normalizedLabel, normalizedTerm)) {
            return;
          }

          const score = this.scoreMatch(
            term, 
            label, 
            matchType, 
            lang, 
            productLanguage,
            ingredientId
          );

          const match: IngredientMatch = {
            ingredientId,
            matchedTerm: label,
            score,
            matchType,
            language: lang
          };

          if (!bestMatchForIngredient || match.score > bestMatchForIngredient.score) {
            bestMatchForIngredient = match;
          }
        });
      });
      
      if (bestMatchForIngredient && (bestMatchForIngredient as IngredientMatch).score <= 0.5) {
        const baseIngredient = this.getBaseIngredient(ingredientId);
        if (!seenBaseIngredients.has(baseIngredient)) {
          matches.push(bestMatchForIngredient);
          seenBaseIngredients.add(baseIngredient);
        }
      }
    });

    // Deduplicate matches by base ingredient
    allMatches.forEach(match => {
      const baseIngredient = this.getBaseIngredient(match.ingredientId);
      if (!seenBaseIngredients.has(baseIngredient)) {
        const bestMatch = this.findBestMatch(allMatches, baseIngredient);
        if (bestMatch && bestMatch.score >= 50) {  // Fixed threshold
          matches.push(bestMatch);
          seenBaseIngredients.add(baseIngredient);
        }
      }
    });

    return matches.sort((a, b) => b.score - a.score);
  }

  private getBaseIngredient(ingredientId: string): string {
    // Extract base ingredient from compound IDs (e.g., "sea-salt" -> "salt")
    const parts = ingredientId.split('-');
    return parts[parts.length - 1];
  }

  private isSubIngredient(term: string, mainIngredient: string): boolean {
    // Check if term is a more specific version of mainIngredient
    const termWords = normalizeText(term).split(' ');
    const mainWords = normalizeText(mainIngredient).split(' ');
    return mainWords.every(word => termWords.includes(word));
  }
}







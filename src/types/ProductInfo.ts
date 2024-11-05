// src/types/ProductInfo.ts

export interface Nutriments {
  'energy-kcal': number;
  'energy-kcal_unit': string;
  proteins: number;
  carbohydrates: number;
  fat: number;
}

export interface ProductInfo {
  code: string;
  product: {
    _id?: string;
    _keywords?: string[];
    product_name?: string;
    brands?: string;
    ingredients_text_en?: string;
    ingredients_text?: string;
    ingredients_hierarchy?: string[];
    ingredients_tags?: string[];
    additives_tags?: string[];
    additives_n?: number;
    additives_original_tags?: string[];
    allergens?: string;
    allergens_from_ingredients?: string;
    allergens_from_user?: string;
    allergens_hierarchy?: string[];
    allergens_tags?: string[];
    nutrients_available?: number;
    nutriments?: Nutriments;
    countries?: string;
    countries_tags?: string[];
    countries_hierarchy?: string[];
    description?: string;
    images?: {
      [key: string]: {
        sizes?: {
          [key: string]: {
            w?: number;
            h?: number;
          };
        };
        uploaded_t?: number;
        uploader?: string;
      };
    };
    // Include any additional fields that might be relevant
    [key: string]: any; // Allow for additional properties
  };
  status: number;
  status_verbose: string;
}

export interface AlternateProductInfo {
  product: {
    id: number;
    barcode: string;
    name?: string;
    product_name?: string;
    brands?: string;
    country?: string;
    countries?: string;
    countries_tags?: string[];
    ingredients_text?: string;
    ingredients_hierarchy?: string[];
    ingredients_tags?: string[];
    additives_tags?: string[];
    allergens?: string;
    allergens_tags?: string[];
    nutriments?: {
      'energy-kcal'?: number;
      'energy-kcal_unit'?: string;
      proteins?: number;
      carbohydrates?: number;
      fat?: number;
      // Add other nutriments as needed
    };
    images?: { medium?: string }[];
    // Include any additional fields that might be relevant
    [key: string]: any; // Allow for additional properties
  };
}

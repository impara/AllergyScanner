export interface Nutriments {
  'energy-kcal': number;
  'energy-kcal_unit': string;
  proteins: number;
  proteins_unit?: string;
  carbohydrates: number;
  carbohydrates_unit?: string;
  fat: number;
  fat_unit?: string;
  [key: string]: number | string | undefined;
}

export interface BaseProduct {
  name?: string;
  product_name?: string;
  brands?: string;
  ingredients_text?: string;
  ingredients_hierarchy?: string[];
  ingredients_tags?: string[];
  additives_tags?: string[];
  allergens?: string;
  allergens_tags?: string[];
  nutriments?: Nutriments;
  ingredients_text_en?: string;
  product_name_en?: string;
  [key: string]: any;
}

export interface ProductInfo {
  code: string;
  product: BaseProduct & {
    _id?: string;
    _keywords?: string[];
    ingredients_text_en?: string;
    allergens_from_ingredients?: string;
    allergens_from_user?: string;
    allergens_hierarchy?: string[];
    nutrients_available?: number;
    countries?: string;
    countries_tags?: string[];
    countries_hierarchy?: string[];
    description?: string;
    images?: Record<string, {
      sizes?: Record<string, {
        w?: number;
        h?: number;
      }>;
      uploaded_t?: number;
      uploader?: string;
    }>;
    [key: string]: any;
  };
  status: number;
  status_verbose: string;
} 
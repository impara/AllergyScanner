import { FOOD_REPO_API_KEY } from '@env';
import axios from 'axios';
import { ProductInfo, AlternateProductInfo } from '../types/ProductInfo';

const OPENFOODFACTS_BASE_URL = 'https://world.openfoodfacts.org/api/v0/product/';
const FOOD_REPO_BASE_URL = 'https://www.foodrepo.org/api/v3';

export const getOpenFoodFactsProductInfo = async (barcode: string): Promise<ProductInfo> => {
  console.log(`Fetching from OpenFoodFacts with barcode: ${barcode}`);
  try {
    const response = await axios.get(`${OPENFOODFACTS_BASE_URL}${barcode}.json`);
    if (response.data.status === 1) {
      console.log('Product found in OpenFoodFacts.');
      return response.data;
    } else {
      console.log('Product not found in OpenFoodFacts.');
      throw new Error('Product not found in OpenFoodFacts');
    }
  } catch (error: any) {
    console.log('Error fetching from OpenFoodFacts:', error.message);
    throw error;
  }
};

export const getAlternateProductInfo = async (barcode: string): Promise<AlternateProductInfo> => {
  console.log(`Fetching from FoodRepo with barcode: ${barcode}`);
  if (!FOOD_REPO_API_KEY) {
    console.log('FOOD_REPO_API_KEY is not defined.');
    throw new Error('FOOD_REPO_API_KEY is not defined');
  }
  try {
    const response = await axios.get(`${FOOD_REPO_BASE_URL}/products`, {
      params: {
        barcodes: barcode,
      },
      headers: {
        Authorization: `Token token=${FOOD_REPO_API_KEY}`,
      },
    });
    const data = response.data;
    if (data.data && data.data.length > 0) {
      console.log('Product found in FoodRepo.');

      const productData = data.data[0];

      // Extract ingredients text
      const ingredientsTranslations = productData.ingredients_translations || {};
      const ingredientsText =
        ingredientsTranslations['en'] ||
        ingredientsTranslations['de'] ||
        ingredientsTranslations['fr'] ||
        ingredientsTranslations['it'] ||
        '';

      // Extract product name
      const nameTranslations = productData.name_translations || {};
      const name =
        nameTranslations['en'] ||
        nameTranslations['de'] ||
        nameTranslations['fr'] ||
        nameTranslations['it'] ||
        '';

      return {
        product: {
          id: productData.id,
          barcode: productData.barcode,
          country: productData.country,
          name: name,
          ingredients_text: ingredientsText,
          allergens_tags: [],
          images: productData.images || [],
          nutriments: productData.nutrients ? {
            'energy-kcal': productData.nutrients.energy,
            'energy-kcal_unit': 'kcal',
            proteins: productData.nutrients.proteins,
            carbohydrates: productData.nutrients.carbohydrates,
            fat: productData.nutrients.fat
          } : undefined
        },
      };
    } else {
      console.log('Product not found in FoodRepo.');
      throw new Error('Product not found in FoodRepo');
    }
  } catch (error: any) {
    console.log('Error fetching from FoodRepo:', error.message);
    throw error;
  }
};


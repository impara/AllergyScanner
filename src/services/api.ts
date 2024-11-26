import axios from 'axios';
import { ProductInfo } from '../types/product';

const OPENFOODFACTS_BASE_URL = 'https://world.openfoodfacts.org/api/v0/product/';

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


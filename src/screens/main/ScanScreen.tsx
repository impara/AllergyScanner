// src/screens/main/ScanScreen.tsx

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
  Animated,
} from 'react-native';
import { Text } from 'react-native-paper';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { useNavigation } from '@react-navigation/native';
import { getOpenFoodFactsProductInfo } from '../../services/api';
import { getUserIngredients, IngredientsProfile } from '../../config/firebase';
import { RootStackNavigationProp, TabNavigationProp, DetectedIngredient } from '../../types/navigation';
import { detectIngredients, parseIngredients } from '../../utils/ingredientDetection';
import { ProductInfo } from '../../types/product';
import { colors } from '../../theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import i18n from '../../localization/i18n';
import { useScanLimit } from '../../context/ScanLimitContext';
import { logScan } from '../../services/analytics';
import { Button } from '../../components';
import { theme as defaultTheme } from '../../theme';
import { CustomTheme } from '../../types/theme';

type ScanScreenNavigationProp = RootStackNavigationProp & TabNavigationProp;

interface ScanScreenProps {
  theme?: CustomTheme;
}

const ScanScreen: React.FC<ScanScreenProps> = ({ 
  theme = defaultTheme 
}) => {
  const navigation = useNavigation<ScanScreenNavigationProp>();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [userIngredients, setUserIngredients] = useState<IngredientsProfile>({});
  const [isScanning, setIsScanning] = useState(false);
  const scanTimeoutRef = useRef<NodeJS.Timeout>();
  const [isScannerEnabled, setScannerEnabled] = useState(true);
  const scannerRef = useRef<BarCodeScanner>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { scansRemaining, useOneScan, watchAdForScans, isAdLoading, isAdReady } = useScanLimit();
  const isMountedRef = useRef(true);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (isMountedRef.current) {
        setIsScanning(false);
        setLoading(false);
        setScannerEnabled(true);
      }

      const fetchUserIngredients = async () => {
        try {
          const ingredients = await getUserIngredients();
          const normalizedIngredients = Object.keys(ingredients).reduce((acc, key) => {
            acc[key.toLowerCase()] = ingredients[key];
            return acc;
          }, {} as IngredientsProfile);
          if (isMountedRef.current) {
            setUserIngredients(normalizedIngredients);
          }
        } catch (error: any) {
          console.error('Error loading ingredient profile:', error);
          handleFirestoreError(error);
        }
      };
      fetchUserIngredients();
    });

    const blurSubscription = navigation.addListener('blur', () => {
      if (isMountedRef.current) {
        setIsScanning(false);
        setScannerEnabled(false);
      }
    });
  
    return () => {
      unsubscribe();
      blurSubscription();
    };
  }, [navigation]);  

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scaleAnim]);

  const handleBarCodeScanned = async ({
    data,
    type,
  }: {
    data: string;
    type: string;
  }) => {
    if (!isMountedRef.current || isScanning) {
      return;
    }

    try {
      setIsScanning(true);
      setLoading(true);

      try {
        const productInfo = await getOpenFoodFactsProductInfo(data);
        // console.log('Raw OpenFoodFacts response:', JSON.stringify(productInfo.product, null, 2));
        
        const canScan = await useOneScan();
        if (!canScan) {
          Alert.alert(
            i18n.t('scan.scanLimitReached'),
            i18n.t('scan.watchAdPrompt'),
            [
              isAdLoading ? 
                {
                  text: i18n.t('ads.loading'),
                  onPress: () => {}
                } :
                {
                  text: i18n.t('scan.watchAdButton'),
                  onPress: watchAdForScans
                },
              {
                text: i18n.t('common.cancel'),
                style: 'cancel'
              }
            ]
          );
          return;
        }

        await logScan(data, true);
        await processProductInfo(productInfo);

      } catch (error) {
        // console.log('OpenFoodFacts Error:', error);
        await logScan(data, false);
        
        Alert.alert(
          i18n.t('scan.productNotFound'),
          i18n.t('scan.productNotFoundDesc'),
          [
            {
              text: i18n.t('common.ok'),
              onPress: () => {
                setIsScanning(false);
                setLoading(false);
              },
            },
          ],
          { cancelable: false }
        );
      }
    } catch (error) {
      console.error('Unexpected Error:', error);
      Alert.alert(
        i18n.t('scan.error'),
        i18n.t('scan.unexpectedError'),
        [
          {
            text: 'OK',
            onPress: () => {
              setIsScanning(false);
              setLoading(false);
            },
          },
        ],
        { cancelable: false }
      );
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        
        if (scanTimeoutRef.current) {
          clearTimeout(scanTimeoutRef.current);
        }
        
        scanTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            setIsScanning(false);
          }
        }, 2000);
      }
    }
  };

  const navigateToProductInfo = (params: any) => {
    setScannerEnabled(false);
    navigation.navigate('ProductInfo', {
      ...params,
      presentation: 'modal',
    });
  };

  const processProductInfo = async (productInfo: ProductInfo) => {
    try {
      const userIngredientsData: IngredientsProfile = userIngredients;

      // Get all ingredient tags from various sources
      const apiIngredientTags: string[] = [
        ...(productInfo.product.allergens_tags || []),
        ...(productInfo.product.allergens_from_ingredients
          ? productInfo.product.allergens_from_ingredients.split(',').map((tag) => tag.trim())
          : []),
        ...(productInfo.product.allergens_hierarchy || []),
        ...(productInfo.product.additives_tags || []),
        ...(productInfo.product.ingredients_hierarchy || []),
        ...(productInfo.product.traces_tags || []),
        ...(productInfo.product.ingredients_analysis_tags || [])
      ];

      // Get ingredients list from various sources
      let ingredientsList: string[] = [];
      const localizedIngredientsKey = `ingredients_text_${i18n.locale}`;
      
      // Try to get ingredients text in order of preference
      const ingredientsText = 
        productInfo.product[localizedIngredientsKey] || 
        productInfo.product.ingredients_text_en || 
        productInfo.product.ingredients_text;
      
      if (ingredientsText) {
        ingredientsList = parseIngredients(ingredientsText, productInfo.product.lang);
      }
      
      // Fallback to ingredients hierarchy if no text available
      if (ingredientsList.length === 0 && productInfo.product.ingredients_hierarchy?.length) {
        ingredientsList = productInfo.product.ingredients_hierarchy.map(i => 
          i.replace(/^en:/, '').replace(/-/g, ' ').trim()
        );
      }
      
      // Fallback to ingredients tags if still no ingredients
      if (ingredientsList.length === 0 && productInfo.product.ingredients_tags?.length) {
        ingredientsList = productInfo.product.ingredients_tags.map(i => 
          i.replace(/^en:/, '').replace(/-/g, ' ').trim()
        );
      }
      
      // Last resort: try keywords
      if (ingredientsList.length === 0 && productInfo.product._keywords?.length) {
        ingredientsList = productInfo.product._keywords.filter(k => 
          !['food', 'product', 'med', 'and', 'contains'].includes(k.toLowerCase())
        );
      }

      // Detect ingredients using all available sources
      const detectedIngredients = detectIngredients(
        ingredientsList,
        userIngredientsData,
        apiIngredientTags,
        { 
          lang: productInfo.product.lang,
          nutriments: productInfo.product.nutriments
        }
      );

      // Navigate to product info screen with results
      navigateToProductInfo({
        productInfo: productInfo.product,
        detectedIngredients: detectedIngredients,
        ingredientsList,
      });
    } finally {
      setIsScanning(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
      setScannerEnabled(false);
    };
  }, []);

  const renderAdLoadingOverlay = () => {
    if (!isAdLoading) return null;
    
    return (
      <View style={styles.adLoadingOverlay}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>{i18n.t('ads.loading')}</Text>
      </View>
    );
  };

  const handleFirestoreError = (error: any) => {
    if (error.code === 'firestore/permission-denied') {
      Alert.alert(
        i18n.t('error.title'),
        i18n.t('error.permissionDenied'),
        [{ text: i18n.t('common.ok') }]
      );
    } else {
      Alert.alert(
        i18n.t('error.title'),
        i18n.t('error.unexpected'),
        [{ text: i18n.t('common.ok') }]
      );
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text>{i18n.t('camera.loading')}</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Text>{i18n.t('camera.permission')}</Text>
        <Text>{i18n.t('camera.permissionDesc')}</Text>
        <Text
          style={styles.link}
          onPress={() => Linking.openSettings()}
        >
          {i18n.t('camera.openSettings')}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.instructions}>
        {i18n.t('scan.instructions')}
      </Text>
      {isScannerEnabled && (
        <BarCodeScanner
          ref={scannerRef}
          onBarCodeScanned={isScanning ? undefined : handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
          barCodeTypes={[
            BarCodeScanner.Constants.BarCodeType.ean13,
            BarCodeScanner.Constants.BarCodeType.ean8,
            BarCodeScanner.Constants.BarCodeType.upc_a,
            BarCodeScanner.Constants.BarCodeType.upc_e,
          ]}
        />
      )}
      <View style={styles.overlay}>
        <Animated.View
          style={[styles.targetBox, { transform: [{ scale: scaleAnim }] }]}
        />
      </View>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>{i18n.t('scan.processing')}</Text>
        </View>
      )}
      <View style={styles.scanCounter}>
        <Text style={styles.scanCounterText}>
          {i18n.t('scan.scansRemaining', { count: scansRemaining })}
        </Text>
      </View>
      {renderAdLoadingOverlay()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  link: {
    marginTop: 10,
    color: 'blue',
    textDecorationLine: 'underline',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  instructions: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    textAlign: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: colors.surface,
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 20,
    zIndex: 2,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  targetBox: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 5,
  },
  loadingOverlay: {
    position: 'absolute',
    top: '50%',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 20,
    borderRadius: 10,
    alignSelf: 'center',
    zIndex: 3,
  },
  loadingText: {
    marginTop: 10,
    color: colors.surface,
    fontSize: 16,
  },
  scanCounter: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: 8,
    zIndex: 2,
  },
  scanCounterText: {
    color: colors.surface,
    fontSize: 16,
  },
  adLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 4,
  },
});

export default ScanScreen;

// src/screens/main/ScanScreen.tsx

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
  Animated,
  Platform,
  TouchableOpacity,
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
import { useInterstitialAd } from '../../hooks/useInterstitialAd';

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
  const [showAdPrompt, setShowAdPrompt] = useState(false);
  const scannerRef = useRef<BarCodeScanner>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { scansRemaining, useOneScan, watchAdForScans, isAdLoading, isAdReady } = useScanLimit();
  const isMountedRef = useRef(true);
  const { showInterstitialAd } = useInterstitialAd();
  const scanCountRef = useRef(0);

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

    // Check scans *before* attempting API call
    if (scansRemaining <= 0) {
      setShowAdPrompt(true);
      return;
    }

    try {
      setIsScanning(true);
      setLoading(true);

      // Get product info FIRST
      const productInfo = await getOpenFoodFactsProductInfo(data);
      // console.log('Raw OpenFoodFacts response:', JSON.stringify(productInfo.product, null, 2));

      // NOW attempt to use a scan credit
      const scanUsedSuccessfully = await useOneScan();
      
      // Double-check scan usage success (although the initial check should prevent this)
      if (!scanUsedSuccessfully) {
         Alert.alert(
          i18n.t('common.error'),
          i18n.t('scan.scanUseErrorDesc'),
          [
            {
              text: i18n.t('common.ok'),
              style: 'cancel'
            }
          ]
        );
        // No return here, allow finally block to reset loading state
      } else {
          // Scan used, log and process
          await logScan(data, true); 
          await processProductInfo(productInfo);
      }

    } catch (error) {
      // API Error (Product not found, network error, etc.) - Scan was NOT used
      // console.log('OpenFoodFacts Error:', error);
      await logScan(data, false); // Log the failed scan attempt
      
      Alert.alert(
        i18n.t('scan.productNotFound'),
        i18n.t('scan.productNotFoundDesc'),
        [
          {
            text: i18n.t('common.ok'),
            onPress: () => {
              // No state changes needed here, handled in finally
            },
          },
        ],
        { cancelable: false }
      );
    } finally {
      // Ensure loading and scanning states are reset regardless of success/failure/scan usage
      if (isMountedRef.current) {
        setLoading(false);
        
        if (scanTimeoutRef.current) {
          clearTimeout(scanTimeoutRef.current);
        }
        
        scanTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            setIsScanning(false);
          }
        }, 2000); // Keep the re-scan delay
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

      scanCountRef.current += 1;
      
      // Show interstitial ad every 3 successful scans
      if (scanCountRef.current % 3 === 0) {
        await showInterstitialAd();
      }

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
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.statusText, { color: theme.colors.text }]}>
          {i18n.t('scan.requestingPermission')}
        </Text>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.statusText, { color: theme.colors.text, marginBottom: 20 }]}>
          {i18n.t('scan.noCameraPermission')}
        </Text>
        <Button onPress={() => Linking.openSettings()}>
          {i18n.t('scan.openSettings')}
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {isScannerEnabled && (
        <BarCodeScanner
          ref={scannerRef}
          onBarCodeScanned={handleBarCodeScanned}
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
        <View style={styles.topSection}>
        </View>

        <View style={styles.middleSection}>
          <View style={styles.viewfinder}>
            <Animated.View
              style={[styles.scanLine, { transform: [{ scaleX: scaleAnim }] }]}
            />
          </View>
        </View>

        <View style={styles.bottomSection}>
        </View>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textOnDark || '#FFFFFF' }]}>
            {i18n.t('scan.loadingProduct')}
          </Text>
        </View>
      )}

      {showAdPrompt && (
        <View style={styles.adPromptOverlay}>
          <View style={[styles.adPromptContainer, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.adPromptText, { color: theme.colors.text }]}>
              {i18n.t('scan.watchAdPrompt')}
            </Text>
            <View style={styles.adPromptButtons}>
              <Button
                variant="primary"
                onPress={() => {
                  setShowAdPrompt(false);
                  if (!isAdLoading) {
                    watchAdForScans();
                  }
                }}
                disabled={isAdLoading}
                loading={isAdLoading}
                style={styles.adPromptButton}
              >
                {isAdLoading ? i18n.t('ads.loading') : i18n.t('scan.watchAdButton')}
              </Button>
              <Button
                variant="outline"
                onPress={() => setShowAdPrompt(false)}
                style={styles.adPromptButton}
              >
                {i18n.t('common.cancel')}
              </Button>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 18,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  topSection: {
    width: '100%',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'android' ? 20 : 10,
  },
  middleSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  viewfinder: {
    width: '80%',
    aspectRatio: 1.5,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'transparent',
  },
  scanLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.8,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
  bottomSection: {
     width: '100%',
     paddingBottom: 20,
     alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  adPromptOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  adPromptContainer: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  adPromptText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 24,
  },
  adPromptButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  adPromptButton: {
    flex: 1,
    marginHorizontal: 8,
    minWidth: 120,
  },
  adPromptButtonLabel: {
    fontSize: 14,
    fontWeight: 'bold',
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
  containedButton: {
    borderWidth: 0,
  },
  containedButtonLabel: {
  },
  outlinedButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  outlinedButtonLabel: {
  },
});

export default ScanScreen;

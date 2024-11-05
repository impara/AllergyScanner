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
import {
  getOpenFoodFactsProductInfo,
  getAlternateProductInfo,
} from '../../services/api';
import { getUserIngredients, IngredientsProfile } from '../../config/firebase';
import { BottomTabNavigationProp, RootStackNavigationProp } from '../../types/navigation';
import { unifiedDetectIngredients, parseIngredients } from '../../utils/ingredientDetection';
import { ProductInfo, AlternateProductInfo } from '../../types/ProductInfo';
import { colors } from '../../theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import i18n from '../../localization/i18n';
import { useScanLimit } from '../../context/ScanLimitContext';
import { logScan } from '../../services/analytics';

type ScanScreenNavigationProp = BottomTabNavigationProp & RootStackNavigationProp;

const ScanScreen: React.FC = () => {
  const navigation = useNavigation<ScanScreenNavigationProp>();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [userIngredients, setUserIngredients] = useState<IngredientsProfile>({});
  const [isScanning, setIsScanning] = useState(false);
  const scanTimeoutRef = useRef<NodeJS.Timeout>();
  const [isScannerEnabled, setScannerEnabled] = useState(true);
  const scannerRef = useRef<BarCodeScanner>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { scansRemaining, useOneScan, watchAdForScans } = useScanLimit();
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
        const ingredients = await getUserIngredients();
        const normalizedIngredients = Object.keys(ingredients).reduce((acc, key) => {
          acc[key.toLowerCase()] = ingredients[key];
          return acc;
        }, {} as IngredientsProfile);
        if (isMountedRef.current) {
          setUserIngredients(normalizedIngredients);
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

      const canScan = await useOneScan();
      if (!canScan) {
        Alert.alert(
          i18n.t('scan.scanLimitReached'),
          i18n.t('scan.watchAdPrompt'),
          [
            {
              text: i18n.t('scan.watchAdButton'),
              onPress: watchAdForScans,
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ]
        );
        return;
      }

      let productInfo: ProductInfo | null = null;
      let alternateProductInfo: AlternateProductInfo | null = null;

      try {
        productInfo = await getOpenFoodFactsProductInfo(data);
        await logScan(data, true);

        if (productInfo?.product?.ingredients_text || productInfo?.product?.ingredients_text_en) {
          await processProductInfo(productInfo);
          return;
        }
      } catch (error) {
        console.log('OpenFoodFacts Error:', error);
        await logScan(data, false);
      }

      if (!productInfo?.product?.ingredients_text && !productInfo?.product?.ingredients_text_en) {
        try {
          alternateProductInfo = await getAlternateProductInfo(data);
          if (alternateProductInfo?.product?.ingredients_text) {
            await processAlternateProductInfo(alternateProductInfo);
            return;
          }
        } catch (error) {
          console.log('FoodRepo Error:', error);
        }
      }

      if (productInfo || alternateProductInfo) {
        Alert.alert(
          i18n.t('scan.ingredientsMissing'),
          i18n.t('scan.ingredientsMissingDesc'),
          [
            {
              text: i18n.t('scan.scanNext'),
              onPress: () => {
                setIsScanning(false);
                setLoading(false);
              },
            },
            {
              text: i18n.t('scan.viewDetails'),
              onPress: () => {
                const product = productInfo?.product || alternateProductInfo?.product || {};
                navigation.navigate('ProductInfo', {
                  productInfo: product,
                  detectedIngredients: [],
                  ingredientsList: [],
                });
              },
            },
          ],
          { cancelable: false }
        );
      } else {
        Alert.alert(
          i18n.t('scan.productNotFound'),
          i18n.t('scan.productNotFoundDesc'),
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

      const apiIngredientTags: string[] = [
        ...(productInfo.product.allergens_tags || []),
        ...(productInfo.product.allergens_from_ingredients
          ? productInfo.product.allergens_from_ingredients.split(',').map((tag) => tag.trim())
          : []),
        ...(productInfo.product.allergens_hierarchy || []),
        ...(productInfo.product.additives_tags || []),
        ...(productInfo.product.ingredients_hierarchy || []),
      ];

      const ingredientsText =
        productInfo.product.ingredients_text_en || productInfo.product.ingredients_text;

      let ingredientsList: string[] = [];
      if (ingredientsText) {
        ingredientsList = parseIngredients(ingredientsText);
      }

      if (ingredientsList.length === 0) {
        handleMissingIngredients(productInfo, null);
        return;
      }

      const finalDetectedIngredients = unifiedDetectIngredients(
        ingredientsList,
        userIngredientsData,
        apiIngredientTags
      );

      navigateToProductInfo({
        productInfo: productInfo.product,
        detectedIngredients: finalDetectedIngredients,
        ingredientsList,
      });
    } finally {
      setIsScanning(false);
      setLoading(false);
    }
  };

  const processAlternateProductInfo = async (alternateProductInfo: AlternateProductInfo) => {
    try {
      const userIngredientsData: IngredientsProfile = userIngredients;

      const ingredientsText = alternateProductInfo.product.ingredients_text;

      let ingredientsList: string[] = [];
      if (ingredientsText) {
        ingredientsList = parseIngredients(ingredientsText);
      }

      if (ingredientsList.length === 0) {
        handleMissingIngredients(null, alternateProductInfo);
        return;
      }

      const finalDetectedIngredients = unifiedDetectIngredients(
        ingredientsList,
        userIngredientsData,
        []
      );

      navigateToProductInfo({
        productInfo: alternateProductInfo.product,
        detectedIngredients: finalDetectedIngredients,
        ingredientsList,
      });
    } finally {
      setIsScanning(false);
      setLoading(false);
    }
  };

  const handleMissingIngredients = (
    productInfo: ProductInfo | null,
    alternateProductInfo: AlternateProductInfo | null
  ) => {
    Alert.alert(
      i18n.t('scan.ingredientsMissing'),
      i18n.t('scan.ingredientsMissingDesc'),
      [
        {
          text: i18n.t('scan.scanNext'),
          onPress: () => {
            setIsScanning(false);
            setLoading(false);
          },
        },
        {
          text: i18n.t('scan.viewDetails'),
          onPress: () => {
            const product = productInfo?.product || alternateProductInfo?.product || {};
            navigation.navigate('ProductInfo', {
              productInfo: product,
              detectedIngredients: [],
              ingredientsList: [],
            });
          },
        },
      ],
      { cancelable: false }
    );
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

  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <Text>{i18n.t('scan.requestingCamera')}</Text>
        <ActivityIndicator size="small" />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Text>{i18n.t('scan.noCamera')}</Text>
        <Text onPress={() => Linking.openSettings()} style={styles.link}>
          {i18n.t('scan.openSettings')}
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
});

export default ScanScreen;

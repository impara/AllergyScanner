// src/screens/main/ProductInfoScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  PanResponder,
  Platform,
} from 'react-native';
import { Text, Chip, IconButton, Divider } from 'react-native-paper';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RouteProp, useRoute } from '@react-navigation/core';
import { RootStackParamList, ProductInfoScreenRouteProp, DetectedIngredient } from '../../types/navigation';
import { getIngredientName, isAdditive, getENumber } from '../../utils/ingredientUtils';
import i18n from '../../localization/i18n';
import { useLanguage } from '../../context/LanguageContext';
import { colors } from '../../theme/colors';
import { spacing, typography } from '../../theme';
import { shadows } from '../../theme/shadows';
import { Button, Input } from '../../components';
import { CustomTheme } from '../../types/theme';
import { ProductInfo } from '../../types/product';
import { theme as defaultTheme } from '../../theme';
import { ProductInfoScreenProps } from '../../navigation/AppStackNavigator';
import { checkContrast, getAccessibleFontSize } from '../../utils/accessibility';
import { useScreenReader } from '../../hooks/useScreenReader';
import { parseIngredients } from '../../utils/ingredientDetection';

const DRAG_THRESHOLD = 100;
const ANIMATION_DURATION = 300;

const ProductInfoScreen: React.FC<ProductInfoScreenProps> = ({ 
  theme = defaultTheme, 
  route, 
  navigation 
}) => {
  const { productInfo, detectedIngredients } = route.params;
  const { locale } = useLanguage();
  const { announce } = useScreenReader();

  const [modalVisible, setModalVisible] = useState(true);
  const pan = React.useRef(new Animated.Value(0)).current;

  // Platform-specific shadow styles
  const platformShadow = Platform.select({
    ios: shadows.small,
    android: {
      elevation: 5,
    },
  });

  const getLocalizedProductName = () => {
    const langSpecificNameKey = `product_name_${locale}`;
    return (
      productInfo[langSpecificNameKey] ||
      productInfo.product_name ||
      productInfo.name ||
      i18n.t('product.unavailable')
    );
  };

  const getLocalizedIngredients = () => {
    const sources = {
      ingredientsList: productInfo.ingredientsList?.length || 0,
      ingredients_hierarchy: productInfo.ingredients_hierarchy?.length || 0,
      ingredients_tags: productInfo.ingredients_tags?.length || 0,
      keywords: productInfo._keywords?.length || 0
    };

    // Enhanced logging to show detected ingredients and their details
    // console.log('Product Ingredient Analysis:', {
    //   timestamp: new Date().toISOString(),
    //   productName: getLocalizedProductName(),
    //   availableSources: sources,
    //   selectedSource: productInfo.ingredientsList?.length > 0 ? 'ingredientsList' :
    //                  productInfo[`ingredients_text_${locale}`] ? `ingredients_text_${locale}` :
    //                  productInfo.ingredients_text_en ? 'ingredients_text_en' :
    //                  productInfo.ingredients_text ? 'ingredients_text' :
    //                  productInfo.ingredients_hierarchy?.length ? 'ingredients_hierarchy' :
    //                  productInfo.ingredients_tags?.length ? 'ingredients_tags' :
    //                  productInfo._keywords?.length ? '_keywords' : 'none',
    //   detectedIngredients: detectedIngredients.map(({ id }) => ({
    //     id,
    //     name: getIngredientName(id, locale),
    //     isAdditive: isAdditive(id),
    //     ...(isAdditive(id) && { eNumber: getENumber(id) })
    //   })),
    //   totalDetected: detectedIngredients.length,
    //   additiveCount: detectedIngredients.filter(({ id }) => isAdditive(id)).length
    // });

    // First try the passed ingredientsList from our detection
    if (productInfo.ingredientsList?.length > 0) {
      // console.log('Using provided ingredientsList:', productInfo.ingredientsList);
      return productInfo.ingredientsList;
    }

    // Try localized ingredients text
    const localizedIngredientsKey = `ingredients_text_${locale}`;
    if (productInfo[localizedIngredientsKey]) {
      const ingredients = parseIngredients(productInfo[localizedIngredientsKey]);
      // console.log('Using localized ingredients text:', ingredients);
      return ingredients;
    }

    // Try English ingredients text
    if (productInfo.ingredients_text_en) {
      const ingredients = parseIngredients(productInfo.ingredients_text_en);
      //console.log('Using English ingredients text:', ingredients);
      return ingredients;
    }

    // Try default ingredients text
    if (productInfo.ingredients_text) {
      const ingredients = parseIngredients(productInfo.ingredients_text);
      // console.log('Using default ingredients text:', ingredients);
      return ingredients;
    }

    // Try ingredients hierarchy
    if (productInfo.ingredients_hierarchy?.length) {
      const ingredients = productInfo.ingredients_hierarchy.map(i => 
        i.replace(/^en:/, '').replace(/-/g, ' ').trim()
      );
      // console.log('Using ingredients_hierarchy:', ingredients);
      return ingredients;
    }

    // Try ingredients tags
    if (productInfo.ingredients_tags?.length) {
      const ingredients = productInfo.ingredients_tags.map(i => 
        i.replace(/^en:/, '').replace(/-/g, ' ').trim()
      );
      // console.log('Using ingredients_tags:', ingredients);
      return ingredients;
    }

    // Try keywords as last resort
    if (productInfo._keywords?.length) {
      const ingredients = productInfo._keywords.filter(k => 
        !['food', 'product', 'med', 'and', 'contains'].includes(k.toLowerCase())
      );
      // console.log('Using _keywords:', ingredients);
      return ingredients;
    }

    // console.log('No ingredients found from any source');
    return [];
  };

  const [isExpanded, setIsExpanded] = useState(false);
  const MAX_VISIBLE_INGREDIENTS = 150; // characters

  const renderIngredients = () => {
    const sections: JSX.Element[] = [];

    // Show detected ingredients if any
    if (detectedIngredients.length > 0) {
      sections.push(
        <View key="detected" style={styles.section}>
          <Text style={styles.sectionTitle}>
            {i18n.t('product.detectedIngredients')}
          </Text>
          <View style={styles.chipContainer}>
            {detectedIngredients.map(({ id: ingredientId }, index) => (
              <Chip
                key={index}
                style={styles.chip}
                textStyle={styles.chipText}
                onPress={() => 
                  navigation.navigate('IngredientsProfile', {
                    ingredientId: ingredientId
                  })
                }
              >
                {getIngredientName(ingredientId, locale) || i18n.t('ingredient.unknown')}
              </Chip>
            ))}
          </View>
        </View>
      );
    }

    // Show raw ingredients list if available
    const ingredients = getLocalizedIngredients();
    if (ingredients.length > 0) {
      const ingredientsText = ingredients.join(', ');
      const shouldTruncate = ingredientsText.length > MAX_VISIBLE_INGREDIENTS;
      const displayText = shouldTruncate && !isExpanded
        ? `${ingredientsText.slice(0, MAX_VISIBLE_INGREDIENTS)}...`
        : ingredientsText;

      sections.push(
        <View key="raw" style={styles.section}>
          <Text style={styles.sectionTitle}>
            {i18n.t('product.ingredients')}
          </Text>
          <View style={styles.ingredientsContainer}>
            <Text style={styles.ingredientsText}>
              {displayText}
            </Text>
            {shouldTruncate && (
              <TouchableOpacity
                onPress={() => setIsExpanded(!isExpanded)}
                style={styles.showMoreButton}
                accessibilityRole="button"
                accessibilityLabel={isExpanded ? i18n.t('common.showLess') : i18n.t('common.showMore')}
              >
                <Text style={styles.showMoreText}>
                  {isExpanded ? i18n.t('common.showLess') : i18n.t('common.showMore')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }

    // If no ingredients at all
    if (sections.length === 0) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {i18n.t('product.ingredients')}
          </Text>
          <Text style={styles.emptyText}>
            {i18n.t('product.unavailable')}
          </Text>
        </View>
      );
    }

    return <>{sections}</>;
  };

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => {
        const isDownwardGesture = gesture.dy > 0;
        const isFromTopArea = gesture.moveY < 100;
        return isDownwardGesture && isFromTopArea;
      },
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          pan.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > DRAG_THRESHOLD || gesture.vy > 0.5) {
          closeModal();
        } else {
          Animated.spring(pan, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 8,
          }).start();
        }
      },
    })
  ).current;

  const closeModal = () => {
    Animated.timing(pan, {
      toValue: 800,
      duration: ANIMATION_DURATION,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      navigation.goBack();
    });
  };

  const animatedStyle = {
    transform: [{
      translateY: pan.interpolate({
        inputRange: [0, 800],
        outputRange: [0, 800],
        extrapolate: 'clamp',
      }),
    }],
  };

  const renderSafetyIndicator = () => {
    const isSafe = detectedIngredients.length === 0;
    const message = isSafe ? i18n.t('product.safeToConsume') : i18n.t('product.caution');
    
    return (
      <View 
        style={[styles.safetyContainer, isSafe ? styles.safeContainer : styles.unsafeContainer]}
        accessibilityRole="alert"
        accessibilityLabel={message}
        accessible={true}
      >
        <IconButton
          icon={isSafe ? 'check-circle' : 'alert-circle'}
          size={32}
          iconColor={isSafe ? colors.success : colors.warning}
        />
        <View style={styles.safetyTextContainer}>
          <Text style={[
            styles.safetyTitle,
            { color: isSafe ? colors.success : colors.warning }
          ]}>
            {message}
          </Text>
          <Text style={styles.safetyDescription}>
            {isSafe ? i18n.t('product.safe') : i18n.t('product.unsafe')}
          </Text>
        </View>
      </View>
    );
  };

  // Announce product safety status when screen loads
  useEffect(() => {
    const message = detectedIngredients.length === 0 
      ? i18n.t('product.safeToConsume') 
      : i18n.t('product.caution');
    announce(message);
  }, []);

  const hasNutrientValues = () => {
    const nutriments = productInfo?.nutriments;
    if (!nutriments) {
      // console.log('No nutriments object found');
      return false;
    }
    
    // Check if any of the key nutrients have valid values
    const nutrients = ['energy-kcal', 'proteins', 'carbohydrates', 'fat'];
    const hasValues = nutrients.some(nutrient => {
      const value = nutriments[nutrient] || 
                   nutriments[`${nutrient}_100g`] ||
                   (nutrient === 'energy-kcal' && nutriments['energy']);
      const hasValidValue = value != null && 
                           value !== '' && 
                           !isNaN(Number(value)) && 
                           Number(value) > 0;
      return hasValidValue;
    });
    
    return hasValues;
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={closeModal}
    >
      <Animated.View style={[styles.modalContainer, animatedStyle]} {...panResponder.panHandlers}>
        <SafeAreaView style={[styles.safeArea, platformShadow]}>
          <View style={[
            styles.headerContainer,
            detectedIngredients.length === 0 ? { backgroundColor: `${colors.success}15` } : { backgroundColor: `${colors.warning}15` }
          ]}>
            <View style={styles.dragIndicator} />
            <View style={styles.headerContent}>
              <TouchableOpacity
                accessibilityLabel={i18n.t('product.close')}
                accessibilityRole="button"
                onPress={closeModal}
                style={styles.closeButton}
              >
                <IconButton
                  icon="chevron-down"
                  size={32}
                  iconColor={detectedIngredients.length === 0 ? colors.success : colors.warning}
                />
              </TouchableOpacity>
              <Text 
                style={[
                  styles.headerTitle,
                  { color: detectedIngredients.length === 0 ? colors.success : colors.warning }
                ]} 
                numberOfLines={1}
              >
                {getLocalizedProductName()}
              </Text>
            </View>
          </View>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={true}
            bounces={true}
            overScrollMode="always"
            alwaysBounceVertical={true}
          >
            <Text style={styles.brandText}>
              {productInfo.brands || productInfo.brand || i18n.t('product.unknownBrand')}
            </Text>

            {renderSafetyIndicator()}

            {renderIngredients()}

            {hasNutrientValues() && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    {i18n.t('product.nutriments.title')}
                  </Text>
                  <View style={styles.nutrientsContainer}>
                    {['energy-kcal', 'proteins', 'carbohydrates', 'fat'].map((nutrient) => {
                      const nutriments = productInfo?.nutriments;
                      if (!nutriments) return null;

                      const value = nutriments[nutrient] || 
                                   nutriments[`${nutrient}_100g`] ||
                                   (nutrient === 'energy-kcal' && nutriments['energy']);
                      
                      const unit = nutrient === 'energy-kcal' ? 
                        (nutriments[`${nutrient}_unit`] || 'kcal') : 
                        'g';
                      
                      if (!value || isNaN(Number(value)) || Number(value) <= 0) {
                        return null;
                      }
                      
                      return (
                        <Text key={nutrient} style={styles.nutrientText}>
                          {i18n.t(`product.nutriments.${nutrient}`, {
                            value: Number(value).toFixed(1),
                            unit: nutrient === 'energy-kcal' ? unit : ''
                          })}
                        </Text>
                      );
                    })}
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 0 : spacing.md,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    marginTop: 'auto',
  },
  headerContainer: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    backgroundColor: `${colors.success}15`,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.xl,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: colors.coolGray,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.xs,
  },
  closeButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  headerTitle: {
    ...typography.h6,
    flex: 1,
    textAlign: 'center',
    marginLeft: spacing.md,
    color: colors.success,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
    flexGrow: 1,
  },
  brandText: {
    ...typography.subtitle1,
    color: colors.secondary,
    marginBottom: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h6,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
  },
  chip: {
    margin: 4,
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderWidth: 1,
  },
  chipText: {
    color: colors.text,
  },
  emptyText: {
    ...typography.body2,
    color: checkContrast(colors.coolGray, colors.background).isValid 
      ? colors.coolGray 
      : colors.text,
    fontSize: getAccessibleFontSize(14),
  },
  ingredientsContainer: {
    width: '100%',
  },
  ingredientsText: {
    ...typography.body1,
    lineHeight: 24,
    flexWrap: 'wrap',
    width: '100%',
  },
  showMoreButton: {
    marginTop: spacing.xs,
    padding: spacing.xs,
    alignSelf: 'flex-start',
  },
  showMoreText: {
    ...typography.button,
    color: colors.primary,
  },
  safetyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: spacing.md,
    marginVertical: spacing.md,
  },
  safeContainer: {
    backgroundColor: `${colors.success}15`,
  },
  unsafeContainer: {
    backgroundColor: `${colors.warning}15`,
  },
  safetyTextContainer: {
    marginLeft: spacing.md,
    flex: 1,
  },
  safetyTitle: {
    ...typography.h6,
    marginBottom: spacing.xs,
  },
  safeTitle: {
    color: colors.success,
  },
  unsafeTitle: {
    color: colors.warning,
  },
  safetyDescription: {
    ...typography.body2,
    color: colors.text,
  },
  divider: {
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },
  nutrientsContainer: {
    marginTop: spacing.xs,
  },
  nutrientText: {
    ...typography.body1,
    marginBottom: spacing.xs,
  },
});

export default ProductInfoScreen;

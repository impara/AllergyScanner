// src/screens/main/ProductInfoScreen.tsx

import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { RouteProp, useRoute } from '@react-navigation/core';
import { RootStackParamList } from '../../types/navigation';
import { getIngredientName } from '../../utils/ingredientUtils';
import i18n from '../../localization/i18n';
import { useLanguage } from '../../context/LanguageContext';
import { colors } from '../../theme/colors';
import { spacing, typography } from '../../theme';
import { shadows } from '../../theme/shadows';

type ProductInfoScreenRouteProp = RouteProp<RootStackParamList, 'ProductInfo'>;

interface DetectedIngredient {
  id: string;
  lang?: string;
}

const DRAG_THRESHOLD = 100;
const ANIMATION_DURATION = 300;

const ProductInfoScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<ProductInfoScreenRouteProp>();
  const {
    productInfo: product,
    detectedIngredients = [],
    ingredientsList = [],
  } = route.params;
  const { locale } = useLanguage();

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
      product[langSpecificNameKey] ||
      product.product_name ||
      product.name ||
      i18n.t('product.unavailable')
    );
  };

  const getLocalizedIngredients = () => {
    const langSpecificKey = `ingredients_text_${locale}`;
    if (product[langSpecificKey]) {
      return product[langSpecificKey].split(',').map((i) => i.trim());
    }
    if (product.ingredients_text_en) {
      return product.ingredients_text_en.split(',').map((i) => i.trim());
    }
    if (product.ingredients_text) {
      return product.ingredients_text.split(',').map((i) => i.trim());
    }
    return ingredientsList || [];
  };

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 5,
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
    return (
      <View style={[
        styles.safetyContainer,
        isSafe ? styles.safeContainer : styles.unsafeContainer,
      ]}>
        <IconButton
          icon={isSafe ? 'check-circle' : 'alert-circle'}
          size={32}
          color={isSafe ? colors.success : colors.warning}
        />
        <View style={styles.safetyTextContainer}>
          <Text style={[
            styles.safetyTitle,
            isSafe ? styles.safeTitle : styles.unsafeTitle,
          ]}>
            {isSafe ? i18n.t('product.safeToConsume') : i18n.t('product.caution')}
          </Text>
          <Text style={styles.safetyDescription}>
            {isSafe ? i18n.t('product.safe') : i18n.t('product.unsafe')}
          </Text>
        </View>
      </View>
    );
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
          <View style={styles.headerContainer}>
            <View style={styles.dragIndicator} />
            <TouchableOpacity
              accessibilityLabel={i18n.t('product.close')}
              accessibilityRole="button"
              onPress={closeModal}
              style={styles.closeButton}
            >
              <IconButton
                icon="chevron-down"
                size={32}
                color={colors.text}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {getLocalizedProductName()}
            </Text>
          </View>

          <ScrollView style={styles.scrollView} bounces={false}>
            <View style={styles.contentContainer}>
              <Text style={styles.brandText}>
                {product.brands || product.brand || i18n.t('product.unknownBrand')}
              </Text>

              {renderSafetyIndicator()}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {i18n.t('product.detectedIngredients')}
                </Text>
                {detectedIngredients.length > 0 ? (
                  <View style={styles.chipContainer}>
                    {detectedIngredients.map(({ id: ingredientId }, index) => (
                      <Chip
                        key={index}
                        style={styles.chip}
                        textStyle={styles.chipText}
                        onPress={() => navigation.navigate('IngredientProfile', { ingredientId })}
                      >
                        {getIngredientName(ingredientId, locale) || i18n.t('ingredient.unknown')}
                      </Chip>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.emptyText}>
                    {i18n.t('product.unavailable')}
                  </Text>
                )}
              </View>

              <Divider style={styles.divider} />

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {i18n.t('product.ingredients')}
                </Text>
                <Text style={styles.ingredientsText}>
                  {getLocalizedIngredients().join(', ')}
                </Text>
              </View>

              {product.nutriments && (
                <>
                  <Divider style={styles.divider} />
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                      {i18n.t('product.nutriments.title')}
                    </Text>
                    <View style={styles.nutrientsContainer}>
                      {['energy-kcal', 'proteins', 'carbohydrates', 'fat'].map((nutrient) => (
                        <Text key={nutrient} style={styles.nutrientText}>
                          {i18n.t(`product.nutriments.${nutrient}`, {
                            value: product.nutriments[nutrient] || i18n.t('product.nutriments.na'),
                            unit: nutrient === 'energy-kcal' ? product.nutriments[`${nutrient}_unit`] : 'g'
                          })}
                        </Text>
                      ))}
                    </View>
                  </View>
                </>
              )}
            </View>
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
    backgroundColor: colors.surface,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
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
    position: 'absolute',
    left: spacing.xs,
    bottom: spacing.xs,
  },
  headerTitle: {
    ...typography.h6,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
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
    color: colors.coolGray,
    fontStyle: 'italic',
  },
  ingredientsText: {
    ...typography.body1,
    lineHeight: 24,
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

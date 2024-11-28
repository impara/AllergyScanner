// src/screens/main/IngredientProfileScreen.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Animated,
  Modal,
  TouchableWithoutFeedback,
  Platform,
  Keyboard,
  TextInput,
  RefreshControl,
} from 'react-native';
import { List, Text, Switch, Title, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import { theme as defaultTheme } from '../../theme';
import { CustomTheme } from '../../types/theme';

// Local imports
import { getUserIngredients, updateUserIngredients, IngredientsProfile } from '../../config/firebase';
import { Input, Toast } from '../../components';
import { findIngredientIdsWithLang } from '../../utils/ingredientDetection';
import { findIngredientsByName } from '../../utils/ingredientUtils';
import { getIngredientName, isAdditive, getENumber, getIngredientCategories } from '../../utils/ingredientUtils';
import i18n from '../../localization/i18n';
import { useLanguage } from '../../context/LanguageContext';
import { colors, spacing, typography, shadows } from '../../theme';
import { DetectedIngredient, IngredientData } from '../../types/navigation';
import { checkContrast, getAccessibleFontSize, getAccessibleColor } from '../../utils/accessibility';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const useCategoryDefinitions = () => {
  return {
    allergens: { 
      icon: 'alert-circle' as IconName,
      description: i18n.t('categories.allergens'),
      color: colors.warning
    },
    vegan: { 
      icon: 'leaf' as IconName,
      description: i18n.t('categories.vegan'),
      color: colors.success
    },
    eNumbers: { 
      icon: 'alpha-e-box' as IconName,
      description: i18n.t('categories.eNumbers'),
    },
    pregnancy: { 
      icon: 'baby-face' as IconName,
      description: i18n.t('categories.pregnancy'),
    },
    environment: { 
      icon: 'earth' as IconName,
      description: i18n.t('categories.environment'),
    },
    glutenFree: { 
      icon: 'heart-off' as IconName,
      description: i18n.t('categories.glutenFree'),
    },
    ketoFriendly: { 
      icon: 'food-variant' as IconName,
      description: i18n.t('categories.ketoFriendly'),
    },
    lowSodium: { 
      icon: 'water-off' as IconName,
      description: i18n.t('categories.lowSodium'),
    },
    organic: { 
      icon: 'leaf' as IconName,
      description: i18n.t('categories.organic'),
    },
    dairyFree: { 
      icon: 'cow-off' as IconName,
      description: i18n.t('categories.dairyFree'),
    },
    sugarFree: { 
      icon: 'square-off' as IconName,
      description: i18n.t('categories.sugarFree'),
    },
    halalKosher: { 
      icon: 'food-halal' as IconName,
      description: i18n.t('categories.halalKosher'),
    },
    other: { 
      icon: 'dots-horizontal' as IconName,
      description: i18n.t('categories.other'),
    },
  };
};

interface IngredientProfileScreenProps {
  theme?: CustomTheme;
  navigation: NavigationProp<RootStackParamList>;
}

const SearchBackdrop: React.FC<{ onPress: () => void }> = ({ onPress }) => (
  <TouchableWithoutFeedback onPress={onPress}>
    <View/>
  </TouchableWithoutFeedback>
);

const IngredientProfileScreen: React.FC<IngredientProfileScreenProps> = ({ 
  theme = defaultTheme,
  navigation 
}) => {
  const { forceRender } = useLanguage();
  const categoryDefinitions = useCategoryDefinitions(); // Use the hook here
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, IngredientData>>({});
  const [ingredientList, setIngredientList] = useState<string[]>([]);
  const [isSnackbarVisible, setIsSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const undoActionRef = useRef<(() => void) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newIngredient, setNewIngredient] = useState('');
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [isGroupModalVisible, setIsGroupModalVisible] = useState(false);
  const [tempIngredient, setTempIngredient] = useState<DetectedIngredient>({ 
    id: '', 
    name: '' 
  });
  // Add a new state to track group toggle status
  const [groupToggleStatus, setGroupToggleStatus] = useState<Record<string, boolean>>({});
  const [searchResults, setSearchResults] = useState<DetectedIngredient[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Reload data when language changes
  useEffect(() => {
    loadIngredientProfile();
  }, [i18n.locale, forceRender]);

  // Function to get translated categories
  const getTranslatedCategories = (): Record<string, { icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'], description?: string }> => ({
    allergens: { 
      icon: 'alert-circle',
      description: i18n.t('categories.allergens')
    },
    vegan: { 
      icon: 'leaf',
      description: i18n.t('categories.vegan'),
    },
    eNumbers: { 
      icon: 'alpha-e-box',
      description: i18n.t('categories.eNumbers'),
    },
    pregnancy: { 
      icon: 'baby-face',
      description: i18n.t('categories.pregnancy'),
    },
    environment: { 
      icon: 'earth',
      description: i18n.t('categories.environment'),
    },
    glutenFree: { 
      icon: 'heart-off',
      description: i18n.t('categories.glutenFree'),
    },
    ketoFriendly: { 
      icon: 'food-variant',
      description: i18n.t('categories.ketoFriendly'),
    },
    lowSodium: { 
      icon: 'water-off',
      description: i18n.t('categories.lowSodium'),
    },
    organic: { 
      icon: 'leaf',
      description: i18n.t('categories.organic'),
    },
    dairyFree: { 
      icon: 'cow-off',
      description: i18n.t('categories.dairyFree'),
    },
    sugarFree: { 
      icon: 'square-off',
      description: i18n.t('categories.sugarFree'),
    },
    halalKosher: { 
      icon: 'food-halal',
      description: i18n.t('categories.halalKosher'),
    },
    other: { 
      icon: 'dots-horizontal',
      description: i18n.t('categories.other'),
    },
  });

  // Update loadIngredientProfile to use getTranslatedCategories
  const loadIngredientProfile = async () => {
    try {
      const userIngredients: IngredientsProfile = await getUserIngredients();
      
      // Clean the loaded ingredients
      const cleanedIngredients = Object.fromEntries(
        Object.entries(userIngredients)
          .map(([key, value]) => [
            key,
            {
              selected: Boolean(value?.selected),
              name: value?.name || '',
              lang: value?.lang || undefined,
              ...(value?.category && value.category !== 'other' && 
                  Object.keys(categoryDefinitions).includes(value.category) 
                  ? { category: value.category } 
                  : {})
            }
          ])
      );

      setCheckedIngredients(cleanedIngredients);
      setIngredientList(Object.keys(cleanedIngredients));

      // Update group toggle status
      const newGroupToggleStatus: Record<string, boolean> = {};
      Object.keys(categoryDefinitions).forEach((groupName) => {
        const groupIngredients = groupName === 'other'
          ? Object.keys(cleanedIngredients).filter(id => 
              !cleanedIngredients[id].category || 
              !Object.keys(categoryDefinitions).includes(cleanedIngredients[id].category!)
            )
          : Object.keys(cleanedIngredients).filter(id => 
              cleanedIngredients[id].category === groupName
            );

        const areAllSelected = groupIngredients.length > 0 && 
          groupIngredients.every(id => cleanedIngredients[id].selected);
        newGroupToggleStatus[groupName] = areAllSelected;
      });
      
      setGroupToggleStatus(newGroupToggleStatus);
    } catch (error) {
      console.error('Error loading ingredient profile:', error);
    } finally {
      setIsLoading(false);
    }
  };  

  const toggleIngredient = async (ingredientId: string) => {
    const updatedIngredients = {
      ...checkedIngredients,
      [ingredientId]: {
        ...checkedIngredients[ingredientId],
        selected: !checkedIngredients[ingredientId]?.selected,
      },
    };
    setCheckedIngredients(updatedIngredients);
    await saveIngredientProfile(updatedIngredients);

    const ingredientName = getIngredientName(ingredientId);
    showToast(`${ingredientName} ${updatedIngredients[ingredientId].selected ? 'enabled' : 'disabled'}`);
  };

  const saveIngredientProfile = async (ingredients: IngredientsProfile) => {
    try {
      // Deep clean the ingredients object
      const cleanedIngredients = Object.fromEntries(
        Object.entries(ingredients)
          .filter(([_, value]) => value !== undefined && value !== null)
          .map(([key, value]) => [
            key,
            {
              selected: Boolean(value.selected),
              name: value.name || '',
              lang: value.lang || undefined,
              // Only include category if it exists, isn't 'other', and is a valid category
              ...(value.category && value.category !== 'other' && 
                  Object.keys(categoryDefinitions).includes(value.category) 
                  ? { category: value.category } 
                  : {})
            }
          ])
      );

      console.log('Saving cleanedIngredients:', cleanedIngredients);
      await updateUserIngredients(cleanedIngredients);
      console.log('Ingredient profile saved successfully.');
      showToast('Ingredient profile saved successfully.');
    } catch (error) {
      console.error('Error saving ingredient profile:', error);
      let errorMessage = 'Failed to save ingredient profile.';
      
      if (error instanceof Error) {
        errorMessage += ` ${error.message}`;
      } else if (typeof error === 'object') {
        errorMessage += ` ${JSON.stringify(error)}`;
      }
  
      Alert.alert('Error', errorMessage);
      showToast(`Error: ${errorMessage}`);
    }
  };  

  const addCustomIngredient = () => {
    const trimmedIngredient = newIngredient.trim();
    if (trimmedIngredient === '') {
      Alert.alert(
        i18n.t('ingredients.invalidInput'),
        i18n.t('ingredients.enterIngredient')
      );
      return;
    }

    const matchedIngredients = findIngredientIdsWithLang(trimmedIngredient);

    if (matchedIngredients.length > 0) {
      const { id: ingredientId, lang } = matchedIngredients[0];
      // Remove duplicate check here since it's now handled in handleSearchResultSelect
      setTempIngredient({ 
        id: ingredientId, 
        name: getIngredientName(ingredientId, lang),
        lang: lang
      });
      setIsGroupModalVisible(true);
      setNewIngredient('');
    } else {
      Alert.alert(
        i18n.t('ingredients.notFound'),
        i18n.t('ingredients.notFoundDesc')
      );
    }
  };

  const deleteIngredient = (ingredientId: string) => {
    // Get the ingredient name with its language
    const ingredientName = getIngredientName(ingredientId, checkedIngredients[ingredientId]?.lang);
    
    Alert.alert(
      i18n.t('ingredients.deleteConfirm'),
      i18n.t('ingredients.deleteConfirmDesc', { name: ingredientName }),
      [
        {
          text: i18n.t('ingredients.cancel'),
          style: 'cancel',
        },
        {
          text: i18n.t('ingredients.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Deleting ingredient:', ingredientId);

              // Remove from ingredientList
              const updatedIngredientList = ingredientList.filter((id) => id !== ingredientId);
              setIngredientList(updatedIngredientList);

              // Remove from checkedIngredients
              const updatedIngredients = { ...checkedIngredients };
              const previousIngredientData = updatedIngredients[ingredientId];
              delete updatedIngredients[ingredientId];
              setCheckedIngredients(updatedIngredients);

              console.log('Updated ingredients:', updatedIngredients);

              // Save the updated profile
              await saveIngredientProfile(updatedIngredients);

              undoActionRef.current = () => {
                console.log('Undoing delete for ingredient:', ingredientId);
                setIngredientList([ingredientId, ...updatedIngredientList]);
                setCheckedIngredients({
                  ...updatedIngredients,
                  [ingredientId]: previousIngredientData,
                });
                saveIngredientProfile({
                  ...updatedIngredients,
                  [ingredientId]: previousIngredientData,
                });
              };

              const deletedText = i18n.t('ingredients.deleted');
              const message = `${ingredientName} ${deletedText}`;
              showToast(message);
            } catch (error) {
              console.error('Error deleting ingredient:', error);
              Alert.alert('Error', 'Failed to delete ingredient. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
    ingredientId: string
  ) => {
    return (
      <View style={styles.rightAction}>
        <Text style={styles.actionText}>Delete</Text>
      </View>
    );
  };

  const showToast = (message: string) => {
    setSnackbarMessage(message);
    setIsSnackbarVisible(true);

    // Clear any existing timeout
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    // Set a new timeout to hide the toast after 3 seconds
    toastTimeoutRef.current = setTimeout(() => {
      setIsSnackbarVisible(false);
    }, 3000);
  };

  const onDismissToast = () => {
    setIsSnackbarVisible(false);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
  };

  const handleUndo = () => {
    if (undoActionRef.current) {
      undoActionRef.current();
      undoActionRef.current = null;
    }
    onDismissToast();
  };
  
  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const toggleGroupIngredients = async (groupName: string) => {
    const groupIngredients = ingredientList.filter(id => {
      const categories = getIngredientCategories(id, checkedIngredients);
      return categories.includes(groupName);
    });

    const isGroupEnabled = !groupToggleStatus[groupName];

    const updatedIngredients = { ...checkedIngredients };
    groupIngredients.forEach(ingredientId => {
      if (updatedIngredients[ingredientId]) {
        updatedIngredients[ingredientId] = {
          ...updatedIngredients[ingredientId],
          selected: isGroupEnabled,
        };
      }
    });

    setCheckedIngredients(updatedIngredients);
    setGroupToggleStatus(prev => ({ ...prev, [groupName]: isGroupEnabled }));
    await saveIngredientProfile(updatedIngredients);

    // Revert back to the working version
    const translatedGroupName = i18n.t(`categories.${groupName}`);
    const status = isGroupEnabled ? i18n.t('ingredients.enabled') : i18n.t('ingredients.disabled');
    showToast(`${translatedGroupName} ${status}`);
  };

  // Platform-specific styles
  const platformStyles = {
    shadow: Platform.select({
      ios: shadows.medium,
      android: {
        elevation: 4
      }
    }),
    ripple: Platform.select({
      ios: {},
      android: {
        android_ripple: {
          color: colors.ripple || 'rgba(0, 0, 0, 0.1)'
        }
      }
    })
  } as const;

  // Render ingredient item with platform-specific feedback
  const renderIngredientItem = (ingredientId: string) => {
    const isAdditiveItem = isAdditive(ingredientId);
    const eNumber = isAdditiveItem ? getENumber(ingredientId) : null;

    return (
      <Swipeable
        key={ingredientId}
        renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, ingredientId)}
        onSwipeableRightOpen={() => deleteIngredient(ingredientId)}
      >
        <TouchableOpacity
          style={[styles.ingredientItem, platformStyles.shadow]}
          {...platformStyles.ripple}
        >
          <List.Item
            title={() => (
              <View style={styles.ingredientTitleContainer}>
                <Text 
                  style={[
                    styles.ingredientText,
                    isAdditiveItem && styles.additiveText
                  ]}
                  numberOfLines={1}
                >
                  {getIngredientName(ingredientId, checkedIngredients[ingredientId]?.lang)}
                </Text>
                {isAdditiveItem && (
                  <View style={styles.additiveIndicatorContainer}>
                    <Text style={styles.additiveIndicator}>
                      {eNumber ? `E${eNumber}` : 'Additive'}
                    </Text>
                  </View>
                )}
              </View>
            )}
            right={() => (
              <Switch
                value={checkedIngredients[ingredientId]?.selected || false}
                onValueChange={() => toggleIngredient(ingredientId)}
                color={colors.primary}
              />
            )}
          />
        </TouchableOpacity>
      </Swipeable>
    );
  };

  const renderGroup = (groupName: string, groupData: { icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'], description?: string }) => {
    const isExpanded = expandedGroups[groupName] || false;
    const isGroupEnabled = groupToggleStatus[groupName] || false;

    // Get ingredients for this group using getIngredientCategories
    const groupIngredients = ingredientList.filter(id => {
      const categories = getIngredientCategories(id, checkedIngredients);
      return categories.includes(groupName);
    });

    // Don't render empty groups
    if (groupIngredients.length === 0) {
      return null;
    }

    return (
      <View key={groupName} style={styles.groupContainer}>
        <TouchableOpacity 
          style={styles.groupHeader} 
          onPress={() => toggleGroup(groupName)}
        >
          <View style={styles.groupTitleContainer}>
            <MaterialCommunityIcons name={groupData.icon} size={24} color={colors.primary} />
            <Text style={styles.groupTitle}>
              {groupData.description || groupName}
            </Text>
          </View>
          <View style={styles.groupHeaderRight}>
            <Switch
              value={isGroupEnabled}
              onValueChange={() => toggleGroupIngredients(groupName)}
              color={colors.primary}
            />
            <MaterialCommunityIcons 
              name={isExpanded ? 'chevron-up' : 'chevron-down'} 
              size={24} 
              color={colors.primary} 
            />
          </View>
        </TouchableOpacity>
        {isExpanded && (
          <View style={styles.groupContent}>
            {groupIngredients.map(ingredientId => renderIngredientItem(ingredientId))}
          </View>
        )}
      </View>
    );
  };

  const handleGroupSelection = (groupName: string) => {
    const { id: ingredientId, name, lang } = tempIngredient;
    
    // Create ingredient data with null instead of undefined for Firebase
    const ingredientData: IngredientData = {
      selected: true,
      name: name || '',
      lang: lang || undefined,
      ...(groupName !== 'other' ? { category: groupName } : {})
    };
    
    // Create new ingredients object with the new ingredient
    const updatedIngredients = {
      ...checkedIngredients,
      [ingredientId]: ingredientData,
    };
    
    setIngredientList([ingredientId, ...ingredientList]);
    setCheckedIngredients(updatedIngredients);

    // Save the profile with the cleaned data
    saveIngredientProfile(updatedIngredients);

    setIsGroupModalVisible(false);
    showToast(i18n.t('ingredients.ingredientAdded', { 
      name: name || ingredientId,
      group: groupName 
    }));
  };

  const GroupSelectionModal = () => (
    <Modal
      visible={isGroupModalVisible}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {i18n.t('ingredients.selectGroup')} {tempIngredient.name}
          </Text>
          {Object.entries(categoryDefinitions).map(([groupName, groupData]) => (
            <TouchableOpacity
              key={groupName}
              style={styles.groupButton}
              onPress={() => handleGroupSelection(groupName)}
            >
              <MaterialCommunityIcons name={groupData.icon} size={24} color={colors.primary} />
              <Text style={styles.groupButtonText}>
                {groupData.description}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setIsGroupModalVisible(false)}
          >
            <Text style={styles.cancelButtonText}>{i18n.t('ingredients.cancel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const handleIngredientSearch = (text: string) => {
    setNewIngredient(text);
    
    if (text.trim().length >= 3) {
      // Search for ingredients matching the input text
      const results = findIngredientsByName(text.trim(), i18n.locale);
      
      // Sort results to prioritize matches in user's language
      const sortedResults = results.sort((a, b) => {
        // First priority: exact matches in user's language
        if (a.lang === i18n.locale && b.lang !== i18n.locale) return -1;
        if (a.lang !== i18n.locale && b.lang === i18n.locale) return 1;
        
        // Second priority: exact matches in English
        if (a.lang === 'en' && b.lang !== 'en') return -1;
        if (a.lang !== 'en' && b.lang === 'en') return 1;
        
        return 0;
      });
      
      setSearchResults(sortedResults.slice(0, 15)); // Limit to top 15 results
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const handleSearchResultSelect = (result: DetectedIngredient) => {
    if (!result.name) {
      return;
    }
    // Check if ingredient already exists
    if (ingredientList.includes(result.id)) {
      Alert.alert(
        i18n.t('ingredients.alreadyExists'),
        i18n.t('ingredients.alreadyExistsDesc')
      );
      return;
    }

    setTempIngredient(result);
    setNewIngredient('');
    setSearchResults([]);
    setShowSearchResults(false);
    setIsGroupModalVisible(true);
  };

  const dismissSearchResults = () => {
    Keyboard.dismiss();
    setShowSearchResults(false);
  };

  useEffect(() => {
    // Update group toggle status based on checked ingredients
    const newGroupToggleStatus: Record<string, boolean> = {};
    Object.entries(categoryDefinitions).forEach(([groupName, groupData]) => {
      const groupIngredients = groupName === 'other'
        ? ingredientList.filter(id => 
            !Object.keys(categoryDefinitions).filter((name) => name !== 'other').includes(id)
          )
        : ingredientList.filter(id => getIngredientCategories(id, checkedIngredients).includes(groupName));

      const areAllSelected = groupIngredients.every(
        ingredientId => checkedIngredients[ingredientId]?.selected
      );
      newGroupToggleStatus[groupName] = areAllSelected;
    });
    setGroupToggleStatus(newGroupToggleStatus);
  }, [checkedIngredients, ingredientList]);

  // Add keyboard handling
  useEffect(() => {
    const keyboardDidHideListener = Platform.select({
      ios: Keyboard.addListener('keyboardDidHide', () => {
        setShowSearchResults(false);
      }),
      android: Keyboard.addListener('keyboardDidHide', () => {
        // Add small delay for Android to prevent flickering
        setTimeout(() => setShowSearchResults(false), 100);
      }),
    });

    return () => {
      keyboardDidHideListener?.remove();
    };
  }, []);

  // Add refresh handler
  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await loadIngredientProfile();
    } catch (error) {
      console.error('Error refreshing:', error);
      showToast(i18n.t('common.errorRefreshing'));
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Add scroll to top handler
  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const renderSearchResult = (result: DetectedIngredient) => {
    const isUserLanguage = result.lang === i18n.locale;
    const isEnglish = result.lang === 'en';
    
    return (
      <TouchableOpacity
        key={result.id}
        style={styles.searchResultItem}
        onPress={() => {
          handleSearchResultSelect(result);
          Keyboard.dismiss();
        }}
        accessible={true}
        accessibilityLabel={i18n.t('ingredients.searchResult', {
          name: result.name,
          language: isUserLanguage ? i18n.t(`languages.${i18n.locale}`) : 
                   isEnglish ? i18n.t('languages.en') : 
                   i18n.t(`languages.${result.lang || 'unknown'}`),
        })}
        accessibilityHint={i18n.t('ingredients.tapToSelect')}
      >
        <View style={styles.searchResultContent}>
          <View style={styles.searchResultTextContainer}>
            <Text style={styles.searchResultText} numberOfLines={1}>
              {result.name}
            </Text>
            {!isUserLanguage && (
              <View style={[
                styles.languageIndicator,
                isEnglish ? styles.englishIndicator : styles.otherLanguageIndicator
              ]}>
                <Text style={styles.languageIndicatorText}>
                  {result.lang?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
          </View>
          {isAdditive(result.id) && (
            <View style={styles.additiveContainer}>
              <Text style={styles.additiveIndicator}>
                {getENumber(result.id) ? `E${getENumber(result.id)}` : i18n.t('ingredients.additive')}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Title>Loading...</Title>
      </View>
    );
  }

  return (
    <SafeAreaView 
      style={styles.safeArea} 
      edges={['top']}
      accessibilityRole="none"
      accessibilityLabel={i18n.t('ingredients.screenBackground')}
    >
      <View 
        style={styles.container}
        accessibilityRole="none"
        accessibilityLabel={i18n.t('ingredients.mainContainer')}
      >
        <View style={styles.header}>
          {/* Make header title tappable */}
          <TouchableOpacity 
            onPress={scrollToTop}
            style={styles.headerTitleContainer}
            activeOpacity={0.7}
          >
            <Text style={styles.headerTitle}>
              {i18n.t('ingredients.title')}
            </Text>
            <MaterialCommunityIcons 
              name="chevron-up" 
              size={20} 
              color={colors.text}
              style={styles.headerIcon}
            />
          </TouchableOpacity>
          
          <View style={styles.searchWrapper}>
            <View style={styles.searchContainer}>
              <TextInput
                style={[
                  styles.searchInput,
                  Platform.OS === 'android' && {
                    elevation: 2,
                    borderWidth: 1,
                    borderColor: colors.divider,
                  }
                ]}
                value={newIngredient}
                onChangeText={handleIngredientSearch}
                placeholder={i18n.t('ingredients.searchInput')}
                placeholderTextColor={colors.placeholder}
                accessibilityLabel={i18n.t('ingredients.searchInput')}
                accessibilityHint={i18n.t('ingredients.searchInputHint')}
                accessible={true}
              />
              <TouchableOpacity 
                style={[
                  styles.addButton,
                  Platform.OS === 'android' && {
                    elevation: 8,
                    borderWidth: 1,
                    borderColor: colors.divider,
                  }
                ]}
                onPress={addCustomIngredient}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={i18n.t('ingredients.addButton')}
                accessibilityHint={i18n.t('ingredients.addButtonHint')}
                // Ensure minimum touch target size
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                // Add high contrast for the icon
              >
                <MaterialCommunityIcons 
                  name="plus" 
                  size={24} 
                  color={colors.surface}
                  accessibilityRole="image"
                  accessibilityLabel={i18n.t('ingredients.addButton')}
                />
              </TouchableOpacity>
            </View>

            {/* Search Results Dropdown with improved scrolling */}
            {showSearchResults && searchResults.length > 0 && (
              <>
                <SearchBackdrop onPress={dismissSearchResults} />
                <View style={styles.searchResultsContainer}>
                  <ScrollView
                    style={styles.searchResults}
                    contentContainerStyle={styles.searchResultsContent}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    nestedScrollEnabled={true}
                    bounces={false}
                    showsVerticalScrollIndicator={true}
                  >
                    {searchResults.map((result) => renderSearchResult(result))}
                  </ScrollView>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Update ScrollView with refresh control and ref */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={true}
          bounces={true} // Enable bouncing for pull to refresh
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]} // Android
              tintColor={colors.primary} // iOS
              title={i18n.t('common.pullToRefresh')} // iOS
              titleColor={colors.text} // iOS
            />
          }
        >
          {Object.entries(getTranslatedCategories()).map(([groupName, groupData]) => 
            renderGroup(groupName, groupData)
          )}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        <Toast
          message={snackbarMessage}
          visible={isSnackbarVisible}
          onDismiss={onDismissToast}
          onUndo={undoActionRef.current ? handleUndo : undefined}
        />
      </View>
      <GroupSelectionModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    // Reduce horizontal padding to prevent button overflow
    paddingHorizontal: Platform.OS === 'android' ? spacing.xs / 2 : 0,
  },
  header: {
    backgroundColor: colors.surface,
    paddingTop: Platform.OS === 'android' ? spacing.md : spacing.sm,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: Platform.select({ ios: 0.5, android: 0 }),
    borderBottomColor: colors.divider,
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs, // Reduced margin for icon
  },
  headerIcon: {
    marginLeft: spacing.xs,
    opacity: 0.7,
  },
  searchWrapper: {
    position: 'relative',
    zIndex: 1000,
    paddingHorizontal: spacing.xs,
    ...(Platform.OS === 'android' && {
      elevation: 1000,
    }),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: -spacing.xs,
  },
  searchInput: {
    flex: 1,
    height: 48,
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    ...typography.body,
    color: getAccessibleColor(colors.text, colors.background),
    minWidth: 100,
    fontSize: getAccessibleFontSize(16),
    ...(Platform.OS === 'android' && {
      elevation: 2,
      borderWidth: 1,
      borderColor: colors.divider,
    }),
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  rightAction: {
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'flex-end',
    flex: 1,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  actionText: {
    color: colors.surface,
    fontWeight: '600',
    padding: spacing.md,
  },
  ingredientItem: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginVertical: spacing.xs / 2,
    marginHorizontal: spacing.sm,
  },
  ingredientTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ingredientText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  additiveText: {
    color: colors.coolGray,
  },
  additiveIndicatorContainer: {
    backgroundColor: colors.surface,
    borderRadius: 4,
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  additiveIndicator: {
    ...typography.caption,
    color: colors.primary,
  },
  groupContainer: {
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: shadows.small,
      android: {
        elevation: 2,
      },
    }),
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
    minHeight: 60,
  },
  groupTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  groupTitle: {
    ...typography.subtitle1,
    color: colors.primary,
    fontWeight: 'bold',
    marginLeft: spacing.sm,
    flexShrink: 1,
    flex: 1,
  },
  groupHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 80,
  },
  groupContent: {
    paddingTop: spacing.xs,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    width: '80%',
    ...Platform.select({
      ios: shadows.medium,
      android: {
        elevation: 4,
      },
    }),
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  groupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.xs,
    backgroundColor: colors.background,
  },
  groupButtonText: {
    ...typography.body,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  cancelButton: {
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.error,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...typography.body,
    color: colors.surface,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResultsContainer: {
    position: 'absolute',
    top: '100%',
    left: spacing.xs,
    right: spacing.xs,
    maxHeight: 250,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginTop: 4,
    zIndex: 1000,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
        borderWidth: 1,
        borderColor: colors.divider,
      },
    }),
  },
  searchResults: {
    flex: 1,
  },
  searchResultsContent: {
    flexGrow: 1,
  },
  searchResultItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  searchResultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchResultText: {
    ...typography.body,
    color: checkContrast(colors.text, colors.surface).isValid 
      ? colors.text 
      : colors.highContrastText,
    fontSize: getAccessibleFontSize(16),
  },
  additiveContainer: {
    backgroundColor: colors.lightGray,
    borderRadius: 4,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  resultDivider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl * 2, // Extra padding at bottom for better UX
  },
  bottomSpacing: {
    height: spacing.xl,
  },
  dragIndicator: {
    backgroundColor: checkContrast(colors.coolGray, colors.background).isValid 
      ? colors.coolGray 
      : colors.contrast.medium,
  },
  searchResultTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  languageIndicator: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: spacing.xs,
  },
  englishIndicator: {
    backgroundColor: colors.primary,
  },
  otherLanguageIndicator: {
    backgroundColor: colors.coolGray,
  },
  languageIndicatorText: {
    ...typography.caption,
    color: colors.surface,
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default IngredientProfileScreen;

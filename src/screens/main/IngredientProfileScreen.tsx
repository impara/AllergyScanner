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
} from 'react-native';
import { List, Text, Switch, Title, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/Swipeable';

// Local imports
import { getUserIngredients, updateUserIngredients, IngredientsProfile } from '../../config/firebase';
import Input from '../../components/common/Input';
import Toast from '../../components/Toast';
import { findIngredientIdsWithLang } from '../../utils/ingredientDetection';
import { findIngredientsByName } from '../../utils/ingredientUtils';
import { getIngredientName, isAdditive, getENumber, getIngredientCategories } from '../../utils/ingredientUtils';
import i18n from '../../localization/i18n';
import { useLanguage } from '../../context/LanguageContext';
import { colors, spacing, typography, shadows } from '../../theme';

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

const IngredientProfileScreen: React.FC = () => {
  const { forceRender } = useLanguage();
  const categoryDefinitions = useCategoryDefinitions(); // Use the hook here
  const [checkedIngredients, setCheckedIngredients] = useState<IngredientsProfile>({});
  const [ingredientList, setIngredientList] = useState<string[]>([]);
  const [isSnackbarVisible, setIsSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const undoActionRef = useRef<(() => void) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newIngredient, setNewIngredient] = useState('');
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [isGroupModalVisible, setIsGroupModalVisible] = useState(false);
  const [tempIngredient, setTempIngredient] = useState<{ id: string; name: string; lang?: string }>({ id: '', name: '' });
  // Add a new state to track group toggle status
  const [groupToggleStatus, setGroupToggleStatus] = useState<Record<string, boolean>>({});
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; lang?: string }>>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

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
      setCheckedIngredients(userIngredients);

      const allUserIngredients = Object.keys(userIngredients);
      setIngredientList(allUserIngredients);

      // Update group toggle status using translated categories
      const translatedCategories = getTranslatedCategories();
      const newGroupToggleStatus: Record<string, boolean> = {};
      Object.entries(translatedCategories).forEach(([groupName, groupData]) => {
        const groupIngredients = groupName === 'other'
          ? ingredientList.filter(id => 
              !Object.keys(translatedCategories).filter((name) => name !== 'other').includes(id)
            )
          : ingredientList.filter(id => getIngredientCategories(id, checkedIngredients).includes(groupName));
        const areAllSelected = groupIngredients.every(
          ingredientId => userIngredients[ingredientId]?.selected
        );
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
      const cleanedIngredients = Object.fromEntries(
        Object.entries(ingredients).filter(([_, value]) => value !== undefined)
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
    Alert.alert(
      i18n.t('ingredients.deleteConfirm'),
      i18n.t('ingredients.deleteConfirmDesc', { name: getIngredientName(ingredientId) }),
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

              showToast(`${getIngredientName(ingredientId)} ${i18n.t('ingredients.deleted')}`);
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

    showToast(`${groupName} group ${isGroupEnabled ? 'enabled' : 'disabled'}`);
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
    
    // Include the language in the ingredient data
    const ingredientData = {
      name,
      lang, // Store the language
      selected: true,
      ...(groupName !== 'other' && { category: groupName })
    };
    
    setIngredientList([ingredientId, ...ingredientList]);
    setCheckedIngredients(prev => ({
      ...prev,
      [ingredientId]: ingredientData,
    }));

    saveIngredientProfile({
      ...checkedIngredients,
      [ingredientId]: ingredientData,
    });

    setIsGroupModalVisible(false);
    showToast(`${name} added to ${groupName}`);
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
    
    if (text.trim().length >= 2) {
      // Search for ingredients matching the input text
      const results = findIngredientsByName(text.trim(), i18n.locale);
      setSearchResults(results.slice(0, 15)); // Limit to top 15 results
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const handleSearchResultSelect = (result: { id: string; name: string; lang?: string }) => {
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Title>Loading...</Title>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={[styles.header, platformStyles.shadow]}>
          <Text style={styles.headerTitle}>{i18n.t('ingredients.title')}</Text>
          <View style={styles.searchContainer}>
            <Input
              value={newIngredient}
              onChangeText={handleIngredientSearch}
              placeholder={i18n.t('ingredients.addCustom')}
              placeholderTextColor={colors.placeholder}
              style={styles.searchInput}
              onFocus={() => setShowSearchResults(true)}
            />
            <TouchableOpacity 
              onPress={addCustomIngredient}
              style={[styles.addButton, platformStyles.shadow]}
              {...platformStyles.ripple}
            >
              <MaterialCommunityIcons 
                name="plus" 
                size={24} 
                color={colors.surface} 
              />
            </TouchableOpacity>
          </View>
          
          {/* Search results dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <>
              <View style={styles.overlay} />
              <View style={styles.searchResultsContainer}>
                <ScrollView 
                  style={styles.searchResults}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {searchResults.map((result, index) => (
                    <React.Fragment key={result.id}>
                      <TouchableOpacity
                        style={styles.searchResultItem}
                        onPress={() => handleSearchResultSelect(result)}
                      >
                        <View style={styles.searchResultContent}>
                          <Text style={styles.searchResultText}>
                            {result.name}
                          </Text>
                          {isAdditive(result.id) && (
                            <View style={styles.additiveContainer}>
                              <Text style={styles.additiveIndicator}>
                                {getENumber(result.id) ? `E${getENumber(result.id)}` : 'Additive'}
                              </Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                      {index < searchResults.length - 1 && <Divider style={styles.resultDivider} />}
                    </React.Fragment>
                  ))}
                </ScrollView>
              </View>
            </>
          )}
        </View>

        {/* Main content */}
        <TouchableWithoutFeedback onPress={dismissSearchResults}>
          <ScrollView style={styles.scrollView}>
            {Object.entries(getTranslatedCategories()).map(([groupName, groupData]) => 
              renderGroup(groupName, groupData)
            )}
          </ScrollView>
        </TouchableWithoutFeedback>

        <Toast
          message={snackbarMessage}
          isVisible={isSnackbarVisible}
          onHide={onDismissToast}
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
  },
  header: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    zIndex: 1000,
    elevation: Platform.OS === 'android' ? 1000 : undefined,
    position: 'relative',
  },
  headerTitle: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    zIndex: 1001,
    elevation: Platform.OS === 'android' ? 1001 : undefined,
  },
  searchInput: {
    flex: 1,
    height: 48,
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    ...typography.body,
    color: colors.text,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
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
  overlay: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    bottom: -1000,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
    elevation: Platform.OS === 'android' ? 999 : undefined,
  },
  searchResultsContainer: {
    position: 'absolute',
    top: '100%',
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    maxHeight: 300,
    marginTop: 4,
    zIndex: 1002,
    elevation: Platform.OS === 'android' ? 1002 : undefined,
    ...Platform.select({
      ios: shadows.medium,
      android: {
        elevation: 8,
      },
    }),
  },
  searchResults: {
    borderRadius: 12,
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
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
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
    padding: spacing.md,
    zIndex: 1,
    elevation: Platform.OS === 'android' ? 1 : undefined,
  },
});

export default IngredientProfileScreen;

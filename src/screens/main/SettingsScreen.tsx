// src/screens/main/SettingsScreen.tsx
import React, { useContext, useState } from 'react';
import { View, StyleSheet, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { Text, TouchableRipple, Divider } from 'react-native-paper';
import { AuthContext } from '../../context/AuthContext';
import { colors, spacing, typography } from '../../theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import i18n from '../../localization/i18n';
import { useLanguage } from '../../context/LanguageContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList } from '../../navigation/AppStackNavigator';
import { LanguageSelectionModal } from '../../components';
import { useInterstitialAd } from '../../hooks/useInterstitialAd';

const SettingsScreen: React.FC = () => {
  const { signOutUser } = useContext(AuthContext);
  const [languageDialogVisible, setLanguageDialogVisible] = useState(false);
  const { locale } = useLanguage();
  const navigation = useNavigation<StackNavigationProp<AppStackParamList>>();
  const { showInterstitialAd } = useInterstitialAd();

  const languages = [
    { code: 'en', name: i18n.t('settings.english'), flag: '🇬🇧' },
    { code: 'es', name: i18n.t('settings.spanish'), flag: '🇪🇸' },
    { code: 'fi', name: i18n.t('settings.finnish'), flag: '🇫🇮' },
    { code: 'da', name: i18n.t('settings.danish'), flag: '🇩🇰' },
    { code: 'de', name: i18n.t('settings.german'), flag: '🇩🇪' },
    { code: 'fr', name: i18n.t('settings.french'), flag: '🇫🇷' },
  ];

  const getCurrentLanguageFlag = () => {
    const currentLang = languages.find(lang => lang.code === locale);
    return currentLang?.flag || '🌐';
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handlePolicyNavigation = async (screen: 'PrivacyPolicy' | 'TermsOfService') => {
    await showInterstitialAd();
    navigation.navigate(screen);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {i18n.t('settings.title')}
        </Text>
      </View>
      
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {i18n.t('settings.appearance')}
          </Text>
          
          <TouchableOpacity
            style={styles.settingsItem}
            onPress={() => setLanguageDialogVisible(true)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={i18n.t('settings.language')}
            accessibilityHint={i18n.t('settings.languageOptionHint', { 
              language: languages.find(lang => lang.code === locale)?.name 
            })}
          >
            <View style={styles.settingsItemContent}>
              <Text style={styles.itemTitle}>{i18n.t('settings.language')}</Text>
              <Text style={styles.itemValue}>
                {`${getCurrentLanguageFlag()} ${languages.find(lang => lang.code === locale)?.name}`}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {i18n.t('settings.policies')}
          </Text>
          
          <TouchableOpacity
            style={styles.settingsItem}
            onPress={() => handlePolicyNavigation('PrivacyPolicy')}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={i18n.t('settings.privacyPolicy')}
            accessibilityHint={i18n.t('settings.privacyPolicyHint')}
          >
            <View style={styles.settingsItemContent}>
              <Text style={styles.itemTitle}>{i18n.t('settings.privacyPolicy')}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingsItem, { marginTop: spacing.sm }]}
            onPress={() => handlePolicyNavigation('TermsOfService')}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={i18n.t('settings.termsOfService')}
            accessibilityHint={i18n.t('settings.termsOfServiceHint')}
          >
            <View style={styles.settingsItemContent}>
              <Text style={styles.itemTitle}>{i18n.t('settings.termsOfService')}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text} />
          </TouchableOpacity>

          <TouchableRipple
            onPress={handleLogout}
            style={[styles.settingsItem, styles.logoutButton]}
            rippleColor={Platform.OS === 'android' ? 'rgba(255, 59, 48, 0.16)' : undefined}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={i18n.t('settings.logout')}
            accessibilityHint={i18n.t('settings.logoutHint')}
          >
            <View style={styles.settingsItemContent}>
              <Text style={[styles.itemTitle, styles.logoutText]}>
                {i18n.t('settings.logout')}
              </Text>
              <MaterialCommunityIcons 
                name="logout" 
                size={24} 
                color={colors.error}
                accessibilityElementsHidden={true}
                importantForAccessibility="no"
              />
            </View>
          </TouchableRipple>
        </View>

        <LanguageSelectionModal
          visible={languageDialogVisible}
          onDismiss={() => setLanguageDialogVisible(false)}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: Platform.select({ ios: 0.5, android: 0 }),
    borderBottomColor: colors.divider,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerTitle: {
    ...typography.h6,
    color: colors.text,
    textAlign: Platform.OS === 'ios' ? 'center' : 'left',
  },
  container: {
    flex: 1,
  },
  section: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    ...typography.subtitle2,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  divider: {
    marginVertical: spacing.lg,
    backgroundColor: colors.divider,
    height: 1,
    marginHorizontal: spacing.md,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: 60,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  settingsItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTitle: {
    ...typography.body1,
    color: colors.text,
  },
  itemValue: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
  },
  logoutButton: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  logoutText: {
    color: colors.error,
    fontWeight: '500',
  },
  dialog: {
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  dialogTitle: {
    ...typography.h6,
    color: colors.text,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  radioLabel: {
    ...typography.body1,
    color: colors.text,
    marginLeft: spacing.sm,
  },
});

export default SettingsScreen;

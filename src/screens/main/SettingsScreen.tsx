// src/screens/main/SettingsScreen.tsx
import React, { useContext, useState } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { 
  Switch, 
  List, 
  Divider, 
  Portal, 
  Dialog, 
  RadioButton,
  Text,
  TouchableRipple,
} from 'react-native-paper';
import { AuthContext } from '../../context/AuthContext';
import { colors, theme, spacing, typography } from '../../theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import i18n from '../../localization/i18n';
import { useLanguage } from '../../context/LanguageContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const SettingsScreen: React.FC = () => {
  const { signOutUser } = useContext(AuthContext);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [languageDialogVisible, setLanguageDialogVisible] = useState(false);
  const { locale, setLocale } = useLanguage();

  const languages = [
    { code: 'en', name: i18n.t('settings.english'), flag: '🇬🇧' },
    { code: 'es', name: i18n.t('settings.spanish'), flag: '🇪🇸' },
    { code: 'fi', name: i18n.t('settings.finnish'), flag: '🇫🇮' },
    { code: 'da', name: i18n.t('settings.danish'), flag: '🇩🇰' },
    { code: 'de', name: i18n.t('settings.german'), flag: '🇩🇪' },
  ];

  const handleLanguageChange = async (languageCode: string) => {
    await setLocale(languageCode);
    setLanguageDialogVisible(false);
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getCurrentLanguageFlag = () => {
    const currentLang = languages.find(lang => lang.code === locale);
    return currentLang?.flag || '🌐';
  };

  const renderSettingsItem = (
    title: string,
    description: string | null,
    right: React.ReactNode,
    onPress?: () => void
  ) => (
    <TouchableRipple
      onPress={onPress}
      rippleColor={Platform.OS === 'android' ? 'rgba(0, 0, 0, .16)' : undefined}
    >
      <List.Item
        title={<Text style={styles.itemTitle}>{title}</Text>}
        description={description && <Text style={styles.itemDescription}>{description}</Text>}
        right={() => right}
        style={styles.listItem}
      />
    </TouchableRipple>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{i18n.t('settings.title')}</Text>
      </View>
      
      <ScrollView style={styles.container} bounces={Platform.OS === 'ios'}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('settings.appearance')}</Text>
          
          {renderSettingsItem(
            i18n.t('settings.language'),
            `${getCurrentLanguageFlag()} ${languages.find(lang => lang.code === locale)?.name}`,
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text} />,
            () => setLanguageDialogVisible(true)
          )}

          {renderSettingsItem(
            i18n.t('settings.darkMode'),
            null,
            <Switch
              value={isDarkMode}
              onValueChange={setIsDarkMode}
              color={colors.primary}
            />
          )}
        </View>

        <Divider style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('settings.policies')}</Text>
          
          {renderSettingsItem(
            i18n.t('settings.privacyPolicy'),
            null,
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text} />
          )}

          {renderSettingsItem(
            i18n.t('settings.termsOfService'),
            null,
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text} />
          )}
        </View>

        <TouchableRipple
          onPress={handleLogout}
          style={styles.logoutButton}
          rippleColor={Platform.OS === 'android' ? 'rgba(255, 59, 48, 0.16)' : undefined}
        >
          <Text style={styles.logoutText}>{i18n.t('settings.logout')}</Text>
        </TouchableRipple>

        <Portal>
          <Dialog
            visible={languageDialogVisible}
            onDismiss={() => setLanguageDialogVisible(false)}
            style={styles.dialog}
          >
            <Dialog.Title style={styles.dialogTitle}>
              {i18n.t('settings.selectLanguage')}
            </Dialog.Title>
            <Dialog.Content>
              <RadioButton.Group onValueChange={handleLanguageChange} value={locale}>
                {languages.map(lang => (
                  <TouchableRipple
                    key={lang.code}
                    onPress={() => handleLanguageChange(lang.code)}
                  >
                    <View style={styles.radioItem}>
                      <RadioButton.Android value={lang.code} />
                      <Text style={styles.radioLabel}>
                        {`${lang.flag}  ${lang.name}`}
                      </Text>
                    </View>
                  </TouchableRipple>
                ))}
              </RadioButton.Group>
            </Dialog.Content>
          </Dialog>
        </Portal>
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
    marginTop: spacing.md,
  },
  sectionTitle: {
    ...typography.subtitle2,
    color: colors.textSecondary,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  listItem: {
    paddingVertical: spacing.sm,
  },
  itemTitle: {
    ...typography.body1,
    color: colors.text,
  },
  itemDescription: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  divider: {
    marginVertical: spacing.md,
    backgroundColor: colors.divider,
  },
  logoutButton: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.error,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    ...typography.button,
    color: colors.surface,
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

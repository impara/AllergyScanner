import React, { useState } from 'react';
import { StyleSheet, View, AccessibilityRole } from 'react-native';
import { Portal, Dialog, TouchableRipple, Text, RadioButton, ActivityIndicator } from 'react-native-paper';
import { colors, spacing, typography } from '../theme';
import i18n from '../localization/i18n';
import { useLanguage } from '../context/LanguageContext';
import { useScreenReader } from '../hooks/useScreenReader';
import { getAccessibleColor, checkContrast } from '../utils/accessibility';

interface LanguageSelectionModalProps {
  visible: boolean;
  onDismiss: () => void;
}

const LanguageSelectionModal: React.FC<LanguageSelectionModalProps> = ({
  visible,
  onDismiss,
}) => {
  const { locale, setLocale } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { announce } = useScreenReader();

  const languages = [
    { code: 'en', name: i18n.t('settings.english'), flag: '🇬🇧' },
    { code: 'es', name: i18n.t('settings.spanish'), flag: '🇪🇸' },
    { code: 'fi', name: i18n.t('settings.finnish'), flag: '🇫🇮' },
    { code: 'da', name: i18n.t('settings.danish'), flag: '🇩🇰' },
    { code: 'de', name: i18n.t('settings.german'), flag: '🇩🇪' },
    { code: 'fr', name: i18n.t('settings.french'), flag: '🇫🇷' },
  ];

  const handleLanguageSelect = async (languageCode: string) => {
    setLoading(true);
    setError(null);
    try {
      await setLocale(languageCode);
      announce(i18n.t('settings.languageChanged', { language: languages.find(l => l.code === languageCode)?.name }));
      onDismiss();
    } catch (err) {
      setError(i18n.t('settings.languageChangeError'));
      announce(i18n.t('settings.languageChangeError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
        style={styles.dialog}
      >
        <View 
          accessible={true}
          accessibilityRole={"alert" as AccessibilityRole}
          accessibilityLabel={i18n.t('settings.languageDialog')}
        >
          <Dialog.Title style={styles.title}>
            {i18n.t('settings.selectLanguage')}
          </Dialog.Title>
          <Dialog.Content>
            <Text 
              style={styles.prompt}
              accessibilityRole="text"
            >
              {i18n.t('settings.languagePrompt')}
            </Text>
            {error && (
              <Text 
                style={styles.errorText}
                accessibilityRole="alert"
              >
                {error}
              </Text>
            )}
            {loading ? (
              <ActivityIndicator 
                style={styles.loader}
                accessibilityLabel={i18n.t('common.loading')}
                accessibilityRole="progressbar"
              />
            ) : (
              languages.map(({ code, name, flag }) => (
                <TouchableRipple
                  key={code}
                  onPress={() => handleLanguageSelect(code)}
                  style={styles.radioItem}
                  accessible={true}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: locale === code }}
                  accessibilityLabel={`${name} ${flag}`}
                  accessibilityHint={i18n.t('settings.languageOptionHint', { language: name })}
                >
                  <View style={styles.radioContainer}>
                    <RadioButton
                      value={code}
                      status={locale === code ? 'checked' : 'unchecked'}
                      onPress={() => handleLanguageSelect(code)}
                      color={colors.primary}
                    />
                    <Text style={styles.radioLabel}>
                      {flag} {name}
                    </Text>
                  </View>
                </TouchableRipple>
              ))
            )}
          </Dialog.Content>
        </View>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    maxHeight: '80%',
  },
  title: {
    ...typography.h2,
    color: getAccessibleColor(colors.text, colors.surface),
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  prompt: {
    ...typography.body1,
    color: getAccessibleColor(colors.text, colors.surface),
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    minHeight: 48,
  },
  radioLabel: {
    ...typography.body1,
    color: getAccessibleColor(colors.text, colors.surface),
    marginLeft: spacing.sm,
  },
  loader: {
    marginVertical: spacing.xl,
  },
  errorText: {
    color: colors.error,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
});

export default LanguageSelectionModal; 
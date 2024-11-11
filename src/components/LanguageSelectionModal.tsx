import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Portal, Dialog, TouchableRipple, Text, RadioButton, ActivityIndicator, Snackbar } from 'react-native-paper';
import { colors, spacing, typography } from '../theme';
import i18n from '../localization/i18n';
import { useLanguage } from '../context/LanguageContext';

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

  const languages = [
    { code: 'en', name: i18n.t('settings.english'), flag: '🇬🇧' },
    { code: 'es', name: i18n.t('settings.spanish'), flag: '🇪🇸' },
    { code: 'fi', name: i18n.t('settings.finnish'), flag: '🇫🇮' },
    { code: 'da', name: i18n.t('settings.danish'), flag: '🇩🇰' },
    { code: 'de', name: i18n.t('settings.german'), flag: '🇩🇪' },
  ];

  const handleLanguageChange = async (languageCode: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await setLocale(languageCode);
      onDismiss();
    } catch (error) {
      console.error('Error setting language:', error);
      setError(i18n.t('settings.languageUpdateError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title style={styles.dialogTitle}>
          {i18n.t('settings.selectLanguage')}
        </Dialog.Title>
        <Dialog.Content>
          <Text style={styles.subtitle}>
            {i18n.t('settings.languagePrompt')}
          </Text>
          {loading ? (
            <ActivityIndicator style={styles.loader} />
          ) : (
            <RadioButton.Group onValueChange={handleLanguageChange} value={locale}>
              {languages.map(lang => (
                <TouchableRipple
                  key={lang.code}
                  onPress={() => handleLanguageChange(lang.code)}
                  disabled={loading}
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
          )}
        </Dialog.Content>
        <Snackbar
          visible={!!error}
          onDismiss={() => setError(null)}
          action={{
            label: i18n.t('common.dismiss'),
            onPress: () => setError(null),
          }}
        >
          {error}
        </Snackbar>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  dialogTitle: {
    ...typography.h6,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body2,
    color: colors.text,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: spacing.md,
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
  loader: {
    marginVertical: spacing.xl,
  }
});

export default LanguageSelectionModal; 
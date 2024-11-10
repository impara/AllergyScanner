import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Portal, Dialog, TouchableRipple, Text, RadioButton } from 'react-native-paper';
import { colors, spacing, typography } from '../theme';
import i18n from '../localization/i18n';
import { useLanguage } from '../context/LanguageContext';
import { getFirebaseDb } from '../config/firebase';
import auth from '@react-native-firebase/auth';

interface LanguageSelectionModalProps {
  visible: boolean;
  onDismiss: () => void;
}

const LanguageSelectionModal: React.FC<LanguageSelectionModalProps> = ({
  visible,
  onDismiss,
}) => {
  const { locale, setLocale } = useLanguage();

  const languages = [
    { code: 'en', name: i18n.t('settings.english'), flag: '🇬🇧' },
    { code: 'es', name: i18n.t('settings.spanish'), flag: '🇪🇸' },
    { code: 'fi', name: i18n.t('settings.finnish'), flag: '🇫🇮' },
    { code: 'da', name: i18n.t('settings.danish'), flag: '🇩🇰' },
    { code: 'de', name: i18n.t('settings.german'), flag: '🇩🇪' },
  ];

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await setLocale(languageCode);
      
      // Update user's hasSelectedLanguage in Firebase
      const currentUser = auth().currentUser;
      if (currentUser) {
        const db = getFirebaseDb();
        await db.collection('users').doc(currentUser.uid).update({
          hasSelectedLanguage: true,
        });
      }
      
      onDismiss();
    } catch (error) {
      console.error('Error setting language:', error);
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
});

export default LanguageSelectionModal; 
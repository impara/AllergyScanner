import React from 'react';
import { ScrollView, StyleSheet, View, Platform } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../theme';
import { useNavigation } from '@react-navigation/native';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const BulletPoint: React.FC<{ text: string }> = ({ text }) => (
  <View style={styles.bulletPoint}>
    <Text style={styles.bulletPointText}>• {text}</Text>
  </View>
);

const TermsOfServiceScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
          <Text style={styles.headerTitle}>Terms of Service</Text>
          <View style={styles.placeholderButton} />
        </View>
      </View>
      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={true}
      >
        <Section title="1. Acceptance of Terms">
          <Text style={styles.text}>
            By accessing and using the PurePlate application, you acknowledge that you have read, 
            understood, and agree to be bound by these Terms of Service. If you do not agree with 
            these terms, please do not use the application.
          </Text>
        </Section>

        <Section title="2. Service Description">
          <Text style={styles.text}>
            PurePlate is a mobile application that allows users to scan product barcodes and check 
            ingredients against their personal preferences and dietary restrictions. The service includes:
          </Text>
          <BulletPoint text="Barcode scanning functionality" />
          <BulletPoint text="Product ingredient analysis" />
          <BulletPoint text="Personalized ingredient profiles" />
          <BulletPoint text="Multi-language support" />
        </Section>

        <Section title="3. User Accounts">
          <Text style={styles.text}>
            To use certain features of the Service, you must register for an account. You agree to:
          </Text>
          <BulletPoint text="Provide accurate and complete information" />
          <BulletPoint text="Maintain the security of your account credentials" />
          <BulletPoint text="Promptly update any changes to your information" />
          <BulletPoint text="Accept responsibility for all activities under your account" />
        </Section>

        <Section title="4. User Responsibilities">
          <Text style={styles.text}>
            When using PurePlate, you agree not to:
          </Text>
          <BulletPoint text="Violate any applicable laws or regulations" />
          <BulletPoint text="Interfere with or disrupt the service" />
          <BulletPoint text="Attempt to gain unauthorized access to the service" />
          <BulletPoint text="Use the service for any illegal or unauthorized purpose" />
        </Section>

        <Section title="5. Data Usage">
          <Text style={styles.text}>
            Your use of PurePlate is also governed by our Privacy Policy. The service will collect 
            and use information as described in the Privacy Policy. By using PurePlate, you consent 
            to such data collection and usage.
          </Text>
        </Section>

        <Section title="6. Limitations">
          <Text style={styles.text}>
            While we strive to provide accurate information, you acknowledge that:
          </Text>
          <BulletPoint text="Product information may not always be complete or up-to-date" />
          <BulletPoint text="Ingredient analysis is provided as a guide only" />
          <BulletPoint text="You should verify critical dietary information from product packaging" />
          <BulletPoint text="We are not liable for any consequences of relying on the information provided" />
        </Section>

        <Section title="7. Changes to Terms">
          <Text style={styles.text}>
            We reserve the right to modify these terms at any time. We will notify users of any material 
            changes through the application or via email. Continued use of the service after such 
            modifications constitutes acceptance of the updated terms.
          </Text>
        </Section>

        <Section title="8. Termination">
          <Text style={styles.text}>
            We reserve the right to terminate or suspend access to our service immediately, without 
            prior notice or liability, for any reason whatsoever, including without limitation if you 
            breach the Terms.
          </Text>
        </Section>

        <Section title="9. Contact">
          <Text style={styles.text}>
            If you have any questions about these Terms, please contact us at support@pureplate.com
          </Text>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    marginLeft: spacing.xs,
  },
  placeholderButton: {
    width: 48, // Same width as the back button for proper centering
  },
  headerTitle: {
    ...typography.h6,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  container: {
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h6,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  text: {
    ...typography.body1,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  bulletPoint: {
    marginBottom: spacing.xs,
    paddingLeft: spacing.sm,
  },
  bulletPointText: {
    ...typography.body1,
    color: colors.text,
  },
});

export default TermsOfServiceScreen; 
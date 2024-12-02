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

const BulletPoint: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <View style={styles.bulletPoint}>
    <Text style={styles.bulletPointText}>• <Text style={styles.bold}>{title}:</Text> {description}</Text>
  </View>
);

const PrivacyPolicyScreen: React.FC = () => {
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
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <View style={styles.placeholderButton} />
        </View>
      </View>
      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={true}
      >
        <Section title="Introduction">
          <Text style={styles.text}>
            PurePlate ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application. We comply with the General Data Protection Regulation (GDPR) to ensure your personal data is handled securely and transparently.
          </Text>
        </Section>

        <Section title="Data We Collect">
          <BulletPoint
            title="Personal Identification Information"
            description="Email address, username, and password used for account creation and authentication."
          />
          <BulletPoint
            title="Usage Data"
            description="Information about how you use the app, including scanned barcodes, preferences, and interaction with features."
          />
          <BulletPoint
            title="Device Information"
            description="Device type, operating system, and unique device identifiers."
          />
          <BulletPoint
            title="Location Data"
            description="If you enable location services, we may collect location data to enhance app functionality."
          />
        </Section>

        <Section title="How We Use Your Data">
          <BulletPoint
            title="To Provide Services"
            description="Facilitating user authentication, barcode scanning, and personalized ingredient profiles."
          />
          <BulletPoint
            title="To Improve Our App"
            description="Analyzing usage patterns to enhance app features and performance."
          />
          <BulletPoint
            title="Communication"
            description="Sending updates, newsletters, or responding to your inquiries."
          />
          <BulletPoint
            title="Compliance and Security"
            description="Ensuring the security of our app and complying with legal obligations."
          />
        </Section>

        <Section title="Data Sharing and Disclosure">
          <BulletPoint
            title="With Service Providers"
            description="We may share your data with third-party service providers who assist us in operating the app, conducting our business, or servicing you."
          />
          <BulletPoint
            title="Legal Requirements"
            description="We may disclose your information if required by law or to protect our rights."
          />
          <BulletPoint
            title="Business Transfers"
            description="In the event of a merger, acquisition, or sale of assets, your data may be transferred to the new owner."
          />
        </Section>

        <Section title="Your Rights Under GDPR">
          <BulletPoint title="Access" description="You have the right to access the personal data we hold about you." />
          <BulletPoint title="Rectification" description="You can request correction of any inaccurate or incomplete data." />
          <BulletPoint title="Erasure" description="You may request the deletion of your personal data under certain conditions." />
          <BulletPoint title="Restriction of Processing" description="You can request the limiting of processing your data." />
          <BulletPoint title="Data Portability" description="You have the right to receive your data in a structured, commonly used format." />
          <BulletPoint title="Objection" description="You can object to the processing of your data for specific purposes." />
        </Section>

        <Section title="Data Retention">
          <Text style={styles.text}>
            We retain your personal data only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
          </Text>
        </Section>

        <Section title="Security">
          <Text style={styles.text}>
            We implement appropriate technical and organizational measures to protect your data against unauthorized access, alteration, disclosure, or destruction.
          </Text>
        </Section>

        <Section title="Changes to This Privacy Policy">
          <Text style={styles.text}>
            We may update this Privacy Policy from time to time. Any changes will be posted on this page, and where appropriate, notified to you via email or within the app.
          </Text>
        </Section>

        <Section title="Contact Us">
          <Text style={styles.text}>
            If you have any questions about this Privacy Policy or our data practices, please contact us at support@pureplate.com.
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
  bold: {
    fontWeight: 'bold',
  },
});

export default PrivacyPolicyScreen; 
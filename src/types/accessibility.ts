import { AccessibilityRole } from 'react-native';

// Extend the AccessibilityRole type to include custom roles if needed
export type CustomAccessibilityRole = AccessibilityRole | 'contentInfo';

// Add other accessibility-related types here
export interface AccessibilityProps {
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: CustomAccessibilityRole;
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | 'mixed';
    busy?: boolean;
    expanded?: boolean;
  };
} 
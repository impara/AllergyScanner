import React from 'react';
import { TextInput, StyleSheet, TextInputProps, View, Text, ViewStyle, TextStyle } from 'react-native';
import { colors, typography, spacing } from '../../theme';
import { CustomTheme } from '../../types/theme';

export interface InputProps extends TextInputProps {
  error?: string;
  containerStyle?: ViewStyle;
  label?: string;
  helperText?: string;
  theme?: CustomTheme;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const Input: React.FC<InputProps> = ({ 
  style, 
  error,
  containerStyle,
  label,
  helperText,
  placeholderTextColor = colors.textSecondary,
  theme,
  accessibilityLabel,
  accessibilityHint,
  ...props 
}) => {
  return (
    <View 
      style={[styles.container, containerStyle]}
      accessible={true}
      accessibilityLabel={accessibilityLabel || label}
      accessibilityHint={accessibilityHint}
    >
      {label && (
        <Text 
          style={styles.label}
          accessibilityRole="text"
        >
          {label}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
          style
        ]}
        placeholderTextColor={placeholderTextColor}
        accessible={true}
        importantForAccessibility="yes"
        accessibilityLabel={accessibilityLabel || label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{
          disabled: props.editable === false,
          selected: !!props.value,
        }}
        {...props}
      />
      {error && (
        <Text 
          style={styles.errorText}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      )}
      {helperText && !error && (
        <Text 
          style={styles.helperText}
          accessibilityRole="text"
        >
          {helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    ...typography.caption,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 5,
    padding: 10,
    color: colors.text,
    minHeight: 48,
    fontSize: 16,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: 4,
    fontSize: 14,
  },
  helperText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
    fontSize: 14,
  },
});

export default Input;
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
}

const Input: React.FC<InputProps> = ({ 
  style, 
  error,
  containerStyle,
  label,
  helperText,
  placeholderTextColor = colors.textSecondary,
  theme,
  ...props 
}) => {
  const inputStyles = [
    styles.input,
    error && styles.inputError,
    style
  ].filter(Boolean) as TextStyle[];

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={inputStyles}
        placeholderTextColor={placeholderTextColor}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
      {helperText && !error && <Text style={styles.helperText}>{helperText}</Text>}
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
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: 4,
  },
  helperText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
});

export default Input;
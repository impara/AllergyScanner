import React from 'react';
import { TextInput, StyleSheet, TextInputProps, View, Text, ViewStyle, TextStyle } from 'react-native';
import { colors, typography, spacing } from '../../theme';
import { CustomTheme } from '../../types/theme';
import { getAccessibleColor, getAccessibleFontSize } from '../../utils/accessibility';

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
  label,
  error,
  ...props
}) => {
  return (
    <View>
      <TextInput
        style={[styles.input, { minHeight: 44 }]}
        accessibilityLabel={label}
        accessibilityRole="text"
        accessibilityState={{ 
          disabled: props.editable === false,
          selected: !!props.value,
        }}
        accessibilityHint={error ? `Error: ${error}` : undefined}
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
    color: getAccessibleColor(colors.text, colors.surface),
    minHeight: 48,
    fontSize: getAccessibleFontSize(16),
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    ...typography.caption,
    color: getAccessibleColor(colors.error, colors.surface),
    marginTop: 4,
    fontSize: getAccessibleFontSize(14),
  },
  helperText: {
    ...typography.caption,
    color: getAccessibleColor(colors.textSecondary, colors.surface),
    marginTop: 4,
    fontSize: getAccessibleFontSize(14),
  },
});

export default Input;
import React from 'react';
import { Pressable, TouchableOpacity, Text, StyleSheet, Platform, View } from 'react-native';
import { colors, typography } from '../../theme';
import { CustomTheme } from '../../types/theme';

export interface ButtonProps {
  title?: string;
  children?: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: object;
  disabled?: boolean;
  loading?: boolean;
  theme?: CustomTheme;
}

const Button: React.FC<ButtonProps> = ({ 
  title, 
  children, 
  onPress, 
  variant = 'primary',
  style,
  disabled,
  loading,
  theme
}) => {
  const ButtonComponent = Platform.select({
    ios: TouchableOpacity as React.ComponentType<any>,
    android: Pressable as React.ComponentType<any>,
    default: Pressable as React.ComponentType<any>,
  });

  return (
    <ButtonComponent
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }: { pressed: boolean }) => [
        styles.button,
        variant && styles[variant],
        pressed && styles.buttonPressed,
        style
      ]}
    >
      <Text style={[styles.text, variant && styles[`${variant}Text` as keyof typeof styles]]}>
        {title || children}
      </Text>
    </ButtonComponent>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  text: {
    ...typography.button,
  },
  primaryText: {
    color: colors.surface,
  },
  secondaryText: {
    color: colors.primary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  outlineText: {
    color: colors.primary,
  },
});

export default Button;
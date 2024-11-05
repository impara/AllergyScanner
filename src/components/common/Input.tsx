import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  placeholderTextColor?: string;
}

const Input: React.FC<InputProps> = ({ style, placeholderTextColor = '#A0A0A0', ...props }) => {
  return (
    <TextInput
      style={[styles.input, style]}
      placeholderTextColor={placeholderTextColor}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 0,
    padding: 0,
    margin: 0,
    // Add any other default styles you want for your input
  },
});

export default Input;
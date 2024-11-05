import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

interface ButtonProps {
  onPress: () => void;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ onPress, children }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.button,
      pressed && styles.buttonPressed
    ]}
  >
    <Text style={styles.text}>{children}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  text: {
    color: 'white',
    textAlign: 'center',
  },
});

export default Button;
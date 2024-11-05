import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

const Footer: React.FC = () => {
  return (
    <View style={styles.footer}>
      <Text style={styles.text}>© 2024 PurePlate</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    height: 30,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: colors.coolGray,
    fontSize: 10,
  },
});

export default Footer;
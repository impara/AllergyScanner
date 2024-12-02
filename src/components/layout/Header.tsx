import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useTheme } from '@react-navigation/native';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
      />
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.title}>{title}</Text>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    minHeight: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Header;
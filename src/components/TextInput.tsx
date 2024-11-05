import { TextInput, View } from 'react-native';

const NumericInputs = () => (
  <View>
    <TextInput keyboardType="numeric" />
    <TextInput inputMode="numeric" />
  </View>
);

export default NumericInputs;
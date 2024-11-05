import { Text, View } from 'react-native';

const NonSelectableText = () => (
  <View>
    <Text selectable={false}>Non-selectable text</Text>
    <Text style={{ userSelect: 'none' }}>Non-selectable text</Text>
  </View>
);

export default NonSelectableText;
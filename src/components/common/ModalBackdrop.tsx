import React from 'react';
import { StyleSheet, TouchableWithoutFeedback, Animated } from 'react-native';
import { colors } from '../../theme';

interface ModalBackdropProps {
  visible: boolean;
  onPress: () => void;
  opacity: Animated.Value;
}

const ModalBackdrop: React.FC<ModalBackdropProps> = ({ visible, onPress, opacity }) => {
  if (!visible) return null;

  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <Animated.View 
        style={[
          styles.backdrop,
          {
            opacity: opacity.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.5],
            }),
          },
        ]} 
      />
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.shadow,
  },
});

export default ModalBackdrop; 
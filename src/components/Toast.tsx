import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '../theme';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onHide: () => void;
  onUndo?: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, isVisible, onHide, onUndo, duration = 3000 }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onHide();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onHide, duration]);

  if (!isVisible) return null;

  return (
    <View style={styles.toastContent}>
      <Text style={styles.message} numberOfLines={1} ellipsizeMode="tail">
        {message}
      </Text>
      {onUndo && (
        <TouchableOpacity onPress={onUndo} style={styles.undoButtonContainer}>
          <Text style={styles.undoButton}>Undo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  toastContent: {
    backgroundColor: colors.surface,
    width: '100%',
    height: 40,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  message: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  undoButtonContainer: {
    marginLeft: spacing.sm,
    paddingLeft: spacing.sm,
    borderLeftWidth: 1,
    borderLeftColor: colors.divider,
    height: '100%',
    justifyContent: 'center',
  },
  undoButton: {
    ...typography.button,
    color: colors.primary,
  },
});

export default Toast;

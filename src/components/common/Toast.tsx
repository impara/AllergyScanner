import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import i18n from '../../localization/i18n';

export interface ToastProps {
  message: string;
  visible: boolean;
  onDismiss: () => void;
  onUndo?: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({
  message,
  visible,
  onDismiss,
  onUndo,
  duration = 3000,
}) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onDismiss]);

  if (!visible) return null;

  return (
    <View 
      style={styles.container}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Text style={styles.message}>{message}</Text>
      {onUndo && (
        <TouchableOpacity 
          onPress={onUndo}
          accessible={true}
          accessibilityLabel={i18n.t('common.undo')}
          accessibilityRole="button"
          style={styles.undoButton}
        >
          <Text style={styles.undoButtonText}>{i18n.t('common.undo')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 9999,
    elevation: Platform.OS === 'android' ? 9999 : undefined,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  message: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  undoButton: {
    minHeight: 48,
    minWidth: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  undoButtonText: {
    ...typography.button,
    color: colors.primary,
  },
});

export default Toast;
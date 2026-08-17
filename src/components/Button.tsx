import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  GestureResponderEvent,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme';

export type HapticType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'selection'
  | 'success'
  | 'warning'
  | 'error';

export const triggerHaptic = async (type: HapticType | 'none' = 'light') => {
  if (type === 'none') return;
  try {
    switch (type) {
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'selection':
        await Haptics.selectionAsync();
        break;
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  } catch (e) {
    // Fail silently on unsupported devices/emulators
  }
};

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'danger'
  | 'ghost';

interface ButtonProps {
  onPress?: (event: GestureResponderEvent) => void;
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  textClassName?: string;
  icon?: React.ReactNode;
  hapticType?: HapticType | 'none';
}

/**
 * Low-level Button. Defaults are applied unconditionally:
 *  - non-ghost: w-full, h-14, rounded-xl, shadow-lg shadow-primary/20
 *  - ghost:     rounded-full, no shadow
 * Pass `className` to override (appended last so caller wins).
 *
 * For common, opinionated usage prefer the convenience exports:
 * `ButtonPrimary`, `ButtonOutline`, `ButtonSecondary`, `ButtonDanger`.
 */
export const Button: React.FC<ButtonProps> = ({
  onPress,
  title,
  variant = 'primary',
  loading = false,
  disabled = false,
  className = '',
  textClassName = '',
  icon,
  hapticType = 'light',
}) => {
  const handlePress = (event: GestureResponderEvent) => {
    if (disabled || loading) return;

    if (hapticType !== 'none') {
      triggerHaptic(hapticType);
    }

    if (onPress) {
      onPress(event);
    }
  };

  const isGhost = variant === 'ghost';

  let btnStyles = isGhost
    ? 'rounded-full flex-row items-center justify-center active:bg-muted'
    : 'w-full h-14 rounded-xl flex-row items-center justify-center shadow-lg shadow-primary/20';

  let textStyles = 'text-base font-bold';

  if (variant === 'primary') {
    btnStyles += disabled ? ' bg-muted shadow-none' : ' bg-primary active:bg-secondary';
    textStyles += ' text-primary-foreground';
  } else if (variant === 'secondary') {
    btnStyles += disabled ? ' bg-muted border border-border' : ' bg-muted active:bg-muted-foreground/10';
    textStyles += ' text-foreground';
  } else if (variant === 'outline') {
    btnStyles = `w-full h-14 rounded-xl flex-row items-center justify-center ${
      disabled
        ? 'bg-background border border-border opacity-50'
        : 'bg-background border border-border active:bg-muted'
    }`;
    textStyles += ' text-foreground';
  } else if (variant === 'danger') {
    btnStyles += disabled ? ' bg-destructive/40' : ' bg-destructive active:bg-destructive/80';
    textStyles += ' text-destructive-foreground';
  } else if (variant === 'ghost') {
    btnStyles += ' p-2';
    textStyles += ' text-muted-foreground';
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      className={`${btnStyles} ${className}`}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'outline' || variant === 'ghost'
              ? Colors.foreground
              : Colors.primaryForeground
          }
        />
      ) : (
        <>
          {icon ? (
            <View className={title ? 'mr-2' : ''}>
              {icon}
            </View>
          ) : null}
          {title ? (
            <Text className={`${textStyles} ${textClassName}`}>{title}</Text>
          ) : null}
        </>
      )}
    </TouchableOpacity>
  );
};

// ---------- Convenience exports ----------

interface VariantButtonProps extends Omit<ButtonProps, 'variant'> {}

export const ButtonPrimary: React.FC<VariantButtonProps> = (props) => (
  <Button {...props} variant="primary" />
);

export const ButtonSecondary: React.FC<VariantButtonProps> = (props) => (
  <Button {...props} variant="secondary" />
);

export const ButtonOutline: React.FC<VariantButtonProps> = (props) => (
  <Button {...props} variant="outline" />
);

export const ButtonDanger: React.FC<VariantButtonProps> = (props) => (
  <Button {...props} variant="danger" />
);

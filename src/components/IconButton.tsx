import React from 'react';
import { TouchableOpacity, GestureResponderEvent, AccessibilityRole } from 'react-native';
import { triggerHaptic, HapticType } from './Button';

type Variant = 'plain' | 'soft' | 'outline';
type Size = 'sm' | 'md' | 'lg';
type Shape = 'circle' | 'rounded' | 'square';

const SIZE_TO_CLASS: Record<Size, string> = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

const VARIANT_TO_CLASS: Record<Variant, string> = {
  plain: '',
  soft: 'bg-muted active:bg-muted-foreground/10',
  outline: 'bg-background border border-border active:bg-muted',
};

const SHAPE_TO_CLASS: Record<Shape, string> = {
  circle: 'rounded-full',
  rounded: 'rounded-xl',
  square: 'rounded-md',
};

interface IconButtonProps {
  onPress?: (event: GestureResponderEvent) => void;
  icon: React.ReactNode;
  variant?: Variant;
  size?: Size;
  shape?: Shape;
  hapticType?: HapticType | 'none';
  disabled?: boolean;
  className?: string;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
}

/**
 * Square/circle hit area wrapping a single lucide icon.
 * Replaces the `<Button variant="ghost" title="" icon={…} />` pattern
 * that was used as an ad-hoc IconButton.
 */
export const IconButton: React.FC<IconButtonProps> = ({
  onPress,
  icon,
  variant = 'plain',
  size = 'md',
  shape = 'circle',
  hapticType = 'selection',
  disabled = false,
  className = '',
  accessibilityLabel,
  accessibilityRole = 'button',
}) => {
  const handlePress = (event: GestureResponderEvent) => {
    if (disabled) return;
    if (hapticType !== 'none') {
      triggerHaptic(hapticType);
    }
    onPress?.(event);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      className={`items-center justify-center ${SIZE_TO_CLASS[size]} ${VARIANT_TO_CLASS[variant]} ${SHAPE_TO_CLASS[shape]} ${className}`}
    >
      {icon}
    </TouchableOpacity>
  );
};

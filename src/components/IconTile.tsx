import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';

type Tone = 'primary' | 'streak' | 'muted' | 'dark' | 'success' | 'warning';
type Size = 'sm' | 'md' | 'lg';
type Shape = 'circle' | 'rounded' | 'square';

const SIZE_TO_CLASS: Record<Size, string> = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
};

const TONE_TO_CLASS: Record<Tone, string> = {
  primary: 'bg-primary/15',
  streak: 'bg-streak-soft border border-streak-border',
  muted: 'bg-muted border border-border',
  dark: 'bg-foreground',
  success: 'bg-success/15',
  warning: 'bg-warning/15',
};

const SHAPE_TO_CLASS: Record<Shape, string> = {
  circle: 'rounded-full',
  rounded: 'rounded-2xl',
  square: 'rounded-md',
};

interface IconTileProps {
  /** The lucide icon element (or any ReactNode). Caller controls size/color. */
  icon?: React.ReactNode;
  /** Rendered instead of `icon` when provided — for tiles that show text (initials). */
  children?: React.ReactNode;
  size?: Size;
  tone?: Tone;
  shape?: Shape;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export const IconTile: React.FC<IconTileProps> = ({
  icon,
  children,
  size = 'md',
  tone = 'muted',
  shape = 'circle',
  className = '',
  style,
}) => {
  return (
    <View
      className={`items-center justify-center ${SIZE_TO_CLASS[size]} ${TONE_TO_CLASS[tone]} ${SHAPE_TO_CLASS[shape]} ${className}`}
      style={style}
    >
      {icon ?? children}
    </View>
  );
};

import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'flat' | 'dark' | 'orange' | 'red' | 'green';
  className?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Card applies no outer spacing (no implicit margin).
 * Pass `className="mb-6"` (or stack the parent with `gap-y-*`) to control layout.
 */
export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className = '',
  style,
}) => {
  let cardStyles = 'rounded-3xl p-5 border';

  switch (variant) {
    case 'default':
      cardStyles += ' bg-card border-border shadow-sm shadow-border';
      break;
    case 'flat':
      cardStyles += ' bg-muted border-border';
      break;
    case 'dark':
      cardStyles += ' bg-foreground border-foreground shadow-sm shadow-primary/20';
      break;
    case 'orange':
      cardStyles += ' bg-streak-soft border-streak-border';
      break;
    case 'red':
      cardStyles += ' bg-destructive/10 border-destructive/30';
      break;
    case 'green':
      cardStyles += ' bg-success/10 border-success/30';
      break;
  }

  return (
    <View className={`${cardStyles} ${className}`} style={style}>
      {children}
    </View>
  );
};
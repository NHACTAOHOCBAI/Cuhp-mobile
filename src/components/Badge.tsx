import React from 'react';
import { View, Text } from 'react-native';

interface BadgeProps {
  label: string;
  variant?: 'zinc' | 'dark' | 'red' | 'green' | 'yellow' | 'pink';
  className?: string;
  textClassName?: string;
}

/**
 * Compact pill label. Variants provide background + text + border tokens.
 * Caller controls placement; Badge applies no outer spacing.
 */

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'zinc',
  className = '',
  textClassName = '',
}) => {
  let badgeStyles = 'px-3 py-1 rounded-full border';
  let textStyles = 'text-xs font-semibold';

  switch (variant) {
    case 'zinc':
      badgeStyles += ' bg-muted border-border';
      textStyles += ' text-muted-foreground';
      break;
    case 'dark':
      badgeStyles += ' bg-foreground border-foreground';
      textStyles += ' text-on-dark';
      break;
    case 'red':
      badgeStyles += ' bg-destructive/10 border-destructive/30';
      textStyles += ' text-destructive';
      break;
    case 'green':
      badgeStyles += ' bg-success/10 border-success/30';
      textStyles += ' text-success';
      break;
    case 'yellow':
      badgeStyles += ' bg-warning/10 border-warning/30';
      textStyles += ' text-warning';
      break;
    case 'pink':
      // Brand pink — matches web's hard-level badge (#EFBCD5/15 + #C7739A).
      badgeStyles += ' bg-primary/15 border-primary/30';
      textStyles += ' text-primary';
      break;
  }

  return (
    <View className={`${badgeStyles} ${className}`}>
      <Text className={`${textStyles} ${textClassName}`}>{label}</Text>
    </View>
  );
};
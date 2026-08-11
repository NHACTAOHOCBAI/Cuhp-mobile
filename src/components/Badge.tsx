import React from 'react';
import { View, Text } from 'react-native';

interface BadgeProps {
  label: string;
  variant?: 'zinc' | 'dark' | 'red' | 'green';
  className?: string;
  textClassName?: string;
}

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
      badgeStyles += ' bg-zinc-100 border-zinc-200/60';
      textStyles += ' text-zinc-600';
      break;
    case 'dark':
      badgeStyles += ' bg-zinc-950 border-zinc-800';
      textStyles += ' text-white';
      break;
    case 'red':
      badgeStyles += ' bg-red-50 border-red-100';
      textStyles += ' text-red-600';
      break;
    case 'green':
      badgeStyles += ' bg-green-50 border-green-100';
      textStyles += ' text-green-600';
      break;
  }

  return (
    <View className={`${badgeStyles} ${className}`}>
      <Text className={`${textStyles} ${textClassName}`}>{label}</Text>
    </View>
  );
};

import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'flat' | 'dark' | 'orange' | 'red' | 'green';
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className = '',
  style,
}) => {
  let cardStyles = 'rounded-3xl p-5 mb-6 border';

  switch (variant) {
    case 'default':
      cardStyles += ' bg-white border-zinc-200/80 shadow-sm shadow-zinc-100/50';
      break;
    case 'flat':
      cardStyles += ' bg-zinc-50 border-zinc-200';
      break;
    case 'dark':
      cardStyles += ' bg-zinc-950 border-zinc-800 shadow-sm shadow-black/10';
      break;
    case 'orange':
      cardStyles += ' bg-orange-50/50 border-orange-100';
      break;
    case 'red':
      cardStyles += ' bg-red-50 border-red-200';
      break;
    case 'green':
      cardStyles += ' bg-green-50 border-green-200';
      break;
  }

  return (
    <View className={`${cardStyles} ${className}`} style={style}>
      {children}
    </View>
  );
};

import React from 'react';
import { View, Text } from 'react-native';
import { typography } from '../theme';
import { Colors } from '../theme';

interface SectionTitleProps {
  /** Optional lucide icon component. Caller controls size+color via `icon` JSX. */
  icon?: React.ReactNode;
  children: React.ReactNode;
  /** Drop the bottom margin — used inside a Card header. */
  tight?: boolean;
  /** Center the text (for use inside cards). */
  centered?: boolean;
  className?: string;
  textClassName?: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({
  icon,
  children,
  tight = false,
  centered = false,
  className = '',
  textClassName = '',
}) => {
  const marginClass = tight ? '' : 'mb-3';
  const justifyClass = centered ? 'justify-center' : '';

  return (
    <View className={`flex-row items-center ${marginClass} ${justifyClass} ${className}`}>
      {icon ? (
        <View className="mr-1.5">
          {icon}
        </View>
      ) : null}
      <Text className={`${typography.eyebrow} ${textClassName}`}>
        {children}
      </Text>
    </View>
  );
};

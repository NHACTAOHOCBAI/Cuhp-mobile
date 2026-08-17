import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { Colors, typography } from '../theme';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
  /** Optional decorative element above the spinner. */
  icon?: React.ReactNode;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message,
  size = 'large',
  icon,
  className = '',
}) => {
  return (
    <View className={`flex-1 justify-center items-center px-6 ${className}`}>
      {icon ? <View className="mb-3">{icon}</View> : null}
      <ActivityIndicator size={size} color={Colors.foreground} />
      {message ? (
        <Text className={`${typography.bodyMuted} mt-3 text-center`}>
          {message}
        </Text>
      ) : null}
    </View>
  );
};

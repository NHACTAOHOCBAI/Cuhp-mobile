import React from 'react';
import { View, Text } from 'react-native';
import { IconTile } from './IconTile';
import { Button, ButtonPrimary, ButtonOutline } from './Button';
import { typography } from '../theme';

type Tone = 'primary' | 'streak' | 'muted' | 'dark' | 'success' | 'warning';
type Variant = 'block' | 'inline';

interface EmptyStateAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'icon';
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  body?: string;
  action?: EmptyStateAction;
  variant?: Variant;
  /** Tints the icon tile container. Default muted. */
  tone?: Tone;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  body,
  action,
  variant = 'block',
  tone = 'muted',
  className = '',
}) => {
  if (variant === 'inline') {
    return (
      <View className={`items-center justify-center py-6 ${className}`}>
        <IconTile tone={tone} shape="circle" size="md" icon={icon} />
        <Text className={`${typography.h4} text-center mt-3`}>{title}</Text>
        {body ? (
          <Text className={`${typography.bodyMuted} text-center mt-1 max-w-[260px]`}>
            {body}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View className={`flex-1 items-center justify-center px-6 py-12 ${className}`}>
      <IconTile tone={tone} shape="circle" size="lg" icon={icon} />
      <Text className={`${typography.h3} text-center mt-6`}>{title}</Text>
      {body ? (
        <Text className={`${typography.bodyMuted} text-center mt-2 max-w-[280px]`}>
          {body}
        </Text>
      ) : null}
      {action ? (
        <View className="mt-6">
          {action.variant === 'outline' ? (
            <ButtonOutline title={action.label} onPress={action.onPress} />
          ) : (
            <ButtonPrimary title={action.label} onPress={action.onPress} />
          )}
        </View>
      ) : null}
    </View>
  );
};

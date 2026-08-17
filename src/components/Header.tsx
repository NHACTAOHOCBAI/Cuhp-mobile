import React from 'react';
import { View, Text } from 'react-native';

interface HeaderProps {
  title: string;
  /** Caller-controlled greeting. Omit to render header without subtitle. */
  subtitle?: string;
  rightElement?: React.ReactNode;
}

/**
 * Decoupled from auth context — callers (e.g. VocabularyScreen) read
 * `useAuth().user?.name` and pass the greeting in via `subtitle`.
 */
export const Header: React.FC<HeaderProps> = ({ title, subtitle, rightElement }) => {
  return (
    <View className="flex-row justify-between items-center px-6 py-4 border-b border-border bg-background">
      <View className="flex-1">
        {subtitle ? (
          <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            {subtitle}
          </Text>
        ) : null}
        <Text className="text-2xl font-bold text-foreground tracking-tight mt-0.5">
          {title}
        </Text>
      </View>
      {rightElement ? <View className="ml-4">{rightElement}</View> : null}
    </View>
  );
};

import React from 'react';
import { View, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, rightElement }) => {
  const { user } = useAuth();
  const displaySubtitle = subtitle || `Xin chào, ${user?.name || 'Học viên'}`;

  return (
    <View className="flex-row justify-between items-center px-6 py-4 border-b border-zinc-100 bg-white">
      <View className="flex-1">
        <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
          {displaySubtitle}
        </Text>
        <Text className="text-2xl font-bold text-zinc-900 tracking-tight mt-0.5">
          {title}
        </Text>
      </View>
      {rightElement ? <View className="ml-4">{rightElement}</View> : null}
    </View>
  );
};

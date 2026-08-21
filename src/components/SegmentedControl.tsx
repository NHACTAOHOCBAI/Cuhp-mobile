import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../theme';
import { triggerHaptic } from './Button';

export interface TabItem<T extends string> {
  value: T;
  label: string;
  icon?: (color: string) => React.ReactNode;
}

interface SegmentedControlProps<T extends string> {
  tabs: ReadonlyArray<TabItem<T>>;
  value: T;
  onChange: (value: T) => void;
  roundedVariant?: 'full' | 'xl';
  className?: string;
}

export function SegmentedControl<T extends string>({
  tabs,
  value,
  onChange,
  roundedVariant = 'full',
  className = '',
}: SegmentedControlProps<T>) {
  const containerRoundedClass = roundedVariant === 'full' ? 'rounded-full' : 'rounded-xl';
  const itemRoundedClass = roundedVariant === 'full' ? 'rounded-full' : 'rounded-lg';

  return (
    <View className={`flex-row bg-muted p-1 ${containerRoundedClass} ${className}`}>
      {tabs.map((tab) => {
        const isSelected = value === tab.value;
        const iconColor = isSelected ? Colors.foreground : Colors.iconMuted;

        return (
          <TouchableOpacity
            key={tab.value}
            onPress={() => {
              if (value === tab.value) return;
              triggerHaptic('selection');
              onChange(tab.value);
            }}
            activeOpacity={0.85}
            className={`flex-1 py-2.5 items-center justify-center flex-row ${itemRoundedClass} ${
              isSelected ? 'bg-card shadow-sm' : ''
            }`}
          >
            {tab.icon && <View className="mr-1">{tab.icon(iconColor)}</View>}
            <Text
              className={`text-[10px] font-extrabold ${
                isSelected ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

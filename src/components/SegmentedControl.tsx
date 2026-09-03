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
    <View className={`flex-row bg-[#fcf1f5] border border-[#F0EAEB] p-1 ${containerRoundedClass} ${className}`} style={{ borderColor: '#F0EAEB' }}>
      {tabs.map((tab) => {
        const isSelected = value === tab.value;
        const iconColor = isSelected ? '#1f1a1d' : '#706065';

        return (
          <TouchableOpacity
            key={tab.value}
            onPress={() => {
              if (value === tab.value) return;
              triggerHaptic('selection');
              onChange(tab.value);
            }}
            activeOpacity={0.85}
            style={isSelected ? { borderColor: '#F0EAEB' } : undefined}
            className={`flex-1 py-2.5 items-center justify-center flex-row ${itemRoundedClass} ${
              isSelected ? 'bg-white shadow-sm border border-[#F0EAEB]' : ''
            }`}
          >
            {tab.icon && <View className="mr-1">{tab.icon(iconColor)}</View>}
            <Text
              className={`text-[10px] font-extrabold ${
                isSelected ? 'text-[#1f1a1d]' : 'text-[#706065]'
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

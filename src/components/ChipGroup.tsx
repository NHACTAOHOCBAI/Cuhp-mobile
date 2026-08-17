import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { triggerHaptic, HapticType } from './Button';
import { Colors } from '../theme';

export interface ChipItem {
  value: string;
  label: string;
}

interface ChipGroupProps {
  data: ReadonlyArray<ChipItem>;
  value: string;
  onChange: (value: string) => void;
  /** Optional small icon to render to the left of the lead label. */
  leadingIcon?: React.ReactNode;
  /** Optional eyebrow label rendered above the chip strip. */
  leadLabel?: string;
  hapticType?: HapticType | 'none';
  className?: string;
}

export const ChipGroup: React.FC<ChipGroupProps> = ({
  data,
  value,
  onChange,
  leadingIcon,
  leadLabel,
  hapticType = 'selection',
  className = '',
}) => {
  return (
    <View className={className}>
      {(leadingIcon || leadLabel) ? (
        <View className="flex-row items-center mb-2">
          {leadingIcon}
          {leadLabel ? (
            <Text className="text-muted-foreground text-xs font-bold uppercase tracking-widest ml-1.5">
              {leadLabel}
            </Text>
          ) : null}
        </View>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="py-1"
        keyboardShouldPersistTaps="handled"
      >
        {data.map((item) => {
          const isSelected = value === item.value;
          return (
            <TouchableOpacity
              key={item.value}
              onPress={() => {
                if (value === item.value) return;
                if (hapticType !== 'none') triggerHaptic(hapticType);
                onChange(item.value);
              }}
              className={`mr-2.5 px-4 py-2.5 rounded-full border ${
                isSelected
                  ? 'bg-primary border-primary'
                  : 'bg-background border-border'
              }`}
              activeOpacity={0.7}
            >
              <Text
                numberOfLines={1}
                className={`text-sm font-bold ${
                  isSelected ? 'text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { Colors } from '../theme';

interface InputProps extends TextInputProps {
  label?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  error?: string | null;
  className?: string;
  inputClassName?: string;
}

/**
 * Input applies no outer spacing.
 * Pass `className="mb-4"` (or wrap in a `space-y-4` parent) to control layout.
 */
export const Input: React.FC<InputProps> = ({
  label,
  icon,
  rightElement,
  error,
  className = '',
  inputClassName = '',
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  let borderStyles = 'border-border bg-muted';
  if (isFocused) {
    borderStyles = 'border-primary bg-background shadow-sm shadow-primary/20';
  }
  if (error) {
    borderStyles = 'border-destructive bg-destructive/5';
  }

  return (
    <View className={`w-full ${className}`}>
      {label ? (
        <Text className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
          {label}
        </Text>
      ) : null}

      <View className={`flex-row items-center border rounded-xl px-4 h-14 ${borderStyles}`}>
        {icon ? <View className="mr-2">{icon}</View> : null}

        <TextInput
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={Colors.iconMuted}
          className={`flex-1 text-foreground text-base h-full font-medium ${inputClassName}`}
          {...props}
        />

        {rightElement ? <View className="ml-2">{rightElement}</View> : null}
      </View>

      {error ? (
        <Text className="text-destructive text-xs mt-1 font-semibold ml-1">
          {error}
        </Text>
      ) : null}
    </View>
  );
};
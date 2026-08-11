import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  error?: string | null;
  className?: string;
  inputClassName?: string;
}

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

  let borderStyles = 'border-zinc-200 bg-zinc-50/50';
  if (isFocused) {
    borderStyles = 'border-black bg-white shadow-sm shadow-black/5';
  }
  if (error) {
    borderStyles = 'border-red-500 bg-red-500/5';
  }

  return (
    <View className={`mb-4 w-full ${className}`}>
      {label ? (
        <Text className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
          {label}
        </Text>
      ) : null}
      
      <View className={`flex-row items-center border rounded-xl px-4 h-14 transition-colors ${borderStyles}`}>
        {icon ? <View className="mr-2">{icon}</View> : null}
        
        <TextInput
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor="#a1a1aa"
          className={`flex-1 text-zinc-900 text-base h-full font-medium ${inputClassName}`}
          {...props}
        />
        
        {rightElement ? <View className="ml-2">{rightElement}</View> : null}
      </View>
      
      {error ? (
        <Text className="text-red-500 text-xs mt-1 font-semibold ml-1">
          {error}
        </Text>
      ) : null}
    </View>
  );
};

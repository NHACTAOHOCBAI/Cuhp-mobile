import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, GestureResponderEvent, View } from 'react-native';
import * as Haptics from 'expo-haptics';

export const triggerHaptic = async (type: 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error' = 'light') => {
  try {
    switch (type) {
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'selection':
        await Haptics.selectionAsync();
        break;
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  } catch (e) {
    // Fail silently on unsupported devices/emulators
  }
};

interface ButtonProps {
  onPress?: (event: GestureResponderEvent) => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  textClassName?: string;
  icon?: React.ReactNode;
  hapticType?: 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error' | 'none';
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  title,
  variant = 'primary',
  loading = false,
  disabled = false,
  className = '',
  textClassName = '',
  icon,
  hapticType = 'light',
}) => {
  const handlePress = (event: GestureResponderEvent) => {
    if (disabled || loading) return;
    
    if (hapticType !== 'none') {
      triggerHaptic(hapticType);
    }
    
    if (onPress) {
      onPress(event);
    }
  };

  let btnStyles = 'rounded-xl flex-row items-center justify-center';
  
  if (!className.includes('w-') && !className.includes('flex-1')) {
    btnStyles += ' w-full';
  }
  if (!className.includes('h-')) {
    btnStyles += ' h-14';
  }
  if (!className.includes('shadow-')) {
    btnStyles += ' shadow-lg shadow-black/10';
  }

  let textStyles = 'text-base font-bold';

  if (variant === 'primary') {
    btnStyles += disabled ? ' bg-zinc-300 shadow-none' : ' bg-black active:bg-zinc-800';
    textStyles += ' text-white';
  } else if (variant === 'secondary') {
    btnStyles += disabled ? ' bg-zinc-100 border border-zinc-200' : ' bg-zinc-100 active:bg-zinc-200';
    textStyles += ' text-zinc-800';
  } else if (variant === 'outline') {
    btnStyles += disabled ? ' bg-white border border-zinc-200 opacity-50' : ' bg-white border border-zinc-200 active:bg-zinc-50';
    textStyles += ' text-zinc-700';
  } else if (variant === 'danger') {
    btnStyles += disabled ? ' bg-red-200' : ' bg-red-600 active:bg-red-700';
    textStyles += ' text-white';
  } else if (variant === 'ghost') {
    btnStyles = 'flex-row items-center justify-center p-2 rounded-full active:bg-zinc-100 shadow-none';
    textStyles += ' text-zinc-600';
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      className={`${btnStyles} ${className}`}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? '#000000' : '#ffffff'} />
      ) : (
        <>
          {icon ? (
            <View className={title ? "mr-2" : ""}>
              {icon}
            </View>
          ) : null}
          {title ? (
            <Text className={`${textStyles} ${textClassName}`}>{title}</Text>
          ) : null}
        </>
      )}
    </TouchableOpacity>
  );
};

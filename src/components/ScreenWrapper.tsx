import React from 'react';
import { View, ScrollView, ActivityIndicator, Text, StatusBar, StyleProp, ViewStyle, RefreshControlProps } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { Colors } from '../theme';

interface ScreenWrapperProps {
  children: React.ReactNode;
  scroll?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  keyboardShouldPersistTaps?: 'handled' | 'always' | 'never';
  /**
   * @deprecated Render a `<LoadingState />` inside `children` instead.
   * Kept temporarily for backward compatibility with existing screens.
   */
  loading?: boolean;
  /** @deprecated Use `<LoadingState message={...} />` instead. */
  loadingMessage?: string;
  edges?: Edge[];
  className?: string;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  contentContainerClassName?: string;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  scroll = false,
  refreshControl,
  keyboardShouldPersistTaps = 'handled',
  loading = false,
  loadingMessage,
  edges = ['top', 'left', 'right'],
  className = '',
  style,
  contentContainerStyle,
  contentContainerClassName = '',
}) => {
  return (
    <SafeAreaView
      edges={edges}
      className={`flex-1 bg-muted ${className}`}
      style={[{ flex: 1, backgroundColor: Colors.muted }, style]}
    >
      <StatusBar barStyle="dark-content" />
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.foreground} />
          {loadingMessage ? (
            <Text className="text-muted-foreground text-sm mt-3 font-medium">{loadingMessage}</Text>
          ) : null}
        </View>
      ) : scroll ? (
        <ScrollView
          refreshControl={refreshControl}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          style={{ flex: 1 }}
          contentContainerStyle={contentContainerStyle}
          contentContainerClassName={`flex-grow ${contentContainerClassName}`}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
};
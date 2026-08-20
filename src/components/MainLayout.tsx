import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleProp,
  ViewStyle,
  RefreshControlProps,
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme';
import { ScreenWrapper } from './ScreenWrapper';
import { Bell } from 'lucide-react-native';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  headerRight?: React.ReactNode;
  scroll?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  user?: any; // Allow passing user override
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  title = 'Cuhp',
  headerRight,
  scroll = true,
  refreshControl,
  user,
  contentContainerStyle,
}) => {
  const { user: authUser } = useAuth();
  const currentUser = user || authUser;

  const getInitials = (name: string) => {
    if (!name) return 'A';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <ScreenWrapper scroll={false} style={{ backgroundColor: '#ffffff' }}>
      {/* Fixed Gradient Background */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }}>
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id="bgGradient" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#c2e6fb" stopOpacity="0.45" />
              <Stop offset="45%" stopColor="#ffffff" stopOpacity="1" />
              <Stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#bgGradient)" />
        </Svg>
      </View>

      {/* Unified Premium Header */}
      <View
        className="flex-row justify-between items-center px-6 py-4 bg-background z-10 shadow-sm shadow-[#193665]/3 border-b border-border/5"
        style={{
          shadowColor: '#193665',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.02,
          shadowRadius: 2,
          elevation: 1,
        }}
      >
        <View className="flex-row items-center flex-1 pr-4">
          {currentUser?.avatar ? (
            <Image source={{ uri: currentUser.avatar }} className="w-8 h-8 rounded-full mr-2.5" />
          ) : (
            <View className="w-8 h-8 rounded-full bg-[#c2e6fb] items-center justify-center mr-2.5">
              <Text className="text-[#193665] text-xs font-bold">{getInitials(currentUser?.name || 'Admin')}</Text>
            </View>
          )}
          <Text className="text-xl font-black text-[#193665] flex-shrink-1" numberOfLines={1}>
            {title}
          </Text>
        </View>
        
        <View className="flex-row items-center">
          {headerRight ? (
            headerRight
          ) : (
            <TouchableOpacity className="p-1">
              <Bell size={20} color="#193665" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content Area */}
      {scroll ? (
        <ScrollView
          refreshControl={refreshControl}
          contentContainerStyle={[
            { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 120 },
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          {children}
        </View>
      )}
    </ScreenWrapper>
  );
};

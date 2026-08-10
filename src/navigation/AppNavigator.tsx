import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { BookOpen, Headphones } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import VocabularyScreen from '../screens/VocabularyScreen';
import ListeningScreen from '../screens/ListeningScreen';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  VocabularyTab: undefined;
  ListeningTab: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'VocabularyTab') {
            return <BookOpen size={size - 2} color={color} />;
          } else if (route.name === 'ListeningTab') {
            return <Headphones size={size - 2} color={color} />;
          }
          return null;
        },
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#a1a1aa',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e4e4e7',
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen
        name="VocabularyTab"
        component={VocabularyScreen}
        options={{ title: 'Từ vựng' }}
      />
      <Tab.Screen
        name="ListeningTab"
        component={ListeningScreen}
        options={{ title: 'Bài nghe' }}
      />
    </Tab.Navigator>
  );
};

// Platform helper for tabbar padding
import { Platform } from 'react-native';

export const AppNavigator = () => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {token === null ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <Stack.Screen name="Main" component={MainTabNavigator} />
      )}
    </Stack.Navigator>
  );
};

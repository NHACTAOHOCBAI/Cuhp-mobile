import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, TouchableOpacity } from 'react-native';
import { Home, BookOpen, Dumbbell, User, List } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme';
import { ErrorBoundary } from '../components/ErrorBoundary';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import EnglishHubScreen from '../screens/EnglishHubScreen';
import ReadingDetailScreen from '../screens/ReadingDetailScreen';
import ListeningDetailScreen from '../screens/ListeningDetailScreen';
import FlashcardScreen from '../screens/FlashcardScreen';
import TodoScreen from '../screens/TodoScreen';
import GymScreen from '../screens/GymScreen';
import SettingScreen from '../screens/SettingScreen';
import SleepTrackerScreen from '../screens/SleepTrackerScreen';

// Wrap with ErrorBoundary to catch runtime errors and print stack trace
const ReadingDetailWithBoundary = () => (
  <ErrorBoundary>
    <ReadingDetailScreen />
  </ErrorBoundary>
);

const ListeningDetailWithBoundary = () => (
  <ErrorBoundary>
    <ListeningDetailScreen />
  </ErrorBoundary>
);

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  ReadingDetail: { passageId: string };
  ListeningDetail: { audioId: string };
  Review: undefined;
  Flashcard: undefined;
  Todo: undefined;
  Gym: undefined;
  SleepTracker: undefined;
};

export type MainTabParamList = {
  DashboardTab: undefined;
  EnglishTab: undefined;
  TodoTab: undefined;
  GymTab: undefined;
  SettingsTab: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#C7739A',
        tabBarInactiveTintColor: '#706065',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          borderTopWidth: 1,
          borderTopColor: '#F0EAEB',
          height: 90,
          paddingTop: 12,
          paddingBottom: 28,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          shadowColor: '#EFBCD5',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 12,
        },
        tabBarButton: (props) => (
          <TouchableOpacity {...(props as any)} activeOpacity={0.8} />
        ),
        tabBarIcon: ({ color }) => {
          let IconComponent;
          if (route.name === 'DashboardTab') {
            IconComponent = Home;
          } else if (route.name === 'EnglishTab') {
            IconComponent = BookOpen;
          } else if (route.name === 'GymTab') {
            IconComponent = Dumbbell;
          } else if (route.name === 'TodoTab') {
            IconComponent = List;
          } else if (route.name === 'SettingsTab') {
            IconComponent = User;
          }

          if (!IconComponent) return null;

          return <IconComponent size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="EnglishTab"
        component={EnglishHubScreen}
        options={{ title: 'English' }}
      />
      <Tab.Screen
        name="GymTab"
        component={GymScreen}
        options={{ title: 'Gym' }}
      />
      <Tab.Screen
        name="TodoTab"
        component={TodoScreen}
        options={{ title: 'Tasks' }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.foreground} />
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
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen name="ReadingDetail" component={ReadingDetailWithBoundary} />
          <Stack.Screen name="ListeningDetail" component={ListeningDetailWithBoundary} />
          <Stack.Screen name="Flashcard" component={FlashcardScreen} />
          <Stack.Screen name="Todo" component={TodoScreen} />
          <Stack.Screen name="Gym" component={GymScreen} />
          <Stack.Screen name="SleepTracker" component={SleepTrackerScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};
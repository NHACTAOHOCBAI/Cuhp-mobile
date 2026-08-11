import "./global.css";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import { SettingsProvider } from "./src/context/SettingsContext";
import { AppNavigator } from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <SafeAreaProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </SafeAreaProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

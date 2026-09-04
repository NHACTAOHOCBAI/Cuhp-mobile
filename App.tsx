import "./global.css";
import React, { useEffect } from "react";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import { SettingsProvider } from "./src/context/SettingsContext";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { ErrorBoundary } from "./src/components/ErrorBoundary";
import * as Notifications from "expo-notifications";
import * as Speech from "expo-speech";
import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";
import { reviewVocabulary } from "./src/api/client";

// Navigation ref to allow navigation from outside the Navigator component
export const navigationRef = createNavigationContainerRef<any>();

export default function App() {
  useEffect(() => {
    // Subscribe to events when the user taps a notification or a quick action button
    const subscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const { actionIdentifier, notification } = response;
      const data = notification.request.content.data;
      const categoryIdentifier = notification.request.content.categoryIdentifier;

      // Handle sleep-related actions
      if (actionIdentifier === "START_SLEEP") {
        try {
          const nowStr = new Date().toISOString();
          await SecureStore.setItemAsync("sleep-start-time", nowStr);
          Alert.alert("Sweet dreams! 🌙", "Your bedtime has been recorded. Turn off the phone screen and rest.");
          if (navigationRef.isReady()) {
            navigationRef.navigate("SleepTracker");
          }
        } catch (err) {
          console.error("Error recording sleep start:", err);
        }
        return;
      }

      if (actionIdentifier === "END_SLEEP") {
        try {
          const startTimeStr = await SecureStore.getItemAsync("sleep-start-time");
          const token = await SecureStore.getItemAsync("user-token");

          if (!startTimeStr) {
            Alert.alert("Good morning! ☀️", "We couldn't find a bedtime start to calculate from. You can add it manually.");
            if (navigationRef.isReady()) {
              navigationRef.navigate("SleepTracker");
            }
            return;
          }

          const sleepTime = new Date(startTimeStr);
          const wakeTime = new Date();
          const durationHrs = (wakeTime.getTime() - sleepTime.getTime()) / (1000 * 60 * 60);

          if (token) {
            const { logSleepSession } = require("./src/api/client");
            const sleepDateStr = sleepTime.toISOString().split("T")[0]; // YYYY-MM-DD
            await logSleepSession({
              sleep_date: sleepDateStr,
              sleep_time_actual: sleepTime.toISOString(),
              wake_time_actual: wakeTime.toISOString(),
              notes: "Quick-logged via notification"
            }, token);

            await SecureStore.deleteItemAsync("sleep-start-time");
            Alert.alert("Good morning! ☀️", `You slept for ${durationHrs.toFixed(1)} hours. Your sleep was saved automatically to the journal.`);
          } else {
            Alert.alert("Good morning! ☀️", "Please log in to save your sleep data.");
          }

          if (navigationRef.isReady()) {
            navigationRef.navigate("SleepTracker");
          }
        } catch (err) {
          console.error("Error recording wake-up:", err);
          Alert.alert("Error", "Could not record sleep data.");
        }
        return;
      }

      // Tap directly on a sleep notification body
      if (categoryIdentifier === "sleep-bedtime" || categoryIdentifier === "sleep-wakeup") {
        if (navigationRef.isReady()) {
          navigationRef.navigate("SleepTracker");
        }
        return;
      }

      // Handle vocabulary-related actions
      const vocabId = data?.vocabId as string;
      const word = data?.word as string;

      if (!vocabId || !word) return;

      try {
        const token = await SecureStore.getItemAsync("user-token");

        if (actionIdentifier === "MARK_KNOWN") {
          // "Got it" button -> call the API to update progress
          if (token && vocabId !== "test-vocab-id") {
            await reviewVocabulary(vocabId, true, token);
          }
          Alert.alert("Congrats! 🎉", `You remembered: "${word}". Keep it up!`);

          // Navigate to the English tab
          if (navigationRef.isReady()) {
            navigationRef.navigate("Main", { screen: "EnglishTab" });
          }
        } else if (actionIdentifier === "MARK_FORGOTTEN") {
          // "Review again" button -> call the API to update
          if (token && vocabId !== "test-vocab-id") {
            await reviewVocabulary(vocabId, false, token);
          }
          Alert.alert("Keep going! 💪", `"${word}" has been moved back to Box 1 for review.`);

          if (navigationRef.isReady()) {
            navigationRef.navigate("Main", { screen: "EnglishTab" });
          }
        } else if (actionIdentifier === "PRONOUNCE") {
          // "Pronounce" button -> read the word out loud
          const storedAccent = await SecureStore.getItemAsync("settings-accent") || "en-US";
          const storedRate = await SecureStore.getItemAsync("settings-rate") || "0.9";

          Speech.speak(word, {
            language: storedAccent,
            rate: parseFloat(storedRate),
          });
        } else {
          // Tap on the notification body itself -> open the English tab
          if (navigationRef.isReady()) {
            navigationRef.navigate("Main", { screen: "EnglishTab" });
          }
        }
      } catch (err: any) {
        console.error("Error handling notification interaction:", err);
        Alert.alert("Notification", `Vocabulary: "${word}"`);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <SettingsProvider>
          <SafeAreaProvider>
            <NavigationContainer ref={navigationRef}>
              <AppNavigator />
            </NavigationContainer>
          </SafeAreaProvider>
        </SettingsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

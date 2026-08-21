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

// Khởi tạo ref điều hướng để sử dụng bên ngoài component Navigator
export const navigationRef = createNavigationContainerRef<any>();

export default function App() {
  useEffect(() => {
    // Đăng ký lắng nghe sự kiện khi người dùng click vào thông báo hoặc nhấn nút tương tác nhanh
    const subscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const { actionIdentifier, notification } = response;
      const data = notification.request.content.data;
      const vocabId = data?.vocabId as string;
      const word = data?.word as string;

      if (!vocabId || !word) return;

      try {
        const token = await SecureStore.getItemAsync("user-token");

        if (actionIdentifier === "MARK_KNOWN") {
          // Nút "Đã thuộc" -> Gọi API cập nhật tiến trình
          if (token && vocabId !== "test-vocab-id") {
            await reviewVocabulary(vocabId, true, token);
          }
          Alert.alert("Chúc mừng! 🎉", `Bạn đã thuộc từ: "${word}". Tiếp tục phát huy nhé!`);
          
          // Điều hướng người dùng sang Tab tiếng Anh (EnglishTab)
          if (navigationRef.isReady()) {
            navigationRef.navigate("Main", { screen: "EnglishTab" });
          }
        } else if (actionIdentifier === "MARK_FORGOTTEN") {
          // Nút "Ôn lại" -> Gọi API cập nhật
          if (token && vocabId !== "test-vocab-id") {
            await reviewVocabulary(vocabId, false, token);
          }
          Alert.alert("Cố gắng lên! 💪", `Từ "${word}" đã được chuyển về Hộp 1 để ôn tập.`);
          
          if (navigationRef.isReady()) {
            navigationRef.navigate("Main", { screen: "EnglishTab" });
          }
        } else if (actionIdentifier === "PRONOUNCE") {
          // Nút "Phát âm" -> Đọc từ vựng
          const storedAccent = await SecureStore.getItemAsync("settings-accent") || "en-US";
          const storedRate = await SecureStore.getItemAsync("settings-rate") || "0.9";
          
          Speech.speak(word, {
            language: storedAccent,
            rate: parseFloat(storedRate),
          });
        } else {
          // Click vào bản thân thông báo -> Mở tab tiếng Anh (EnglishTab)
          if (navigationRef.isReady()) {
            navigationRef.navigate("Main", { screen: "EnglishTab" });
          }
        }
      } catch (err: any) {
        console.error("Lỗi xử lý tương tác thông báo:", err);
        Alert.alert("Thông báo", `Từ vựng: "${word}"`);
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



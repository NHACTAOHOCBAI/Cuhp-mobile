import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { User, Lock, Eye, EyeOff, BookOpen } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import { loginRequest } from "../api/client";

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Vui lòng điền đầy đủ tên đăng nhập và mật khẩu.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await loginRequest(username, password);
      await login(response.token, response.user);
    } catch (err: any) {
      setError(err.message || "Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          className="px-6 py-12"
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center mb-10">
            {/* White and Black Logo Block - Monochrome inversion */}
            <View className="h-16 w-16 rounded-2xl bg-black items-center justify-center shadow-lg shadow-black/10 mb-4">
              <BookOpen size={36} color="#ffffff" />
            </View>
            <Text className="text-3xl font-extrabold text-zinc-900 tracking-tight">
              Vocabulary Hub
            </Text>
            <Text className="text-zinc-500 text-sm mt-2 text-center">
              Đăng nhập vào hệ thống quản lý từ vựng cá nhân
            </Text>
          </View>

          <View className="space-y-4">
            {error && (
              <View className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl mb-4">
                <Text className="text-red-600 text-sm text-center">{error}</Text>
              </View>
            )}

            {/* Username Input */}
            <View className="mb-4">
              <Text className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                Tên đăng nhập
              </Text>
              <View className="flex-row items-center bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 h-14">
                <User size={20} color="#71717a" />
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Nhập tên đăng nhập"
                  placeholderTextColor="#a1a1aa"
                  autoCapitalize="none"
                  className="flex-1 text-zinc-900 ml-3 text-base h-full"
                />
              </View>
            </View>

            {/* Password Input */}
            <View className="mb-6">
              <Text className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                Mật khẩu
              </Text>
              <View className="flex-row items-center bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 h-14">
                <Lock size={20} color="#71717a" />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Nhập mật khẩu"
                  placeholderTextColor="#a1a1aa"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  className="flex-1 text-zinc-900 ml-3 text-base h-full"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="p-1"
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#71717a" />
                  ) : (
                    <Eye size={20} color="#71717a" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Monochrome Submit Button - Black background */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              className="w-full bg-black h-14 rounded-xl items-center justify-center shadow-lg shadow-black/10 active:bg-zinc-800"
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white text-base font-bold">
                  Đăng nhập
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

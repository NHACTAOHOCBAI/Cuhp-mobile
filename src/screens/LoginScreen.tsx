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
  SafeAreaView,
  StatusBar,
} from "react-native";
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
    <SafeAreaView className="flex-1 bg-[#0f172a]">
      <StatusBar barStyle="light-content" />
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
            <View className="h-16 w-16 rounded-2xl bg-indigo-600 items-center justify-center shadow-lg shadow-indigo-500/30 mb-4">
              <BookOpen size={36} color="#ffffff" />
            </View>
            <Text className="text-3xl font-bold text-white tracking-tight">
              Vocabulary Hub
            </Text>
            <Text className="text-slate-400 text-sm mt-2 text-center">
              Đăng nhập để xem và quản lý từ vựng của bạn
            </Text>
          </View>

          <View className="space-y-4">
            {error && (
              <View className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl mb-4">
                <Text className="text-red-400 text-sm text-center">{error}</Text>
              </View>
            )}

            {/* Username Input */}
            <View className="mb-4">
              <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Tên đăng nhập
              </Text>
              <View className="flex-row items-center bg-slate-900/60 border border-slate-800 rounded-xl px-4 h-14">
                <User size={20} color="#94a3b8" />
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Nhập tên đăng nhập"
                  placeholderTextColor="#475569"
                  autoCapitalize="none"
                  className="flex-1 text-white ml-3 text-base h-full"
                />
              </View>
            </View>

            {/* Password Input */}
            <View className="mb-6">
              <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Mật khẩu
              </Text>
              <View className="flex-row items-center bg-slate-900/60 border border-slate-800 rounded-xl px-4 h-14">
                <Lock size={20} color="#94a3b8" />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Nhập mật khẩu"
                  placeholderTextColor="#475569"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  className="flex-1 text-white ml-3 text-base h-full"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="p-1"
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#94a3b8" />
                  ) : (
                    <Eye size={20} color="#94a3b8" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              className="w-full bg-indigo-600 h-14 rounded-xl items-center justify-center shadow-lg shadow-indigo-600/30 active:bg-indigo-700"
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white text-base font-semibold">
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

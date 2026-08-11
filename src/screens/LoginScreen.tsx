import React, { useState } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { User, Lock, Eye, EyeOff, BookOpen } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import { loginRequest } from "../api/client";
import { ScreenWrapper } from "../components/ScreenWrapper";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { Card } from "../components/Card";

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
    <ScreenWrapper scroll edges={['top', 'bottom', 'left', 'right']} className="bg-white" contentContainerClassName="justify-center px-6 py-12">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-center"
      >
        <View className="items-center mb-10">
          {/* Logo container */}
          <Card variant="dark" className="h-16 w-16 items-center justify-center p-0 rounded-2xl mb-4">
            <BookOpen size={36} color="#ffffff" />
          </Card>
          <Text className="text-3xl font-extrabold text-zinc-900 tracking-tight">
            Vocabulary Hub
          </Text>
          <Text className="text-zinc-500 text-sm mt-2 text-center">
            Đăng nhập vào hệ thống quản lý từ vựng cá nhân
          </Text>
        </View>

        <View className="space-y-4">
          {error && (
            <Card variant="red" className="p-4 rounded-xl mb-4">
              <Text className="text-red-600 text-sm text-center font-semibold">{error}</Text>
            </Card>
          )}

          {/* Username Input */}
          <Input
            label="Tên đăng nhập"
            value={username}
            onChangeText={setUsername}
            placeholder="Nhập tên đăng nhập"
            autoCapitalize="none"
            icon={<User size={20} color="#71717a" />}
          />

          {/* Password Input */}
          <Input
            label="Mật khẩu"
            value={password}
            onChangeText={setPassword}
            placeholder="Nhập mật khẩu"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            icon={<Lock size={20} color="#71717a" />}
            rightElement={
              <Button
                variant="ghost"
                hapticType="selection"
                onPress={() => setShowPassword(!showPassword)}
                title=""
                icon={
                  showPassword ? (
                    <EyeOff size={20} color="#71717a" />
                  ) : (
                    <Eye size={20} color="#71717a" />
                  )
                }
              />
            }
          />

          {/* Submit Button */}
          <Button
            title="Đăng nhập"
            loading={loading}
            onPress={handleLogin}
            className="mt-2"
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

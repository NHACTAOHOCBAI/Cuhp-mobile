import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { User, Lock, Eye, EyeOff, BookOpen } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { loginRequest } from '../api/client';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { Input } from '../components/Input';
import { IconButton } from '../components/IconButton';
import { IconTile } from '../components/IconTile';
import { ButtonPrimary } from '../components/Button';
import { Card } from '../components/Card';
import { Colors } from '../theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Vui lòng điền đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await loginRequest(username, password);
      await login(response.token, response.user);
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper
      scroll
      edges={['top', 'bottom', 'left', 'right']}
      className="bg-background"
      contentContainerClassName="justify-center px-6 py-12"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-center"
      >
        <View className="items-center mb-10">
          <View className="mb-4">
            <IconTile
              tone="dark"
              size="lg"
              shape="rounded"
              icon={<BookOpen size={36} color={Colors.onDark} />}
            />
          </View>
          <Text className="text-3xl font-extrabold text-foreground tracking-tight">
            Vocabulary Hub
          </Text>
          <Text className="text-muted-foreground text-sm mt-2 text-center">
            Đăng nhập vào hệ thống quản lý từ vựng cá nhân
          </Text>
        </View>

        <View className="space-y-4">
          {error ? (
            <Card variant="red" className="p-4 mb-4 rounded-xl">
              <Text className="text-destructive text-sm text-center font-semibold">
                {error}
              </Text>
            </Card>
          ) : null}

          <View className="mb-4">
            <Input
              label="Tên đăng nhập"
              value={username}
              onChangeText={setUsername}
              placeholder="Nhập tên đăng nhập"
              autoCapitalize="none"
              icon={<User size={20} color={Colors.iconMuted} />}
            />
          </View>

          <View className="mb-6">
            <Input
              label="Mật khẩu"
              value={password}
              onChangeText={setPassword}
              placeholder="Nhập mật khẩu"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              icon={<Lock size={20} color={Colors.iconMuted} />}
              rightElement={
                <IconButton
                  variant="soft"
                  size="md"
                  onPress={() => setShowPassword(!showPassword)}
                  accessibilityLabel={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  icon={
                    showPassword ? (
                      <EyeOff size={20} color={Colors.iconMuted} />
                    ) : (
                      <Eye size={20} color={Colors.iconMuted} />
                    )
                  }
                />
              }
            />
          </View>

          <ButtonPrimary
            title="Đăng nhập"
            loading={loading}
            onPress={handleLogin}
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Mail, Lock, Eye, EyeOff, PawPrint } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { loginRequest } from '../api/client';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { Input } from '../components/Input';
import { Colors } from '../theme';

// SVG Google Icon
const GoogleIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24">
    <Path
      fill="#EA4335"
      d="M12 5.04c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.77 14.97.68 12 .68 7.7.68 3.99 3.15 2.18 6.74l3.66 2.84c.87-2.6 3.3-4.54 6.16-4.54z"
    />
    <Path
      fill="#4285F4"
      d="M22.56 12c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <Path
      fill="#FBBC05"
      d="M5.84 13.77c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V6.74H2.18C1.43 8.23 1 9.9 1 11.68s.43 3.45 1.18 4.94l3.66-2.85z"
    />
    <Path
      fill="#34A853"
      d="M12 22.68c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.21 7.7 22.68 12 22.68z"
    />
  </Svg>
);

// SVG Apple Icon
const AppleIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="#000000">
    <Path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.69-1.12 1.83-.98 2.94 1.07.08 2.16-.52 2.81-1.33" />
  </Svg>
);

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all details.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Map email input to backend username login request
      const response = await loginRequest(email.trim(), password);
      await login(response.token, response.user, response.refresh_token);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper
      scroll
      edges={['top', 'bottom', 'left', 'right']}
      style={{ backgroundColor: '#FCFAF7' }}
      className="bg-[#FCFAF7]"
      contentContainerClassName="justify-center px-4 py-8"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-center"
      >
        <View className="bg-white rounded-[32px] border border-[#F0EAEB] overflow-hidden shadow-sm shadow-[#EFBCD5]/20" style={{ borderColor: '#F0EAEB' }}>
          {/* Main content */}
          <View className="p-8">
            {/* Header */}
            <View className="items-center mb-8">
              <View className="w-16 h-16 bg-[#fcf1f5] border border-[#F0EAEB] rounded-2xl items-center justify-center mb-4" style={{ borderColor: '#F0EAEB' }}>
                <PawPrint size={32} color="#C7739A" />
              </View>
              <Text className="text-4xl font-bold text-[#EFBCD5] tracking-tight">
                Cuhp
              </Text>
              <Text className="text-[#706065] text-sm mt-2 text-center font-medium">
                Welcome back. Please enter your details.
              </Text>
            </View>

            {/* Error Message */}
            {error ? (
              <View className="bg-red-50 border border-red-100 p-4 mb-5 rounded-2xl">
                <Text className="text-red-600 text-sm text-center font-semibold">
                  {error}
                </Text>
              </View>
            ) : null}

            {/* Input fields */}
            <View className="gap-y-6">
              <View>
                <Text className="text-[11px] font-bold text-[#706065] uppercase tracking-widest mb-2.5 pl-1">
                  Email Address
                </Text>
                <Input
                  value={email}
                  onChangeText={setEmail}
                  placeholder="hello@example.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  icon={<Mail size={20} color="#706065" />}
                  className="mb-0"
                  inputClassName="text-[#1f1a1d]"
                  style={{ borderRadius: 9999, height: 54, borderColor: '#F0EAEB' }}
                />
              </View>

              <View>
                <Text className="text-[11px] font-bold text-[#706065] uppercase tracking-widest mb-2.5 pl-1">
                  Password
                </Text>
                <Input
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  icon={<Lock size={20} color="#706065" />}
                  className="mb-0"
                  inputClassName="text-[#1f1a1d]"
                  style={{ borderRadius: 9999, height: 54, borderColor: '#F0EAEB' }}
                  rightElement={
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      activeOpacity={0.6}
                      className="p-1 mr-1"
                    >
                      {showPassword ? (
                        <EyeOff size={20} color="#706065" />
                      ) : (
                        <Eye size={20} color="#706065" />
                      )}
                    </TouchableOpacity>
                  }
                />
                <TouchableOpacity activeOpacity={0.7} className="align-self-end self-end pr-1 mt-3">
                  <Text className="text-[#C7739A] text-sm font-semibold">
                    Forgot password?
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
                className="w-full h-14 bg-[#EFBCD5] rounded-full items-center justify-center shadow-md shadow-[#EFBCD5]/40 mt-1"
              >
                <Text className="text-[#1f1a1d] text-base font-bold">
                  {loading ? 'Logging in...' : 'Login'}
                </Text>
              </TouchableOpacity>

              {/* OR Separator */}
              <View className="flex-row items-center my-1 py-1">
                <View className="flex-1 h-[1px] bg-[#F0EAEB]" />
                <Text className="mx-4 text-[10px] font-bold text-[#706065] uppercase tracking-wider">
                  OR
                </Text>
                <View className="flex-1 h-[1px] bg-[#F0EAEB]" />
              </View>

              {/* Continue with Google */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={{ borderColor: '#F0EAEB' }}
                className="w-full h-14 bg-[#fcf1f5] rounded-full flex-row items-center justify-center border border-[#F0EAEB]"
              >
                <GoogleIcon />
                <Text className="text-[#706065] text-base font-semibold ml-3">
                  Continue with Google
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View className="bg-[#FCFAF7] py-5 border-t border-[#F0EAEB] items-center justify-center" style={{ borderTopColor: '#F0EAEB' }}>
            <TouchableOpacity activeOpacity={0.7} className="flex-row">
              <Text className="text-[#706065] text-sm font-medium">
                Don't have an account?{' '}
              </Text>
              <Text className="text-[#C7739A] text-sm font-bold">
                Sign up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}


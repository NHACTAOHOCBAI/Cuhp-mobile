import React, { useState, useEffect } from 'react';
import { View, Text, Switch, Platform, ScrollView, TouchableOpacity, Image } from 'react-native';
import {
  LogOut,
  Bell,
  User,
  Volume2,
  ChevronDown,
  ChevronUp,
  Play,
  Flame,
  Sparkles,
  Accessibility,
  Shield,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useSettings, SpeechAccent } from '../context/SettingsContext';
import * as Speech from 'expo-speech';
import * as SecureStore from 'expo-secure-store';
import { MainLayout } from '../components/MainLayout';
import { Colors } from '../theme';
import { triggerHaptic } from '../components/Button';
import { updateUserProfile } from '../api/client';
import { NotificationSettings } from '../components/NotificationSettings';

export default function SettingScreen() {
  const { user, token, login, logout } = useAuth();
  const {
    accent,
    speechRate,
    setAccent,
    setSpeechRate,
  } = useSettings();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [weeklyReports, setWeeklyReports] = useState(false);
  const [streakFreezes, setStreakFreezes] = useState(2);

  useEffect(() => {
    const loadFreezes = async () => {
      try {
        const stored = await SecureStore.getItemAsync('settings-streak-freezes');
        if (stored !== null) {
          setStreakFreezes(parseInt(stored));
        } else {
          await SecureStore.setItemAsync('settings-streak-freezes', '2');
        }
      } catch (e) {
        console.warn(e);
      }
    };
    loadFreezes();
  }, []);

  const handleTargetChange = async (newTarget: number) => {
    if (newTarget < 1) return;
    try {
      const updatedUser = await updateUserProfile({ daily_target: newTarget }, token);
      if (token) {
        await login(token, updatedUser);
      }
      triggerHaptic('success');
    } catch (err) {
      console.error('Lỗi khi cập nhật mục tiêu hàng ngày:', err);
      triggerHaptic('error');
    }
  };

  const handleAccentChange = async (newAccent: SpeechAccent) => {
    await setAccent(newAccent);
    setDropdownOpen(false);
    triggerHaptic('selection');
    const testPhrase = newAccent === 'en-US' ? 'Welcome' : 'Welcome';
    Speech.speak(testPhrase, {
      language: newAccent,
      pitch: 1.0,
      rate: speechRate,
    });
  };

  const handleRateChange = async (newRate: number) => {
    await setSpeechRate(newRate);
    triggerHaptic('selection');
    Speech.speak('Hello', {
      language: accent,
      pitch: 1.0,
      rate: newRate,
    });
  };

  const testVoice = () => {
    triggerHaptic('light');
    const phrase = accent === 'en-US' 
      ? 'Đây là bản đọc thử giọng Anh Mỹ với tốc độ tiêu chuẩn.' 
      : 'Đây là bản đọc thử giọng Anh Anh với tốc độ tiêu chuẩn.';
    Speech.speak(phrase, {
      language: accent,
      pitch: 1.0,
      rate: speechRate,
    });
  };

  const dailyTarget = user?.daily_target || 5;
  const wordsReviewed = user?.words_reviewed_today || 0;
  // Calculate progress percentage for daily goal (clamp between 5% and 100% for UI purposes)
  const progressPercent = Math.min(100, Math.max(8, (wordsReviewed / dailyTarget) * 100));

  // Speech rate steps for custom slider
  const rateSteps = [0.5, 0.75, 1.0, 1.25, 1.5];

  return (
    <MainLayout
      title="Cuhp"
      scroll={false}
    >
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View className="bg-card border border-border/40 rounded-3xl p-6 shadow-sm shadow-[#193665]/3 items-center mb-5">
          <View className="relative mb-3">
            {user?.avatar ? (
              <Image
                source={{ uri: user.avatar }}
                className="w-20 h-20 rounded-full border-4 border-white shadow-md shadow-black/10"
              />
            ) : (
              <View className="w-20 h-20 rounded-full bg-[#c2e6fb] border-4 border-white items-center justify-center shadow-md shadow-black/10">
                <Text className="text-[#193665] text-2xl font-black">
                  {user?.name?.slice(0, 2).toUpperCase() || 'AD'}
                </Text>
              </View>
            )}
          </View>
          
          <Text className="text-foreground text-xl font-black">{user?.name || 'Người dùng Cuhp'}</Text>
          <Text className="text-muted-foreground text-xs mt-0.5">
            {user?.username ? `${user.username}@cuhp.app` : 'user@cuhp.app'}
          </Text>

          {/* Daily Streak Goal pill - Bộ đếm tăng giảm linh hoạt */}
          <View className="bg-muted/60 rounded-3xl px-5 py-4 mt-5 w-full items-center">
            <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
              MỤC TIÊU HỌC HÀNG NGÀY
            </Text>
            
            <View className="flex-row items-center justify-between w-full px-2">
              <TouchableOpacity
                onPress={() => {
                  if (dailyTarget > 1) {
                    handleTargetChange(dailyTarget - 1);
                  }
                }}
                className="w-10 h-10 bg-[#e0f2fe] rounded-full items-center justify-center border border-primary/10"
              >
                <Text className="text-primary font-black text-lg">-</Text>
              </TouchableOpacity>
              
              <Text className="text-foreground text-base font-black">
                {dailyTarget} từ / ngày
              </Text>
              
              <TouchableOpacity
                onPress={() => {
                  if (dailyTarget < 50) {
                    handleTargetChange(dailyTarget + 1);
                  }
                }}
                className="w-10 h-10 bg-[#e0f2fe] rounded-full items-center justify-center border border-primary/10"
              >
                <Text className="text-primary font-black text-lg">+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Streak Freeze Shields Info */}
          <View className="bg-amber-500/10 rounded-full px-5 py-3 mt-3 w-full flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Shield size={16} color={Colors.warning} className="mr-2" />
              <Text className="text-foreground text-[10px] font-bold uppercase tracking-wider">
                Khiên Đóng Băng Streak
              </Text>
            </View>
            <Text className="text-[#193665] text-xs font-black">
              Đang có {streakFreezes}
            </Text>
          </View>
        </View>

        {/* Speech Configuration Card */}
        <View className="bg-card border border-border/40 rounded-3xl p-6 shadow-sm shadow-[#193665]/3 mb-5">
          <View className="flex-row items-center mb-4">
            <View className="w-8 h-8 rounded-full bg-purple/10 items-center justify-center mr-3">
              <Volume2 size={16} color={Colors.purple} />
            </View>
            <Text className="text-foreground font-black text-base">Cấu hình giọng đọc</Text>
          </View>

          <View className="border-t border-border/40 pt-4">
            <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">GIỌNG PHÁT ÂM</Text>
            
            {/* Custom Dropdown Trigger */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setDropdownOpen(!dropdownOpen)}
              className="flex-row justify-between items-center bg-muted/40 border border-border/40 rounded-full px-5 py-3.5 mb-2"
            >
              <Text className="text-foreground text-xs font-bold">
                {accent === 'en-US' ? 'Tiếng Anh Mỹ (en-US)' : 'Tiếng Anh Anh (en-GB)'}
              </Text>
              {dropdownOpen ? <ChevronUp size={16} color={Colors.iconMuted} /> : <ChevronDown size={16} color={Colors.iconMuted} />}
            </TouchableOpacity>

            {/* Dropdown Options */}
            {dropdownOpen && (
              <View className="bg-muted/40 border border-border/40 rounded-2xl p-1 mb-4 overflow-hidden">
                <TouchableOpacity
                  onPress={() => handleAccentChange('en-US')}
                  className={`px-4 py-3 rounded-xl ${accent === 'en-US' ? 'bg-primary/5' : ''}`}
                >
                  <Text className={`text-xs font-bold ${accent === 'en-US' ? 'text-primary' : 'text-foreground'}`}>
                    Tiếng Anh Mỹ (en-US)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleAccentChange('en-GB')}
                  className={`px-4 py-3 rounded-xl ${accent === 'en-GB' ? 'bg-primary/5' : ''}`}
                >
                  <Text className={`text-xs font-bold ${accent === 'en-GB' ? 'text-primary' : 'text-foreground'}`}>
                    Tiếng Anh Anh (en-GB)
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Speech Rate Slider Section */}
            <View className="mt-4">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">TỐC ĐỘ ĐỌC</Text>
                <View className="bg-primary/10 px-2 py-0.5 rounded">
                  <Text className="text-primary text-[10px] font-black">{speechRate.toFixed(2)}x</Text>
                </View>
              </View>

              {/* Custom Slider with steps */}
              <View className="flex-row items-center px-1 py-2">
                <Accessibility size={16} color={Colors.iconMuted} className="mr-3" />
                
                <View className="flex-1 h-8 justify-center relative">
                  <View className="w-full h-1 bg-border/60 rounded-full" />
                  
                  {/* Render step points and handle selection */}
                  {rateSteps.map((step) => {
                    // Position calculations
                    const index = rateSteps.indexOf(step);
                    const totalSteps = rateSteps.length - 1;
                    const leftPos = `${(index / totalSteps) * 100}%`;
                    const isActive = speechRate === step;

                    return (
                      <TouchableOpacity
                        key={step}
                        onPress={() => handleRateChange(step)}
                        style={{ left: leftPos as any, transform: [{ translateX: -8 }] }}
                        className="absolute w-4 h-4 justify-center items-center"
                      >
                        <View 
                          style={isActive ? { transform: [{ scale: 1.25 }] } : undefined}
                          className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-primary' : 'bg-muted-foreground/30'}`} 
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Accessibility size={16} color={Colors.iconMuted} className="ml-3 rotate-12 scale-110" />
              </View>
            </View>

            {/* Test Voice Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={testVoice}
              className="mt-6 bg-primary/10 border border-primary/5 rounded-full py-3.5 items-center justify-center flex-row"
            >
              <Play size={14} color={Colors.primary} className="mr-2" />
              <Text className="text-primary text-xs font-black">Nghe thử giọng đọc</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications Card */}
        <NotificationSettings />

        {/* Weekly Reports Section (Báo cáo tuần) */}
        <View className="bg-card border border-border/40 rounded-3xl p-6 shadow-sm shadow-[#193665]/3 mb-5">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <Text className="text-foreground text-xs font-bold">Báo cáo tuần</Text>
              <Text className="text-muted-foreground text-[10px] mt-0.5">Tóm tắt tiến trình học tập qua email hàng tuần</Text>
            </View>
            <Switch
              value={weeklyReports}
              onValueChange={setWeeklyReports}
              trackColor={{ false: Colors.trackOff, true: Colors.foreground }}
              thumbColor={Platform.OS === 'android' ? Colors.background : undefined}
            />
          </View>
        </View>

        {/* Account Card */}
        <View className="bg-card border border-border/40 rounded-3xl p-6 shadow-sm shadow-[#193665]/3 mb-5">
          <View className="flex-row items-center mb-3">
            <View className="w-8 h-8 rounded-full bg-slate-500/10 items-center justify-center mr-3">
              <User size={16} color="#64748b" />
            </View>
            <Text className="text-foreground font-black text-base">Tài khoản</Text>
          </View>

          <View className="border-t border-border/40 pt-4">
            <Text className="text-muted-foreground text-[10px] leading-normal mb-5">
              Quản lý dữ liệu của bạn, gói đăng ký và bảo mật tài khoản.
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              className="border border-border/60 rounded-full py-3.5 items-center justify-center mb-3"
            >
              <Text className="text-foreground text-xs font-bold">Quản lý gói đăng ký</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={logout}
              className="bg-red-50 border border-red-100 rounded-full py-3.5 items-center justify-center flex-row"
            >
              <LogOut size={14} color={Colors.destructive} className="mr-2" />
              <Text className="text-destructive text-xs font-bold">Đăng xuất</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </MainLayout>
  );
}

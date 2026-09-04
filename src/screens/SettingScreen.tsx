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
  Moon,
  ChevronRight,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
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
  const navigation = useNavigation<any>();
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

  // Hydrate the weekly-reports toggle from SecureStore on mount.
  useEffect(() => {
    const loadWeeklyReports = async () => {
      try {
        const stored = await SecureStore.getItemAsync('settings-weekly-reports');
        if (stored !== null) {
          setWeeklyReports(stored === 'true');
        }
      } catch (e) {
        console.warn(e);
      }
    };
    loadWeeklyReports();
  }, []);

  // Persist weekly-reports toggle whenever it changes.
  const handleWeeklyReportsChange = async (value: boolean) => {
    setWeeklyReports(value);
    try {
      await SecureStore.setItemAsync('settings-weekly-reports', String(value));
    } catch (e) {
      console.warn('Failed to persist weekly-reports setting:', e);
    }
  };

  const handleTargetChange = async (newTarget: number) => {
    if (newTarget < 1) return;
    try {
      const updatedUser = await updateUserProfile({ daily_target: newTarget }, token);
      if (token) {
        await login(token, updatedUser);
      }
      triggerHaptic('success');
    } catch (err) {
      console.error('Error updating daily target:', err);
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
      ? 'This is a sample of American English at standard speed.'
      : 'This is a sample of British English at standard speed.';
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
        <View className="bg-white border border-[#F0EAEB] rounded-3xl p-6 shadow-sm shadow-[#EFBCD5]/20 items-center mb-5" style={{ borderColor: '#F0EAEB' }}>
          <View className="relative mb-3">
            {user?.avatar ? (
              <Image
                source={{ uri: user.avatar }}
                className="w-20 h-20 rounded-full border-4 border-white shadow-md shadow-black/10"
              />
            ) : (
              <View className="w-20 h-20 rounded-full bg-[#fcf1f5] border-4 border-[#F0EAEB] items-center justify-center shadow-md shadow-black/10" style={{ borderColor: '#F0EAEB' }}>
                <Text className="text-[#C7739A] text-2xl font-black">
                  {user?.name?.slice(0, 2).toUpperCase() || 'AD'}
                </Text>
              </View>
            )}
          </View>

          <Text className="text-[#1f1a1d] text-xl font-black">{user?.name || 'Cuhp User'}</Text>
          <Text className="text-[#706065] text-xs mt-0.5">
            {user?.username ? `${user.username}@cuhp.app` : 'user@cuhp.app'}
          </Text>

          {/* Daily Streak Goal pill */}
          <View className="bg-[#fcf1f5] border border-[#F0EAEB] rounded-3xl px-5 py-4 mt-5 w-full items-center" style={{ borderColor: '#F0EAEB' }}>
            <Text className="text-[10px] font-bold text-[#706065] uppercase tracking-widest mb-3">
              DAILY LEARNING TARGET
            </Text>

            <View className="flex-row items-center justify-between w-full px-2">
              <TouchableOpacity
                onPress={() => {
                  if (dailyTarget > 1) {
                    handleTargetChange(dailyTarget - 1);
                  }
                }}
                className="w-10 h-10 bg-white rounded-full items-center justify-center border border-[#F0EAEB]"
                style={{ borderColor: '#F0EAEB' }}
              >
                <Text className="text-[#C7739A] font-black text-lg">-</Text>
              </TouchableOpacity>

              <Text className="text-[#1f1a1d] text-base font-black">
                {dailyTarget} words / day
              </Text>

              <TouchableOpacity
                onPress={() => {
                  if (dailyTarget < 50) {
                    handleTargetChange(dailyTarget + 1);
                  }
                }}
                className="w-10 h-10 bg-white rounded-full items-center justify-center border border-[#F0EAEB]"
                style={{ borderColor: '#F0EAEB' }}
              >
                <Text className="text-[#C7739A] font-black text-lg">+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Streak Freeze Shields Info */}
          <View className="bg-amber-50 border border-amber-100 rounded-full px-5 py-3 mt-3 w-full flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Shield size={16} color={Colors.warning} className="mr-2" />
              <Text className="text-[#1f1a1d] text-[10px] font-bold uppercase tracking-wider">
                Streak Freeze Shields
              </Text>
            </View>
            <Text className="text-[#1f1a1d] text-xs font-black">
              Currently have {streakFreezes}
            </Text>
          </View>
        </View>

        {/* Speech Configuration Card */}
        <View className="bg-white border border-[#F0EAEB] rounded-3xl p-6 shadow-sm shadow-[#EFBCD5]/20 mb-5" style={{ borderColor: '#F0EAEB' }}>
          <View className="flex-row items-center mb-4">
            <View className="w-8 h-8 rounded-full bg-[#fcf1f5] border border-[#F0EAEB] items-center justify-center mr-3" style={{ borderColor: '#F0EAEB' }}>
              <Volume2 size={16} color="#C7739A" />
            </View>
            <Text className="text-[#1f1a1d] font-black text-base">Speech configuration</Text>
          </View>

          <View className="border-t border-[#F0EAEB] pt-4" style={{ borderTopColor: '#F0EAEB' }}>
            <Text className="text-[10px] font-bold text-[#706065] uppercase tracking-widest mb-2">ACCENT</Text>

            {/* Custom Dropdown Trigger */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setDropdownOpen(!dropdownOpen)}
              style={{ borderColor: '#F0EAEB' }}
              className="flex-row justify-between items-center bg-[#fcf1f5] border border-[#F0EAEB] rounded-full px-5 py-3.5 mb-2"
            >
              <Text className="text-[#1f1a1d] text-xs font-bold">
                {accent === 'en-US' ? 'American English (en-US)' : 'British English (en-GB)'}
              </Text>
              {dropdownOpen ? <ChevronUp size={16} color="#706065" /> : <ChevronDown size={16} color="#706065" />}
            </TouchableOpacity>

            {/* Dropdown Options */}
            {dropdownOpen && (
              <View className="bg-[#fcf1f5] border border-[#F0EAEB] rounded-2xl p-1 mb-4 overflow-hidden" style={{ borderColor: '#F0EAEB' }}>
                <TouchableOpacity
                  onPress={() => handleAccentChange('en-US')}
                  className={`px-4 py-3 rounded-xl ${accent === 'en-US' ? 'bg-[#EFBCD5]/20' : ''}`}
                >
                  <Text className={`text-xs font-bold ${accent === 'en-US' ? 'text-[#C7739A]' : 'text-[#1f1a1d]'}`}>
                    American English (en-US)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleAccentChange('en-GB')}
                  className={`px-4 py-3 rounded-xl ${accent === 'en-GB' ? 'bg-[#EFBCD5]/20' : ''}`}
                >
                  <Text className={`text-xs font-bold ${accent === 'en-GB' ? 'text-[#C7739A]' : 'text-[#1f1a1d]'}`}>
                    British English (en-GB)
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Speech Rate Slider Section */}
            <View className="mt-4">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-[10px] font-bold text-[#706065] uppercase tracking-widest">SPEECH RATE</Text>
                <View className="bg-[#EFBCD5]/20 border border-[#F0EAEB] px-2 py-0.5 rounded" style={{ borderColor: '#F0EAEB' }}>
                  <Text className="text-[#C7739A] text-[10px] font-black">{speechRate.toFixed(2)}x</Text>
                </View>
              </View>

              {/* Custom Slider with steps */}
              <View className="flex-row items-center px-1 py-2">
                <Accessibility size={16} color="#706065" className="mr-3" />

                <View className="flex-1 h-8 justify-center relative">
                  <View className="w-full h-1 bg-[#F0EAEB] rounded-full" />

                  {/* Render step points and handle selection */}
                  {rateSteps.map((step) => {
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
                          className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-[#C7739A]' : 'bg-[#706065]/30'}`}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Accessibility size={16} color="#706065" className="ml-3 rotate-12 scale-110" />
              </View>
            </View>

            {/* Test Voice Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={testVoice}
              style={{ borderColor: '#F0EAEB' }}
              className="mt-6 bg-[#EFBCD5] border border-[#F0EAEB] rounded-full py-3.5 items-center justify-center flex-row"
            >
              <Play size={14} color="#1f1a1d" className="mr-2" />
              <Text className="text-[#1f1a1d] text-xs font-black">Test voice</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sleep Settings Entry */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            triggerHaptic('light');
            navigation.navigate('SleepTracker');
          }}
          style={{ borderColor: '#F0EAEB' }}
          className="bg-white border border-[#F0EAEB] rounded-3xl p-6 shadow-sm shadow-[#EFBCD5]/20 mb-5 flex-row items-center justify-between"
        >
          <View className="flex-row items-center flex-1">
            <View className="w-8 h-8 rounded-full bg-[#fcf1f5] border border-[#F0EAEB] items-center justify-center mr-3" style={{ borderColor: '#F0EAEB' }}>
              <Moon size={16} color="#C7739A" />
            </View>
            <View className="flex-1">
              <Text className="text-[#1f1a1d] font-black text-base">Sleep settings</Text>
              <Text className="text-[#706065] text-[10px] mt-0.5">Bedtime, wakeup goals & reminders</Text>
            </View>
          </View>
          <ChevronRight size={16} color="#706065" />
        </TouchableOpacity>

        {/* Notifications Card */}
        <NotificationSettings />

        {/* Weekly Reports Section */}
        <View className="bg-white border border-[#F0EAEB] rounded-3xl p-6 shadow-sm shadow-[#EFBCD5]/20 mb-5" style={{ borderColor: '#F0EAEB' }}>
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <Text className="text-[#1f1a1d] text-xs font-bold">Weekly reports</Text>
              <Text className="text-[#706065] text-[10px] mt-0.5">Weekly summary of learning progress via email</Text>
            </View>
            <Switch
              value={weeklyReports}
              onValueChange={handleWeeklyReportsChange}
              trackColor={{ false: Colors.trackOff, true: '#EFBCD5' }}
              thumbColor={Platform.OS === 'android' ? Colors.background : undefined}
            />
          </View>
        </View>

        {/* Account Card */}
        <View className="bg-white border border-[#F0EAEB] rounded-3xl p-6 shadow-sm shadow-[#EFBCD5]/20 mb-5" style={{ borderColor: '#F0EAEB' }}>
          <View className="flex-row items-center mb-3">
            <View className="w-8 h-8 rounded-full bg-[#fcf1f5] border border-[#F0EAEB] items-center justify-center mr-3" style={{ borderColor: '#F0EAEB' }}>
              <User size={16} color="#706065" />
            </View>
            <Text className="text-[#1f1a1d] font-black text-base">Account</Text>
          </View>

          <View className="border-t border-[#F0EAEB] pt-4" style={{ borderTopColor: '#F0EAEB' }}>
            <Text className="text-[#706065] text-[10px] leading-normal mb-5">
              Manage your data, subscription and account security.
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              style={{ borderColor: '#F0EAEB' }}
              className="border border-[#F0EAEB] bg-[#fcf1f5] rounded-full py-3.5 items-center justify-center mb-3"
            >
              <Text className="text-[#1f1a1d] text-xs font-bold">Manage subscription</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={logout}
              className="bg-red-50 border border-red-100 rounded-full py-3.5 items-center justify-center flex-row"
            >
              <LogOut size={14} color={Colors.destructive} className="mr-2" />
              <Text className="text-destructive text-xs font-bold">Log out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </MainLayout>
  );
}
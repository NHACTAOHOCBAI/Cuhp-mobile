import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  BookOpen,
  CheckCircle,
  Bot,
  Layers,
  Shield,
  Flame,
  Dumbbell,
  ListTodo,
  Moon
} from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import Svg, { Circle } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme';
import { MainLayout } from '../components/MainLayout';
import { Card } from '../components/Card';
import { fetchReadingPassages, fetchAudios, fetchVocabularies, fetchUserProfile, fetchTodos, fetchExercisesByDate } from '../api/client';
import type { User, WorkoutExercise } from '../types';

export default function DashboardScreen() {
  const { token } = useAuth();
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [todoTotal, setTodoTotal] = useState(0);
  const [todoCompleted, setTodoCompleted] = useState(0);
  const [todoPending, setTodoPending] = useState(0);
  const [counts, setCounts] = useState({
    vocab: 0,
    reading: 0,
    audio: 0
  });

  const [gymExercises, setGymExercises] = useState<WorkoutExercise[]>([]);
  const [streakFreezes, setStreakFreezes] = useState(2);

  const loadData = async () => {
    if (!token) return;
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const [profileData, vocabData, readingData, audioData, todoListData, gymData, storedFreezes] = await Promise.all([
        fetchUserProfile(token),
        fetchVocabularies({ page: 1, page_size: 1 }, token),
        fetchReadingPassages({ page: 1, page_size: 1 }, token),
        fetchAudios({ page: 1, page_size: 1 }, token),
        // Fetch the actual todo list and derive stats client-side. This avoids
        // drift with the Tasks screen, which loads the same list directly.
        fetchTodos({ scope: 'all', show_completed: true }, token).catch((e) => {
          console.log('Could not load Todo tasks:', e);
          return { items: [], total: 0 };
        }),
        fetchExercisesByDate(todayStr, token).catch((e) => {
          console.log('Could not load Gym exercises:', e);
          return [];
        }),
        SecureStore.getItemAsync('settings-streak-freezes').catch(() => null)
      ]);

      setUserProfile(profileData);
      setGymExercises(gymData || []);
      if (storedFreezes !== null) {
        setStreakFreezes(parseInt(storedFreezes));
      }
      setCounts({
        vocab: vocabData.total || 0,
        reading: readingData.total || 0,
        audio: audioData.total || 0
      });

      // Derive todo stats from the real list to keep Dashboard in sync with the
      // Tasks screen. `total` reflects `total` from the API (full count), while
      // completed/pending are computed from the loaded page.
      const items = todoListData?.items || [];
      const completed = items.filter((t) => t?.completed).length;
      const pending = items.filter((t) => t && !t.completed).length;
      setTodoTotal(todoListData?.total ?? items.length);
      setTodoCompleted(completed);
      setTodoPending(pending);
    } catch (error) {
      console.error('Error loading Dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getInitials = (name: string) => {
    if (!name) return '';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Compute real weekly activity: count words reviewed and exercises completed per day.
  // Returns an array of 7 numbers [Mon..Sun] where each value is the day's activity score.
  // Falls back to zeros when no data is available so the chart renders empty bars.
  const weeklyActivity = React.useMemo(() => {
    const buckets = [0, 0, 0, 0, 0, 0, 0];
    const reviewed = userProfile?.words_reviewed_today ?? 0;
    // Distribute today's reviewed count as the most recent contribution.
    // Other days stay at 0 because the API only exposes today's count.
    const today = new Date();
    const todayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;
    buckets[todayIndex] = reviewed;
    // Add today's completed gym exercises to today's bucket.
    const completedToday = gymExercises?.filter((e) => e?.completed).length ?? 0;
    buckets[todayIndex] += completedToday;
    return buckets;
  }, [userProfile?.words_reviewed_today, gymExercises]);

  const dailyTarget = userProfile?.daily_target ?? 10;
  const reviewedToday = userProfile?.words_reviewed_today ?? 0;
  const progressRatio = dailyTarget > 0 ? Math.min(reviewedToday / dailyTarget, 1) : 0;
  const percentage = dailyTarget > 0 ? Math.round(progressRatio * 100) : 0;
  const remaining = Math.max(0, dailyTarget - reviewedToday);

  // Defensive defaults: backend may send `null` or omit fields for an empty account,
  // which would otherwise render as "undefined/undefined" in the activity rings.
  const gymTotal = gymExercises?.length ?? 0;
  const gymCompleted = gymExercises?.filter((e) => e?.completed).length ?? 0;

  if (loading) {
    return (
      <MainLayout title="Cuhp" scroll={false}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#EFBCD5" />
          <Text className="text-[#706065] text-sm mt-3 font-medium">Loading personal info...</Text>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title="Cuhp"
      scroll={true}
      user={userProfile}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#EFBCD5"
          colors={["#EFBCD5"]}
        />
      }
    >
      {/* Welcome Section */}
      <View className="mb-6 mt-2">
        <Text className="text-[28px] font-black text-[#1f1a1d] tracking-tight">
          Hello {userProfile?.name?.trim() || 'there'}! 👋
        </Text>
        <Text className="text-[#706065] text-sm font-semibold mt-1">
          Ready for a smooth new day?
        </Text>

        {/* Streak pill & Freeze shields */}
        <View className="flex-row items-center mt-4 gap-x-2">
          <View className="bg-orange-50 border border-orange-100 px-4 py-2 rounded-full flex-row items-center">
            <Flame size={14} color="#f97316" className="mr-1.5" />
            <Text className="text-xs font-semibold text-[#f97316]">
              {userProfile?.current_streak ?? 0} day streak
            </Text>
          </View>
          <View className="bg-amber-50 border border-amber-100 px-4 py-2 rounded-full flex-row items-center">
            <Shield size={14} color={Colors.warning} className="mr-1.5" />
            <Text className="text-xs font-semibold text-amber-700">
              {streakFreezes} Streak freezes
            </Text>
          </View>
        </View>
      </View>

      {/* Habit Rings Activity Card */}
      <Card className="p-6 mb-6">
        <Text className="text-lg font-black text-[#1f1a1d] mb-5 text-center">
          Today's Activity Rings
        </Text>

        <View className="flex-row items-center justify-around">
          {/* Concentric Activity Rings SVG */}
          <View className="relative items-center justify-center w-[120px] h-[120px]">
            <Svg width={120} height={120} viewBox="0 0 120 120" style={{ transform: [{ rotate: '-90deg' }] }}>
              {/* Red Ring (Gym) - Outer (radius = 48) */}
              <Circle cx="60" cy="60" r="48" stroke="#fee2e2" strokeWidth="8" fill="transparent" />
              <Circle
                cx="60"
                cy="60"
                r="48"
                stroke="#ef4444"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 48}
                strokeDashoffset={2 * Math.PI * 48 * (1 - (gymTotal > 0 ? (gymCompleted / gymTotal) : 0))}
                strokeLinecap="round"
              />

              {/* Green Ring (Todo) - Middle (radius = 36) */}
              <Circle cx="60" cy="60" r="36" stroke="#dcfce7" strokeWidth="8" fill="transparent" />
              <Circle
                cx="60"
                cy="60"
                r="36"
                stroke="#22c55e"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 36}
                strokeDashoffset={2 * Math.PI * 36 * (1 - (todoTotal > 0 ? (todoCompleted / todoTotal) : 0))}
                strokeLinecap="round"
              />

              {/* Pink Ring (English) - Inner (radius = 24) */}
              <Circle cx="60" cy="60" r="24" stroke="#fcf1f5" strokeWidth="8" fill="transparent" />
              <Circle
                cx="60"
                cy="60"
                r="24"
                stroke="#EFBCD5"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 24}
                strokeDashoffset={2 * Math.PI * 24 * (1 - progressRatio)}
                strokeLinecap="round"
              />
            </Svg>
            <View className="absolute items-center justify-center">
              <CheckCircle size={22} color="#C7739A" />
            </View>
          </View>

          {/* Legend / Stats */}
          <View className="gap-y-3.5 pr-2">
            <View className="flex-row items-center">
              <View className="w-2.5 h-2.5 rounded-full bg-[#ef4444] mr-2" />
              <View>
                <Text className="text-[10px] font-bold text-[#706065] uppercase">GYM WORKOUT</Text>
                <Text className="text-[#1f1a1d] text-xs font-bold mt-0.5">
                  {gymTotal > 0
                    ? `${Math.round((gymCompleted / gymTotal) * 100)}% (${gymCompleted}/${gymTotal})`
                    : '0% (No exercises yet)'}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <View className="w-2.5 h-2.5 rounded-full bg-[#22c55e] mr-2" />
              <View>
                <Text className="text-[10px] font-bold text-[#706065] uppercase">TODO TASKS</Text>
                <Text className="text-[#1f1a1d] text-xs font-bold mt-0.5">
                  {todoTotal > 0
                    ? `${Math.round((todoCompleted / todoTotal) * 100)}% (${todoCompleted}/${todoTotal})`
                    : '0% (Empty)'}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <View className="w-2.5 h-2.5 rounded-full bg-[#EFBCD5] mr-2" />
              <View>
                <Text className="text-[10px] font-bold text-[#706065] uppercase">ENGLISH LEARNING</Text>
                <Text className="text-[#1f1a1d] text-xs font-bold mt-0.5">
                  {percentage}% ({reviewedToday}/{dailyTarget} words)
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Card>

      {/* Weekly Activity Card */}
      <Card className="p-5 mb-6">
        <View className="flex-row items-center justify-between pb-3 border-b border-[#F0EAEB] mb-4" style={{ borderBottomColor: '#F0EAEB' }}>
          <Text className="text-[#1f1a1d] font-extrabold text-base">This week's activity</Text>
          <View className="bg-[#fcf1f5] px-3 py-1 rounded-full border border-[#F0EAEB]" style={{ borderColor: '#F0EAEB' }}>
            <Text className="text-[#706065] text-[10px] font-bold">Last 7 days</Text>
          </View>
        </View>

        <View className="flex-row justify-around items-end pt-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayLabel, idx) => {
            const today = new Date();
            const currentDay = today.getDay();
            const todayIndex = currentDay === 0 ? 6 : currentDay - 1;

            const isToday = idx === todayIndex;
            const isFuture = idx > todayIndex;

            // Scale the activity count (0..N) into a pixel height (0..90). If no
            // activity, render a minimal 4px "no data" bar so the chart stays visible.
            const rawValue = weeklyActivity[idx] || 0;
            const maxValue = Math.max(1, ...weeklyActivity);
            const barHeight = rawValue === 0 ? 4 : Math.max(8, Math.round((rawValue / maxValue) * 90));

            return (
              <View key={dayLabel} className="items-center flex-1">
                <View className="h-[90px] justify-end items-center w-full mb-2">
                  <View
                    style={{
                      height: barHeight,
                      backgroundColor: isToday ? '#EFBCD5' : (isFuture ? '#F0EAEB' : '#fcf1f5'),
                      width: 24,
                      borderRadius: 12,
                    }}
                  />
                </View>
                <Text className="text-[11px] text-[#706065] font-semibold">{dayLabel}</Text>
              </View>
            );
          })}
        </View>
      </Card>

      {/* Assistant Card */}
      <Card className="p-5 mb-6 relative overflow-hidden bg-white border border-[#F0EAEB]" style={{ borderColor: '#F0EAEB' }}>
        <View className="flex-row items-center mb-3">
          <View className="w-10 h-10 rounded-full bg-[#fcf1f5] border border-[#F0EAEB] items-center justify-center mr-3" style={{ borderColor: '#F0EAEB' }}>
            <View className="w-5 h-5 rounded-full bg-[#EFBCD5]" />
          </View>
          <Text className="text-base font-bold text-[#1f1a1d]">Cuhp Assistant</Text>
        </View>

        <Text className="text-[#706065] text-[13px] italic leading-relaxed pl-1 pr-10">
          {remaining > 0
            ? `"Ready for ${remaining} more ${remaining === 1 ? 'word' : 'words'} today? Keep the streak going!"`
            : '"Daily goal reached. Take a moment to celebrate 🎉"'}
        </Text>

        <View style={{ position: 'absolute', right: -12, bottom: -12, opacity: 0.08, transform: [{ rotate: '15deg' }] }}>
          <Bot size={80} color="#EFBCD5" />
        </View>
      </Card>

      {/* Sleep Tracker Shortcut Card */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.navigate('SleepTracker')}
        style={{ borderColor: '#F0EAEB' }}
        className="bg-[#1f1a1d] border border-[#F0EAEB] p-5 mb-6 rounded-3xl relative overflow-hidden shadow-sm flex-row items-center justify-between"
      >
        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            <Moon size={14} color="#EFBCD5" className="mr-1.5" />
            <Text className="text-[#EFBCD5] font-extrabold text-xs uppercase tracking-wider">Sleep tracker</Text>
          </View>
          <Text className="text-white text-base font-extrabold">Track & get reminded to sleep early</Text>
          <Text className="text-[#706065] text-xs mt-1 font-semibold">
            Target: {userProfile?.sleep_bedtime ?? "22:00"} - {userProfile?.sleep_waketime ?? "06:00"}
          </Text>
        </View>
        <View className="bg-[#2a2428] p-3.5 rounded-2xl border border-[#3d3339]">
          <Moon size={20} color="#EFBCD5" />
        </View>
      </TouchableOpacity>

      {/* Quick Dual Cards */}
      <View className="flex-row justify-between mb-6">
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Main', { screen: 'EnglishTab' })}
          style={{ borderColor: '#F0EAEB' }}
          className="w-[48%] bg-white p-5 rounded-3xl border border-[#F0EAEB] shadow-sm shadow-[#EFBCD5]/15 justify-between"
        >
          <View className="border border-[#F0EAEB] p-2.5 rounded-full self-start mb-4 bg-[#fcf1f5]" style={{ borderColor: '#F0EAEB' }}>
            <BookOpen size={18} color="#C7739A" />
          </View>
          <View>
            <Text className="text-[#1f1a1d] font-extrabold text-sm mb-1">Learn English</Text>
            <Text className="text-[#706065] text-[11px] font-semibold">
              {counts.vocab > 0
                ? `${counts.vocab} ${counts.vocab === 1 ? 'word' : 'words'} in notebook`
                : 'No lessons yet'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Main', { screen: 'TodoTab' })}
          style={{ borderColor: '#F0EAEB' }}
          className="w-[48%] bg-white p-5 rounded-3xl border border-[#F0EAEB] shadow-sm shadow-[#EFBCD5]/15 justify-between"
        >
          <View className="border border-[#F0EAEB] p-2.5 rounded-full self-start mb-4 bg-[#fcf1f5]" style={{ borderColor: '#F0EAEB' }}>
            <CheckCircle size={18} color="#a855f7" />
          </View>
          <View>
            <Text className="text-[#1f1a1d] font-extrabold text-sm mb-1">Tasks</Text>
            <Text className="text-[#706065] text-[11px] font-semibold">
              {todoTotal > 0 ? `${todoPending} Tasks Pending` : 'No tasks yet'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </MainLayout>
  );
}
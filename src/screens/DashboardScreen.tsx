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
  Bot
} from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme';
import { MainLayout } from '../components/MainLayout';
import { Card } from '../components/Card';
import { fetchReadingPassages, fetchAudios, fetchVocabularies, fetchUserProfile, fetchTodoStats } from '../api/client';
import type { User, TodoStats } from '../types';

export default function DashboardScreen() {
  const { token } = useAuth();
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [todoStats, setTodoStats] = useState<TodoStats | null>(null);
  const [counts, setCounts] = useState({
    vocab: 0,
    reading: 0,
    audio: 0
  });

  const loadData = async () => {
    if (!token) return;
    try {
      const [profileData, vocabData, readingData, audioData, todoStatsData] = await Promise.all([
        fetchUserProfile(token),
        fetchVocabularies({ page: 1, page_size: 1 }, token),
        fetchReadingPassages({ page: 1, page_size: 1 }, token),
        fetchAudios({ page: 1, page_size: 1 }, token),
        fetchTodoStats(token).catch((e) => {
          console.log('Không tải được thống kê Todo:', e);
          return null;
        })
      ]);

      setUserProfile(profileData);
      setTodoStats(todoStatsData);
      setCounts({
        vocab: vocabData.total || 0,
        reading: readingData.total || 0,
        audio: audioData.total || 0
      });
    } catch (error) {
      console.error('Lỗi tải dữ liệu Dashboard:', error);
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
    if (!name) return 'A';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const dailyTarget = userProfile?.daily_target ?? 10;
  const reviewedToday = userProfile?.words_reviewed_today ?? 0;
  const progressRatio = Math.min(reviewedToday / dailyTarget, 1);
  const percentage = dailyTarget > 0 ? Math.round(progressRatio * 100) : 0;
  const remaining = Math.max(0, dailyTarget - reviewedToday);

  if (loading) {
    return (
      <MainLayout title="Cuhp" scroll={false}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#006699" />
          <Text className="text-muted-foreground text-sm mt-3 font-medium">Đang tải thông tin cá nhân...</Text>
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
          tintColor="#006699"
          colors={["#006699"]}
        />
      }
    >
        {/* Welcome Section */}
        <View className="mb-6 mt-2">
          <Text className="text-[28px] font-black text-[#193665] tracking-tight">
            Chào {userProfile?.name || 'Admin'}! 👋
          </Text>
          <Text className="text-muted-foreground text-sm font-semibold mt-1">
            Sẵn sàng cho một ngày mới?
          </Text>

          {/* Streak pill */}
          <View className="bg-white border border-[#19366511] px-4 py-2 rounded-full self-start mt-4">
            <Text className="text-xs font-semibold text-[#193665]">
              {userProfile?.current_streak ?? 12} days streak
            </Text>
          </View>
        </View>

        {/* Vocabulary Goal Card */}
        <Card className="p-6 mb-6 items-center">
          <View className="relative items-center justify-center w-36 h-36 mb-4">
            <Svg width={120} height={120} viewBox="0 0 120 120" style={{ transform: [{ rotate: '-90deg' }] }}>
              <Circle
                cx="60"
                cy="60"
                r="50"
                stroke="#e5f3fb"
                strokeWidth="10"
                fill="transparent"
              />
              <Circle
                cx="60"
                cy="60"
                r="50"
                stroke="#006699"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 50}
                strokeDashoffset={2 * Math.PI * 50 * (1 - progressRatio)}
                strokeLinecap="round"
              />
            </Svg>
            <View className="absolute items-center justify-center">
              <Text className="text-3xl font-extrabold text-[#193665]">{percentage}%</Text>
              <Text className="text-xs text-muted-foreground font-semibold">Vocab</Text>
            </View>
          </View>

          <Text className="text-xl font-bold text-[#193665] mb-2 text-center">
            Mục tiêu từ vựng
          </Text>
          <Text className="text-muted-foreground text-sm text-center px-4 mb-5 leading-relaxed">
            {remaining > 0
              ? `Bạn đã hoàn thành ${percentage}% mục tiêu từ vựng ngày hôm nay. Cố gắng lên nhé, chỉ còn ${remaining} từ nữa thôi!`
              : `Bạn đã hoàn thành xuất sắc 100% mục tiêu từ vựng ngày hôm nay. Hãy tiếp tục duy trì phong độ nhé!`}
          </Text>

          <TouchableOpacity
            onPress={() => navigation.navigate('Review')}
            className="bg-[#006699] py-3.5 px-8 rounded-full w-full items-center active:opacity-90 shadow-sm"
          >
            <Text className="text-white font-bold text-base">Tiếp tục học</Text>
          </TouchableOpacity>
        </Card>

        {/* Weekly Activity Card */}
        <Card className="p-5 mb-6">
          <View className="flex-row items-center justify-between pb-3 border-b border-border/30 mb-4">
            <Text className="text-[#193665] font-extrabold text-base">Hoạt động tuần này</Text>
            <View className="bg-zinc-100 px-3 py-1 rounded-full">
              <Text className="text-muted-foreground text-[10px] font-bold">Last 7 Days</Text>
            </View>
          </View>

          <View className="flex-row justify-around items-end pt-2">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((dayLabel, idx) => {
              const today = new Date();
              const currentDay = today.getDay();
              const todayIndex = currentDay === 0 ? 6 : currentDay - 1;

              const isToday = idx === todayIndex;
              const isFuture = idx > todayIndex;

              const defaultHeights = [30, 50, 60, 85, 25, 45, 10];
              const barHeight = defaultHeights[idx];

              return (
                <View key={dayLabel} className="items-center flex-1">
                  <View className="h-[90px] justify-end items-center w-full mb-2">
                    <View
                      style={{
                        height: barHeight,
                        backgroundColor: isToday ? '#006699' : (isFuture ? '#19366511' : '#bce2fa'),
                        width: 24,
                        borderRadius: 12,
                      }}
                    />
                  </View>
                  <Text className="text-[11px] text-muted-foreground font-semibold">{dayLabel}</Text>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Assistant Card */}
        <Card className="p-5 mb-6 relative overflow-hidden">
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 rounded-full bg-[#c2e6fb] items-center justify-center mr-3">
              <View className="w-5 h-5 rounded-full bg-[#006699]" />
            </View>
            <Text className="text-base font-bold text-[#193665]">Trợ lý Cuhp</Text>
          </View>

          <Text className="text-muted-foreground text-[13px] italic leading-relaxed pl-1 pr-10">
            "Sẵn sàng cho {remaining > 0 ? remaining : 15} từ mới hôm nay chưa? Đừng quên buổi tập ngực chiều nay nhé!"
          </Text>

          <View style={{ position: 'absolute', right: -12, bottom: -12, opacity: 0.05, transform: [{ rotate: '15deg' }] }}>
            <Bot size={80} color="#193665" />
          </View>
        </Card>

        {/* Quick Dual Cards */}
        <View className="flex-row justify-between mb-6">
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Main', { screen: 'EnglishTab' })}
            className="w-[48%] bg-white p-5 rounded-3xl border border-[#1936651a] shadow-sm shadow-[#193665]/3 justify-between"
          >
            <View className="border border-[#1936651a] p-2.5 rounded-full self-start mb-4 bg-[#e5f3fb]/60">
              <BookOpen size={18} color="#006699" />
            </View>
            <View>
              <Text className="text-[#193665] font-extrabold text-sm mb-1">Học tiếng Anh</Text>
              <Text className="text-muted-foreground text-[11px] font-semibold">Còn 1 bài học</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Main', { screen: 'TodoTab' })}
            className="w-[48%] bg-white p-5 rounded-3xl border border-[#1936651a] shadow-sm shadow-[#193665]/3 justify-between"
          >
            <View className="border border-[#1936651a] p-2.5 rounded-full self-start mb-4 bg-[#f3e8ff]/60">
              <CheckCircle size={18} color="#a855f7" />
            </View>
            <View>
              <Text className="text-[#193665] font-extrabold text-sm mb-1">Công việc</Text>
              <Text className="text-muted-foreground text-[11px] font-semibold">
                {todoStats?.pending ?? 3} Tasks Pending
              </Text>
            </View>
          </TouchableOpacity>
        </View>
    </MainLayout>
  );
}


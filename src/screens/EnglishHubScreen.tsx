import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { BookOpen, Headphones, Brain, BookMarked, Flame, Target, Sparkles, ArrowRight } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { Colors, typography } from '../theme';
import { MainLayout } from '../components/MainLayout';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { IconTile } from '../components/IconTile';
import { ProgressBar } from '../components/ProgressBar';
import { ButtonPrimary } from '../components/Button';
import { fetchVocabularies, fetchUserProfile } from '../api/client';
import type { VocabularyItem, User } from '../types';

import VocabularyScreen from './VocabularyScreen';
import ReadingScreen from './ReadingScreen';
import ListeningScreen from './ListeningScreen';

type SubTabKey = 'vocabulary' | 'review' | 'reading' | 'listening';

export default function EnglishHubScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { token, user } = useAuth();

  const [activeTab, setActiveTab] = useState<SubTabKey>('vocabulary');
  const [currentUser, setCurrentUser] = useState<User | null>(user);
  const [vocabCount, setVocabCount] = useState(0);
  const [dueVocabCount, setDueVocabCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Sync tab from route params (e.g. when coming from Dashboard shortcuts)
  useEffect(() => {
    if (route.params?.activeSubTab) {
      setActiveTab(route.params.activeSubTab);
    }
  }, [route.params?.activeSubTab]);

  const loadStats = async () => {
    if (!token) return;
    setLoadingStats(true);
    try {
      const [profileData, vocabList, dueVocabList] = await Promise.all([
        fetchUserProfile(token),
        fetchVocabularies({ page: 1, page_size: 1 }, token),
        fetchVocabularies({ page: 1, page_size: 1, due: true }, token),
      ]);
      setCurrentUser(profileData);
      setVocabCount(vocabList.total || 0);
      setDueVocabCount(dueVocabList.total || 0);
    } catch (error) {
      console.error('Lỗi tải thống kê ôn tập trong Hub:', error);
    } finally {
      setLoadingStats(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'review') {
      loadStats();
    }
  }, [activeTab, token]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  const renderReviewHub = () => {
    const dailyGoalMet = currentUser
      ? currentUser.words_reviewed_today >= currentUser.daily_target
      : false;
    const progressPercent = currentUser
      ? Math.min(100, (currentUser.words_reviewed_today / currentUser.daily_target) * 100)
      : 0;

    return (
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.foreground}
            colors={[Colors.foreground]}
          />
        }
        className="px-6 pt-4"
      >
        {/* Streak & Progress */}
        <View className="flex-row justify-between gap-4 mb-5">
          <Card className="flex-1 flex-row items-center mb-0 p-4">
            <View className="mr-3">
              <IconTile
                tone="streak"
                size="md"
                icon={<Flame size={20} color={Colors.streak} />}
              />
            </View>
            <View>
              <Text className={typography.eyebrowSm}>Chuỗi streak</Text>
              <Text className="text-foreground text-base font-black">
                {currentUser?.current_streak || 0} ngày
              </Text>
            </View>
          </Card>

          <Card className="flex-1 flex-row items-center mb-0 p-4">
            <View className="mr-3">
              <IconTile
                tone="muted"
                size="md"
                icon={<Target size={20} color={Colors.foreground} />}
              />
            </View>
            <View className="flex-1">
              <Text className={typography.eyebrowSm}>Mục tiêu ngày</Text>
              <Text className="text-foreground text-base font-black">
                {currentUser?.words_reviewed_today || 0}/{currentUser?.daily_target || 10}
              </Text>
            </View>
          </Card>
        </View>

        {/* Daily progress bar */}
        <Card className="mb-5">
          <ProgressBar
            value={progressPercent}
            label="Tiến trình ngày hôm nay"
            trailingLabel={`${Math.round(progressPercent)}%`}
            tone="primary"
            footer={
              dailyGoalMet ? (
                <View className="flex-row items-center">
                  <Sparkles size={12} color={Colors.warning} />
                  <Text className="text-foreground text-[11px] font-semibold ml-1">
                    Đã hoàn thành mục tiêu ngày!
                  </Text>
                </View>
              ) : null
            }
          />
        </Card>

        {/* Vocabulary stats */}
        <Card variant="flat" className="mb-6 p-5">
          <Text className={`${typography.eyebrowSm} mb-3`}>Thống kê ôn tập</Text>
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-muted-foreground text-sm font-medium">Số từ cần ôn tập hôm nay:</Text>
            <Badge
              label={`${dueVocabCount} từ đến hạn`}
              variant={dueVocabCount > 0 ? 'red' : 'green'}
            />
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-muted-foreground text-sm font-medium">Tổng số từ trong sổ tay:</Text>
            <Text className="text-foreground text-sm font-bold">{vocabCount} từ</Text>
          </View>
        </Card>

        {/* Button to start full-screen review */}
        <ButtonPrimary
          title="Bắt đầu học Flashcard"
          disabled={vocabCount === 0}
          onPress={() => navigation.navigate('Flashcard')}
          icon={<ArrowRight size={18} color={Colors.primaryForeground} />}
          className="h-14"
        />

        {vocabCount === 0 ? (
          <Text className="text-destructive text-xs text-center mt-2.5">
            Sổ tay của bạn hiện đang trống. Hãy thêm từ vựng mới để bắt đầu ôn tập.
          </Text>
        ) : null}
      </ScrollView>
    );
  };

  const subTabs: { key: SubTabKey; label: string }[] = [
    { key: 'vocabulary', label: 'Từ vựng' },
    { key: 'review', label: 'Ôn tập' },
    { key: 'reading', label: 'Bài đọc' },
    { key: 'listening', label: 'Nghe' },
  ];

  return (
    <MainLayout title="Cuhp" scroll={false}>
      {/* Screen Title */}
      <Text className="text-[28px] font-black text-[#193665] px-6 pt-4 mb-3">
        English Hub
      </Text>

      {/* Segmented Control / Sub-tabs */}
      <View className="flex-row bg-[#193665]/5 p-1 rounded-2xl mb-4 mx-6">
        {subTabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className="flex-1 py-2.5 rounded-xl items-center justify-center"
              style={
                isActive
                  ? {
                      backgroundColor: Colors.card,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                      elevation: 2,
                    }
                  : undefined
              }
            >
              <Text
                className="text-xs font-bold"
                style={{ color: isActive ? Colors.foreground : Colors.iconMuted }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Sub-tab Content */}
      <View className="flex-1">
        {activeTab === 'vocabulary' && <VocabularyScreen hideHeader />}
        {activeTab === 'review' && renderReviewHub()}
        {activeTab === 'reading' && <ReadingScreen />}
        {activeTab === 'listening' && <ListeningScreen hideHeader />}
      </View>
    </MainLayout>
  );
}

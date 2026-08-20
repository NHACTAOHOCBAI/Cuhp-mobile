import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  GestureResponderEvent,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import {
  Volume2,
  RotateCw,
  Trophy,
  X,
  MoreHorizontal,
  BookOpen,
} from 'lucide-react-native';

import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import {
  fetchVocabularies,
  reviewVocabulary,
  fetchUserProfile,
} from '../api/client';
import { VocabularyItem, User } from '../types';

import { ScreenWrapper } from '../components/ScreenWrapper';
import {
  Button,
  ButtonPrimary,
  ButtonOutline,
  triggerHaptic,
} from '../components/Button';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { IconButton } from '../components/IconButton';
import { IconTile } from '../components/IconTile';
import { ProgressBar } from '../components/ProgressBar';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';

import { Colors, typography } from '../theme';
import { getWordTypeLabel } from '../utils/vocabulary';

const SESSION_SIZE = 15;
const ADVANCE_DELAY_MS = 250;
const FLIP_DURATION_MS = 450;

export default function FlashcardScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user, token, login } = useAuth();
  const { accent, speechRate } = useSettings();

  const [vocabList, setVocabList] = useState<VocabularyItem[]>([]);
  const [dueVocabList, setDueVocabList] = useState<VocabularyItem[]>([]);
  const [sessionItems, setSessionItems] = useState<VocabularyItem[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(user);

  const [loading, setLoading] = useState(true);
  const [gameState, setGameState] = useState<'review' | 'result'>('review');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [answerBusy, setAnswerBusy] = useState(false);

  const flip = useSharedValue(0); // 0 = front, 1 = back

  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      {
        rotateY: `${interpolate(
          flip.value,
          [0, 1],
          [0, 180],
          Extrapolation.CLAMP
        )}deg`,
      },
    ],
    opacity: interpolate(
      flip.value,
      [0, 0.5, 0.5001, 1],
      [1, 1, 0, 0]
    ),
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      {
        rotateY: `${interpolate(
          flip.value,
          [0, 1],
          [180, 360],
          Extrapolation.CLAMP
        )}deg`,
      },
    ],
    opacity: interpolate(
      flip.value,
      [0, 0.4999, 0.5, 1],
      [0, 0, 1, 1]
    ),
  }));

  const loadData = async () => {
    try {
      const freshUser = await fetchUserProfile(token);
      setCurrentUser(freshUser);
      if (token) {
        await login(token, freshUser);
      }

      const allResponse = await fetchVocabularies(
        { page: 1, page_size: 100 },
        token
      );
      const allItems = allResponse.items || [];

      const dueResponse = await fetchVocabularies(
        { page: 1, page_size: 100, due: true },
        token
      );
      const dueItems = dueResponse.items || [];

      setVocabList(allItems);
      setDueVocabList(dueItems);

      const pool = dueItems.length > 0 ? dueItems : allItems;
      if (pool.length === 0) {
        setSessionItems([]);
      } else {
        const shuffled = [...pool]
          .sort(() => Math.random() - 0.5)
          .slice(0, SESSION_SIZE);
        setSessionItems(shuffled);
        setCurrentIndex(0);
        setScore(0);
        setIsFlipped(false);
        flip.value = 0;
        setGameState('review');
      }
    } catch (e) {
      console.error('Lỗi khi tải dữ liệu Flashcard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startSession = () => {
    const pool = dueVocabList.length > 0 ? dueVocabList : vocabList;
    if (pool.length === 0) {
      setSessionItems([]);
      return;
    }

    const shuffled = [...pool]
      .sort(() => Math.random() - 0.5)
      .slice(0, SESSION_SIZE);

    setSessionItems(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setIsFlipped(false);
    flip.value = 0;
    setGameState('review');
  };

  const restartSession = () => {
    setCurrentIndex(0);
    setScore(0);
    setIsFlipped(false);
    flip.value = 0;
    startSession();
  };

  const speakWord = (word: string) => {
    Speech.speak(word, { language: accent, pitch: 1.0, rate: speechRate });
  };

  const toggleFlip = () => {
    triggerHaptic('light');
    const next = !isFlipped;
    setIsFlipped(next);
    flip.value = withTiming(next ? 1 : 0, { duration: FLIP_DURATION_MS });
  };

  const handleAnswer = async (known: boolean) => {
    if (answerBusy) return;
    setAnswerBusy(true);

    triggerHaptic(known ? 'success' : 'error');

    const currentItem = sessionItems[currentIndex];
    if (!currentItem) {
      setAnswerBusy(false);
      return;
    }

    try {
      const response = await reviewVocabulary(currentItem.id, known, token);
      if (currentUser) {
        setCurrentUser({
          ...currentUser,
          words_reviewed_today: response.words_reviewed_today,
          current_streak: response.current_streak,
        });
      }
    } catch (err) {
      console.error('Lỗi khi gửi kết quả Flashcard:', err);
    }

    setTimeout(() => {
      if (known) {
        setScore((prev) => prev + 1);
      }
      if (currentIndex < sessionItems.length - 1) {
        setIsFlipped(false);
        flip.value = 0;
        setCurrentIndex((prev) => prev + 1);
      } else {
        setGameState('result');
      }
      setAnswerBusy(false);
    }, ADVANCE_DELAY_MS);
  };

  // ---------- Loading ----------

  if (loading) {
    return (
      <ScreenWrapper scroll={false} edges={['top', 'left', 'right']}>
        <GradientBackground />
        <LoadingState message="Đang tải Flashcard..." />
      </ScreenWrapper>
    );
  }

  // ---------- Empty ----------

  if (sessionItems.length === 0) {
    return (
      <ScreenWrapper scroll={false} edges={['top', 'left', 'right']}>
        <GradientBackground />
        <View className="px-6 pt-3">
          <IconButton
            shape="circle"
            variant="soft"
            size="md"
            hapticType="light"
            onPress={() => navigation.goBack()}
            accessibilityLabel="Đóng"
            icon={<X size={18} color={Colors.foreground} />}
          />
        </View>
        <EmptyState
          icon={<BookOpen size={32} color={Colors.iconMuted} />}
          title="Chưa có từ vựng"
          body="Hãy thêm từ vựng mới vào sổ tay trước khi bắt đầu Flashcard."
          action={{
            label: 'Quay lại',
            onPress: () => navigation.goBack(),
            variant: 'outline',
          }}
        />
      </ScreenWrapper>
    );
  }

  // ---------- Result ----------

  if (gameState === 'result') {
    const ratio = sessionItems.length > 0 ? score / sessionItems.length : 0;
    const isExcellent = ratio >= 0.8;

    return (
      <ScreenWrapper scroll={false} edges={['top', 'left', 'right']}>
        <GradientBackground />
        <View
          className="flex-1 justify-center px-6"
          style={{ paddingBottom: insets.bottom + 24 }}
        >
          <View className="items-center mb-6">
            <View className="mb-6">
              <IconTile
                tone={isExcellent ? 'success' : 'muted'}
                size="lg"
                shape="circle"
                icon={
                  <Trophy
                    size={40}
                    color={isExcellent ? Colors.gold : Colors.iconMuted}
                  />
                }
                className="shadow-sm shadow-border"
              />
            </View>
            <Text className="text-2xl font-extrabold text-foreground text-center tracking-tight">
              {isExcellent ? 'Tuyệt Vời!' : 'Hoàn Thành!'}
            </Text>
            <Text className="text-muted-foreground text-sm text-center mt-2 max-w-[280px] leading-relaxed">
              Bạn đã hoàn thành phiên Flashcard này. Hãy tiếp tục duy trì thói
              quen học tập hàng ngày!
            </Text>
          </View>

          <Card className="items-center p-6 mb-6">
            <Text className={`${typography.eyebrowSm} mb-1`}>
              Số từ đã thuộc lượt này
            </Text>
            <Text className="text-4xl font-black text-foreground mt-1">
              {score} / {sessionItems.length}
            </Text>
            <Text className="text-muted-foreground text-xs mt-2">
              Đạt tỉ lệ chính xác {Math.round(ratio * 100)}%
            </Text>
          </Card>

          <View className="gap-3">
            <ButtonPrimary onPress={restartSession} title="Ôn tập tiếp lượt mới" />
            <ButtonOutline
              onPress={() => navigation.goBack()}
              title="Quay lại trang chủ"
            />
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  // ---------- Review ----------

  const currentItem = sessionItems[currentIndex];
  if (!currentItem) return null;

  const progressPct = ((currentIndex + 1) / sessionItems.length) * 100;
  const boxNumber = currentItem.box_number ?? 1;

  return (
    <ScreenWrapper scroll={false} edges={['top', 'left', 'right']}>
      <GradientBackground />

      <View className="flex-1">
        {/* Top row: close · pill · more */}
        <View className="px-6 pt-3 pb-2">
          <View className="flex-row items-center justify-between">
            <IconButton
              shape="circle"
              variant="soft"
              size="md"
              hapticType="light"
              onPress={() => navigation.goBack()}
              accessibilityLabel="Đóng"
              icon={<X size={18} color={Colors.foreground} />}
            />

            <View className="items-center">
              <View className="px-3 py-1 rounded-full bg-[#a855f7]/15">
                <Text className="text-[#a855f7] text-xs font-bold tracking-wide">
                  BOX {boxNumber}/5
                </Text>
              </View>
              <Text className="text-muted-foreground text-[11px] font-semibold mt-1.5">
                Ôn tập: {currentIndex + 1}/{sessionItems.length}
              </Text>
            </View>

            <IconButton
              shape="circle"
              variant="soft"
              size="md"
              hapticType="light"
              onPress={() => {
                /* TODO: open more menu */
              }}
              accessibilityLabel="Thêm"
              icon={<MoreHorizontal size={18} color={Colors.foreground} />}
            />
          </View>
        </View>

        {/* Progress bar */}
        <View className="px-6 mb-3">
          <ProgressBar value={progressPct} tone="primary" thickness="thin" />
        </View>

        {/* Flashcard with 3D flip animation */}
        <View className="flex-1 mx-6 my-2">
          <Animated.View style={[styles.cardShell, frontStyle]}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={toggleFlip}
              className="flex-1 bg-card border border-border rounded-3xl p-6 items-center justify-between shadow-sm shadow-[#193665]/3"
            >
              <Badge label="Mặt trước" variant="zinc" />

              <View className="items-center w-full px-4">
                <Text className="text-3xl font-extrabold text-foreground text-center">
                  {currentItem.word}
                </Text>
                {currentItem.pronunciation ? (
                  <Text className="text-muted-foreground text-base italic mt-2 text-center">
                    {currentItem.pronunciation}
                  </Text>
                ) : null}

                <View className="mt-6">
                  <IconButton
                    variant="soft"
                    size="lg"
                    hapticType="light"
                    onPress={(e: GestureResponderEvent) => {
                      e.stopPropagation?.();
                      speakWord(currentItem.word);
                    }}
                    accessibilityLabel={`Phát âm ${currentItem.word}`}
                    icon={<Volume2 size={20} color={Colors.foreground} />}
                  />
                </View>
              </View>

              <View className="flex-row items-center justify-center">
                <RotateCw size={12} color={Colors.iconSubtle} />
                <Text className="text-muted-foreground text-xs font-semibold ml-1.5">
                  Chạm để lật xem nghĩa
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[styles.cardShell, styles.backFace, backStyle]}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={toggleFlip}
              className="flex-1 bg-card border border-border rounded-3xl p-6"
            >
              <ScrollView
                contentContainerStyle={{
                  flexGrow: 1,
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
                showsVerticalScrollIndicator={false}
                className="w-full"
              >
                <Badge label="Mặt sau" variant="dark" />

                <View className="items-center w-full my-6 px-4">
                  <Text className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-1.5 text-center">
                    Ý nghĩa
                  </Text>
                  <Text className="text-2xl font-bold text-foreground text-center">
                    {currentItem.meaning}
                  </Text>

                  <View className="mt-4">
                    <Badge
                      label={getWordTypeLabel(currentItem.word_type)}
                      variant="zinc"
                    />
                  </View>

                  {currentItem.context_sentence ? (
                    <Card
                      variant="flat"
                      className="p-4 mt-6 w-full mb-0 bg-muted border-border"
                    >
                      <Text className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-1 text-center">
                        Ngữ cảnh (Câu chứa từ)
                      </Text>
                      <Text className="text-foreground text-sm text-center italic leading-relaxed">
                        "{currentItem.context_sentence}"
                      </Text>
                    </Card>
                  ) : null}

                  {currentItem.notes ? (
                    <Card variant="flat" className="p-4 mt-6 w-full mb-0">
                      <Text className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-1">
                        Ghi chú
                      </Text>
                      <Text className="text-muted-foreground text-sm text-center leading-relaxed">
                        {currentItem.notes}
                      </Text>
                    </Card>
                  ) : null}
                </View>

                <View className="flex-row items-center justify-center">
                  <RotateCw size={12} color={Colors.iconSubtle} />
                  <Text className="text-muted-foreground text-xs font-semibold ml-1.5">
                    Chạm để quay lại mặt trước
                  </Text>
                </View>
              </ScrollView>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Bottom buttons — padding respects device safe-area */}
        <View
          className="flex-row w-full gap-3 px-6 pb-4"
          style={{ paddingBottom: Math.max(insets.bottom, 16) + 12 }}
        >
          <Button
            variant="outline"
            hapticType="none"
            onPress={() => handleAnswer(false)}
            title="Chưa thuộc"
            className="flex-1 h-14 rounded-2xl"
            textClassName="text-destructive"
          />
          <Button
            variant="primary"
            hapticType="none"
            onPress={() => handleAnswer(true)}
            title="Đã thuộc"
            className="flex-1 h-14 rounded-2xl bg-success active:bg-success/80 shadow-lg shadow-success/20"
            textClassName="text-success-foreground"
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}

// ---------- Shared bits ----------

const GradientBackground: React.FC = () => (
  <View
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: -1,
    }}
    pointerEvents="none"
  >
    <Svg width="100%" height="100%">
      <Defs>
        <LinearGradient id="flashcardBg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#c2e6fb" stopOpacity="0.45" />
          <Stop offset="45%" stopColor="#ffffff" stopOpacity="1" />
          <Stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#flashcardBg)" />
    </Svg>
  </View>
);

const styles = StyleSheet.create({
  cardShell: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backfaceVisibility: 'hidden',
  },
  backFace: {
    // Reanimated rotates this; the backfaceVisibility hides the mirrored face.
  },
});

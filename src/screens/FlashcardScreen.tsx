import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BookOpen, Flame, Target, Sparkles, ArrowRight } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { Colors, typography } from '../theme';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { IconTile } from '../components/IconTile';
import { ProgressBar } from '../components/ProgressBar';
import { ButtonPrimary, ButtonOutline } from '../components/Button';
import { IconButton } from '../components/IconButton';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import {
  fetchVocabularies,
  reviewVocabulary,
  fetchUserProfile,
} from '../api/client';
import { VocabularyItem, User } from '../types';
import * as Speech from 'expo-speech';
import { useSettings } from '../context/SettingsContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Volume2, RotateCw, Trophy, X, MoreHorizontal } from 'lucide-react-native';
import { triggerHaptic } from '../components/Button';
import { getWordTypeLabel } from '../utils/vocabulary';

const SESSION_SIZE = 15;
const ADVANCE_DELAY_MS = 250;
const FLIP_DURATION_MS = 450;

export default function FlashcardScreen() {
  const navigation = useNavigation<any>();
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
      console.error('Error loading Flashcard data:', e);
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
      console.error('Error submitting Flashcard result:', err);
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
        <LoadingState message="Loading Flashcards..." />
      </ScreenWrapper>
    );
  }

  // ---------- Empty ----------

  if (sessionItems.length === 0) {
    return (
      <ScreenWrapper scroll={false} edges={['top', 'left', 'right']}>
        <View className="px-6 pt-3">
          <IconButton
            shape="circle"
            variant="soft"
            size="md"
            hapticType="light"
            onPress={() => navigation.goBack()}
            accessibilityLabel="Close"
            icon={<X size={18} color={Colors.foreground} />}
          />
        </View>
        <EmptyState
          icon={<BookOpen size={32} color={Colors.iconMuted} />}
          title="No vocabulary yet"
          body="Add new vocabulary to your notebook before starting Flashcards."
          action={{
            label: 'Back',
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
        <View className="flex-1 justify-center px-6">
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
              {isExcellent ? 'Excellent!' : 'Completed!'}
            </Text>
            <Text className="text-muted-foreground text-sm text-center mt-2 max-w-[280px] leading-relaxed">
              You finished this Flashcard session. Keep up your daily learning habit!
            </Text>
          </View>

          <Card className="items-center p-6 mb-6">
            <Text className={`${typography.eyebrowSm} mb-1`}>
              Words remembered this round
            </Text>
            <Text className="text-4xl font-black text-foreground mt-1">
              {score} / {sessionItems.length}
            </Text>
            <Text className="text-muted-foreground text-xs mt-2">
              Accuracy: {Math.round(ratio * 100)}%
            </Text>
          </Card>

          <View className="gap-3">
            <ButtonPrimary onPress={restartSession} title="Start a new round" />
            <ButtonOutline
              onPress={() => navigation.goBack()}
              title="Back to home"
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
              accessibilityLabel="Close"
              icon={<X size={18} color={Colors.foreground} />}
            />

            <View className="items-center">
              <View className="px-3 py-1 rounded-full bg-[#a855f7]/15">
                <Text className="text-[#a855f7] text-xs font-bold tracking-wide">
                  BOX {boxNumber}/5
                </Text>
              </View>
              <Text className="text-muted-foreground text-[11px] font-semibold mt-1.5">
                Review: {currentIndex + 1}/{sessionItems.length}
              </Text>
            </View>

            <IconButton
              shape="circle"
              variant="soft"
              size="md"
              hapticType="light"
              onPress={() => {
                Alert.alert('No extra actions', 'Additional actions are not available yet.');
              }}
              accessibilityLabel="More"
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
          <Animated.View style={[frontStyle]} pointerEvents={isFlipped ? 'none' : 'auto'}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={toggleFlip}
              className="flex-1 bg-card border border-border rounded-3xl p-6 items-center justify-between shadow-sm shadow-[#193665]/3 overflow-hidden"
            >
              <Badge label="Front" variant="zinc" />

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
                    onPress={() => speakWord(currentItem.word)}
                    accessibilityLabel={`Pronounce ${currentItem.word}`}
                    icon={<Volume2 size={20} color={Colors.foreground} />}
                  />
                </View>
              </View>

              <View className="flex-row items-center justify-center">
                <RotateCw size={12} color={Colors.iconSubtle} />
                <Text className="text-muted-foreground text-xs font-semibold ml-1.5">
                  Tap to flip and see meaning
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[backStyle]} pointerEvents={isFlipped ? 'auto' : 'none'}>
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
                <Badge label="Back" variant="dark" />

                <View className="items-center w-full my-6 px-4">
                  <Text className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-1.5 text-center">
                    Meaning
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
                        Context (Example sentence)
                      </Text>
                      <Text className="text-foreground text-sm text-center italic leading-relaxed">
                        "{currentItem.context_sentence}"
                      </Text>
                    </Card>
                  ) : null}

                  {currentItem.notes ? (
                    <Card variant="flat" className="p-4 mt-6 w-full mb-0">
                      <Text className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-1">
                        Notes
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
                    Tap to flip back to the front
                  </Text>
                </View>
              </ScrollView>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Bottom buttons — padding respects device safe-area */}
        <View className="flex-row w-full gap-3 px-6 pb-4">
          <TouchableOpacity
            onPress={() => handleAnswer(false)}
            className="flex-1 h-14 rounded-2xl border border-destructive items-center justify-center"
          >
            <Text className="text-destructive text-base font-bold">Don't know</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleAnswer(true)}
            className="flex-1 h-14 rounded-2xl bg-success items-center justify-center shadow-lg shadow-success/20"
          >
            <Text className="text-success-foreground text-base font-bold">Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  );
}

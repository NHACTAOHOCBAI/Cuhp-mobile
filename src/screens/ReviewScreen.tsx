import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import * as Speech from 'expo-speech';
import {
  Volume2,
  BookOpen,
  Check,
  X,
  RotateCw,
  Trophy,
  ArrowRight,
  Flame,
  Target,
  Sparkles,
  Keyboard,
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
import { Header } from '../components/Header';
import {
  Button,
  ButtonPrimary,
  ButtonOutline,
  triggerHaptic,
} from '../components/Button';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Input } from '../components/Input';
import { IconButton } from '../components/IconButton';
import { IconTile } from '../components/IconTile';
import { SectionTitle } from '../components/SectionTitle';
import { LoadingState } from '../components/LoadingState';
import { ProgressBar } from '../components/ProgressBar';
import { Colors, typography } from '../theme';
import { getWordTypeLabel } from '../utils/vocabulary';

// ---------- StartView ----------

interface StartViewProps {
  currentUser: User | null;
  dueVocabList: VocabularyItem[];
  vocabList: VocabularyItem[];
  reviewMode: 'flashcard' | 'spelling';
  setReviewMode: (mode: 'flashcard' | 'spelling') => void;
  onStart: () => void;
  refreshing: boolean;
  onRefresh: () => void;
}

const StartView: React.FC<StartViewProps> = ({
  currentUser,
  dueVocabList,
  vocabList,
  reviewMode,
  setReviewMode,
  onStart,
  refreshing,
  onRefresh,
}) => {
  const dailyGoalMet = currentUser
    ? currentUser.words_reviewed_today >= currentUser.daily_target
    : false;
  const progressPercent = currentUser
    ? Math.min(100, (currentUser.words_reviewed_today / currentUser.daily_target) * 100)
    : 0;

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.foreground}
          colors={[Colors.foreground]}
        />
      }
      className="px-6"
    >
      {/* Streak & Daily Progress Cards */}
      <View className="flex-row justify-between gap-4 mb-6 mt-4">
        <Card className="flex-1 flex-row items-center mb-0 p-4">
          <View className="mr-3">
            <IconTile
              tone="streak"
              size="md"
              icon={<Flame size={20} color={Colors.streak} />}
            />
          </View>
          <View>
            <Text className={typography.eyebrowSm}>Chuỗi liên tục</Text>
            <Text className="text-foreground text-lg font-black">
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
            <Text className="text-foreground text-lg font-black">
              {currentUser?.words_reviewed_today || 0}/{currentUser?.daily_target || 10}
            </Text>
          </View>
        </Card>
      </View>

      {/* Daily goal progress */}
      <Card className="mb-6">
        <ProgressBar
          value={progressPercent}
          label="Tiến trình ngày hôm nay"
          trailingLabel={`${Math.round(progressPercent)}%`}
          tone="primary"
          footer={
            dailyGoalMet ? (
              <View className="flex-row items-center">
                <Sparkles size={12} color={Colors.warning} />
                <Text className="text-foreground text-xs font-medium ml-1.5">
                  Đã hoàn thành mục tiêu ngày! Tiếp tục phát huy nhé.
                </Text>
              </View>
            ) : null
          }
        />
      </Card>

      {/* Learning status box */}
      <Card variant="flat" className="mb-6 p-5">
        <Text className={`${typography.eyebrowSm} mb-2`}>
          Trạng thái từ vựng
        </Text>
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-muted-foreground text-sm font-medium">
            Số từ cần ôn tập hôm nay:
          </Text>
          <Badge
            label={`${dueVocabList.length} từ đến hạn`}
            variant={dueVocabList.length > 0 ? 'red' : 'green'}
          />
        </View>
        <View className="flex-row justify-between items-center">
          <Text className="text-muted-foreground text-sm font-medium">
            Tổng số từ học tập:
          </Text>
          <Text className="text-foreground text-sm font-bold">
            {vocabList.length} từ
          </Text>
        </View>
      </Card>

      {/* Mode Selector */}
      <Text className={`${typography.eyebrowSm} mb-2 ml-1`}>
        Chọn chế độ ôn tập
      </Text>
      <View className="flex-row justify-between gap-3 mb-8">
        {(
          [
            { key: 'flashcard', icon: BookOpen, title: 'Thẻ ghi nhớ', desc: 'Nhìn chữ đoán nghĩa' },
            { key: 'spelling', icon: Keyboard, title: 'Gõ chính tả', desc: 'Nghe âm gõ từ vựng' },
          ] as const
        ).map((m) => {
          const isSelected = reviewMode === m.key;
          const Icon = m.icon;
          return (
            <TouchableOpacity
              key={m.key}
              onPress={() => {
                triggerHaptic('selection');
                setReviewMode(m.key);
              }}
              className={`flex-1 border p-4 rounded-2xl items-center ${
                isSelected
                  ? 'bg-primary border-primary shadow-sm'
                  : 'bg-background border-border'
              }`}
            >
              <Icon
                size={24}
                color={isSelected ? Colors.primaryForeground : Colors.foreground}
              />
              <Text
                className={`text-sm font-bold mt-2 ${
                  isSelected ? 'text-primary-foreground' : 'text-foreground'
                }`}
              >
                {m.title}
              </Text>
              <Text className="text-[10px] text-center mt-1 leading-relaxed text-muted-foreground">
                {m.desc}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ButtonPrimary
        title="Bắt đầu ôn tập"
        disabled={vocabList.length === 0}
        onPress={onStart}
        icon={<ArrowRight size={18} color={Colors.primaryForeground} />}
        className="mb-6"
      />

      {vocabList.length === 0 ? (
        <Text className="text-destructive text-xs text-center">
          Vui lòng thêm từ vựng mới vào sổ từ trước khi bắt đầu ôn tập.
        </Text>
      ) : null}
    </ScrollView>
  );
};

// ---------- ReviewView ----------

interface ReviewViewProps {
  items: VocabularyItem[];
  index: number;
  mode: 'flashcard' | 'spelling';
  flipped: boolean;
  onFlip: () => void;
  onSpeak: (word: string) => void;
  onAnswer: (known: boolean) => void;
  spellingInput: string;
  setSpellingInput: (s: string) => void;
  spellingChecked: boolean;
  isSpellingCorrect: boolean;
  onCheckSpelling: () => void;
}

const ReviewView: React.FC<ReviewViewProps> = ({
  items,
  index,
  mode,
  flipped,
  onFlip,
  onSpeak,
  onAnswer,
  spellingInput,
  setSpellingInput,
  spellingChecked,
  isSpellingCorrect,
  onCheckSpelling,
}) => {
  const currentItem = items[index];
  if (!currentItem) return null;

  const sessionPct = ((index + 1) / items.length) * 100;
  const modeLabel = mode === 'flashcard' ? 'Chế độ Thẻ ghi nhớ' : 'Chế độ Gõ chính tả';

  return (
    <View className="flex-1 justify-between px-6 py-4">
      <View className="mb-2">
        <ProgressBar
          value={sessionPct}
          label={modeLabel}
          trailingLabel={`${index + 1} / ${items.length}`}
          tone="primary"
          thickness="thin"
        />
      </View>

      {mode === 'flashcard' ? (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            triggerHaptic('light');
            onFlip();
          }}
          className="flex-1 bg-background border border-border rounded-3xl p-6 items-center justify-center shadow-sm shadow-border my-4 min-h-[320px]"
        >
          {!flipped ? (
            <View className="w-full flex-1 items-center justify-between py-6">
              <Badge label="Mặt trước" variant="zinc" />

              <View className="items-center w-full px-4">
                <Text className="text-3xl font-extrabold text-foreground text-center select-text">
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
                    onPress={(e) => {
                      e.stopPropagation?.();
                      onSpeak(currentItem.word);
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
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={{
                flexGrow: 1,
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
              showsVerticalScrollIndicator={false}
              className="w-full py-6"
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
          )}
        </TouchableOpacity>
      ) : (
        <Card className="flex-1 justify-between my-4 min-h-[320px] p-6 mb-0">
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, alignItems: 'center' }}
            showsVerticalScrollIndicator={false}
            className="w-full"
          >
            <Badge
              label="Hãy viết từ tiếng Anh tương ứng"
              variant="zinc"
              className="mb-4"
            />

            <View className="items-center w-full my-4 px-4">
              <Text className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-1 text-center">
                Ý nghĩa tiếng Việt
              </Text>
              <Text className="text-2xl font-bold text-foreground text-center mb-3">
                {currentItem.meaning}
              </Text>

              <View className="mb-6">
                <Badge
                  label={getWordTypeLabel(currentItem.word_type)}
                  variant="zinc"
                />
              </View>

              <ButtonPrimary
                onPress={() => onSpeak(currentItem.word)}
                title="Nghe phát âm"
                icon={<Volume2 size={20} color={Colors.primaryForeground} />}
                className="mb-6 w-auto px-6 h-12"
              />

              <View className="w-full">
                <Input
                  value={spellingInput}
                  onChangeText={(text) => {
                    if (!spellingChecked) setSpellingInput(text);
                  }}
                  placeholder="Nhập từ tiếng Anh..."
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!spellingChecked}
                  inputClassName="text-center font-bold text-lg"
                  className={
                    spellingChecked
                      ? isSpellingCorrect
                        ? 'bg-success/10 border-success/40'
                        : 'bg-destructive/10 border-destructive/40'
                      : ''
                  }
                />
              </View>

              {spellingChecked ? (
                <View className="w-full mt-4">
                  {isSpellingCorrect ? (
                    <Card
                      variant="green"
                      className="p-3.5 rounded-xl items-center mb-0"
                    >
                      <Text className="text-success text-sm font-bold">
                        Chính xác!
                      </Text>
                    </Card>
                  ) : (
                    <Card
                      variant="red"
                      className="p-3.5 rounded-xl items-center mb-0"
                    >
                      <Text className="text-destructive text-xs font-bold uppercase tracking-wider">
                        Từ đúng là:
                      </Text>
                      <Text className="text-destructive text-lg font-black mt-0.5">
                        {currentItem.word}
                      </Text>
                      {currentItem.pronunciation ? (
                        <Text className="text-destructive text-sm italic mt-0.5">
                          {currentItem.pronunciation}
                        </Text>
                      ) : null}
                    </Card>
                  )}
                </View>
              ) : null}
            </View>
          </ScrollView>

          {!spellingChecked ? (
            <ButtonPrimary
              title="Kiểm tra"
              disabled={!spellingInput.trim()}
              onPress={onCheckSpelling}
              className="mt-4 h-12"
            />
          ) : null}
        </Card>
      )}

      {mode === 'flashcard' ? (
        <View className="flex-row w-full justify-between gap-4 mb-4 mt-2">
          <Button
            variant="outline"
            hapticType="none"
            onPress={() => onAnswer(false)}
            title="Chưa thuộc"
            icon={<X size={18} color={Colors.destructive} />}
            className="flex-1 h-14"
          />
          <Button
            variant="primary"
            hapticType="none"
            onPress={() => onAnswer(true)}
            title="Đã thuộc"
            icon={<Check size={18} color={Colors.primaryForeground} />}
            className="flex-1 h-14"
          />
        </View>
      ) : spellingChecked ? (
        <ButtonPrimary
          onPress={() => onAnswer(isSpellingCorrect)}
          title="Tiếp theo"
          icon={<ArrowRight size={18} color={Colors.primaryForeground} />}
          className="mb-4 mt-2 h-14"
        />
      ) : null}
    </View>
  );
};

// ---------- ResultView ----------

interface ResultViewProps {
  score: number;
  total: number;
  currentUser: User | null;
  onRestart: () => void;
  onHome: () => void;
}

const ResultView: React.FC<ResultViewProps> = ({
  score,
  total,
  currentUser,
  onRestart,
  onHome,
}) => {
  const ratio = score / total;
  const isExcellent = ratio >= 0.8;

  return (
    <View className="flex-1 justify-center px-6">
      <View className="items-center mb-8">
        <View className="mb-6">
          <IconTile
            tone="muted"
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
          Bạn đã hoàn thành phiên ôn tập này. Hãy tiếp tục duy trì thói quen học
          tập hàng ngày!
        </Text>
      </View>

      <Card className="items-center p-6 mb-8">
        <Text className={`${typography.eyebrowSm} mb-1`}>
          Số từ đã thuộc lượt này
        </Text>
        <Text className="text-4xl font-black text-foreground mt-1">
          {score} / {total}
        </Text>
        <Text className="text-muted-foreground text-xs mt-2">
          Đạt tỉ lệ chính xác {Math.round(ratio * 100)}%
        </Text>
      </Card>

      <Card variant="orange" className="p-5 mb-8 items-center flex-row">
        <View className="mr-3">
          <Flame size={32} color={Colors.streak} />
        </View>
        <View className="flex-1">
          <Text className="text-streak-foreground text-sm font-bold">
            Chuỗi của bạn: {currentUser?.current_streak || 0} ngày liên tiếp!
          </Text>
          <Text className="text-streak-foreground text-xs mt-0.5 leading-relaxed">
            Mục tiêu học ngày hôm nay: {currentUser?.words_reviewed_today || 0}/
            {currentUser?.daily_target || 10} từ.
          </Text>
        </View>
      </Card>

      <View className="gap-3">
        <ButtonPrimary onPress={onRestart} title="Ôn tập tiếp lượt mới" />
        <ButtonOutline onPress={onHome} title="Quay lại trang chủ" />
      </View>
    </View>
  );
};

// ---------- ReviewScreen ----------

export default function ReviewScreen() {
  const { user, token, login } = useAuth();
  const { accent, speechRate } = useSettings();

  const [vocabList, setVocabList] = useState<VocabularyItem[]>([]);
  const [dueVocabList, setDueVocabList] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionItems, setSessionItems] = useState<VocabularyItem[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(user);

  const [gameState, setGameState] = useState<'start' | 'review' | 'result'>(
    'start'
  );
  const [reviewMode, setReviewMode] = useState<'flashcard' | 'spelling'>(
    'flashcard'
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [spellingInput, setSpellingInput] = useState('');
  const [spellingChecked, setSpellingChecked] = useState(false);
  const [isSpellingCorrect, setIsSpellingCorrect] = useState(false);

  const loadData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
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
      setVocabList(allResponse.items || []);

      const dueResponse = await fetchVocabularies(
        { page: 1, page_size: 100, due: true },
        token
      );
      setDueVocabList(dueResponse.items || []);
    } catch (e) {
      console.error('Lỗi khi tải dữ liệu ôn tập:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData(true);
    setRefreshing(false);
  };

  const startSession = () => {
    const pool = dueVocabList.length > 0 ? dueVocabList : vocabList;
    if (pool.length === 0) return;

    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 15);

    setSessionItems(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setIsFlipped(false);
    setSpellingInput('');
    setSpellingChecked(false);
    setGameState('review');
  };

  const speakWord = (word: string) => {
    Speech.speak(word, { language: accent, pitch: 1.0, rate: speechRate });
  };

  const handleAnswerSubmit = async (known: boolean) => {
    triggerHaptic(known ? 'success' : 'error');

    const currentItem = sessionItems[currentIndex];
    if (!currentItem) return;

    try {
      const response = await reviewVocabulary(currentItem.id, known, token);

      if (currentUser) {
        const updatedUser: User = {
          ...currentUser,
          words_reviewed_today: response.words_reviewed_today,
          current_streak: response.current_streak,
        };
        setCurrentUser(updatedUser);
      }
    } catch (err) {
      console.error('Lỗi khi gửi kết quả ôn tập:', err);
    }

    if (known) {
      setScore((prev) => prev + 1);
    }

    if (currentIndex < sessionItems.length - 1) {
      setIsFlipped(false);
      setSpellingInput('');
      setSpellingChecked(false);
      setCurrentIndex((prev) => prev + 1);
    } else {
      setGameState('result');
    }
  };

  const checkSpellingAnswer = () => {
    const currentItem = sessionItems[currentIndex];
    if (!currentItem) return;

    const answer = spellingInput.trim().toLowerCase();
    const correct = currentItem.word.trim().toLowerCase();
    const isMatched = answer === correct;

    setIsSpellingCorrect(isMatched);
    setSpellingChecked(true);
    triggerHaptic(isMatched ? 'success' : 'error');
    speakWord(currentItem.word);
  };

  const subtitle = user
    ? `Xin chào, ${user.name || 'bạn'}`
    : 'Xin chào';

  return (
    <ScreenWrapper scroll={false}>
      <Header title="Ôn Tập Từ Vựng" subtitle={subtitle} />

      {loading ? (
        <LoadingState message="Đang tải dữ liệu ôn tập..." />
      ) : (
        <View className="flex-1">
          {gameState === 'start' ? (
            <StartView
              currentUser={currentUser}
              dueVocabList={dueVocabList}
              vocabList={vocabList}
              reviewMode={reviewMode}
              setReviewMode={setReviewMode}
              onStart={startSession}
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          ) : null}
          {gameState === 'review' ? (
            <ReviewView
              items={sessionItems}
              index={currentIndex}
              mode={reviewMode}
              flipped={isFlipped}
              onFlip={() => setIsFlipped(!isFlipped)}
              onSpeak={speakWord}
              onAnswer={handleAnswerSubmit}
              spellingInput={spellingInput}
              setSpellingInput={setSpellingInput}
              spellingChecked={spellingChecked}
              isSpellingCorrect={isSpellingCorrect}
              onCheckSpelling={checkSpellingAnswer}
            />
          ) : null}
          {gameState === 'result' ? (
            <ResultView
              score={score}
              total={sessionItems.length}
              currentUser={currentUser}
              onRestart={startSession}
              onHome={async () => {
                await loadData(true);
                setGameState('start');
              }}
            />
          ) : null}
        </View>
      )}
    </ScreenWrapper>
  );
}

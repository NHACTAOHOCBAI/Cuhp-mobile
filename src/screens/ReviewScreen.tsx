import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import * as Speech from "expo-speech";
import {
  Volume2,
  BookOpen,
  Brain,
  Check,
  X,
  RotateCw,
  Trophy,
  ArrowRight,
  Flame,
  Target,
  Sparkles,
  Keyboard,
} from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { fetchVocabularies, reviewVocabulary, fetchUserProfile } from "../api/client";
import { VocabularyItem, User } from "../types";
import { ScreenWrapper } from "../components/ScreenWrapper";
import { Header } from "../components/Header";
import { Button, triggerHaptic } from "../components/Button";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Input } from "../components/Input";

const getWordTypeLabel = (type?: string | null) => {
  const normalized = type?.toLowerCase() || "";
  switch (normalized) {
    case "noun": return "Danh từ";
    case "verb": return "Động từ";
    case "adjective": return "Tính từ";
    case "adverb": return "Trạng từ";
    case "pronoun": return "Đại từ";
    case "preposition": return "Giới từ";
    case "conjunction": return "Liên từ";
    case "interjection": return "Thán từ";
    default: return "Khác";
  }
};

export default function ReviewScreen() {
  const { user, token, login } = useAuth();
  const { accent, speechRate } = useSettings();

  // Core Data State
  const [vocabList, setVocabList] = useState<VocabularyItem[]>([]);
  const [dueVocabList, setDueVocabList] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionItems, setSessionItems] = useState<VocabularyItem[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(user);

  // Review Session State
  const [gameState, setGameState] = useState<"start" | "review" | "result">("start");
  const [reviewMode, setReviewMode] = useState<"flashcard" | "spelling">("flashcard");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Spelling Mode Input State
  const [spellingInput, setSpellingInput] = useState("");
  const [spellingChecked, setSpellingChecked] = useState(false);
  const [isSpellingCorrect, setIsSpellingCorrect] = useState(false);

  // Load user vocabulary and profile details
  const loadData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const freshUser = await fetchUserProfile(token);
      setCurrentUser(freshUser);
      if (token) {
        await login(token, freshUser);
      }

      const allResponse = await fetchVocabularies({ page: 1, page_size: 100 }, token);
      setVocabList(allResponse.items || []);

      const dueResponse = await fetchVocabularies({ page: 1, page_size: 100, due: true }, token);
      setDueVocabList(dueResponse.items || []);
    } catch (e) {
      console.error("Lỗi khi tải dữ liệu ôn tập:", e);
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

    const shuffled = [...pool]
      .sort(() => Math.random() - 0.5)
      .slice(0, 15);

    setSessionItems(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setIsFlipped(false);
    setSpellingInput("");
    setSpellingChecked(false);
    setGameState("review");
  };

  const speakWord = (word: string) => {
    Speech.speak(word, { language: accent, pitch: 1.0, rate: speechRate });
  };

  const handleAnswerSubmit = async (known: boolean) => {
    // Trực tiếp kích hoạt rung phản hồi Đúng/Sai dựa theo kết quả người dùng chọn
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
      console.error("Lỗi khi gửi kết quả ôn tập:", err);
    }

    if (known) {
      setScore((prev) => prev + 1);
    }

    if (currentIndex < sessionItems.length - 1) {
      setIsFlipped(false);
      setSpellingInput("");
      setSpellingChecked(false);
      setCurrentIndex((prev) => prev + 1);
    } else {
      setGameState("result");
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

    // Kích hoạt rung phản hồi Đúng/Sai
    triggerHaptic(isMatched ? 'success' : 'error');

    speakWord(currentItem.word);
  };

  const renderStart = () => {
    const dailyGoalMet = currentUser ? currentUser.words_reviewed_today >= currentUser.daily_target : false;
    const progressPercent = currentUser ? Math.min(100, (currentUser.words_reviewed_today / currentUser.daily_target) * 100) : 0;

    return (
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#000000"
            colors={["#000000"]}
          />
        }
        className="px-6"
      >
        {/* Streak & Daily Progress Cards */}
        <View className="flex-row justify-between gap-4 mb-6 mt-4">
          {/* Streak Box */}
          <Card className="flex-1 flex-row items-center mb-0 p-4">
            <View className="h-10 w-10 bg-orange-50 rounded-full items-center justify-center mr-3">
              <Flame size={20} color="#f97316" />
            </View>
            <View>
              <Text className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Chuỗi liên tục</Text>
              <Text className="text-zinc-900 text-lg font-black">{currentUser?.current_streak || 0} ngày</Text>
            </View>
          </Card>

          {/* Daily Goal Box */}
          <Card className="flex-1 flex-row items-center mb-0 p-4">
            <View className="h-10 w-10 bg-zinc-100 rounded-full items-center justify-center mr-3">
              <Target size={20} color="#000000" />
            </View>
            <View className="flex-1">
              <Text className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Mục tiêu ngày</Text>
              <Text className="text-zinc-900 text-lg font-black">
                {currentUser?.words_reviewed_today || 0}/{currentUser?.daily_target || 10}
              </Text>
            </View>
          </Card>
        </View>

        {/* Progress Bar under cards */}
        <Card className="mb-6">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-zinc-500 text-xs font-semibold">Tiến trình ngày hôm nay</Text>
            <Text className="text-zinc-900 text-xs font-bold">{Math.round(progressPercent)}%</Text>
          </View>
          <View className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
            <View
              className="h-full bg-black rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </View>
          {dailyGoalMet && (
            <View className="flex-row items-center mt-2.5">
              <Sparkles size={12} color="#f59e0b" />
              <Text className="text-zinc-700 text-xs font-medium ml-1.5">
                Đã hoàn thành mục tiêu ngày! Tiếp tục phát huy nhé.
              </Text>
            </View>
          )}
        </Card>

        {/* Learning status box */}
        <Card variant="flat" className="mb-6 p-5">
          <Text className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2">Trạng thái từ vựng</Text>
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-zinc-600 text-sm font-medium">Số từ cần ôn tập hôm nay:</Text>
            <Badge
              label={`${dueVocabList.length} từ đến hạn`}
              variant={dueVocabList.length > 0 ? "red" : "green"}
            />
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-zinc-600 text-sm font-medium">Tổng số từ học tập:</Text>
            <Text className="text-zinc-900 text-sm font-bold">{vocabList.length} từ</Text>
          </View>
        </Card>

        {/* Mode Selector */}
        <Text className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 ml-1">Chọn chế độ ôn tập</Text>
        <View className="flex-row justify-between gap-3 mb-8">
          {/* Flashcard Option */}
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('selection');
              setReviewMode("flashcard");
            }}
            className={`flex-1 border p-4 rounded-2xl items-center ${reviewMode === "flashcard"
              ? "bg-black border-black shadow-sm"
              : "bg-white border-zinc-200"
            }`}
          >
            <BookOpen size={24} color={reviewMode === "flashcard" ? "#ffffff" : "#000000"} />
            <Text className={`text-sm font-bold mt-2 ${reviewMode === "flashcard" ? "text-white" : "text-zinc-700"}`}>
              Thẻ ghi nhớ
            </Text>
            <Text className={`text-[10px] text-center mt-1 leading-relaxed ${reviewMode === "flashcard" ? "text-zinc-400" : "text-zinc-400"}`}>
              Nhìn chữ đoán nghĩa
            </Text>
          </TouchableOpacity>

          {/* Spelling Option */}
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('selection');
              setReviewMode("spelling");
            }}
            className={`flex-1 border p-4 rounded-2xl items-center ${reviewMode === "spelling"
              ? "bg-black border-black shadow-sm"
              : "bg-white border-zinc-200"
            }`}
          >
            <Keyboard size={24} color={reviewMode === "spelling" ? "#ffffff" : "#000000"} />
            <Text className={`text-sm font-bold mt-2 ${reviewMode === "spelling" ? "text-white" : "text-zinc-700"}`}>
              Gõ chính tả
            </Text>
            <Text className={`text-[10px] text-center mt-1 leading-relaxed ${reviewMode === "spelling" ? "text-zinc-400" : "text-zinc-400"}`}>
              Nghe âm gõ từ vựng
            </Text>
          </TouchableOpacity>
        </View>

        {/* Start Button */}
        <Button
          title="Bắt đầu ôn tập"
          disabled={vocabList.length === 0}
          onPress={startSession}
          icon={<ArrowRight size={18} color="#ffffff" />}
          className="mb-6"
        />

        {vocabList.length === 0 && (
          <Text className="text-red-500 text-xs text-center">
            Vui lòng thêm từ vựng mới vào sổ từ trước khi bắt đầu ôn tập.
          </Text>
        )}
      </ScrollView>
    );
  };

  const renderReview = () => {
    const currentItem = sessionItems[currentIndex];
    if (!currentItem) return null;

    return (
      <View className="flex-1 justify-between px-6 py-4">
        {/* Progress Bar */}
        <View className="mb-2">
          <View className="flex-row justify-between items-center mb-1.5">
            <Text className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
              {reviewMode === "flashcard" ? "Chế độ Thẻ ghi nhớ" : "Chế độ Gõ chính tả"}
            </Text>
            <Text className="text-zinc-900 text-xs font-bold">
              {currentIndex + 1} / {sessionItems.length}
            </Text>
          </View>
          <View className="h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden">
            <View
              className="h-full bg-black rounded-full"
              style={{ width: `${((currentIndex + 1) / sessionItems.length) * 100}%` }}
            />
          </View>
        </View>

        {reviewMode === "flashcard" ? (
          /* ==================== FLASHCARD MODE ==================== */
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              triggerHaptic('light');
              setIsFlipped(!isFlipped);
            }}
            className="flex-1 bg-white border border-zinc-200 rounded-3xl p-6 items-center justify-center shadow-sm shadow-zinc-200/40 my-4 min-h-[320px]"
          >
            {!isFlipped ? (
              /* FRONT CARD */
              <View className="w-full flex-1 items-center justify-between py-6">
                <Badge label="Mặt trước" variant="zinc" />

                <View className="items-center w-full px-4">
                  <Text className="text-3xl font-extrabold text-zinc-900 text-center select-text">
                    {currentItem.word}
                  </Text>
                  {currentItem.pronunciation ? (
                    <Text className="text-zinc-500 text-base italic mt-2 text-center">
                      {currentItem.pronunciation}
                    </Text>
                  ) : null}

                  <Button
                    variant="ghost"
                    hapticType="light"
                    onPress={(e) => {
                      e.stopPropagation(); // prevent flipping
                      speakWord(currentItem.word);
                    }}
                    title=""
                    icon={<Volume2 size={20} color="#000000" />}
                    className="bg-zinc-100 p-3 rounded-full active:bg-zinc-200 mt-6"
                  />
                </View>

                <View className="flex-row items-center justify-center">
                  <RotateCw size={12} color="#a1a1aa" />
                  <Text className="text-zinc-400 text-xs font-semibold ml-1.5">
                    Chạm để lật xem nghĩa
                  </Text>
                </View>
              </View>
            ) : (
              /* BACK CARD */
              <ScrollView
                contentContainerStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "space-between" }}
                showsVerticalScrollIndicator={false}
                className="w-full py-6"
              >
                <Badge label="Mặt sau" variant="dark" />

                <View className="items-center w-full my-6 px-4">
                  <Text className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1.5">
                    Ý nghĩa
                  </Text>
                  <Text className="text-2xl font-bold text-zinc-900 text-center">
                    {currentItem.meaning}
                  </Text>

                  <View className="mt-4">
                    <Badge label={getWordTypeLabel(currentItem.word_type)} variant="zinc" />
                  </View>

                  {currentItem.notes ? (
                    <Card variant="flat" className="p-4 mt-6 w-full mb-0">
                      <Text className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">
                        Ghi chú
                      </Text>
                      <Text className="text-zinc-600 text-sm text-center leading-relaxed">
                        {currentItem.notes}
                      </Text>
                    </Card>
                  ) : null}
                </View>

                <View className="flex-row items-center justify-center">
                  <RotateCw size={12} color="#a1a1aa" />
                  <Text className="text-zinc-400 text-xs font-semibold ml-1.5">
                    Chạm để quay lại mặt trước
                  </Text>
                </View>
              </ScrollView>
            )}
          </TouchableOpacity>
        ) : (
          /* ==================== SPELLING MODE ==================== */
          <Card className="flex-1 justify-between my-4 min-h-[320px] p-6 mb-0">
            <ScrollView
              contentContainerStyle={{ flexGrow: 1, alignItems: "center" }}
              showsVerticalScrollIndicator={false}
              className="w-full"
            >
              <Badge label="Hãy viết từ tiếng Anh tương ứng" variant="zinc" className="mb-4" />

              <View className="items-center w-full my-4 px-4">
                <Text className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">
                  Ý nghĩa tiếng Việt
                </Text>
                <Text className="text-2xl font-bold text-zinc-900 text-center mb-3">
                  {currentItem.meaning}
                </Text>

                <View className="mb-6">
                  <Badge label={getWordTypeLabel(currentItem.word_type)} variant="zinc" />
                </View>

                {/* Speaker pronunciation helper */}
                <Button
                  variant="secondary"
                  hapticType="light"
                  onPress={() => speakWord(currentItem.word)}
                  title="Nghe phát âm"
                  icon={<Volume2 size={20} color="#000000" />}
                  className="mb-6 flex-row items-center gap-2 px-6 h-12 w-auto"
                />

                {/* Input for answer */}
                <Input
                  value={spellingInput}
                  onChangeText={text => {
                    if (!spellingChecked) {
                      setSpellingInput(text);
                    }
                  }}
                  placeholder="Nhập từ tiếng Anh..."
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!spellingChecked}
                  inputClassName="text-center font-bold text-lg"
                  className={
                    spellingChecked
                      ? isSpellingCorrect
                        ? "bg-green-50 border-green-300"
                        : "bg-red-50 border-red-300"
                      : ""
                  }
                />

                {/* Explanation / Correction feedback */}
                {spellingChecked && (
                  <View className="w-full mt-4">
                    {isSpellingCorrect ? (
                      <Card variant="green" className="p-3.5 rounded-xl items-center mb-0">
                        <Text className="text-green-800 text-sm font-bold">Chính xác!</Text>
                      </Card>
                    ) : (
                      <Card variant="red" className="p-3.5 rounded-xl items-center mb-0">
                        <Text className="text-red-800 text-xs font-bold uppercase tracking-wider">Từ đúng là:</Text>
                        <Text className="text-red-900 text-lg font-black mt-0.5">{currentItem.word}</Text>
                        {currentItem.pronunciation ? (
                          <Text className="text-red-700 text-sm italic mt-0.5">{currentItem.pronunciation}</Text>
                        ) : null}
                      </Card>
                    )}
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Check Button for spelling */}
            {!spellingChecked && (
              <Button
                title="Kiểm tra"
                disabled={!spellingInput.trim()}
                onPress={checkSpellingAnswer}
                className="mt-4 h-12"
              />
            )}
          </Card>
        )}

        {/* Action Buttons (Submit results to SRS) */}
        {reviewMode === "flashcard" ? (
          /* Buttons for Flashcards mode */
          <View className="flex-row w-full justify-between gap-4 mb-4 mt-2">
            <Button
              variant="outline"
              hapticType="none" // handle custom in handleAnswerSubmit
              onPress={() => handleAnswerSubmit(false)}
              title="Chưa thuộc"
              icon={<X size={18} color="#ef4444" />}
              className="flex-1 h-14"
            />

            <Button
              variant="primary"
              hapticType="none" // handle custom in handleAnswerSubmit
              onPress={() => handleAnswerSubmit(true)}
              title="Đã thuộc"
              icon={<Check size={18} color="#ffffff" />}
              className="flex-1 h-14"
            />
          </View>
        ) : (
          /* Action Buttons for spelling mode after checking */
          spellingChecked && (
            <Button
              onPress={() => handleAnswerSubmit(isSpellingCorrect)}
              title="Tiếp theo"
              icon={<ArrowRight size={18} color="#ffffff" />}
              className="mb-4 mt-2 h-14"
            />
          )
        )}
      </View>
    );
  };

  const renderResult = () => {
    const ratio = score / sessionItems.length;
    const isExcellent = ratio >= 0.8;

    return (
      <View className="flex-1 justify-center px-6">
        <View className="items-center mb-8">
          <View className="h-20 w-20 bg-zinc-100 border border-zinc-200 rounded-full items-center justify-center mb-6 shadow-sm shadow-zinc-100/50">
            <Trophy size={40} color={isExcellent ? "#eab308" : "#71717a"} />
          </View>
          <Text className="text-2xl font-extrabold text-zinc-900 text-center tracking-tight">
            {isExcellent ? "Tuyệt Vời!" : "Hoàn Thành!"}
          </Text>
          <Text className="text-zinc-500 text-sm text-center mt-2 max-w-[280px] leading-relaxed">
            Bạn đã hoàn thành phiên ôn tập này. Hãy tiếp tục duy trì thói quen học tập hàng ngày!
          </Text>
        </View>

        {/* Results Info Box */}
        <Card className="items-center p-6 mb-8">
          <Text className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            Số từ đã thuộc lượt này
          </Text>
          <Text className="text-4xl font-black text-zinc-950 mt-1">
            {score} / {sessionItems.length}
          </Text>
          <Text className="text-zinc-500 text-xs mt-2">
            Đạt tỉ lệ chính xác {Math.round(ratio * 100)}%
          </Text>
        </Card>

        {/* Streak Increment Result Message */}
        <Card variant="orange" className="p-5 mb-8 items-center flex-row">
          <View className="mr-3">
            <Flame size={32} color="#f97316" />
          </View>
          <View className="flex-1">
            <Text className="text-orange-800 text-sm font-bold">Chuỗi của bạn: {currentUser?.current_streak || 0} ngày liên tiếp!</Text>
            <Text className="text-orange-600 text-xs mt-0.5 leading-relaxed">
              Mục tiêu học ngày hôm nay: {currentUser?.words_reviewed_today || 0}/{currentUser?.daily_target || 10} từ.
            </Text>
          </View>
        </Card>

        {/* End-game Action Buttons */}
        <View className="gap-3">
          <Button
            onPress={startSession}
            title="Ôn tập tiếp lượt mới"
          />

          <Button
            variant="outline"
            onPress={async () => {
              await loadData(true);
              setGameState("start");
            }}
            title="Quay lại trang chủ"
          />
        </View>
      </View>
    );
  };

  return (
    <ScreenWrapper scroll={false}>
      {/* Top Header Bar */}
      <Header title="Ôn Tập Từ Vựng" />

      {/* Main Container */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#000000" />
          <Text className="text-zinc-500 text-sm mt-3 font-medium">Đang tải dữ liệu ôn tập...</Text>
        </View>
      ) : (
        <View className="flex-1">
          {gameState === "start" && renderStart()}
          {gameState === "review" && renderReview()}
          {gameState === "result" && renderResult()}
        </View>
      )}
    </ScreenWrapper>
  );
}

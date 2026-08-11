import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  RefreshControl,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  LogOut,
  Flame,
  Target,
  Sparkles,
  Keyboard,
} from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import { fetchVocabularies, reviewVocabulary, fetchUserProfile } from "../api/client";
import { VocabularyItem, User } from "../types";

// Grayscale badge helper matching the VocabularyScreen styling
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
  const { user, token, logout, login } = useAuth();
  const insets = useSafeAreaInsets();

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
      // 1. Fetch fresh user profile (to sync streak & words_reviewed_today)
      const freshUser = await fetchUserProfile(token);
      setCurrentUser(freshUser);
      // Update AuthContext to sync globally
      if (token) {
        await login(token, freshUser);
      }

      // 2. Fetch vocabulary list
      const allResponse = await fetchVocabularies({ page: 1, page_size: 100 }, token);
      setVocabList(allResponse.items || []);

      // 3. Fetch due vocabulary items
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

  // Start a new review session
  const startSession = () => {
    // Select from due items first; if none, fall back to all items
    const pool = dueVocabList.length > 0 ? dueVocabList : vocabList;
    if (pool.length === 0) return;

    // Shuffle and take max 15 words
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

  // Speak word
  const speakWord = (word: string) => {
    Speech.speak(word, { language: "en-US", pitch: 1.0, rate: 0.9 });
  };

  // Answer action - submits review to BE
  const handleAnswerSubmit = async (known: boolean) => {
    const currentItem = sessionItems[currentIndex];
    if (!currentItem) return;

    try {
      // Submit result to Backend to recalculate Leitner interval and update user progress
      const response = await reviewVocabulary(currentItem.id, known, token);

      // Update local profile progress and streak
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

    // Move to next word
    if (currentIndex < sessionItems.length - 1) {
      setIsFlipped(false);
      setSpellingInput("");
      setSpellingChecked(false);
      setCurrentIndex((prev) => prev + 1);
    } else {
      setGameState("result");
    }
  };

  // Spelling Check Action
  const checkSpellingAnswer = () => {
    const currentItem = sessionItems[currentIndex];
    if (!currentItem) return;

    const answer = spellingInput.trim().toLowerCase();
    const correct = currentItem.word.trim().toLowerCase();
    const isMatched = answer === correct;

    setIsSpellingCorrect(isMatched);
    setSpellingChecked(true);
    // Auto speak correct answer
    speakWord(currentItem.word);
  };

  // Render Start State
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
          <View className="flex-1 bg-white border border-zinc-200 rounded-2xl p-4 flex-row items-center shadow-sm shadow-zinc-100/50">
            <View className="h-10 w-10 bg-orange-50 rounded-full items-center justify-center mr-3">
              <Flame size={20} color="#f97316" />
            </View>
            <View>
              <Text className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Chuỗi liên tục</Text>
              <Text className="text-zinc-900 text-lg font-black">{currentUser?.current_streak || 0} ngày</Text>
            </View>
          </View>

          {/* Daily Goal Box */}
          <View className="flex-1 bg-white border border-zinc-200 rounded-2xl p-4 flex-row items-center shadow-sm shadow-zinc-100/50">
            <View className="h-10 w-10 bg-zinc-100 rounded-full items-center justify-center mr-3">
              <Target size={20} color="#000000" />
            </View>
            <View className="flex-1">
              <Text className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Mục tiêu ngày</Text>
              <Text className="text-zinc-900 text-lg font-black">
                {currentUser?.words_reviewed_today || 0}/{currentUser?.daily_target || 10}
              </Text>
            </View>
          </View>
        </View>

        {/* Progress Bar under cards */}
        <View className="bg-white border border-zinc-200 rounded-2xl p-4 mb-6 shadow-sm shadow-zinc-100/50">
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
        </View>

        {/* Learning status box */}
        <View className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 mb-6">
          <Text className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2">Trạng thái từ vựng</Text>
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-zinc-600 text-sm font-medium">Số từ cần ôn tập hôm nay:</Text>
            <View className={`px-3 py-1 rounded-full ${dueVocabList.length > 0 ? "bg-red-50 border border-red-100" : "bg-green-50 border border-green-100"}`}>
              <Text className={`text-xs font-bold ${dueVocabList.length > 0 ? "text-red-600" : "text-green-600"}`}>
                {dueVocabList.length} từ đến hạn
              </Text>
            </View>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-zinc-600 text-sm font-medium">Tổng số từ học tập:</Text>
            <Text className="text-zinc-900 text-sm font-bold">{vocabList.length} từ</Text>
          </View>
        </View>

        {/* Mode Selector */}
        <Text className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 ml-1">Chọn chế độ ôn tập</Text>
        <View className="flex-row justify-between gap-3 mb-8">
          {/* Flashcard Option */}
          <TouchableOpacity
            onPress={() => setReviewMode("flashcard")}
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
            onPress={() => setReviewMode("spelling")}
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
        <TouchableOpacity
          onPress={startSession}
          disabled={vocabList.length === 0}
          className={`w-full h-14 rounded-xl flex-row items-center justify-center shadow-lg shadow-black/10 mb-6 ${vocabList.length === 0 ? "bg-zinc-300" : "bg-black active:bg-zinc-800"
            }`}
        >
          <Text className="text-white text-base font-bold mr-2">Bắt đầu ôn tập</Text>
          <ArrowRight size={18} color="#ffffff" />
        </TouchableOpacity>

        {vocabList.length === 0 && (
          <Text className="text-red-500 text-xs text-center">
            Vui lòng thêm từ vựng mới vào sổ từ trước khi bắt đầu ôn tập.
          </Text>
        )}
      </ScrollView>
    );
  };

  // Render Review State
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
            onPress={() => setIsFlipped(!isFlipped)}
            className="flex-1 bg-white border border-zinc-200 rounded-3xl p-6 items-center justify-center shadow-sm shadow-zinc-200/40 my-4 min-h-[320px]"
          >
            {!isFlipped ? (
              /* FRONT CARD */
              <View className="w-full flex-1 items-center justify-between py-6">
                <View className="bg-zinc-100 px-3 py-1 rounded-full border border-zinc-200/50">
                  <Text className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                    Mặt trước
                  </Text>
                </View>

                <View className="items-center w-full px-4">
                  <Text className="text-3xl font-extrabold text-zinc-900 text-center select-text">
                    {currentItem.word}
                  </Text>
                  {currentItem.pronunciation ? (
                    <Text className="text-zinc-500 text-base italic mt-2 text-center">
                      {currentItem.pronunciation}
                    </Text>
                  ) : null}

                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation(); // prevent flipping
                      speakWord(currentItem.word);
                    }}
                    className="bg-zinc-100 p-3 rounded-full active:bg-zinc-200 mt-6"
                  >
                    <Volume2 size={20} color="#000000" />
                  </TouchableOpacity>
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
                <View className="bg-zinc-950 px-3 py-1 rounded-full border border-zinc-800">
                  <Text className="text-white text-[10px] font-bold uppercase tracking-wider">
                    Mặt sau
                  </Text>
                </View>

                <View className="items-center w-full my-6 px-4">
                  <Text className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1.5">
                    Ý nghĩa
                  </Text>
                  <Text className="text-2xl font-bold text-zinc-900 text-center">
                    {currentItem.meaning}
                  </Text>

                  <View className="bg-zinc-100 border border-zinc-200/60 px-3 py-1 rounded-full mt-4">
                    <Text className="text-zinc-600 text-xs font-bold">
                      {getWordTypeLabel(currentItem.word_type)}
                    </Text>
                  </View>

                  {currentItem.notes ? (
                    <View className="bg-zinc-50 border border-zinc-100 p-4 rounded-xl mt-6 w-full">
                      <Text className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">
                        Ghi chú
                      </Text>
                      <Text className="text-zinc-600 text-sm text-center leading-relaxed">
                        {currentItem.notes}
                      </Text>
                    </View>
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
          <View className="flex-1 bg-white border border-zinc-200 rounded-3xl p-6 justify-between my-4 min-h-[320px] shadow-sm shadow-zinc-200/40">
            <ScrollView
              contentContainerStyle={{ flexGrow: 1, alignItems: "center" }}
              showsVerticalScrollIndicator={false}
              className="w-full"
            >
              <View className="bg-zinc-100 px-3 py-1 rounded-full border border-zinc-200/50 mb-4">
                <Text className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                  Hãy viết từ tiếng Anh tương ứng
                </Text>
              </View>

              <View className="items-center w-full my-4 px-4">
                <Text className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">
                  Ý nghĩa tiếng Việt
                </Text>
                <Text className="text-2xl font-bold text-zinc-900 text-center mb-3">
                  {currentItem.meaning}
                </Text>

                <View className="bg-zinc-100 border border-zinc-200/60 px-3 py-1 rounded-full mb-6">
                  <Text className="text-zinc-600 text-xs font-bold">
                    {getWordTypeLabel(currentItem.word_type)}
                  </Text>
                </View>

                {/* Speaker pronunciation helper */}
                <TouchableOpacity
                  onPress={() => speakWord(currentItem.word)}
                  className="bg-zinc-100 p-4 rounded-full active:bg-zinc-200 mb-6 flex-row items-center gap-2 px-6"
                >
                  <Volume2 size={20} color="#000000" />
                  <Text className="text-zinc-800 text-xs font-bold">Nghe phát âm</Text>
                </TouchableOpacity>

                {/* TextInput for answer */}
                <View className="w-full">
                  <TextInput
                    value={spellingInput}
                    onChangeText={setSpellingInput}
                    placeholder="Nhập từ tiếng Anh..."
                    placeholderTextColor="#a1a1aa"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!spellingChecked}
                    textAlign="center"
                    className={`w-full border h-14 rounded-xl px-4 font-bold text-lg text-zinc-900 ${spellingChecked
                        ? isSpellingCorrect
                          ? "bg-green-50 border-green-300"
                          : "bg-red-50 border-red-300"
                        : "bg-zinc-50/50 border-zinc-200"
                      }`}
                  />
                </View>

                {/* Explanation / Correction feedback */}
                {spellingChecked && (
                  <View className="w-full mt-4">
                    {isSpellingCorrect ? (
                      <View className="bg-green-50 border border-green-200 p-3.5 rounded-xl items-center">
                        <Text className="text-green-800 text-sm font-bold">Chính xác!</Text>
                      </View>
                    ) : (
                      <View className="bg-red-50 border border-red-200 p-3.5 rounded-xl items-center">
                        <Text className="text-red-800 text-xs font-bold uppercase tracking-wider">Từ đúng là:</Text>
                        <Text className="text-red-900 text-lg font-black mt-0.5">{currentItem.word}</Text>
                        {currentItem.pronunciation ? (
                          <Text className="text-red-700 text-sm italic mt-0.5">{currentItem.pronunciation}</Text>
                        ) : null}
                      </View>
                    )}
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Check Button for spelling */}
            {!spellingChecked && (
              <TouchableOpacity
                onPress={checkSpellingAnswer}
                disabled={!spellingInput.trim()}
                className={`w-full h-12 rounded-xl items-center justify-center mt-4 ${!spellingInput.trim() ? "bg-zinc-200" : "bg-black active:bg-zinc-800"
                  }`}
              >
                <Text className={`text-sm font-bold ${!spellingInput.trim() ? "text-zinc-400" : "text-white"}`}>
                  Kiểm tra
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Action Buttons (Submit results to SRS) */}
        {reviewMode === "flashcard" ? (
          /* Buttons for Flashcards mode */
          <View className="flex-row w-full justify-between space-x-4 mb-4">
            <TouchableOpacity
              onPress={() => handleAnswerSubmit(false)}
              className="flex-1 border border-zinc-200 bg-white h-14 rounded-xl flex-row items-center justify-center active:bg-zinc-50"
            >
              <X size={18} color="#ef4444" />
              <Text className="text-zinc-700 text-base font-bold ml-2">Chưa thuộc</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleAnswerSubmit(true)}
              className="flex-1 bg-black h-14 rounded-xl flex-row items-center justify-center active:bg-zinc-800"
            >
              <Check size={18} color="#ffffff" />
              <Text className="text-white text-base font-bold ml-2">Đã thuộc</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Action Buttons for spelling mode after checking */
          spellingChecked && (
            <TouchableOpacity
              onPress={() => handleAnswerSubmit(isSpellingCorrect)}
              className="w-full bg-black h-14 rounded-xl flex-row items-center justify-center mb-4 active:bg-zinc-800"
            >
              <Text className="text-white text-base font-bold mr-2">Tiếp theo</Text>
              <ArrowRight size={18} color="#ffffff" />
            </TouchableOpacity>
          )
        )}
      </View>
    );
  };

  // Render Result State
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
        <View className="bg-white border border-zinc-200 rounded-2xl p-6 mb-8 shadow-sm shadow-zinc-100/50 items-center">
          <Text className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            Số từ đã thuộc lượt này
          </Text>
          <Text className="text-4xl font-black text-zinc-950 mt-1">
            {score} / {sessionItems.length}
          </Text>
          <Text className="text-zinc-500 text-xs mt-2">
            Đạt tỉ lệ chính xác {Math.round(ratio * 100)}%
          </Text>
        </View>

        {/* Streak Increment Result Message */}
        <View className="bg-orange-50/50 border border-orange-100 p-5 rounded-2xl mb-8 items-center flex-row">
          <View className="mr-3">
            <Flame size={32} color="#f97316" />
          </View>
          <View className="flex-1">
            <Text className="text-orange-800 text-sm font-bold">Chuỗi của bạn: {currentUser?.current_streak || 0} ngày liên tiếp!</Text>
            <Text className="text-orange-600 text-xs mt-0.5 leading-relaxed">
              Mục tiêu học ngày hôm nay: {currentUser?.words_reviewed_today || 0}/{currentUser?.daily_target || 10} từ.
            </Text>
          </View>
        </View>

        {/* End-game Action Buttons */}
        <View className="space-y-4">
          <TouchableOpacity
            onPress={startSession}
            className="w-full bg-black h-14 rounded-xl items-center justify-center active:bg-zinc-800"
          >
            <Text className="text-white text-base font-bold">Ôn tập tiếp lượt mới</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={async () => {
              await loadData(true);
              setGameState("start");
            }}
            className="w-full border border-zinc-200 bg-white h-14 rounded-xl items-center justify-center active:bg-zinc-50"
          >
            <Text className="text-zinc-700 text-base font-bold">Quay lại trang chủ</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-zinc-50/60">
      <StatusBar barStyle="dark-content" />

      {/* Top Header Bar */}
      <View className="flex-row justify-between items-center px-6 py-4 border-b border-zinc-100 bg-white">
        <View className="flex-1 pr-4">
          <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
            Xin chào, {user?.name || "Học viên"}
          </Text>
          <Text className="text-2xl font-bold text-zinc-900 tracking-tight mt-0.5">
            Ôn Tập Từ Vựng
          </Text>
        </View>
        <TouchableOpacity
          onPress={logout}
          className="bg-white border border-zinc-200 p-3 rounded-full active:bg-zinc-100 shadow-sm shadow-zinc-100/50"
        >
          <LogOut size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>

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
    </View>
  );
}

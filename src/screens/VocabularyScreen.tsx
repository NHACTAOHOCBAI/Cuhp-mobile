import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from "react-native";
import * as Speech from "expo-speech";
import {
  Search,
  Volume2,
  LogOut,
  X,
  BookOpen,
  Filter,
} from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import { fetchVocabularies } from "../api/client";
import { VocabularyItem } from "../types";

const WORD_TYPES = [
  { value: "all", label: "Tất cả" },
  { value: "noun", label: "Danh từ" },
  { value: "verb", label: "Động từ" },
  { value: "adjective", label: "Tính từ" },
  { value: "adverb", label: "Trạng từ" },
  { value: "pronoun", label: "Đại từ" },
  { value: "preposition", label: "Giới từ" },
  { value: "conjunction", label: "Liên từ" },
  { value: "interjection", label: "Thán từ" },
] as const;

// Helper to get color code for word type badge
const getWordTypeStyle = (type?: string | null) => {
  switch (type?.toLowerCase()) {
    case "noun":
      return { bg: "bg-blue-500/10", border: "border-blue-500/25", text: "text-blue-400", label: "Danh từ" };
    case "verb":
      return { bg: "bg-emerald-500/10", border: "border-emerald-500/25", text: "text-emerald-400", label: "Động từ" };
    case "adjective":
      return { bg: "bg-amber-500/10", border: "border-amber-500/25", text: "text-amber-400", label: "Tính từ" };
    case "adverb":
      return { bg: "bg-violet-500/10", border: "border-violet-500/25", text: "text-violet-400", label: "Trạng từ" };
    case "pronoun":
      return { bg: "bg-pink-500/10", border: "border-pink-500/25", text: "text-pink-400", label: "Đại từ" };
    case "preposition":
      return { bg: "bg-cyan-500/10", border: "border-cyan-500/25", text: "text-cyan-400", label: "Giới từ" };
    case "conjunction":
      return { bg: "bg-teal-500/10", border: "border-teal-500/25", text: "text-teal-400", label: "Liên từ" };
    case "interjection":
      return { bg: "bg-rose-500/10", border: "border-rose-500/25", text: "text-rose-400", label: "Thán từ" };
    default:
      return { bg: "bg-slate-500/10", border: "border-slate-500/25", text: "text-slate-400", label: "Khác" };
  }
};

export default function VocabularyScreen() {
  const { user, token, logout } = useAuth();

  // State
  const [items, setItems] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");

  // Load vocabulary function
  const loadData = async (pageNum: number, isRefresh = false) => {
    if (pageNum > 1 && !hasMore && !isRefresh) return;

    if (pageNum === 1 && !isRefresh) {
      setLoading(true);
    } else if (pageNum > 1) {
      setLoadingMore(true);
    }

    try {
      const typeParam = selectedType === "all" ? undefined : selectedType;
      const response = await fetchVocabularies(
        {
          page: pageNum,
          page_size: 10,
          q: searchQuery || undefined,
          word_type: typeParam,
        },
        token
      );

      const newItems = response.items || [];
      if (isRefresh || pageNum === 1) {
        setItems(newItems);
      } else {
        setItems((prev) => [...prev, ...newItems]);
      }

      const loadedCount = (isRefresh ? 0 : items.length) + newItems.length;
      setHasMore(loadedCount < response.total);
      setPage(pageNum);
    } catch (error) {
      console.error("Lỗi khi tải từ vựng:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  // Reload when query or filter changes
  useEffect(() => {
    loadData(1);
  }, [searchQuery, selectedType]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      loadData(page + 1);
    }
  };

  const speakWord = (word: string) => {
    Speech.speak(word, {
      language: "en-US",
      pitch: 1.0,
      rate: 0.9,
    });
  };

  const renderItem = ({ item }: { item: VocabularyItem }) => {
    const style = getWordTypeStyle(item.word_type);

    return (
      <View className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 mb-4 shadow-sm shadow-slate-950/20">
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 pr-4">
            <View className="flex-row items-center flex-wrap">
              <Text className="text-xl font-bold text-white mr-3">
                {item.word}
              </Text>
              <TouchableOpacity
                onPress={() => speakWord(item.word)}
                className="bg-indigo-600/10 p-2 rounded-full active:bg-indigo-600/25"
              >
                <Volume2 size={16} color="#6366f1" />
              </TouchableOpacity>
            </View>
            {item.pronunciation ? (
              <Text className="text-slate-400 text-sm italic mt-1">
                {item.pronunciation}
              </Text>
            ) : null}
          </View>

          <View className={`${style.bg} border ${style.border} px-3 py-1 rounded-full`}>
            <Text className={`${style.text} text-xs font-semibold`}>
              {style.label}
            </Text>
          </View>
        </View>

        <View className="border-t border-slate-800/60 pt-3 mt-2">
          <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
            Nghĩa của từ
          </Text>
          <Text className="text-slate-200 text-base font-medium">
            {item.meaning}
          </Text>
        </View>

        {item.notes ? (
          <View className="bg-slate-800/40 border border-slate-800/40 p-3 rounded-xl mt-3">
            <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
              Ghi chú
            </Text>
            <Text className="text-slate-300 text-sm leading-relaxed">
              {item.notes}
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

  const renderHeader = () => (
    <View className="mb-4">
      {/* Search Input */}
      <View className="flex-row items-center bg-slate-900 border border-slate-800 rounded-2xl px-4 h-14 mb-4">
        <Search size={20} color="#64748b" />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Tìm kiếm từ vựng..."
          placeholderTextColor="#475569"
          className="flex-1 text-white ml-3 text-base h-full"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery("")} className="p-1">
            <X size={18} color="#64748b" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Horizontal Word Types Slider */}
      <View className="flex-row items-center mb-2">
        <Filter size={14} color="#94a3b8" />
        <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider ml-1.5">
          Lọc theo loại từ
        </Text>
      </View>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={WORD_TYPES}
        keyExtractor={(item) => item.value}
        className="py-1"
        renderItem={({ item }) => {
          const isSelected = selectedType === item.value;
          return (
            <TouchableOpacity
              onPress={() => setSelectedType(item.value)}
              className={`mr-2.5 px-4 py-2.5 rounded-full border ${
                isSelected
                  ? "bg-indigo-600 border-indigo-600"
                  : "bg-slate-900 border-slate-800"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  isSelected ? "text-white" : "text-slate-400"
                }`}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return <View className="h-6" />;
    return (
      <View className="py-4 justify-center items-center">
        <ActivityIndicator color="#6366f1" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View className="items-center justify-center py-20 px-6">
        <View className="h-16 w-16 bg-slate-900 border border-slate-800 rounded-full items-center justify-center mb-4">
          <BookOpen size={28} color="#475569" />
        </View>
        <Text className="text-slate-300 text-lg font-bold text-center">
          Không tìm thấy từ vựng nào
        </Text>
        <Text className="text-slate-500 text-sm text-center mt-2">
          {searchQuery || selectedType !== "all"
            ? "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc loại từ của bạn."
            : "Sổ từ vựng của bạn hiện tại đang trống."}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0f172a]">
      <StatusBar barStyle="light-content" />

      {/* Top Header Bar */}
      <View className="flex-row justify-between items-center px-6 py-4 border-b border-slate-900">
        <View className="flex-1 pr-4">
          <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
            Xin chào, {user?.name || "Học viên"}
          </Text>
          <Text className="text-2xl font-bold text-white tracking-tight mt-0.5">
            Sổ Từ Vựng
          </Text>
        </View>
        <TouchableOpacity
          onPress={logout}
          className="bg-slate-900 border border-slate-800 p-3 rounded-full active:bg-slate-800"
        >
          <LogOut size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Main List */}
      {loading && page === 1 ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#6366f1" />
          <Text className="text-slate-400 text-sm mt-3">Đang tải danh sách từ vựng...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#6366f1"
              colors={["#6366f1"]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.25}
        />
      )}
    </SafeAreaView>
  );
}

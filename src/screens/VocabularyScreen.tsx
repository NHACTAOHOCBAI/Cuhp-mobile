import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  { value: "other", label: "Khác" },
] as const;

// Grayscale Badge helper for Light theme
const getWordTypeStyle = (type?: string | null) => {
  const normalized = type?.toLowerCase() || "";
  let label = "Khác";

  switch (normalized) {
    case "noun":
      label = "Danh từ";
      break;
    case "verb":
      label = "Động từ";
      break;
    case "adjective":
      label = "Tính từ";
      break;
    case "adverb":
      label = "Trạng từ";
      break;
    case "pronoun":
      label = "Đại từ";
      break;
    case "preposition":
      label = "Giới từ";
      break;
    case "conjunction":
      label = "Liên từ";
      break;
    case "interjection":
      label = "Thán từ";
      break;
    case "other":
      label = "Khác";
      break;
  }

  return {
    bg: "bg-zinc-100",
    border: "border-zinc-200/60",
    text: "text-zinc-600",
    label,
  };
};

export default function VocabularyScreen() {
  const { user, token, logout } = useAuth();
  const insets = useSafeAreaInsets();

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
      console.error("Lỗi tải từ vựng:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

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
      <View className="bg-white border border-zinc-200/80 rounded-2xl p-5 mb-4 shadow-sm shadow-zinc-100/50">
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 pr-4">
            <View className="flex-row items-center flex-wrap">
              <Text className="text-xl font-bold text-zinc-900 mr-3">
                {item.word}
              </Text>
              <TouchableOpacity
                onPress={() => speakWord(item.word)}
                className="bg-zinc-100 p-2 rounded-full active:bg-zinc-200"
              >
                <Volume2 size={16} color="#000000" />
              </TouchableOpacity>
            </View>
            {item.pronunciation ? (
              <Text className="text-zinc-500 text-sm italic mt-1 font-medium">
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

        <View className="border-t border-zinc-100 pt-3 mt-2">
          <Text className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">
            Nghĩa của từ
          </Text>
          <Text className="text-zinc-800 text-base font-semibold">
            {item.meaning}
          </Text>
        </View>

        {item.notes ? (
          <View className="bg-zinc-50 border border-zinc-100/80 p-3 rounded-xl mt-3">
            <Text className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">
              Ghi chú
            </Text>
            <Text className="text-zinc-600 text-sm leading-relaxed">
              {item.notes}
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

  const renderHeader = () => (
    <View className="mb-4">
      {/* Search Input - Light theme style */}
      <View className="flex-row items-center bg-white border border-zinc-200 rounded-2xl px-4 h-14 mb-4 shadow-sm shadow-zinc-100/30">
        <Search size={20} color="#71717a" />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Tìm kiếm từ vựng..."
          placeholderTextColor="#a1a1aa"
          className="flex-1 text-zinc-900 ml-3 text-base h-full"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery("")} className="p-1">
            <X size={18} color="#71717a" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Horizontal Word Types Slider */}
      <View className="flex-row items-center mb-2">
        <Filter size={14} color="#71717a" />
        <Text className="text-zinc-400 text-xs font-bold uppercase tracking-widest ml-1.5">
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
                  ? "bg-black border-black"
                  : "bg-white border-zinc-200"
              }`}
            >
              <Text
                numberOfLines={1}
                className={`text-sm font-bold ${
                  isSelected ? "text-white" : "text-zinc-500"
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
        <ActivityIndicator color="#000000" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View className="items-center justify-center py-20 px-6">
        <View className="h-16 w-16 bg-zinc-100 border border-zinc-200 rounded-full items-center justify-center mb-4">
          <BookOpen size={28} color="#71717a" />
        </View>
        <Text className="text-zinc-800 text-lg font-bold text-center">
          Không tìm thấy từ vựng nào
        </Text>
        <Text className="text-zinc-500 text-sm text-center mt-2 leading-relaxed">
          {searchQuery || selectedType !== "all"
            ? "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc loại từ của bạn."
            : "Sổ từ vựng của bạn hiện tại đang trống."}
        </Text>
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
            Sổ Từ Vựng
          </Text>
        </View>
        <TouchableOpacity
          onPress={logout}
          className="bg-white border border-zinc-200 p-3 rounded-full active:bg-zinc-100 shadow-sm shadow-zinc-100/50"
        >
          <LogOut size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Main List */}
      {loading && page === 1 ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#000000" />
          <Text className="text-zinc-500 text-sm mt-3 font-medium">Đang tải danh sách từ vựng...</Text>
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
              tintColor="#000000"
              colors={["#000000"]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.25}
        />
      )}
    </View>
  );
}

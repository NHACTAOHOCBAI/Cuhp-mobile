import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import * as Speech from "expo-speech";
import {
  Search,
  Volume2,
  X,
  BookOpen,
  Filter,
} from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { fetchVocabularies } from "../api/client";
import { VocabularyItem } from "../types";
import { ScreenWrapper } from "../components/ScreenWrapper";
import { Header } from "../components/Header";
import { Input } from "../components/Input";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";

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

export default function VocabularyScreen() {
  const { token } = useAuth();
  const { accent, speechRate } = useSettings();

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
      language: accent,
      pitch: 1.0,
      rate: speechRate,
    });
  };

  const renderItem = ({ item }: { item: VocabularyItem }) => {
    const wordTypeLabel = getWordTypeLabel(item.word_type);

    return (
      <Card className="mb-4">
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 pr-4">
            <View className="flex-row items-center flex-wrap">
              <Text className="text-xl font-bold text-zinc-900 mr-3">
                {item.word}
              </Text>
              <Button
                variant="ghost"
                hapticType="light"
                onPress={() => speakWord(item.word)}
                title=""
                icon={<Volume2 size={16} color="#000000" />}
                className="bg-zinc-100 p-2 rounded-full active:bg-zinc-200"
              />
            </View>
            {item.pronunciation ? (
              <Text className="text-zinc-500 text-sm italic mt-1 font-medium">
                {item.pronunciation}
              </Text>
            ) : null}
          </View>

          <Badge label={wordTypeLabel} variant="zinc" />
        </View>

        <View className="border-t border-zinc-100 pt-3 mt-2">
          <Text className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">
            Nghĩa của từ
          </Text>
          <Text className="text-zinc-800 text-base font-semibold">
            {item.meaning}
          </Text>
        </View>

        {item.context_sentence ? (
          <Card variant="flat" className="p-3 mt-3 mb-0 rounded-xl bg-zinc-50 border-zinc-100">
            <Text className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">
              Ngữ cảnh (Câu chứa từ)
            </Text>
            <Text className="text-zinc-700 text-sm italic leading-relaxed">
              "{item.context_sentence}"
            </Text>
          </Card>
        ) : null}

        {item.notes ? (
          <Card variant="flat" className="p-3 mt-3 mb-0 rounded-xl">
            <Text className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">
              Ghi chú
            </Text>
            <Text className="text-zinc-600 text-sm leading-relaxed">
              {item.notes}
            </Text>
          </Card>
        ) : null}
      </Card>
    );
  };

  const renderHeader = () => (
    <View className="mb-4">
      {/* Search Input */}
      <Input
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Tìm kiếm từ vựng..."
        icon={<Search size={20} color="#71717a" />}
        rightElement={
          searchQuery ? (
            <Button
              variant="ghost"
              hapticType="selection"
              onPress={() => setSearchQuery("")}
              title=""
              icon={<X size={18} color="#71717a" />}
            />
          ) : undefined
        }
      />

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
              className={`mr-2.5 px-4 py-2.5 rounded-full border ${isSelected
                ? "bg-black border-black"
                : "bg-white border-zinc-200"
              }`}
            >
              <Text
                numberOfLines={1}
                className={`text-sm font-bold ${isSelected ? "text-white" : "text-zinc-500"
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
    <ScreenWrapper scroll={false}>
      {/* Top Header Bar */}
      <Header title="Sổ Từ Vựng" />

      {/* Main List */}
      {loading && page === 1 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
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
    </ScreenWrapper>
  );
}

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
} from 'react-native';
import * as Speech from 'expo-speech';
import {
  Search,
  Volume2,
  X,
  BookOpen,
  Filter,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { fetchVocabularies } from '../api/client';
import { VocabularyItem } from '../types';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { Header } from '../components/Header';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { IconButton } from '../components/IconButton';
import { ChipGroup } from '../components/ChipGroup';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { Colors } from '../theme';
import { WORD_TYPES, getWordTypeLabel } from '../utils/vocabulary';

export default function VocabularyScreen() {
  const { user, token } = useAuth();
  const { accent, speechRate } = useSettings();

  const [items, setItems] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const subtitle = user
    ? `Xin chào, ${user.name || 'bạn'}`
    : 'Xin chào';

  const loadData = async (pageNum: number, isRefresh = false) => {
    if (pageNum > 1 && !hasMore && !isRefresh) return;

    if (pageNum === 1 && !isRefresh) {
      setLoading(true);
    } else if (pageNum > 1) {
      setLoadingMore(true);
    }

    try {
      const typeParam = selectedType === 'all' ? undefined : selectedType;
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
      console.error('Lỗi tải từ vựng:', error);
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
              <Text className="text-xl font-bold text-foreground mr-3">
                {item.word}
              </Text>
              <IconButton
                variant="soft"
                size="sm"
                hapticType="light"
                onPress={() => speakWord(item.word)}
                accessibilityLabel={`Phát âm ${item.word}`}
                icon={<Volume2 size={16} color={Colors.foreground} />}
              />
            </View>
            {item.pronunciation ? (
              <Text className="text-muted-foreground text-sm italic mt-1 font-medium">
                {item.pronunciation}
              </Text>
            ) : null}
          </View>

          <Badge label={wordTypeLabel} variant="zinc" />
        </View>

        <View className="border-t border-border pt-3 mt-2">
          <Text className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-1">
            Nghĩa của từ
          </Text>
          <Text className="text-foreground text-base font-semibold">
            {item.meaning}
          </Text>
        </View>

        {item.context_sentence ? (
          <Card variant="flat" className="p-3 mt-3 mb-0 rounded-xl bg-muted border-border">
            <Text className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-1">
              Ngữ cảnh (Câu chứa từ)
            </Text>
            <Text className="text-foreground text-sm italic leading-relaxed">
              "{item.context_sentence}"
            </Text>
          </Card>
        ) : null}

        {item.notes ? (
          <Card variant="flat" className="p-3 mt-3 mb-0 rounded-xl">
            <Text className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-1">
              Ghi chú
            </Text>
            <Text className="text-muted-foreground text-sm leading-relaxed">
              {item.notes}
            </Text>
          </Card>
        ) : null}
      </Card>
    );
  };

  const renderHeader = () => (
    <View className="mb-4">
      <View className="mb-4">
        <Input
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Tìm kiếm từ vựng..."
          icon={<Search size={20} color={Colors.iconMuted} />}
          rightElement={
            searchQuery ? (
              <IconButton
                variant="plain"
                size="sm"
                hapticType="selection"
                onPress={() => setSearchQuery('')}
                accessibilityLabel="Xóa nội dung tìm kiếm"
                icon={<X size={18} color={Colors.iconMuted} />}
              />
            ) : undefined
          }
        />
      </View>

      <ChipGroup
        data={WORD_TYPES}
        value={selectedType}
        onChange={setSelectedType}
        leadingIcon={<Filter size={14} color={Colors.iconMuted} />}
        leadLabel="Lọc theo loại từ"
      />
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return <View className="h-6" />;
    return (
      <View className="py-4 justify-center items-center">
        <LoadingState size="small" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <EmptyState
        icon={<BookOpen size={28} color={Colors.iconMuted} />}
        title="Không tìm thấy từ vựng nào"
        body={
          searchQuery || selectedType !== 'all'
            ? 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc loại từ của bạn.'
            : 'Sổ từ vựng của bạn hiện tại đang trống.'
        }
      />
    );
  };

  return (
    <ScreenWrapper scroll={false}>
      <Header title="Sổ Từ Vựng" subtitle={subtitle} />

      {loading && page === 1 ? (
        <LoadingState message="Đang tải danh sách từ vựng..." />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.foreground}
              colors={[Colors.foreground]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.25}
        />
      )}
    </ScreenWrapper>
  );
}

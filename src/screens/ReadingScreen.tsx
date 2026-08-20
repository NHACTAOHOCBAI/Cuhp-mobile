import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BookOpen } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { fetchReadingPassages } from '../api/client';
import type { ReadingPassage } from '../types';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { Colors } from '../theme';

export default function ReadingScreen() {
  const { token } = useAuth();
  const navigation = useNavigation<any>();

  const [items, setItems] = useState<ReadingPassage[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadData = async (pageNum: number, isRefresh = false) => {
    if (pageNum > 1 && !hasMore && !isRefresh) return;

    if (pageNum === 1 && !isRefresh) {
      setLoading(true);
    } else if (pageNum > 1) {
      setLoadingMore(true);
    }

    try {
      const response = await fetchReadingPassages(
        {
          page: pageNum,
          page_size: 10,
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
      setInitialLoaded(true);
    } catch (error) {
      console.error('Lỗi tải danh sách bài đọc:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      loadData(page + 1);
    }
  };

  const getLevelVariant = (level: string) => {
    switch (level) {
      case 'easy':
        return 'green';
      case 'medium':
        return 'yellow';
      case 'hard':
        return 'red';
      default:
        return 'zinc';
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'easy':
        return 'Dễ';
      case 'medium':
        return 'Trung bình';
      case 'hard':
        return 'Khó';
      default:
        return level;
    }
  };

  const renderItem = ({ item }: { item: ReadingPassage }) => {
    // Bảo vệ: content có thể undefined khi backend cũ chưa trả field này
    const safeContent = item.content || '';
    // Trích dẫn 120 ký tự đầu tiên của bài viết làm mô tả ngắn
    const excerpt = safeContent.length > 120 ? safeContent.substring(0, 120) + '...' : safeContent;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate('ReadingDetail', { passageId: item.id })}
      >
        <Card className="mb-4 p-6 rounded-3xl border border-zinc-200/40 bg-white">
          <View className="flex-row justify-between items-start mb-2.5">
            <Text className="text-base font-extrabold text-foreground flex-1 pr-3 leading-snug">
              {item.title}
            </Text>
            <Badge label={getLevelLabel(item.level)} variant={getLevelVariant(item.level)} />
          </View>

          <Text className="text-muted-foreground text-xs leading-normal mb-3">
            {excerpt}
          </Text>

          <View className="flex-row justify-between items-center border-t border-border/50 pt-2">
            <Badge label={item.category || 'Chung'} variant="zinc" />
            <Text className="text-foreground text-xs font-semibold">Đọc bài ngay →</Text>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return <View className="h-6" />;
    return (
      <View className="py-4 justify-center items-center">
        <LoadingState size="small" />
      </View>
    );
  };

  const renderEmpty = () => {
    return (
      <EmptyState
        icon={<BookOpen size={28} color={Colors.iconMuted} />}
        title="Không tìm thấy bài đọc nào"
        body="Hệ thống hiện tại chưa cập nhật tài liệu bài đọc nào."
      />
    );
  };

  return (
    <View className="flex-1 bg-transparent">
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={loading && !initialLoaded ? <LoadingState message="Đang tải danh sách bài đọc..." /> : renderEmpty()}
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
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
      />
    </View>
  );
}

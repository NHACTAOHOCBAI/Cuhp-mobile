import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Headphones } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { fetchAudios } from '../api/client';
import type { AudioListItem } from '../types';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { Header } from '../components/Header';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { Colors } from '../theme';
import {
  getReadingLevelLabel,
  getReadingLevelVariant,
} from '../utils/reading';

interface ListeningScreenProps {
  hideHeader?: boolean;
}

export default function ListeningScreen({ hideHeader = false }: ListeningScreenProps) {
  const { token } = useAuth();
  const navigation = useNavigation<any>();

  const [items, setItems] = useState<AudioListItem[]>([]);
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
      const response = await fetchAudios(
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
      console.error('Error loading listening list:', error);
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

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const renderItem = ({ item }: { item: AudioListItem }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate('ListeningDetail', { audioId: item.id })}
      >
        <Card className="mb-4 p-6 rounded-3xl border border-zinc-200/40 bg-white">
          <View className="flex-row justify-between items-start mb-2.5">
            <Text className="text-base font-extrabold text-foreground flex-1 pr-3 leading-snug">
              {item.title}
            </Text>
            <Badge
              label={getReadingLevelLabel(item.level)}
              variant={getReadingLevelVariant(item.level)}
            />
          </View>

          {item.description ? (
            <Text className="text-muted-foreground text-xs leading-normal mb-3">
              {item.description}
            </Text>
          ) : null}

          <View className="flex-row justify-between items-center border-t border-border/50 pt-2">
            <View className="flex-row items-center">
              <Badge label={item.category || 'General'} variant="zinc" className="mr-2" />
              <Text className="text-muted-foreground text-[10px] font-semibold">
                Duration: {formatDuration(item.duration)}
              </Text>
            </View>
            <Text className="text-foreground text-xs font-semibold">Listen now →</Text>
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
        icon={<Headphones size={28} color={Colors.iconMuted} />}
        title="No listening tracks found"
        body="There are currently no listening tracks in the system."
      />
    );
  };

  const content = (
    <View className="flex-1 bg-transparent">
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={loading && !initialLoaded ? <LoadingState message="Loading listening list..." /> : renderEmpty()}
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

  if (hideHeader) {
    return content;
  }

  return (
    <ScreenWrapper scroll={false}>
      <Header title="Listening Practice" />
      {content}
    </ScreenWrapper>
  );
}
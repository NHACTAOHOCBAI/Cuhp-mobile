import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Search, BookOpen, BookMarked } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { fetchReadingPassages, fetchVocabularies } from '../api/client';
import type { ReadingPassage } from '../types';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { ChipGroup } from '../components/ChipGroup';
import { Input } from '../components/Input';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { ProgressBar } from '../components/ProgressBar';
import { Colors } from '../theme';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import {
  computePassageStats,
  getReadingLevelLabel,
  getReadingLevelVariant,
} from '../utils/reading';
import {
  ReadingStorageKeys,
  getItemAsync,
} from '../utils/asyncStore';

// Filter chips. Values are the strings sent to the backend `level` query.
// `all` is a sentinel we strip before fetching.
const LEVEL_CHIPS = [
  { value: 'all', label: 'All levels' },
  { value: 'easy', label: 'Easy (A1)' },
  { value: 'medium', label: 'Medium (B1)' },
  { value: 'hard', label: 'Hard (C1)' },
] as const;

type LevelFilter = (typeof LEVEL_CHIPS)[number]['value'];

export default function ReadingScreen() {
  const { token } = useAuth();
  const navigation = useNavigation<any>();

  const [items, setItems] = useState<ReadingPassage[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Refs used inside `loadData` to avoid stale closures in pagination.
  const itemsLengthRef = useRef(0);
  const hasMoreRef = useRef(true);

  // Vocabulary for "new words" stats. We fetch the user's vocab list once
  // and reuse it for every card; it is read-only on this screen.
  const [userVocabWords, setUserVocabWords] = useState<Set<string>>(new Set());

  const debouncedSearch = useDebouncedValue(search, 300);

  const loadData = useCallback(
    async (pageNum: number, isRefresh = false) => {
      if (!token) return;
      if (pageNum > 1 && !hasMoreRef.current && !isRefresh) return;

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
            q: debouncedSearch.trim() || undefined,
            level: levelFilter === 'all' ? undefined : levelFilter,
          },
          token
        );

        const newItems = response.items || [];
        if (isRefresh || pageNum === 1) {
          setItems(newItems);
          itemsLengthRef.current = newItems.length;
        } else {
          setItems((prev) => {
            const next = [...prev, ...newItems];
            itemsLengthRef.current = next.length;
            return next;
          });
        }

        const loadedCount =
          (isRefresh ? 0 : itemsLengthRef.current) + newItems.length;
        const more = loadedCount < response.total;
        setHasMore(more);
        hasMoreRef.current = more;
        setPage(pageNum);
        setTotalCount(response.total);
        setInitialLoaded(true);
      } catch (error) {
        console.error('Error loading reading list:', error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [token, debouncedSearch, levelFilter]
  );

  // Re-fetch on filter changes. Search debouncing lives in `useDebouncedValue`.
  useEffect(() => {
    setPage(1);
    hasMoreRef.current = true;
    loadData(1, true);
  }, [debouncedSearch, levelFilter, loadData]);

  // Load vocab list once for "new words" stats.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetchVocabularies(
          { page: 1, page_size: 200 },
          token
        );
        if (cancelled) return;
        const set = new Set<string>();
        for (const item of response.items || []) {
          if (item?.word) {
            set.add(item.word.toLowerCase().trim());
          }
        }
        setUserVocabWords(set);
      } catch (e) {
        // Non-fatal: cards just show "new words = total words" if vocab fails.
        console.warn('Could not load vocab for reading stats:', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData(1, true);
  };

  const handleLoadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMoreRef.current) {
      loadData(page + 1);
    }
  }, [loading, loadingMore, loadData, page]);

  const renderItem = ({ item }: { item: ReadingPassage }) => (
    <ReadingCard
      passage={item}
      vocabWords={userVocabWords}
      onPress={() =>
        navigation.navigate('ReadingDetail', { passageId: item.id })
      }
    />
  );

  const renderFooter = () => {
    if (!loadingMore) return <View className="h-6" />;
    return (
      <View className="py-4 justify-center items-center">
        <LoadingState size="small" />
      </View>
    );
  };

  const renderEmpty = () => (
    <EmptyState
      icon={<BookOpen size={28} color={Colors.iconMuted} />}
      title={
        debouncedSearch || levelFilter !== 'all'
          ? 'No passages match your filters'
          : 'No reading passages yet'
      }
      body={
        debouncedSearch || levelFilter !== 'all'
          ? 'Try a different search term or level.'
          : 'Check back later — new passages are added regularly.'
      }
    />
  );

  return (
    <View className="flex-1 bg-transparent">
      {/* Sticky header: search + level chips */}
      <View className="px-6 pt-3 pb-2 bg-transparent">
        <Text className="text-2xl font-black text-foreground tracking-tight mb-1">
          Reading
        </Text>
        <Text className="text-muted-foreground text-xs font-semibold mb-4">
          {totalCount > 0
            ? `${totalCount} ${totalCount === 1 ? 'passage' : 'passages'}`
            : 'Bilingual passages to sharpen your reading skills'}
        </Text>

        <Input
          value={search}
          onChangeText={setSearch}
          placeholder="Search passages..."
          icon={<Search size={18} color={Colors.iconMuted} />}
          className="mb-3"
          returnKeyType="search"
        />

        <ChipGroup
          data={LEVEL_CHIPS as any}
          value={levelFilter}
          onChange={(v) => setLevelFilter(v as LevelFilter)}
          hapticType="selection"
        />
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          loading && !initialLoaded ? (
            <LoadingState message="Loading reading list..." />
          ) : (
            renderEmpty()
          )
        }
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: 32,
          flexGrow: 1,
        }}
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

// ----- Card -----

interface ReadingCardProps {
  passage: ReadingPassage;
  vocabWords: Set<string>;
  onPress: () => void;
}

const ReadingCard: React.FC<ReadingCardProps> = React.memo(
  ({ passage, vocabWords, onPress }) => {
    const [progress, setProgress] = useState(0);

    // Load cached progress on mount.
    useEffect(() => {
      let cancelled = false;
      (async () => {
        const raw = await getItemAsync(ReadingStorageKeys.progress(passage.id));
        if (cancelled) return;
        const n = raw ? parseInt(raw, 10) : 0;
        if (!Number.isNaN(n)) setProgress(n);
      })();
      return () => {
        cancelled = true;
      };
    }, [passage.id]);

    const stats = useMemo(
      () => computePassageStats(passage.content, vocabWords),
      [passage.content, vocabWords]
    );

    const excerpt = useMemo(() => {
      const text = (passage.content || '').trim();
      if (!text) return '';
      if (text.length <= 140) return text;
      return text.slice(0, 140) + '...';
    }, [passage.content]);

    const isCompleted = progress >= 100;

    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
        <Card className="mb-4 p-5 rounded-3xl border border-border bg-card">
          {/* Row 1: level pill + category */}
          <View className="flex-row items-center justify-between mb-3">
            <Badge
              label={getReadingLevelLabel(passage.level)}
              variant={getReadingLevelVariant(passage.level)}
            />
            {passage.category ? (
              <Text className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
                {passage.category}
              </Text>
            ) : null}
          </View>

          {/* Row 2: title */}
          <Text
            className="text-foreground text-lg font-extrabold leading-snug mb-2"
            numberOfLines={2}
          >
            {passage.title}
          </Text>

          {/* Row 2b: excerpt */}
          {excerpt ? (
            <Text
              className="text-muted-foreground text-xs leading-relaxed mb-3"
              numberOfLines={3}
            >
              {excerpt}
            </Text>
          ) : null}

          {/* Row 3: stats */}
          <View className="flex-row items-center flex-wrap mb-3 gap-x-3 gap-y-1">
            <StatPill
              icon={<BookOpen size={12} color={Colors.iconMuted} />}
              label={`${stats.words} ${stats.words === 1 ? 'word' : 'words'}`}
            />
            <StatPill
              icon={<BookMarked size={12} color={Colors.iconMuted} />}
              label={`~${stats.minRead} min`}
            />
            {stats.newWords > 0 ? (
              <StatPill
                icon={<BookMarked size={12} color={Colors.primary} />}
                label={`${stats.newWords} new`}
                accent
              />
            ) : null}
          </View>

          {/* Progress + CTA */}
          <View className="border-t border-border/50 pt-3">
            <View className="flex-row items-center justify-between mb-1.5">
              <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                {progress >= 100
                  ? 'Completed'
                  : progress > 0
                  ? 'In progress'
                  : 'Not started'}
              </Text>
              <Text className="text-foreground text-xs font-bold">
                {isCompleted ? 'Review again →' : 'Read bilingual →'}
              </Text>
            </View>
            <ProgressBar
              value={progress}
              tone={isCompleted ? 'success' : 'primary'}
              thickness="thin"
            />
          </View>
        </Card>
      </TouchableOpacity>
    );
  }
);
ReadingCard.displayName = 'ReadingCard';

const StatPill: React.FC<{
  icon: React.ReactNode;
  label: string;
  accent?: boolean;
}> = ({ icon, label, accent }) => (
  <View className="flex-row items-center">
    {icon}
    <Text
      className={`ml-1 text-[11px] font-semibold ${
        accent ? 'text-primary' : 'text-muted-foreground'
      }`}
    >
      {label}
    </Text>
  </View>
);

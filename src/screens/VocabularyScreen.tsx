import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput
} from 'react-native';
import * as Speech from 'expo-speech';
import {
  Search,
  Volume2,
  X,
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Save,
  SearchCode,
  Zap
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import {
  fetchVocabularies,
  createVocabulary,
  updateVocabulary,
  deleteVocabulary,
  lookupVocabularyWord
} from '../api/client';
import type { VocabularyItem } from '../types';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { Header } from '../components/Header';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { IconButton } from '../components/IconButton';
import { ChipGroup } from '../components/ChipGroup';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { ButtonPrimary, ButtonOutline } from '../components/Button';
import { Colors } from '../theme';
import { WORD_TYPES, getWordTypeLabel } from '../utils/vocabulary';

interface VocabularyScreenProps {
  hideHeader?: boolean;
}

export default function VocabularyScreen({ hideHeader = false }: VocabularyScreenProps) {
  const { user, token } = useAuth();
  const { accent, speechRate } = useSettings();

  const [items, setItems] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');

  // Debounce search query để tránh gọi API trên mỗi keystroke (mobile-friendly)
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 500);

  // Modal State for Create/Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formWord, setFormWord] = useState('');
  const [formPronunciation, setFormPronunciation] = useState('');
  const [formMeaning, setFormMeaning] = useState('');
  const [formWordType, setFormWordType] = useState('noun');
  const [formContext, setFormContext] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const [lookupLoading, setLookupLoading] = useState(false);
  const [savingVocab, setSavingVocab] = useState(false);

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
      const response = await fetchVocabularies(
        {
          page: pageNum,
          page_size: 10,
          q: debouncedSearchQuery || undefined,
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
      console.error('Lỗi tải từ vựng:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(1);
  }, [debouncedSearchQuery]);

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

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormWord('');
    setFormPronunciation('');
    setFormMeaning('');
    setFormWordType('noun');
    setFormContext('');
    setFormNotes('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (item: VocabularyItem) => {
    setEditingId(item.id);
    setFormWord(item.word);
    setFormPronunciation(item.pronunciation || '');
    setFormMeaning(item.meaning);
    setFormWordType(item.word_type || 'noun');
    setFormContext(item.context_sentence || '');
    setFormNotes(item.notes || '');
    setModalOpen(true);
  };

  const handleLookup = async () => {
    if (!formWord.trim()) return;
    setLookupLoading(true);
    try {
      const result = await lookupVocabularyWord(formWord.trim(), token);
      if (result.meaning) {
        setFormMeaning(result.meaning);
      }
      if (result.pronunciation) {
        setFormPronunciation(result.pronunciation);
      }
      if (result.word_type) {
        setFormWordType(result.word_type);
      }
      Alert.alert('Thành công', `Đã tìm thấy định nghĩa cho từ "${formWord}".`);
    } catch (error) {
      console.error(error);
      Alert.alert('Không tìm thấy', 'Không thể tự động tra cứu từ này. Bạn vui lòng tự điền định nghĩa.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleMainLookup = async () => {
    if (!searchQuery.trim()) return;
    setLookupLoading(true);
    try {
      const result = await lookupVocabularyWord(searchQuery.trim(), token);
      setEditingId(null);
      setFormWord(searchQuery.trim());
      setFormPronunciation(result.pronunciation || '');
      setFormMeaning(result.meaning || '');
      setFormWordType(result.word_type || 'noun');
      setFormContext('');
      setFormNotes('');
      setModalOpen(true);
    } catch (error) {
      console.error(error);
      setEditingId(null);
      setFormWord(searchQuery.trim());
      setFormPronunciation('');
      setFormMeaning('');
      setFormWordType('noun');
      setFormContext('');
      setFormNotes('');
      setModalOpen(true);
      Alert.alert('Không tìm thấy', 'Không thể tự động tra cứu từ này. Bạn vui lòng tự điền định nghĩa.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSaveVocab = async () => {
    if (!formWord.trim() || !formMeaning.trim()) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ Từ vựng và Ý nghĩa.');
      return;
    }

    setSavingVocab(true);
    try {
      const payload = {
        word: formWord.trim(),
        pronunciation: formPronunciation.trim() || null,
        meaning: formMeaning.trim(),
        word_type: formWordType,
        context_sentence: formContext.trim() || null,
        notes: formNotes.trim() || null
      };

      if (editingId) {
        await updateVocabulary(editingId, payload, token);
        Alert.alert('Thành công 🎉', `Đã cập nhật từ vựng "${formWord}".`);
      } else {
        await createVocabulary(payload, token);
        Alert.alert('Thành công 🎉', `Đã thêm từ vựng mới "${formWord}".`);
      }
      setModalOpen(false);
      loadData(1, true);
    } catch (error) {
      console.error(error);
      Alert.alert('Thất bại', 'Đã xảy ra lỗi khi lưu từ vựng.');
    } finally {
      setSavingVocab(false);
    }
  };

  const handleDeleteVocab = (item: VocabularyItem) => {
    Alert.alert('Xác nhận xóa', `Bạn có chắc chắn muốn xóa từ "${item.word}" khỏi sổ tay?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteVocabulary(item.id, token);
            loadData(1, true);
          } catch (error) {
            console.error(error);
            Alert.alert('Lỗi', 'Xóa từ vựng thất bại.');
          }
        }
      }
    ]);
  };

  const renderItem = ({ item }: { item: VocabularyItem }) => {
    // Color mapping based on mockup (adjective -> sky blue, noun -> purple, verb -> green)
    const getTypeColors = (type?: string | null) => {
      const norm = type?.toLowerCase() || '';
      if (norm === 'adjective') return { bg: 'bg-[#e5f3fb]', text: 'text-[#006699]' };
      if (norm === 'noun') return { bg: 'bg-[#f3e8ff]', text: 'text-[#7c3aed]' };
      if (norm === 'verb') return { bg: 'bg-[#e6f4ea]', text: 'text-[#137333]' };
      if (norm === 'adverb') return { bg: 'bg-[#fef3c7]', text: 'text-[#d97706]' };
      return { bg: 'bg-zinc-100', text: 'text-zinc-600' };
    };

    const typeColors = getTypeColors(item.word_type);
    const upperType = item.word_type ? item.word_type.toUpperCase() : 'OTHER';

    return (
      <Card className="mb-4 p-6 rounded-3xl border border-zinc-200/40 bg-white">
        {/* Row 1: Word and Type badge */}
        <View className="flex-row justify-between items-start mb-2.5">
          <Text className="text-[28px] font-black text-[#006699] select-text leading-tight">
            {item.word}
          </Text>

          {/* Type badge */}
          <View className={`px-4 py-1.5 rounded-full ${typeColors.bg}`}>
            <Text className={`text-[10px] font-extrabold uppercase tracking-widest ${typeColors.text}`}>
              {upperType}
            </Text>
          </View>
        </View>

        {/* Row 2: Pronunciation & Audio speaker icon */}
        {item.pronunciation ? (
          <View className="flex-row items-center gap-2 mb-3.5">
            <View className="bg-zinc-100 px-3.5 py-1.5 rounded-xl">
              <Text className="text-zinc-500 text-sm font-semibold select-text">
                {item.pronunciation}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => speakWord(item.word)}
              activeOpacity={0.7}
              className="w-9 h-9 rounded-full bg-white border border-zinc-200 items-center justify-center"
            >
              <Volume2 size={16} color="#006699" />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Faint Divider */}
        <View className="border-b border-zinc-100 mb-4" />

        {/* Meaning */}
        <Text className="text-zinc-800 text-lg font-bold mb-2 select-text leading-snug">
          {item.meaning}
        </Text>

        {/* Example blockquote style */}
        {item.context_sentence ? (
          <View className="border-l-[3px] border-[#c2e6fb] pl-4 mt-2 mb-1">
            <Text className="text-zinc-600 text-sm italic leading-relaxed select-text">
              "{item.context_sentence}"
            </Text>
          </View>
        ) : null}

        {/* Notes (Rendered cleanly if exists) */}
        {item.notes ? (
          <View className="mt-3 bg-zinc-50/50 p-2.5 rounded-xl border border-zinc-100/50">
            <Text className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-1">
              Ghi chú
            </Text>
            <Text className="text-zinc-500 text-xs leading-relaxed select-text">
              {item.notes}
            </Text>
          </View>
        ) : null}
      </Card>
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
        title="Không tìm thấy từ vựng nào"
        body={
          searchQuery
            ? 'Thử thay đổi từ khóa tìm kiếm của bạn.'
            : 'Sổ từ vựng của bạn hiện tại đang trống.'
        }
      />
    );
  };

  const mainView = (
    <View className="flex-1 bg-transparent">
      {/* Header cố định — tách ra ngoài FlatList để TextInput không bị re-mount khi search */}
      <View className="px-6 pt-4">
        <View className="flex-row items-center bg-white border border-zinc-200/80 rounded-full px-5 h-12 shadow-sm shadow-[#193665]/2">
          <Search size={20} color="#a1a1aa" className="mr-3" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Tra từ nhanh..."
            placeholderTextColor="#a1a1aa"
            className="flex-1 text-[#193665] text-base h-full font-semibold"
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={handleMainLookup}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} className="p-1">
              <X size={18} color="#a1a1aa" />
            </TouchableOpacity>
          ) : null}
        </View>
        <Text className="text-muted-foreground text-xs mt-2.5 pl-4 font-semibold">
          Auto-fills definition, IPA, and type.
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={loading && !initialLoaded ? <LoadingState message="Đang tải danh sách từ vựng..." /> : renderEmpty()}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 80 }}
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

      {/* FAB to Add Word */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleOpenCreateModal}
        className="absolute bottom-6 right-6 bg-foreground w-14 h-14 rounded-full items-center justify-center shadow-lg shadow-black/30 z-50"
      >
        <Plus size={24} color={Colors.background} />
      </TouchableOpacity>

      {/* Modal Add / Edit */}
      <Modal
        animationType="slide"
        transparent
        visible={modalOpen}
        onRequestClose={() => setModalOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-background rounded-t-3xl p-6 min-h-[500px] max-h-[85%]">
            {/* Header Modal */}
            <View className="flex-row justify-between items-center pb-3 border-b border-border/50">
              <Text className="text-lg font-black text-foreground">
                {editingId ? 'Sửa Từ Vựng' : 'Thêm Từ Vựng Mới'}
              </Text>
              <TouchableOpacity onPress={() => setModalOpen(false)} className="p-1">
                <Text className="text-muted-foreground text-sm font-semibold">Đóng</Text>
              </TouchableOpacity>
            </View>

            {/* Scrollable Form */}
            <ScrollView contentContainerStyle={{ paddingVertical: 4 }} showsVerticalScrollIndicator={false}>
              {/* Word Row with lookup button */}
              <View className="mt-4 flex-row items-end gap-3.5">
                <View className="flex-1">
                  <Text className="text-foreground text-xs font-bold mb-1.5">Từ vựng (Tiếng Anh)*</Text>
                  <Input
                    value={formWord}
                    onChangeText={setFormWord}
                    placeholder="Ví dụ: wonderful"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                {!editingId && (
                  <TouchableOpacity
                    onPress={handleLookup}
                    disabled={lookupLoading || !formWord.trim()}
                    className="bg-muted px-4 h-12 rounded-xl border border-border items-center justify-center flex-row"
                  >
                    {lookupLoading ? (
                      <ActivityIndicator size="small" color={Colors.foreground} />
                    ) : (
                      <>
                        <SearchCode size={14} color={Colors.foreground} />
                        <Text className="text-foreground text-xs font-bold ml-1">Tra từ</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              <View className="mt-4">
                <Text className="text-foreground text-xs font-bold mb-1.5">Phiên âm (nếu có)</Text>
                <Input
                  value={formPronunciation}
                  onChangeText={setFormPronunciation}
                  placeholder="Ví dụ: /ˈwʌndərfl/"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View className="mt-4">
                <Text className="text-foreground text-xs font-bold mb-1.5">Loại từ</Text>
                <ChipGroup
                  data={WORD_TYPES.filter(w => w.value !== 'all')}
                  value={formWordType}
                  onChange={setFormWordType}
                />
              </View>

              <View className="mt-4">
                <Text className="text-foreground text-xs font-bold mb-1.5">Nghĩa của từ (Tiếng Việt)*</Text>
                <Input
                  value={formMeaning}
                  onChangeText={setFormMeaning}
                  placeholder="Ví dụ: tuyệt vời, kỳ diệu"
                />
              </View>

              <View className="mt-4">
                <Text className="text-foreground text-xs font-bold mb-1.5">Ngữ cảnh (Câu ví dụ)</Text>
                <Input
                  value={formContext}
                  onChangeText={setFormContext}
                  placeholder="Ví dụ: The weather was wonderful."
                  multiline
                />
              </View>

              <View className="mt-4">
                <Text className="text-foreground text-xs font-bold mb-1.5">Ghi chú thêm</Text>
                <Input
                  value={formNotes}
                  onChangeText={setFormNotes}
                  placeholder="Bất kỳ ghi nhớ hoặc cách dùng đặc biệt..."
                  multiline
                />
              </View>

              {/* Action Button */}
              <View className="mt-6 mb-8">
                <ButtonPrimary
                  title={editingId ? 'Lưu cập nhật' : 'Thêm vào sổ tay'}
                  onPress={handleSaveVocab}
                  disabled={savingVocab || !formWord.trim() || !formMeaning.trim()}
                  icon={savingVocab ? <ActivityIndicator size="small" color="#ffffff" /> : <Save size={18} color={Colors.primaryForeground} />}
                  className="h-12"
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );

  if (hideHeader) {
    return mainView;
  }

  return (
    <ScreenWrapper scroll={false}>
      <Header title="Sổ Từ Vựng" subtitle={subtitle} />
      {mainView}
    </ScreenWrapper>
  );
}

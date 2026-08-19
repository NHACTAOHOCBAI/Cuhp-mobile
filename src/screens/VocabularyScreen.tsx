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
  ActivityIndicator
} from 'react-native';
import * as Speech from 'expo-speech';
import {
  Search,
  Volume2,
  X,
  BookOpen,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Save,
  SearchCode
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

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
    const wordTypeLabel = getWordTypeLabel(item.word_type);

    return (
      <Card className="mb-4">
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 pr-4">
            <View className="flex-row items-center flex-wrap">
              <Text className="text-xl font-bold text-foreground mr-3 select-text">
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

          <View className="items-end">
            <Badge label={wordTypeLabel} variant="zinc" />
            <View className="flex-row gap-2.5 mt-2.5">
              <TouchableOpacity onPress={() => handleOpenEditModal(item)} className="p-1">
                <Edit2 size={14} color={Colors.iconMuted} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteVocab(item)} className="p-1">
                <Trash2 size={14} color={Colors.destructive} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View className="border-t border-border pt-3 mt-2">
          <Text className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-1">
            Nghĩa của từ
          </Text>
          <Text className="text-foreground text-base font-semibold leading-relaxed">
            {item.meaning}
          </Text>
        </View>

        {item.context_sentence ? (
          <Card variant="flat" className="p-3 mt-3 mb-0 rounded-xl bg-muted border-border">
            <Text className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-1">
              Ngữ cảnh (Câu chứa từ)
            </Text>
            <Text className="text-foreground text-sm italic leading-relaxed select-text">
              "{item.context_sentence}"
            </Text>
          </Card>
        ) : null}

        {item.notes ? (
          <Card variant="flat" className="p-3 mt-3 mb-0 rounded-xl">
            <Text className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-1">
              Ghi chú
            </Text>
            <Text className="text-muted-foreground text-sm leading-relaxed select-text">
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

  const mainView = (
    <View className="flex-1 bg-background">
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
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 80 }}
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

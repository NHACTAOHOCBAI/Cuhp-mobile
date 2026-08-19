import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as Speech from 'expo-speech';
import { ArrowLeft, BookOpen, MessageSquare, Languages, Volume2, Save, Send, Trash2, Plus, Sparkles } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { Colors } from '../theme';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { IconButton } from '../components/IconButton';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { ButtonPrimary, ButtonOutline } from '../components/Button';
import {
  fetchReadingPassageById,
  fetchTranslationPractice,
  saveTranslationPractice,
  fetchReadingComments,
  createReadingComment,
  deleteReadingComment,
  lookupVocabularyWord,
  createVocabulary
} from '../api/client';
import type { ReadingPassage, ReadingComment, TranslationPractice } from '../types';

export default function ReadingDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { token, user } = useAuth();
  const { accent, speechRate } = useSettings();
  const { passageId } = route.params;

  const [activeTab, setActiveTab] = useState<'content' | 'translation' | 'comments'>('content');
  const [loading, setLoading] = useState(true);
  const [passage, setPassage] = useState<ReadingPassage | null>(null);

  // Translation practice state
  const [translationDraft, setTranslationDraft] = useState('');
  const [savingTranslation, setSavingTranslation] = useState(false);

  // Comments state
  const [comments, setComments] = useState<ReadingComment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  // Dictionary Lookup Modal State
  const [lookupModalOpen, setLookupModalOpen] = useState(false);
  const [lookupWord, setLookupWord] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [savingVocab, setSavingVocab] = useState(false);

  const loadData = async () => {
    if (!token || !passageId) return;
    try {
      const [passageData, translationData, commentsData] = await Promise.all([
        fetchReadingPassageById(passageId, token),
        fetchTranslationPractice(passageId, token),
        fetchReadingComments(passageId, token)
      ]);

      setPassage(passageData);
      if (translationData) {
        setTranslationDraft(translationData.user_translation);
      }
      setComments(commentsData || []);
    } catch (error) {
      console.error('Lỗi tải chi tiết bài đọc:', error);
      Alert.alert('Lỗi', 'Không thể kết nối để tải chi tiết bài đọc.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [passageId, token]);

  const handleSaveTranslation = async () => {
    if (!token || !passageId) return;
    setSavingTranslation(true);
    try {
      await saveTranslationPractice(passageId, { user_translation: translationDraft }, token);
      Alert.alert('Thành công 🎉', 'Đã lưu bản dịch cá nhân của bạn.');
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể lưu bản dịch.');
    } finally {
      setSavingTranslation(false);
    }
  };

  const handleSendComment = async () => {
    if (!commentInput.trim() || !token || !passageId) return;
    setSendingComment(true);
    try {
      const newComment = await createReadingComment(passageId, { content: commentInput.trim() }, token);
      setComments((prev) => [newComment, ...prev]);
      setCommentInput('');
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Gửi bình luận thất bại.');
    } finally {
      setSendingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!token) return;
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn xóa bình luận này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteReadingComment(commentId, token);
            setComments((prev) => prev.filter((c) => c.id !== commentId));
          } catch (error) {
            console.error(error);
            Alert.alert('Lỗi', 'Xóa bình luận thất bại.');
          }
        }
      }
    ]);
  };

  const handleWordPress = async (word: string) => {
    // Làm sạch từ vựng (bỏ dấu câu ở 2 đầu)
    const cleanWord = word.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '');
    if (!cleanWord || cleanWord.length < 2) return;

    setLookupWord(cleanWord);
    setLookupResult(null);
    setLookupLoading(true);
    setLookupModalOpen(true);

    try {
      const result = await lookupVocabularyWord(cleanWord, token);
      setLookupResult(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSpeakLookupWord = () => {
    if (!lookupWord) return;
    Speech.speak(lookupWord, { language: accent, rate: speechRate });
  };

  const handleSaveToVocab = async () => {
    if (!token || !lookupResult) return;
    setSavingVocab(true);
    try {
      await createVocabulary({
        word: lookupResult.word,
        pronunciation: lookupResult.pronunciation || '',
        meaning: lookupResult.meaning || 'Chưa rõ nghĩa',
        word_type: lookupResult.word_type || 'noun',
        notes: `Tra từ bài đọc: "${passage?.title || ''}"`,
        context_sentence: ''
      }, token);
      Alert.alert('Chúc mừng! 🎉', `Đã lưu từ "${lookupResult.word}" vào sổ tay từ vựng.`);
      setLookupModalOpen(false);
    } catch (error) {
      console.error(error);
      Alert.alert('Thất bại', 'Không thể lưu từ vựng. Từ này có thể đã tồn tại.');
    } finally {
      setSavingVocab(false);
    }
  };

  const renderInteractiveText = (text: string) => {
    if (!text) return null;
    // Tách văn bản thành danh sách từ giữ nguyên các dấu câu và khoảng trắng
    const tokens = text.split(/(\b[a-zA-Z']+\b)/g);

    return tokens.map((tokenStr, idx) => {
      const isWord = /^[a-zA-Z']+$/.test(tokenStr);
      if (isWord) {
        return (
          <Text
            key={idx}
            onPress={() => handleWordPress(tokenStr)}
            style={{ textDecorationLine: 'underline', textDecorationStyle: 'dashed', textDecorationColor: Colors.iconSubtle }}
            className="text-foreground text-[15px] leading-relaxed"
          >
            {tokenStr}
          </Text>
        );
      }
      return (
        <Text key={idx} className="text-foreground text-[15px] leading-relaxed">
          {tokenStr}
        </Text>
      );
    });
  };

  const renderContentTab = () => {
    if (!passage) return null;

    // Phân tách bài viết thành các đoạn văn
    const enParagraphs = passage.content.split('\n\n').filter(Boolean);
    const viParagraphs = passage.translation.split('\n\n').filter(Boolean);

    return (
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 }}>
        <Text className="text-muted-foreground text-[11px] font-semibold mb-4 leading-normal">
          💡 Mẹo: Chạm vào bất kỳ từ tiếng Anh nào trong bài viết để tra nghĩa nhanh và lưu vào sổ tay.
        </Text>

        {enParagraphs.map((enPara, idx) => {
          const viPara = viParagraphs[idx] || '';
          return (
            <Card key={idx} className="mb-5 p-4">
              <View className="flex-row flex-wrap mb-3.5 pr-2">
                {renderInteractiveText(enPara)}
              </View>
              {viPara ? (
                <View className="border-t border-border/50 pt-2.5">
                  <Text className="text-muted-foreground text-sm leading-relaxed">
                    {viPara}
                  </Text>
                </View>
              ) : null}
            </Card>
          );
        })}
      </ScrollView>
    );
  };

  const renderTranslationTab = () => {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 }}>
          <Card className="p-4 mb-4">
            <View className="flex-row items-center mb-2">
              <Languages size={16} color={Colors.foreground} />
              <Text className="text-foreground font-extrabold text-sm ml-1.5">Luyện dịch của bạn</Text>
            </View>
            <Text className="text-muted-foreground text-xs leading-normal">
              Viết bản dịch cá nhân của bạn cho bài đọc này. Đây là cách tuyệt vời để rèn luyện tư duy ngôn ngữ.
            </Text>
          </Card>

          <TextInput
            multiline
            numberOfLines={12}
            value={translationDraft}
            onChangeText={setTranslationDraft}
            placeholder="Nhập bản dịch tiếng Việt của bạn ở đây..."
            className="bg-card border border-border rounded-2xl p-4 text-foreground text-sm leading-relaxed mb-5"
            style={{ minHeight: 240, textAlignVertical: 'top' }}
          />

          <ButtonPrimary
            title="Lưu bản dịch"
            onPress={handleSaveTranslation}
            disabled={savingTranslation || !translationDraft.trim()}
            icon={savingTranslation ? <ActivityIndicator size="small" color="#ffffff" /> : <Save size={18} color={Colors.primaryForeground} />}
            className="h-12"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  const renderCommentsTab = () => {
    return (
      <View className="flex-1 justify-between">
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}>
          {comments.length === 0 ? (
            <View className="py-12 items-center justify-center">
              <MessageSquare size={28} color={Colors.iconMuted} />
              <Text className="text-muted-foreground text-xs mt-2 text-center">
                Chưa có bình luận nào. Hãy bắt đầu thảo luận!
              </Text>
            </View>
          ) : (
            comments.map((c) => {
              const isMine = user && c.user_id === user.id;
              const formattedDate = c.created_at ? new Date(c.created_at).toLocaleDateString('vi-VN') : '';
              return (
                <Card key={c.id} className="mb-3.5 p-4">
                  <View className="flex-row justify-between items-center mb-1.5">
                    <View className="flex-row items-center">
                      <Text className="text-foreground font-bold text-xs">{c.user_name || 'Học viên'}</Text>
                      {isMine && <Text className="text-primary text-[9px] font-extrabold ml-1.5 uppercase bg-primary/10 px-1 py-0.5 rounded">Bạn</Text>}
                    </View>
                    <Text className="text-muted-foreground text-[10px]">{formattedDate}</Text>
                  </View>
                  <Text className="text-foreground text-xs leading-relaxed">{c.content}</Text>
                  {isMine && (
                    <TouchableOpacity
                      onPress={() => handleDeleteComment(c.id)}
                      className="self-end mt-1.5 p-1 flex-row items-center"
                    >
                      <Trash2 size={12} color={Colors.destructive} />
                      <Text className="text-destructive text-[10px] ml-1 font-semibold">Xóa</Text>
                    </TouchableOpacity>
                  )}
                </Card>
              );
            })
          )}
        </ScrollView>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View className="flex-row items-center p-4 bg-background border-t border-border">
            <TextInput
              value={commentInput}
              onChangeText={setCommentInput}
              placeholder="Nhập bình luận thảo luận..."
              placeholderTextColor={Colors.iconMuted}
              className="flex-1 bg-muted text-foreground px-4 py-2.5 rounded-xl border border-border mr-3 text-xs"
              style={{ maxHeight: 80 }}
              multiline
            />
            <IconButton
              variant="soft"
              size="md"
              disabled={sendingComment || !commentInput.trim()}
              onPress={handleSendComment}
              icon={sendingComment ? <ActivityIndicator size="small" color="#ffffff" /> : <Send size={16} color={Colors.primaryForeground} />}
            />
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  };

  if (loading) {
    return (
      <ScreenWrapper scroll={false}>
        <View className="p-4 border-b border-border flex-row items-center">
          <IconButton
            variant="plain"
            size="sm"
            onPress={() => navigation.goBack()}
            icon={<ArrowLeft size={20} color={Colors.foreground} />}
          />
          <Text className="text-foreground font-black text-lg ml-3">Chi tiết bài đọc</Text>
        </View>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={Colors.foreground} />
          <Text className="text-muted-foreground text-sm mt-3">Đang tải bài viết...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scroll={false}>
      {/* Top Header Row */}
      <View className="px-4 py-3 border-b border-border flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 pr-4">
          <IconButton
            variant="plain"
            size="sm"
            onPress={() => navigation.goBack()}
            icon={<ArrowLeft size={20} color={Colors.foreground} />}
          />
          <Text className="text-foreground font-black text-base ml-2.5 flex-1" numberOfLines={1}>
            {passage?.title}
          </Text>
        </View>
        {passage?.level && (
          <Badge
            label={passage.level === 'easy' ? 'Dễ' : passage.level === 'medium' ? 'T.Bình' : 'Khó'}
            variant={passage.level === 'easy' ? 'green' : passage.level === 'medium' ? 'yellow' : 'red'}
          />
        )}
      </View>

      {/* Tab bar */}
      <View className="flex-row bg-muted p-1 rounded-xl my-3 mx-6">
        <TouchableOpacity
          onPress={() => setActiveTab('content')}
          className={`flex-1 py-2 rounded-lg items-center ${activeTab === 'content' ? 'bg-card' : ''}`}
        >
          <Text className={`text-[10px] font-extrabold ${activeTab === 'content' ? 'text-foreground' : 'text-muted-foreground'}`}>
            Đọc bài
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('translation')}
          className={`flex-1 py-2 rounded-lg items-center ${activeTab === 'translation' ? 'bg-card' : ''}`}
        >
          <Text className={`text-[10px] font-extrabold ${activeTab === 'translation' ? 'text-foreground' : 'text-muted-foreground'}`}>
            Luyện dịch
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('comments')}
          className={`flex-1 py-2 rounded-lg items-center ${activeTab === 'comments' ? 'bg-card' : ''}`}
        >
          <Text className={`text-[10px] font-extrabold ${activeTab === 'comments' ? 'text-foreground' : 'text-muted-foreground'}`}>
            Thảo luận ({comments.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Render selected tab */}
      <View className="flex-1">
        {activeTab === 'content' && renderContentTab()}
        {activeTab === 'translation' && renderTranslationTab()}
        {activeTab === 'comments' && renderCommentsTab()}
      </View>

      {/* Lookup Word Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={lookupModalOpen}
        onRequestClose={() => setLookupModalOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-background rounded-t-3xl p-6 min-h-[300px]">
            {/* Header Modal */}
            <View className="flex-row justify-between items-center pb-4 border-b border-border/50">
              <View className="flex-row items-center">
                <Text className="text-xl font-black text-foreground mr-3">{lookupWord}</Text>
                <IconButton
                  variant="soft"
                  size="sm"
                  onPress={handleSpeakLookupWord}
                  icon={<Volume2 size={16} color={Colors.foreground} />}
                />
              </View>
              <TouchableOpacity onPress={() => setLookupModalOpen(false)} className="p-1">
                <Text className="text-muted-foreground text-sm font-semibold">Đóng</Text>
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
            <View className="flex-1 py-5 justify-center">
              {lookupLoading ? (
                <View className="items-center py-6">
                  <ActivityIndicator size="small" color={Colors.foreground} />
                  <Text className="text-muted-foreground text-xs mt-2">Đang tra cứu từ điển...</Text>
                </View>
              ) : lookupResult ? (
                <View>
                  <View className="flex-row items-center flex-wrap mb-4">
                    <Badge label={lookupResult.word_type || 'noun'} variant="zinc" />
                    {lookupResult.pronunciation ? (
                      <Text className="text-muted-foreground text-sm italic font-medium ml-2.5">
                        {lookupResult.pronunciation}
                      </Text>
                    ) : null}
                  </View>
                  <Text className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-1">Định nghĩa</Text>
                  <Text className="text-foreground text-base font-extrabold mb-6 leading-snug">
                    {lookupResult.meaning || 'Không tìm thấy nghĩa của từ này.'}
                  </Text>

                  {/* Button save */}
                  {lookupResult.meaning ? (
                    <ButtonPrimary
                      title="Lưu vào Sổ từ vựng"
                      onPress={handleSaveToVocab}
                      disabled={savingVocab}
                      icon={savingVocab ? <ActivityIndicator size="small" color="#ffffff" /> : <Plus size={18} color={Colors.primaryForeground} />}
                      className="h-12"
                    />
                  ) : null}
                </View>
              ) : (
                <View className="items-center py-6">
                  <Text className="text-muted-foreground text-sm">Không tìm thấy kết quả tra cứu.</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

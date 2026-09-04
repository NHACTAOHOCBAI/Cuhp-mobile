import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as Speech from 'expo-speech';
import * as Clipboard from 'expo-clipboard';
import {
  ArrowLeft,
  BookOpen,
  MessageSquare,
  Languages,
  Volume2,
  Save,
  Send,
  Trash2,
  Plus,
  Sparkles,
  Eye,
  EyeOff,
  Copy,
  StickyNote,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { Colors } from '../theme';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { IconButton } from '../components/IconButton';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { ButtonPrimary, ButtonOutline, triggerHaptic } from '../components/Button';
import { SelectionActionSheet } from '../components/SelectionActionSheet';
import { AddNoteModal } from '../components/AddNoteModal';
import { ProgressBar } from '../components/ProgressBar';
import {
  fetchReadingPassageById,
  fetchTranslationPractice,
  saveTranslationPractice,
  fetchReadingComments,
  createReadingComment,
  deleteReadingComment,
  lookupVocabularyWord,
  createVocabulary,
  fetchVocabularies,
} from '../api/client';
import type {
  ReadingPassage,
  ReadingComment,
  TranslationPractice,
  VocabularyItem,
} from '../types';
import {
  computePassageStats,
  extractContextSentence,
  getReadingLevelLabel,
  getReadingLevelVariant,
  stripHtml,
} from '../utils/reading';
import {
  ReadingStorageKeys,
  getItemAsync,
  setItemAsync,
  getJSONAsync,
  setJSONAsync,
} from '../utils/asyncStore';

type Tab = 'read' | 'translate' | 'discuss' | 'notes';

interface SavedNote {
  id: string;
  selectedText: string;
  comment: string;
  createdAt: string;
}

export default function ReadingDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { token, user } = useAuth();
  const { accent, speechRate } = useSettings();
  const { passageId } = route.params;

  const [activeTab, setActiveTab] = useState<Tab>('read');
  const [loading, setLoading] = useState(true);
  const [passage, setPassage] = useState<ReadingPassage | null>(null);

  // Translation state
  const [translationDraft, setTranslationDraft] = useState('');
  const [savedTranslation, setSavedTranslation] = useState<TranslationPractice | null>(null);
  const [savingTranslation, setSavingTranslation] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);

  // Comments state
  const [comments, setComments] = useState<ReadingComment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [pendingSelectedText, setPendingSelectedText] = useState<string | null>(null);
  const [sendingComment, setSendingComment] = useState(false);

  // Lookup modal state (tap-on-word)
  const [lookupModalOpen, setLookupModalOpen] = useState(false);
  const [lookupWord, setLookupWord] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [savingVocab, setSavingVocab] = useState(false);

  // Selection popup state
  const [selectionSheetOpen, setSelectionSheetOpen] = useState(false);
  const [activeSelection, setActiveSelection] = useState('');

  // Add-note modal state
  const [noteModalOpen, setNoteModalOpen] = useState(false);

  // Notes state (local-only via AsyncStorage)
  const [notes, setNotes] = useState<SavedNote[]>([]);

  // Vocab-for-this-passage (from server, filtered client-side)
  const [passageVocab, setPassageVocab] = useState<VocabularyItem[]>([]);

  // Progress (local)
  const [progress, setProgress] = useState(0);

  // Refs to avoid stale closures in onSelectionChange handlers.
  const passageRef = useRef(passage);
  passageRef.current = passage;

  // -------- Data loading --------

  const loadData = useCallback(async () => {
    if (!token || !passageId) return;
    try {
      const [passageData, translationData, commentsData] = await Promise.all([
        fetchReadingPassageById(passageId, token),
        fetchTranslationPractice(passageId, token),
        fetchReadingComments(passageId, token),
      ]);

      setPassage(passageData);
      if (translationData) {
        setSavedTranslation(translationData);
        // Backend column is `translation_content` (fixed in Phase 1).
        setTranslationDraft(translationData.translation_content || '');
      }
      setComments(commentsData || []);
    } catch (error) {
      console.error('Error loading reading details:', error);
      Alert.alert('Error', 'Could not load reading details.');
    } finally {
      setLoading(false);
    }
  }, [passageId, token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Hydrate notes from AsyncStorage whenever passageId changes.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await getJSONAsync<SavedNote[]>(
        ReadingStorageKeys.notes(passageId),
        []
      );
      if (!cancelled) setNotes(stored);
    })();
    return () => {
      cancelled = true;
    };
  }, [passageId]);

  // Hydrate progress from AsyncStorage; bump to 40 the first time the
  // detail screen opens, mirroring web's progression.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const raw = await getItemAsync(ReadingStorageKeys.progress(passageId));
      if (cancelled) return;
      if (raw === null) {
        setProgress(40);
        await setItemAsync(ReadingStorageKeys.progress(passageId), '40');
      } else {
        const n = parseInt(raw, 10);
        setProgress(Number.isNaN(n) ? 0 : n);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [passageId]);

  // Load user's vocabulary list and filter to words saved from this passage
  // (matched by the `notes` field we stamp when saving from the selection
  // sheet).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetchVocabularies({ page: 1, page_size: 200 }, token);
        if (cancelled) return;
        const title = (passage?.title || '').toLowerCase();
        const filtered = (response.items || []).filter((v) => {
          if (!v?.notes) return false;
          const n = v.notes.toLowerCase();
          // Marker we set: `Looked up from reading: "<title>"` or
          // `Saved from reading: "<title>"`. Match loosely.
          return n.includes(`reading: "${title}"`) || n.includes(`"${title}"`);
        });
        setPassageVocab(filtered);
      } catch (e) {
        console.warn('Could not load passage vocab:', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [passage?.title, token]);

  // -------- Stats --------

  const stats = useMemo(() => {
    if (!passage) return { words: 0, minRead: 1, newWords: 0 };
    const userWords = new Set(
      passageVocab.map((v) => (v.word || '').toLowerCase().trim()).filter(Boolean)
    );
    // Strip HTML first — passages pasted from word processors arrive as
    // raw HTML and would otherwise throw off the word count.
    return computePassageStats(stripHtml(passage.content), userWords);
  }, [passage, passageVocab]);

  // -------- Save handlers --------

  const bumpProgress = useCallback(
    async (target: number) => {
      if (!passageId) return;
      const next = Math.max(progress, target);
      setProgress(next);
      await setItemAsync(ReadingStorageKeys.progress(passageId), String(next));
    },
    [passageId, progress]
  );

  const handleSaveTranslation = async () => {
    if (!token || !passageId) return;
    setSavingTranslation(true);
    try {
      const saved = await saveTranslationPractice(
        passageId,
        { translation_content: translationDraft },
        token
      );
      setSavedTranslation(saved);
      await bumpProgress(100);
      triggerHaptic('success');
      Alert.alert('Saved 🎉', 'Your personal translation has been saved.');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not save translation.');
    } finally {
      setSavingTranslation(false);
    }
  };

  const handleSendComment = async () => {
    if (!commentInput.trim() || !token || !passageId) return;
    setSendingComment(true);
    try {
      const newComment = await createReadingComment(
        passageId,
        {
          content: commentInput.trim(),
          selected_text: pendingSelectedText,
        },
        token
      );
      setComments((prev) => [...prev, newComment]);
      setCommentInput('');
      setPendingSelectedText(null);
      await bumpProgress(75);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to send comment.');
    } finally {
      setSendingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!token) return;
    Alert.alert('Confirm', 'Are you sure you want to delete this comment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteReadingComment(commentId, token);
            setComments((prev) => prev.filter((c) => c.id !== commentId));
          } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to delete comment.');
          }
        },
      },
    ]);
  };

  // -------- Selection popup actions --------

  const openSelectionSheet = (selectedText: string) => {
    const cleaned = (selectedText || '').trim();
    if (!cleaned) return;
    setActiveSelection(cleaned);
    setSelectionSheetOpen(true);
  };

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(activeSelection);
      triggerHaptic('success');
      Alert.alert('Copied', `"${activeSelection}" copied to clipboard.`);
    } catch (e) {
      console.warn('Clipboard error:', e);
    }
  };

  const handleSaveVocabFromSelection = async () => {
    if (!token || !passage) return;
    const phrase = activeSelection.trim();
    if (!phrase) return;
    // For multi-word phrases, we save the full phrase as the "word".
    // Single words go through lookup to fetch a real meaning; phrases get
    // a stub meaning that the user can edit later.
    const isSingleWord = /^[A-Za-z']+$/.test(phrase);
    let meaning = phrase;
    let pronunciation: string | null = null;
    let word_type: string | null = 'phrase';
    try {
      if (isSingleWord) {
        const lookup = await lookupVocabularyWord(phrase, token);
        meaning = lookup?.meaning || phrase;
        pronunciation = lookup?.pronunciation || null;
        word_type = lookup?.word_type || 'noun';
      }
    } catch (e) {
      console.warn('Lookup failed, saving raw phrase:', e);
    }

    const contextSentence =
      extractContextSentence(stripHtml(passage.content || ''), phrase) || '';

    try {
      await createVocabulary(
        {
          word: phrase,
          pronunciation: pronunciation || '',
          meaning,
          word_type,
          notes: `Saved from reading: "${passage.title}"`,
          context_sentence: contextSentence,
        },
        token
      );
      triggerHaptic('success');
      Alert.alert('Saved 🎉', `"${phrase}" added to your notebook.`);
    } catch (error) {
      console.error(error);
      Alert.alert('Failed', 'Could not save vocabulary. The word may already exist.');
    }
  };

  const handleAddNoteOpen = () => {
    setNoteModalOpen(true);
  };

  const handleSaveNote = async (comment: string) => {
    if (!comment.trim() || !passageId) return;
    const newNote: SavedNote = {
      id: `note-${Date.now()}`,
      selectedText: activeSelection,
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
    };
    const next = [newNote, ...notes];
    setNotes(next);
    await setJSONAsync(ReadingStorageKeys.notes(passageId), next);
    triggerHaptic('success');
  };

  const handleDeleteNote = async (id: string) => {
    if (!passageId) return;
    const next = notes.filter((n) => n.id !== id);
    setNotes(next);
    await setJSONAsync(ReadingStorageKeys.notes(passageId), next);
  };

  const handlePronounce = () => {
    Speech.speak(activeSelection, { language: accent, rate: speechRate });
  };

  // -------- Word tap lookup (legacy interactive text) --------

  const handleWordPress = async (word: string) => {
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
      const current = passageRef.current;
      await createVocabulary(
        {
          word: lookupResult.word,
          pronunciation: lookupResult.pronunciation || '',
          meaning: lookupResult.meaning || 'Unknown meaning',
          word_type: lookupResult.word_type || 'noun',
          notes: `Looked up from reading: "${current?.title || ''}"`,
          context_sentence: '',
        },
        token
      );
      Alert.alert('Saved 🎉', `"${lookupResult.word}" added to your notebook.`);
      setLookupModalOpen(false);
    } catch (error) {
      console.error(error);
      Alert.alert('Failed', 'Could not save vocabulary. This word may already exist.');
    } finally {
      setSavingVocab(false);
    }
  };

  // -------- Render helpers --------

  // Tap-any-word lookup renderer (kept for the Read tab — backwards
  // compatible with the existing UX).
  const renderInteractiveText = (text: string) => {
    if (!text) return null;
    const tokens = text.split(/(\b[a-zA-Z']+\b)/g);
    return tokens.map((tokenStr, idx) => {
      const isWord = /^[a-zA-Z']+$/.test(tokenStr);
      if (isWord) {
        return (
          <Text
            key={idx}
            onPress={() => handleWordPress(tokenStr)}
            style={{
              textDecorationLine: 'underline',
              textDecorationStyle: 'dashed',
              textDecorationColor: Colors.iconSubtle,
            }}
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

  const renderReadTab = () => {
    if (!passage) return null;
    // Backend often stores passages as HTML pasted from Google Docs/Word;
    // strip it so the user sees clean prose on mobile (which can't render
    // arbitrary HTML like the web app's DOMParser does).
    const safeContent = stripHtml(passage.content);
    const paragraphs = safeContent.split(/\n\s*\n/).filter(Boolean);
    const translationToShow = stripHtml(savedTranslation?.translation_content || '');

    return (
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 }}
      >
        <View className="flex-row items-start mb-3 px-1">
          <Sparkles size={14} color={Colors.primary} />
          <Text className="text-muted-foreground text-[11px] font-semibold ml-1.5 flex-1 leading-normal">
            Tip: tap a word to look it up, or use "Copy selection" below any paragraph to act on highlighted text.
          </Text>
        </View>

        {paragraphs.length === 0 ? (
          <Card className="p-5">
            <Text className="text-muted-foreground text-sm">No content yet.</Text>
          </Card>
        ) : (
          paragraphs.map((para, idx) => (
            <Card key={idx} className="mb-4 p-5">
              <Text
                selectable
                className="text-foreground text-[15px] leading-relaxed"
              >
                {renderInteractiveText(para)}
              </Text>

              <View className="mt-3 flex-row items-center justify-end">
                <TouchableOpacity
                  onPress={() => openSelectionSheet(para)}
                  activeOpacity={0.7}
                  className="flex-row items-center px-3 py-1.5 rounded-full bg-primary/15 border border-primary/30"
                >
                  <Copy size={12} color={Colors.primary} />
                  <Text className="text-primary text-[11px] font-bold ml-1.5">
                    Act on paragraph
                  </Text>
                </TouchableOpacity>
              </View>

              {showTranslation && translationToShow ? (
                <View className="border-t border-border/50 mt-4 pt-3">
                  <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
                    Your translation
                  </Text>
                  <Text className="text-muted-foreground text-sm leading-relaxed">
                    {translationToShow}
                  </Text>
                </View>
              ) : null}
            </Card>
          ))
        )}

        {/* Translation reveal toggle */}
        {translationToShow ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setShowTranslation((s) => !s)}
            className="mt-2 mb-2 bg-muted border border-border rounded-2xl py-3 flex-row items-center justify-center"
          >
            {showTranslation ? (
              <EyeOff size={14} color={Colors.foreground} />
            ) : (
              <Eye size={14} color={Colors.foreground} />
            )}
            <Text className="text-foreground text-xs font-bold ml-2">
              {showTranslation ? 'Hide translation' : 'Reveal translation'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    );
  };

  const renderTranslateTab = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 }}
      >
        <Card className="p-4 mb-4">
          <View className="flex-row items-center mb-2">
            <Languages size={16} color={Colors.foreground} />
            <Text className="text-foreground font-extrabold text-sm ml-1.5">
              Your translation practice
            </Text>
          </View>
          <Text className="text-muted-foreground text-xs leading-normal">
            Write your personal translation. It's a great way to train your language thinking.
          </Text>
        </Card>

        <TextInput
          multiline
          numberOfLines={12}
          value={translationDraft}
          onChangeText={setTranslationDraft}
          placeholder="Type your translation here..."
          className="bg-card border border-border rounded-2xl p-4 text-foreground text-sm leading-relaxed mb-5"
          style={{ minHeight: 240, textAlignVertical: 'top' }}
        />

        <ButtonPrimary
          title="Save translation"
          onPress={handleSaveTranslation}
          disabled={savingTranslation || !translationDraft.trim()}
          icon={
            savingTranslation ? (
              <ActivityIndicator size="small" color={Colors.primaryForeground} />
            ) : (
              <Save size={18} color={Colors.primaryForeground} />
            )
          }
          className="h-12"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderDiscussTab = () => (
    <View className="flex-1 justify-between">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}
      >
        <Card className="mb-3 p-3 bg-muted border-border">
          <Text className="text-foreground font-extrabold text-xs mb-1">
            Want to quote a phrase?
          </Text>
          <Text className="text-muted-foreground text-[11px] leading-relaxed mb-2">
            Use "Act on paragraph" from the Read tab to copy or quote specific text.
          </Text>
          {activeSelection ? (
            <TouchableOpacity
              onPress={() => {
                setPendingSelectedText(activeSelection);
                triggerHaptic('selection');
              }}
              activeOpacity={0.8}
              className="self-start bg-primary px-3 py-1.5 rounded-full"
            >
              <Text className="text-primary-foreground text-[11px] font-bold">
                Quote last selection
              </Text>
            </TouchableOpacity>
          ) : null}
        </Card>

        {pendingSelectedText ? (
          <Card className="mb-3 p-3 bg-primary/10 border-primary/30">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-primary text-[10px] font-bold uppercase tracking-widest">
                Quoting
              </Text>
              <TouchableOpacity
                onPress={() => setPendingSelectedText(null)}
                hitSlop={8}
              >
                <Text className="text-primary text-[10px] font-semibold">
                  Remove
                </Text>
              </TouchableOpacity>
            </View>
            <Text className="text-foreground text-xs italic leading-relaxed">
              "{pendingSelectedText}"
            </Text>
          </Card>
        ) : null}

        {comments.length === 0 ? (
          <View className="py-12 items-center justify-center">
            <MessageSquare size={28} color={Colors.iconMuted} />
            <Text className="text-muted-foreground text-xs mt-2 text-center">
              No comments yet. Start the discussion!
            </Text>
          </View>
        ) : (
          comments.map((c) => {
            const authorName = c.user?.name || c.user_name || 'Student';
            const isMine = user && c.user_id === user.id;
            const formattedDate = c.created_at
              ? new Date(c.created_at).toLocaleDateString('en-US')
              : '';
            return (
              <Card key={c.id} className="mb-3.5 p-4">
                <View className="flex-row justify-between items-center mb-1.5">
                  <View className="flex-row items-center">
                    <Text className="text-foreground font-bold text-xs">
                      {authorName}
                    </Text>
                    {isMine && (
                      <Text className="text-primary text-[9px] font-extrabold ml-1.5 uppercase bg-primary/10 px-1 py-0.5 rounded">
                        You
                      </Text>
                    )}
                  </View>
                  <Text className="text-muted-foreground text-[10px]">
                    {formattedDate}
                  </Text>
                </View>
                {c.selected_text ? (
                  <View className="bg-muted border-l-2 border-primary px-3 py-2 mb-2 rounded-r-lg">
                    <Text className="text-muted-foreground text-[11px] italic leading-relaxed">
                      "{c.selected_text}"
                    </Text>
                  </View>
                ) : null}
                <Text className="text-foreground text-xs leading-relaxed">
                  {c.content}
                </Text>
                {isMine && (
                  <TouchableOpacity
                    onPress={() => handleDeleteComment(c.id)}
                    className="self-end mt-1.5 p-1 flex-row items-center"
                  >
                    <Trash2 size={12} color={Colors.destructive} />
                    <Text className="text-destructive text-[10px] ml-1 font-semibold">
                      Delete
                    </Text>
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
            placeholder="Type your discussion comment..."
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
            icon={
              sendingComment ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Send size={16} color={Colors.primaryForeground} />
              )
            }
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );

  const renderNotesTab = () => (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 }}
    >
      <Card className="p-4 mb-4">
        <View className="flex-row items-center mb-1.5">
          <StickyNote size={16} color={Colors.foreground} />
          <Text className="text-foreground font-extrabold text-sm ml-1.5">
            Your notes
          </Text>
        </View>
        <Text className="text-muted-foreground text-xs leading-normal">
          Notes you add from selecting text in this passage.
        </Text>
      </Card>

      {notes.length === 0 ? (
        <View className="py-10 items-center justify-center">
          <StickyNote size={24} color={Colors.iconMuted} />
          <Text className="text-muted-foreground text-xs mt-2 text-center">
            No notes yet. Long-press any sentence in the Read tab to add one.
          </Text>
        </View>
      ) : (
        notes.map((n) => (
          <Card key={n.id} className="mb-3 p-4">
            <View className="bg-primary/10 border-l-2 border-primary px-3 py-2 mb-2 rounded-r-lg">
              <Text className="text-foreground text-[11px] italic leading-relaxed">
                "{n.selectedText}"
              </Text>
            </View>
            <Text className="text-foreground text-sm leading-relaxed mb-2">
              {n.comment}
            </Text>
            <View className="flex-row items-center justify-between">
              <Text className="text-muted-foreground text-[10px]">
                {new Date(n.createdAt).toLocaleDateString('en-US')}
              </Text>
              <TouchableOpacity
                onPress={() => handleDeleteNote(n.id)}
                className="flex-row items-center"
              >
                <Trash2 size={12} color={Colors.destructive} />
                <Text className="text-destructive text-[10px] ml-1 font-semibold">
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))
      )}

      {/* Saved vocab in passage */}
      <View className="mt-4">
        <Card className="p-4 mb-3 bg-muted border-border">
          <View className="flex-row items-center">
            <BookOpen size={16} color={Colors.foreground} />
            <Text className="text-foreground font-extrabold text-sm ml-1.5">
              Saved vocabulary from this passage
            </Text>
          </View>
          <Text className="text-muted-foreground text-xs mt-1">
            {passageVocab.length} {passageVocab.length === 1 ? 'word' : 'words'} saved
          </Text>
        </Card>
        {passageVocab.length === 0 ? (
          <View className="py-6 items-center">
            <Text className="text-muted-foreground text-xs text-center">
              No words saved yet. Select a phrase in the Read tab and choose "Save to vocabulary".
            </Text>
          </View>
        ) : (
          passageVocab.map((v) => (
            <Card key={v.id} className="mb-2.5 p-3.5">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-foreground text-sm font-extrabold">
                  {v.word}
                </Text>
                {v.word_type ? (
                  <Badge label={v.word_type} variant="zinc" />
                ) : null}
              </View>
              {v.pronunciation ? (
                <Text className="text-muted-foreground text-[11px] italic mb-1">
                  {v.pronunciation}
                </Text>
              ) : null}
              <Text className="text-foreground text-xs leading-relaxed">
                {v.meaning}
              </Text>
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );

  // -------- Loading state --------

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
          <Text className="text-foreground font-black text-lg ml-3">Reading</Text>
        </View>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={Colors.foreground} />
          <Text className="text-muted-foreground text-sm mt-3">Loading passage...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  // -------- Main UI --------

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: 'read', label: 'Read' },
    { key: 'translate', label: 'Translate' },
    { key: 'discuss', label: `Discuss (${comments.length})` },
    { key: 'notes', label: `Notes (${notes.length})` },
  ];

  return (
    <ScreenWrapper scroll={false}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-border flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 pr-3">
          <IconButton
            variant="plain"
            size="sm"
            onPress={() => navigation.goBack()}
            icon={<ArrowLeft size={20} color={Colors.foreground} />}
          />
          <Text
            className="text-foreground font-black text-base ml-2.5 flex-1"
            numberOfLines={1}
          >
            {passage?.title || 'Reading'}
          </Text>
        </View>
        {passage?.level ? (
          <Badge
            label={getReadingLevelLabel(passage.level)}
            variant={getReadingLevelVariant(passage.level)}
          />
        ) : null}
      </View>

      {/* Subheader: meta + progress */}
      <View className="px-6 pt-3 pb-2">
        <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          {passage?.category || 'General'} • {stats.words}{' '}
          {stats.words === 1 ? 'word' : 'words'} • {stats.minRead} MIN READ
        </Text>
        <View className="mt-2">
          <ProgressBar
            value={progress}
            tone={progress >= 100 ? 'success' : 'primary'}
            thickness="thin"
          />
        </View>
      </View>

      {/* Tab bar */}
      <View className="flex-row bg-muted p-1 rounded-xl my-3 mx-6">
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            onPress={() => setActiveTab(t.key)}
            className="flex-1 py-2 rounded-xl items-center justify-center"
            style={
              activeTab === t.key
                ? {
                    backgroundColor: '#ffffff',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 2,
                  }
                : undefined
            }
          >
            <Text
              className="text-[10px] font-extrabold"
              style={{
                color: activeTab === t.key ? Colors.foreground : Colors.iconMuted,
              }}
              numberOfLines={1}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Active tab */}
      <View className="flex-1">
        {activeTab === 'read' && renderReadTab()}
        {activeTab === 'translate' && renderTranslateTab()}
        {activeTab === 'discuss' && renderDiscussTab()}
        {activeTab === 'notes' && renderNotesTab()}
      </View>

      {/* Selection popup (Copy / Save Vocab / Add Note / Pronounce) */}
      <SelectionActionSheet
        visible={selectionSheetOpen}
        selectedText={activeSelection}
        onClose={() => setSelectionSheetOpen(false)}
        onCopy={handleCopy}
        onSaveVocab={handleSaveVocabFromSelection}
        onAddNote={handleAddNoteOpen}
        onPronounce={handlePronounce}
      />

      {/* Add-note modal */}
      <AddNoteModal
        visible={noteModalOpen}
        selectedText={activeSelection}
        onClose={() => setNoteModalOpen(false)}
        onSave={handleSaveNote}
      />

      {/* Tap-word lookup modal */}
      <Modal
        animationType="slide"
        transparent
        visible={lookupModalOpen}
        onRequestClose={() => setLookupModalOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-background rounded-t-3xl p-6 min-h-[300px]">
            <View className="flex-row justify-between items-center pb-4 border-b border-border/50">
              <View className="flex-row items-center">
                <Text className="text-xl font-black text-foreground mr-3">
                  {lookupWord}
                </Text>
                <IconButton
                  variant="soft"
                  size="sm"
                  onPress={handleSpeakLookupWord}
                  icon={<Volume2 size={16} color={Colors.foreground} />}
                />
              </View>
              <TouchableOpacity
                onPress={() => setLookupModalOpen(false)}
                className="p-1"
              >
                <Text className="text-muted-foreground text-sm font-semibold">
                  Close
                </Text>
              </TouchableOpacity>
            </View>

            <View className="flex-1 py-5 justify-center">
              {lookupLoading ? (
                <View className="items-center py-6">
                  <ActivityIndicator size="small" color={Colors.foreground} />
                  <Text className="text-muted-foreground text-xs mt-2">
                    Looking up dictionary...
                  </Text>
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
                  <Text className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-1">
                    Definition
                  </Text>
                  <Text className="text-foreground text-base font-extrabold mb-6 leading-snug">
                    {lookupResult.meaning || 'No definition found for this word.'}
                  </Text>

                  {lookupResult.meaning ? (
                    <ButtonPrimary
                      title="Save to vocabulary"
                      onPress={handleSaveToVocab}
                      disabled={savingVocab}
                      icon={
                        savingVocab ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <Plus size={18} color={Colors.primaryForeground} />
                        )
                      }
                      className="h-12"
                    />
                  ) : null}
                </View>
              ) : (
                <View className="items-center py-6">
                  <Text className="text-muted-foreground text-sm">
                    No lookup results found.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { ArrowLeft, Play, Pause, RotateCcw, Volume2, Send, Trash2, Award, Headphones, RotateCw, Check } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { Colors } from '../theme';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { IconButton } from '../components/IconButton';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { ButtonPrimary, ButtonOutline } from '../components/Button';
import {
  fetchAudioById,
  fetchAudioComments,
  createAudioComment,
  deleteAudioComment
} from '../api/client';
import type { AudioTrack, AudioComment } from '../types';

export default function ListeningDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { token, user } = useAuth();
  const { accent, speechRate } = useSettings();
  const { audioId } = route.params;

  const [activeTab, setActiveTab] = useState<'transcript' | 'dictation' | 'comments'>('transcript');
  const [loading, setLoading] = useState(true);
  const [passage, setPassage] = useState<AudioTrack | null>(null);

  // Audio state
  const player = useAudioPlayer(passage?.url ?? null);
  const status = useAudioPlayerStatus(player);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [progressWidth, setProgressWidth] = useState(0);

  const isPlaying = status.playing;
  const duration = (status.duration || 0) * 1000; // convert to ms for UI
  const position = (status.currentTime || 0) * 1000;

  // Cập nhật nguồn âm thanh khi tải xong dữ liệu bài nghe
  useEffect(() => {
    if (passage?.url) {
      player.replace(passage.url);
      
      // Kích hoạt bảng điều khiển màn hình khóa với thông tin bài nghe
      player.setActiveForLockScreen(true, {
        title: passage.title,
        artist: passage.category || "Cuhp English Hub",
        albumTitle: passage.level === 'easy' ? 'Mức độ: Dễ' : passage.level === 'medium' ? 'Mức độ: Trung bình' : 'Mức độ: Khó',
      });
    }

    return () => {
      // Hủy kích hoạt lockscreen controls khi unmount
      player.setActiveForLockScreen(false);
    };
  }, [passage, player]);

  // Dictation state
  const [dictationInput, setDictationInput] = useState('');
  const [dictationChecked, setDictationChecked] = useState(false);
  const [dictationResult, setDictationResult] = useState<Array<{ word: string; isCorrect: boolean; userInput: string }>>([]);

  // Comments state
  const [comments, setComments] = useState<AudioComment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  const loadData = async () => {
    if (!token || !audioId) return;
    try {
      const [audioData, commentsData] = await Promise.all([
        fetchAudioById(audioId, token),
        fetchAudioComments(audioId, token)
      ]);

      setPassage(audioData);
      setComments(commentsData || []);
    } catch (error) {
      console.error('Lỗi tải chi tiết bài nghe:', error);
      Alert.alert('Lỗi', 'Không thể kết nối để tải chi tiết bài nghe.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [audioId, token]);

  // Audio mode setup (silent mode + background playback)
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    }).catch((e) => console.error('Lỗi setAudioModeAsync:', e));
  }, []);

  const handlePlayPause = () => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  };

  const handleSkipBack = async () => {
    const currentSec = status.currentTime || 0;
    await player.seekTo(Math.max(0, currentSec - 10));
  };

  const handleSkipForward = async () => {
    const currentSec = status.currentTime || 0;
    const totalSec = status.duration || 0;
    await player.seekTo(Math.min(totalSec, currentSec + 10));
  };

  const handleRateChange = () => {
    let nextRate = 1.0;
    if (playbackRate === 1.0) nextRate = 1.25;
    else if (playbackRate === 1.25) nextRate = 1.5;
    else if (playbackRate === 1.5) nextRate = 0.75;
    else nextRate = 1.0;

    setPlaybackRate(nextRate);
    player.setPlaybackRate(nextRate, 'high');
  };

  const handleProgressBarPress = (e: any) => {
    const totalSec = status.duration || 0;
    if (!totalSec || progressWidth === 0) return;
    const clickX = e.nativeEvent.locationX;
    const pct = clickX / progressWidth;
    player.seekTo(pct * totalSec);
  };

  // Dictation logic
  const handleCheckDictation = () => {
    const correctText = passage?.transcript || '';

    const clean = (text: string) => {
      return text
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const correctWords = clean(correctText).split(' ').filter(Boolean);
    const inputWords = clean(dictationInput).split(' ').filter(Boolean);

    const compared = correctWords.map((correctWord, idx) => {
      const inputWord = inputWords[idx] || '';
      const isCorrect = inputWord === correctWord;
      return {
        word: correctWord,
        isCorrect,
        userInput: inputWord
      };
    });

    setDictationResult(compared);
    setDictationChecked(true);
  };

  const handleResetDictation = () => {
    setDictationInput('');
    setDictationChecked(false);
    setDictationResult([]);
  };

  // Comments logic
  const handleSendComment = async () => {
    if (!commentInput.trim() || !token || !audioId) return;
    setSendingComment(true);
    try {
      const newComment = await createAudioComment(audioId, commentInput.trim(), null, token);
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
            await deleteAudioComment(commentId, token);
            setComments((prev) => prev.filter((c) => c.id !== commentId));
          } catch (error) {
            console.error(error);
            Alert.alert('Lỗi', 'Xóa bình luận thất bại.');
          }
        }
      }
    ]);
  };

  const formatDuration = (ms: number) => {
    if (!ms) return '0:00';
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const renderTranscriptTab = () => {
    if (!passage) return null;
    const enParagraphs = passage.transcript.split('\n\n').filter(Boolean);
    const viParagraphs = passage.translation ? passage.translation.split('\n\n').filter(Boolean) : [];

    return (
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 }}>
        {enParagraphs.map((enPara, idx) => {
          const viPara = viParagraphs[idx] || '';
          return (
            <Card key={idx} className="mb-4 p-4">
              <Text className="text-foreground text-sm font-semibold leading-relaxed mb-2.5">
                {enPara}
              </Text>
              {viPara ? (
                <Text className="text-muted-foreground text-xs leading-normal border-t border-border/50 pt-2">
                  {viPara}
                </Text>
              ) : null}
            </Card>
          );
        })}
      </ScrollView>
    );
  };

  const renderDictationTab = () => {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 }}>
          <Card className="p-4 mb-4">
            <View className="flex-row items-center mb-2">
              <Award size={16} color={Colors.foreground} />
              <Text className="text-foreground font-extrabold text-sm ml-1.5">Shadow Dictation</Text>
            </View>
            <Text className="text-muted-foreground text-xs leading-normal">
              Nghe audio và ghi lại những gì bạn nghe được vào ô nhập liệu dưới đây để kiểm tra khả năng bắt từ của mình.
            </Text>
          </Card>

          {!dictationChecked ? (
            <>
              <TextInput
                multiline
                numberOfLines={8}
                value={dictationInput}
                onChangeText={setDictationInput}
                placeholder="Nghe và viết lại tại đây..."
                className="bg-card border border-border rounded-2xl p-4 text-foreground text-sm leading-relaxed mb-5"
                style={{ minHeight: 180, textAlignVertical: 'top' }}
              />

              <ButtonPrimary
                title="Kiểm tra kết quả"
                onPress={handleCheckDictation}
                disabled={!dictationInput.trim()}
                icon={<Check size={18} color={Colors.primaryForeground} />}
                className="h-12"
              />
            </>
          ) : (
            <View className="space-y-4">
              <Card className="p-5">
                <Text className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-3">Kết quả so khớp của bạn</Text>
                <View className="flex-row flex-wrap leading-relaxed pr-2">
                  {dictationResult.map((res, idx) => (
                    <Text
                      key={idx}
                      className={`text-sm mr-1.5 mb-1.5 ${
                        res.isCorrect ? 'text-success font-bold' : 'text-destructive line-through font-medium bg-red-100 px-1 rounded'
                      }`}
                    >
                      {res.word}
                    </Text>
                  ))}
                </View>
              </Card>

              <ButtonOutline
                title="Luyện lại từ đầu"
                onPress={handleResetDictation}
                icon={<RotateCcw size={16} color={Colors.foreground} />}
                className="h-12 mt-4"
              />
            </View>
          )}
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
              <Headphones size={28} color={Colors.iconMuted} />
              <Text className="text-muted-foreground text-xs mt-2 text-center">
                Chưa có thảo luận nào. Hãy bắt đầu hỏi đáp hoặc thảo luận!
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
          <Text className="text-foreground font-black text-lg ml-3">Chi tiết bài nghe</Text>
        </View>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={Colors.foreground} />
          <Text className="text-muted-foreground text-sm mt-3">Đang tải bài nghe...</Text>
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

      {/* Embedded Audio Player controls */}
      <Card className="m-6 mb-3 p-4 bg-muted border-border/70">
        <View className="flex-row justify-between items-center text-xs text-muted-foreground">
          <Text className="text-muted-foreground text-xs font-semibold">{formatDuration(position)}</Text>
          <Text className="text-muted-foreground text-xs font-semibold">{formatDuration(duration)}</Text>
        </View>

        {/* Custom Progress Scrubber */}
        <TouchableOpacity
          activeOpacity={1}
          onLayout={(e) => setProgressWidth(e.nativeEvent.layout.width)}
          onPress={handleProgressBarPress}
          className="w-full bg-zinc-200 h-1.5 rounded-full my-3.5 relative"
        >
          <View
            style={{ width: duration > 0 ? `${(position / duration) * 100}%` : '0%', backgroundColor: Colors.foreground }}
            className="h-full rounded-full"
          />
        </TouchableOpacity>

        {/* Control Buttons */}
        <View className="flex-row justify-around items-center">
          <TouchableOpacity onPress={handleRateChange} className="bg-zinc-200 px-2.5 py-1.5 rounded-lg w-14 items-center">
            <Text className="text-[10px] font-extrabold text-foreground">{playbackRate}x</Text>
          </TouchableOpacity>

          <View className="flex-row items-center gap-6">
            <IconButton
              variant="soft"
              size="md"
              onPress={handleSkipBack}
              icon={<RotateCcw size={18} color={Colors.foreground} />}
            />
            <TouchableOpacity
              onPress={handlePlayPause}
              className="bg-foreground w-12 h-12 rounded-full items-center justify-center"
            >
              {isPlaying ? <Pause size={20} color={Colors.background} /> : <Play size={20} color={Colors.background} className="ml-0.5" />}
            </TouchableOpacity>
            <IconButton
              variant="soft"
              size="md"
              onPress={handleSkipForward}
              icon={<RotateCw size={18} color={Colors.foreground} />}
            />
          </View>

          <View className="w-14 items-center">
            <Headphones size={16} color={Colors.iconMuted} />
          </View>
        </View>
      </Card>

      {/* Tab Selector */}
      <View className="flex-row bg-muted p-1 rounded-xl my-2 mx-6">
        <TouchableOpacity
          onPress={() => setActiveTab('transcript')}
          className={`flex-1 py-2 rounded-lg items-center ${activeTab === 'transcript' ? 'bg-card' : ''}`}
        >
          <Text className={`text-[10px] font-extrabold ${activeTab === 'transcript' ? 'text-foreground' : 'text-muted-foreground'}`}>
            Kịch bản
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('dictation')}
          className={`flex-1 py-2 rounded-lg items-center ${activeTab === 'dictation' ? 'bg-card' : ''}`}
        >
          <Text className={`text-[10px] font-extrabold ${activeTab === 'dictation' ? 'text-foreground' : 'text-muted-foreground'}`}>
            Chép chính tả
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
        {activeTab === 'transcript' && renderTranscriptTab()}
        {activeTab === 'dictation' && renderDictationTab()}
        {activeTab === 'comments' && renderCommentsTab()}
      </View>
    </ScreenWrapper>
  );
}

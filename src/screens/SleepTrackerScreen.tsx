import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
  Modal,
  TextInput,
  RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  ChevronLeft,
  Moon,
  Sun,
  Clock,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  TrendingUp,
  FileText
} from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { Colors } from '../theme';
import { useAuth } from '../context/AuthContext';
import {
  fetchSleepLogs,
  fetchSleepStats,
  logSleepSession,
  updateSleepSettings,
  deleteSleepLog
} from '../api/client';
import { scheduleSleepReminders } from '../api/notificationService';
import type { SleepLog, SleepStats, User } from '../types';

export default function SleepTrackerScreen() {
  const { token, user, refreshUser } = useAuth();
  const navigation = useNavigation<any>();

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<SleepStats | null>(null);
  const [logs, setLogs] = useState<SleepLog[]>([]);
  
  // Realtime Sleep Tracking
  const [isSleeping, setIsSleeping] = useState(false);
  const [sleepStartTime, setSleepStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const timerRef = useRef<any>(null);

  // Settings
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [bedtime, setBedtime] = useState({ hour: 22, minute: 0 });
  const [waketime, setWaketime] = useState({ hour: 6, minute: 0 });
  const [isSettingsChanged, setIsSettingsChanged] = useState(false);

  // Manual Log Modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualBedtime, setManualBedtime] = useState({ hour: 22, minute: 0 });
  const [manualWaketime, setManualWaketime] = useState({ hour: 6, minute: 0 });
  const [manualNotes, setManualNotes] = useState('');

  // Load User Settings
  useEffect(() => {
    if (user) {
      setReminderEnabled(user.sleep_reminder_enabled ?? true);
      if (user.sleep_bedtime) {
        const [h, m] = user.sleep_bedtime.split(':').map(Number);
        setBedtime({ hour: h, minute: m });
      }
      if (user.sleep_waketime) {
        const [h, m] = user.sleep_waketime.split(':').map(Number);
        setWaketime({ hour: h, minute: m });
      }
    }
  }, [user]);

  // Load Sleep logs and stats
  const loadData = async () => {
    if (!token) return;
    try {
      const [logsData, statsData] = await Promise.all([
        fetchSleepLogs(1, 10, token),
        fetchSleepStats(token)
      ]);
      setLogs(logsData || []);
      setStats(statsData || null);

      // Check current sleep state
      const storedStartTime = await SecureStore.getItemAsync('sleep-start-time');
      if (storedStartTime) {
        setSleepStartTime(new Date(storedStartTime));
        setIsSleeping(true);
      } else {
        setIsSleeping(false);
        setSleepStartTime(null);
      }
    } catch (e) {
      console.error('Lỗi tải dữ liệu giấc ngủ:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Timer logic for sleeping state
  useEffect(() => {
    if (isSleeping && sleepStartTime) {
      timerRef.current = setInterval(() => {
        const diffMs = new Date().getTime() - sleepStartTime.getTime();
        const hrs = Math.floor(diffMs / (1000 * 60 * 60));
        const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
        setElapsedTime(
          `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        );
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedTime('00:00:00');
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSleeping, sleepStartTime]);

  // Start Sleeping
  const handleStartSleep = async () => {
    try {
      const now = new Date();
      await SecureStore.setItemAsync('sleep-start-time', now.toISOString());
      setSleepStartTime(now);
      setIsSleeping(true);
      Alert.alert('Chúc ngủ ngon! 🌙', 'Thời gian bắt đầu ngủ đã được ghi nhận. Hãy gác điện thoại qua một bên và nghỉ ngơi nhé.');
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể bắt đầu ghi nhận giấc ngủ.');
    }
  };

  // Wake Up & Log Sleep
  const handleWakeUp = async () => {
    if (!sleepStartTime || !token) return;

    try {
      const wakeTime = new Date();
      const sleepDateStr = sleepStartTime.toISOString().split('T')[0];

      setLoading(true);
      await logSleepSession({
        sleep_date: sleepDateStr,
        sleep_time_actual: sleepStartTime.toISOString(),
        wake_time_actual: wakeTime.toISOString(),
        notes: 'Ghi nhận qua nút bấm app'
      }, token);

      await SecureStore.deleteItemAsync('sleep-start-time');
      setIsSleeping(false);
      setSleepStartTime(null);
      
      Alert.alert('Chào buổi sáng! ☀️', 'Giấc ngủ của bạn đã được lưu lại thành công.');
      loadData();
    } catch (e: any) {
      Alert.alert('Lỗi', e.message || 'Không thể lưu giấc ngủ của bạn.');
    } finally {
      setLoading(false);
    }
  };

  // Cancel ongoing sleep session
  const handleCancelSleep = async () => {
    Alert.alert(
      'Hủy ghi nhận?',
      'Bạn có muốn hủy bỏ phiên theo dõi giấc ngủ đang chạy không?',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy bỏ',
          style: 'destructive',
          onPress: async () => {
            await SecureStore.deleteItemAsync('sleep-start-time');
            setIsSleeping(false);
            setSleepStartTime(null);
          }
        }
      ]
    );
  };

  // Adjust settings time functions
  const changeTime = (type: 'bedtime' | 'waketime', field: 'hour' | 'minute', delta: number) => {
    setIsSettingsChanged(true);
    if (type === 'bedtime') {
      setBedtime((prev) => {
        let val = prev[field] + delta;
        if (field === 'hour') {
          val = (val + 24) % 24;
        } else {
          val = (val + 60) % 60;
        }
        return { ...prev, [field]: val };
      });
    } else {
      setWaketime((prev) => {
        let val = prev[field] + delta;
        if (field === 'hour') {
          val = (val + 24) % 24;
        } else {
          val = (val + 60) % 60;
        }
        return { ...prev, [field]: val };
      });
    }
  };

  // Save Settings to Backend & Reschedule Notifications
  const handleSaveSettings = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const bedtimeStr = `${bedtime.hour.toString().padStart(2, '0')}:${bedtime.minute.toString().padStart(2, '0')}`;
      const waketimeStr = `${waketime.hour.toString().padStart(2, '0')}:${waketime.minute.toString().padStart(2, '0')}`;

      await updateSleepSettings({
        sleep_bedtime: bedtimeStr,
        sleep_waketime: waketimeStr,
        sleep_reminder_enabled: reminderEnabled
      }, token);

      await scheduleSleepReminders(reminderEnabled, bedtimeStr, waketimeStr);
      await refreshUser();
      
      setIsSettingsChanged(false);
      Alert.alert('Thành công 🎉', 'Đã lưu cài đặt giấc ngủ và cập nhật lịch nhắc nhở.');
    } catch (e: any) {
      Alert.alert('Thất bại', e.message || 'Lỗi lưu cài đặt.');
    } finally {
      setLoading(false);
    }
  };

  // Add manual log
  const handleAddManualLog = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const today = new Date();
      const currentYear = today.getFullYear();
      
      // Parse manual date
      const [year, month, day] = manualDate.split('-').map(Number);
      
      // Construct sleep date & actual datetimes
      // bedtime
      const sleepDateTime = new Date(year, month - 1, day, manualBedtime.hour, manualBedtime.minute, 0);
      
      // wakeup date (if wakeup hour < bedtime hour, assume it's the next day)
      let wakeDate = new Date(year, month - 1, day);
      if (manualWaketime.hour < manualBedtime.hour) {
        wakeDate.setDate(wakeDate.getDate() + 1);
      }
      const wakeDateTime = new Date(wakeDate.getFullYear(), wakeDate.getMonth(), wakeDate.getDate(), manualWaketime.hour, manualWaketime.minute, 0);

      await logSleepSession({
        sleep_date: manualDate,
        sleep_time_actual: sleepDateTime.toISOString(),
        wake_time_actual: wakeDateTime.toISOString(),
        notes: manualNotes || 'Nhập thủ công'
      }, token);

      setShowManualModal(false);
      setManualNotes('');
      Alert.alert('Thành công', 'Đã lưu giấc ngủ thủ công.');
      loadData();
    } catch (e: any) {
      Alert.alert('Lỗi', e.message || 'Không thể tạo bản ghi.');
    } finally {
      setLoading(false);
    }
  };

  // Delete sleep log
  const handleDeleteLog = (id: string) => {
    Alert.alert(
      'Xóa bản ghi?',
      'Bạn có chắc chắn muốn xóa bản ghi giấc ngủ này không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            if (!token) return;
            try {
              setLoading(true);
              await deleteSleepLog(id, token);
              loadData();
            } catch (e: any) {
              Alert.alert('Lỗi', e.message || 'Không thể xóa bản ghi.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Format sleep duration helper
  const formatDuration = (mins: number) => {
    const hrs = Math.floor(mins / 60);
    const remainingMins = Math.round(mins % 60);
    return `${hrs}h ${remainingMins}m`;
  };

  const getDayName = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      return days[d.getDay()];
    } catch {
      return '';
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-[#0b0f19]"
      contentContainerStyle={{ paddingBottom: 120 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#a78bfa" />
      }
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-14 pb-4">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 items-center justify-center"
        >
          <ChevronLeft size={20} color="#94a3b8" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-black tracking-tight">Theo Dõi Giấc Ngủ</Text>
        <View className="w-10 h-10 items-center justify-center rounded-full bg-violet-950/20">
          <Moon size={20} color="#a78bfa" />
        </View>
      </View>

      {/* Main Sleep Status Card */}
      <View className="px-6 mb-6">
        <View className="bg-slate-900 border border-violet-950/40 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
          {isSleeping ? (
            <View className="items-center py-4">
              <View className="w-24 h-24 rounded-full bg-violet-950/40 items-center justify-center mb-4 border border-violet-800/40 relative">
                {/* Glow ring */}
                <View className="absolute inset-0 rounded-full border border-violet-500/30 scale-110 opacity-70 animate-pulse" />
                <Moon size={40} color="#c084fc" />
              </View>
              
              <Text className="text-violet-300 font-bold text-sm tracking-widest uppercase">ĐANG ĐỒNG HỒ NGỦ</Text>
              <Text className="text-white text-3xl font-black mt-2 tracking-tight">{elapsedTime}</Text>
              
              <Text className="text-slate-400 text-xs mt-1">
                Bắt đầu lúc: {sleepStartTime ? sleepStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
              </Text>

              <View className="flex-row gap-x-3 w-full mt-6">
                <TouchableOpacity
                  onPress={handleCancelSleep}
                  className="flex-1 py-4 bg-slate-800 border border-slate-700 rounded-2xl items-center justify-center"
                >
                  <Text className="text-slate-300 font-bold text-sm">Hủy bỏ</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleWakeUp}
                  className="flex-2 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl items-center justify-center flex-row shadow-lg shadow-violet-500/20"
                >
                  <Sun size={18} color="white" className="mr-2" />
                  <Text className="text-white font-extrabold text-sm">Tôi đã thức dậy 🌅</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className="items-center py-4">
              <View className="w-20 h-20 rounded-full bg-slate-950 items-center justify-center mb-4 border border-slate-850">
                <Moon size={32} color="#94a3b8" />
              </View>
              <Text className="text-white text-base font-extrabold">Chúc bạn giấc ngủ ngon</Text>
              <Text className="text-slate-400 text-xs text-center mt-2 px-6 leading-relaxed">
                Nhấn bắt đầu khi bạn chuẩn bị đi ngủ tối nay để theo dõi thời gian thực tế.
              </Text>

              <TouchableOpacity
                onPress={handleStartSleep}
                className="w-full py-4 mt-6 bg-violet-600 rounded-2xl items-center justify-center shadow-lg shadow-violet-500/10 flex-row"
              >
                <Moon size={16} color="white" className="mr-2" />
                <Text className="text-white font-black text-sm">Bắt đầu đi ngủ 🌌</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Sleep Statistics Overview & Chart */}
      <View className="px-6 mb-6">
        <View className="bg-slate-900 border border-slate-800/60 rounded-3xl p-5">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white font-bold text-sm uppercase tracking-wide">Thống kê & Biểu đồ</Text>
            <TrendingUp size={16} color="#c084fc" />
          </View>

          {/* Quick Stats Grid */}
          <View className="flex-row justify-between mb-6 gap-x-2">
            <View className="flex-1 bg-slate-950 p-3.5 rounded-2xl border border-slate-800/30">
              <Text className="text-slate-400 text-[10px] font-bold uppercase">Giờ ngủ TB</Text>
              <Text className="text-white text-base font-extrabold mt-1">{stats?.average_duration_hours ?? 0}h</Text>
            </View>
            <View className="flex-1 bg-slate-950 p-3.5 rounded-2xl border border-slate-800/30">
              <Text className="text-slate-400 text-[10px] font-bold uppercase">Đi ngủ TB</Text>
              <Text className="text-white text-base font-extrabold mt-1">{stats?.average_bedtime ?? '--:--'}</Text>
            </View>
            <View className="flex-1 bg-slate-950 p-3.5 rounded-2xl border border-slate-800/30">
              <Text className="text-slate-400 text-[10px] font-bold uppercase">Thức dậy TB</Text>
              <Text className="text-white text-base font-extrabold mt-1">{stats?.average_waketime ?? '--:--'}</Text>
            </View>
          </View>

          {/* Simple Custom Bar Chart (7 days) */}
          <Text className="text-slate-400 text-xs font-semibold mb-3">Thời lượng ngủ 7 ngày qua</Text>
          <View className="h-32 flex-row justify-around items-end pt-4 pb-2 px-1 border-b border-slate-800">
            {stats && stats.sleep_logs_7_days && stats.sleep_logs_7_days.length > 0 ? (
              stats.sleep_logs_7_days.map((log) => {
                const durationHrs = log.duration_minutes / 60.0;
                // Max height represents 12 hours
                const barHeight = Math.min((durationHrs / 12) * 100, 100);
                const dayName = getDayName(log.sleep_date);

                return (
                  <View key={log.id} className="items-center flex-1">
                    <View className="h-[90px] justify-end items-center w-full relative">
                      {/* Duration label on hover/top */}
                      <Text className="text-violet-400 text-[8px] font-bold mb-1">{durationHrs.toFixed(1)}h</Text>
                      <View
                        style={{
                          height: `${barHeight}%`,
                          backgroundColor: durationHrs >= 7 ? '#8b5cf6' : '#f43f5e',
                          width: 14,
                          borderRadius: 6,
                        }}
                      />
                    </View>
                    <Text className="text-[10px] text-slate-400 font-bold mt-2">{dayName}</Text>
                  </View>
                );
              })
            ) : (
              <View className="flex-1 justify-center items-center h-full">
                <Text className="text-slate-500 text-xs italic">Chưa có đủ dữ liệu giấc ngủ</Text>
              </View>
            )}
          </View>
          {stats && stats.sleep_logs_7_days && stats.sleep_logs_7_days.length > 0 && (
            <View className="flex-row items-center mt-3 gap-x-3">
              <View className="flex-row items-center">
                <View className="w-2 h-2 rounded-full bg-violet-500 mr-1.5" />
                <Text className="text-[10px] text-slate-400">Đạt mục tiêu (≥7h)</Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-2 h-2 rounded-full bg-rose-500 mr-1.5" />
                <Text className="text-[10px] text-slate-400">Thiếu ngủ (&lt;7h)</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Target Sleep settings */}
      <View className="px-6 mb-6">
        <View className="bg-slate-900 border border-slate-800/60 rounded-3xl p-5">
          <View className="flex-row items-center justify-between pb-3 border-b border-slate-800/50 mb-4">
            <View className="flex-row items-center">
              <Clock size={16} color="#a78bfa" className="mr-2" />
              <Text className="text-white font-bold text-sm">Cài Đặt Mục Tiêu & Nhắc Nhở</Text>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={(val) => {
                setReminderEnabled(val);
                setIsSettingsChanged(true);
              }}
              trackColor={{ false: '#334155', true: '#6d28d9' }}
              thumbColor={reminderEnabled ? '#c084fc' : '#94a3b8'}
            />
          </View>

          {/* Time Picker adjusters */}
          <View className="flex-row justify-between mb-4">
            {/* Target Bedtime */}
            <View className="flex-1 bg-slate-950 p-4 rounded-2xl border border-slate-850 mr-2 items-center">
              <Text className="text-slate-400 text-xs font-semibold mb-2">Giờ đi ngủ mục tiêu</Text>
              <View className="flex-row items-center gap-x-2">
                {/* Hours */}
                <View className="items-center">
                  <TouchableOpacity onPress={() => changeTime('bedtime', 'hour', 1)} className="p-1 bg-slate-900 rounded-md">
                    <Text className="text-violet-400 text-[10px] font-bold">+</Text>
                  </TouchableOpacity>
                  <Text className="text-white text-base font-extrabold my-1">{bedtime.hour.toString().padStart(2, '0')}</Text>
                  <TouchableOpacity onPress={() => changeTime('bedtime', 'hour', -1)} className="p-1 bg-slate-900 rounded-md">
                    <Text className="text-violet-400 text-[10px] font-bold">-</Text>
                  </TouchableOpacity>
                </View>
                <Text className="text-white text-lg font-bold">:</Text>
                {/* Minutes */}
                <View className="items-center">
                  <TouchableOpacity onPress={() => changeTime('bedtime', 'minute', 5)} className="p-1 bg-slate-900 rounded-md">
                    <Text className="text-violet-400 text-[10px] font-bold">+</Text>
                  </TouchableOpacity>
                  <Text className="text-white text-base font-extrabold my-1">{bedtime.minute.toString().padStart(2, '0')}</Text>
                  <TouchableOpacity onPress={() => changeTime('bedtime', 'minute', -5)} className="p-1 bg-slate-900 rounded-md">
                    <Text className="text-violet-400 text-[10px] font-bold">-</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Target Waketime */}
            <View className="flex-1 bg-slate-950 p-4 rounded-2xl border border-slate-850 ml-2 items-center">
              <Text className="text-slate-400 text-xs font-semibold mb-2">Giờ thức dậy mục tiêu</Text>
              <View className="flex-row items-center gap-x-2">
                {/* Hours */}
                <View className="items-center">
                  <TouchableOpacity onPress={() => changeTime('waketime', 'hour', 1)} className="p-1 bg-slate-900 rounded-md">
                    <Text className="text-violet-400 text-[10px] font-bold">+</Text>
                  </TouchableOpacity>
                  <Text className="text-white text-base font-extrabold my-1">{waketime.hour.toString().padStart(2, '0')}</Text>
                  <TouchableOpacity onPress={() => changeTime('waketime', 'hour', -1)} className="p-1 bg-slate-900 rounded-md">
                    <Text className="text-violet-400 text-[10px] font-bold">-</Text>
                  </TouchableOpacity>
                </View>
                <Text className="text-white text-lg font-bold">:</Text>
                {/* Minutes */}
                <View className="items-center">
                  <TouchableOpacity onPress={() => changeTime('waketime', 'minute', 5)} className="p-1 bg-slate-900 rounded-md">
                    <Text className="text-violet-400 text-[10px] font-bold">+</Text>
                  </TouchableOpacity>
                  <Text className="text-white text-base font-extrabold my-1">{waketime.minute.toString().padStart(2, '0')}</Text>
                  <TouchableOpacity onPress={() => changeTime('waketime', 'minute', -5)} className="p-1 bg-slate-900 rounded-md">
                    <Text className="text-violet-400 text-[10px] font-bold">-</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {isSettingsChanged && (
            <TouchableOpacity
              onPress={handleSaveSettings}
              className="w-full py-3.5 bg-violet-600 rounded-2xl items-center justify-center shadow-lg shadow-violet-500/10"
            >
              <Text className="text-white font-extrabold text-sm">Lưu Thay Đổi Cài Đặt</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Sleep Logs History List */}
      <View className="px-6">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white font-black text-sm uppercase tracking-wide">Nhật ký giấc ngủ</Text>
          <TouchableOpacity
            onPress={() => {
              setManualDate(new Date().toISOString().split('T')[0]);
              setShowManualModal(true);
            }}
            className="flex-row items-center bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full"
          >
            <Plus size={14} color="#a78bfa" className="mr-1" />
            <Text className="text-violet-400 text-xs font-bold">Ghi thủ công</Text>
          </TouchableOpacity>
        </View>

        {logs.length > 0 ? (
          logs.map((log) => {
            const sleepTime = new Date(log.sleep_time_actual);
            const wakeTime = new Date(log.wake_time_actual);

            return (
              <View
                key={log.id}
                className="bg-slate-900 border border-slate-850 rounded-2xl p-4 flex-row items-center justify-between mb-3"
              >
                <View className="flex-row items-center flex-1">
                  <View className="w-10 h-10 bg-slate-950 border border-slate-800 rounded-full items-center justify-center mr-3">
                    <Moon size={18} color="#a78bfa" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-extrabold text-sm">{log.sleep_date}</Text>
                    <Text className="text-slate-400 text-xs mt-0.5">
                      {sleepTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {wakeTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    {log.notes ? (
                      <Text className="text-slate-500 text-[10px] italic mt-1">{log.notes}</Text>
                    ) : null}
                  </View>
                </View>

                <View className="flex-row items-center ml-2">
                  <View className="bg-violet-950/30 px-3 py-1.5 rounded-xl border border-violet-900/30 mr-3">
                    <Text className="text-violet-400 text-xs font-bold">{formatDuration(log.duration_minutes)}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteLog(log.id)}
                    className="p-2 bg-slate-950 rounded-xl border border-slate-850"
                  >
                    <Trash2 size={14} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        ) : (
          <View className="bg-slate-900 border border-slate-850 rounded-2xl p-8 items-center justify-center">
            <FileText size={32} color="#475569" className="mb-2" />
            <Text className="text-slate-500 text-xs italic">Chưa có bản ghi giấc ngủ nào</Text>
          </View>
        )}
      </View>

      {/* Manual Entry Modal */}
      <Modal
        visible={showManualModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowManualModal(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-slate-900 rounded-t-[32px] p-6 border-t border-slate-800">
            <View className="flex-row items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <Text className="text-white text-lg font-black">Ghi Nhận Thủ Công</Text>
              <TouchableOpacity onPress={() => setShowManualModal(false)} className="px-3 py-1.5 bg-slate-850 rounded-full">
                <Text className="text-slate-400 text-xs font-bold">Đóng</Text>
              </TouchableOpacity>
            </View>

            {/* Date input */}
            <Text className="text-slate-400 text-xs font-bold uppercase mb-2">Ngày đi ngủ (YYYY-MM-DD)</Text>
            <View className="flex-row items-center bg-slate-950 border border-slate-850 rounded-2xl px-4 py-3.5 mb-4">
              <Calendar size={16} color="#94a3b8" className="mr-3" />
              <TextInput
                value={manualDate}
                onChangeText={setManualDate}
                placeholder="2026-08-23"
                placeholderTextColor="#475569"
                className="text-white text-sm font-semibold flex-1 p-0"
              />
            </View>

            {/* Manual Bedtime */}
            <View className="flex-row justify-between mb-4">
              <View className="flex-1 bg-slate-950 p-4 rounded-2xl border border-slate-850 mr-2 items-center">
                <Text className="text-slate-400 text-xs font-semibold mb-2">Giờ ngủ thực tế</Text>
                <View className="flex-row items-center gap-x-2">
                  <View className="items-center">
                    <TouchableOpacity onPress={() => setManualBedtime(prev => ({ ...prev, hour: (prev.hour + 1) % 24 }))} className="p-1 bg-slate-900 rounded-md">
                      <Text className="text-violet-400 text-[10px] font-bold">+</Text>
                    </TouchableOpacity>
                    <Text className="text-white text-base font-extrabold my-1">{manualBedtime.hour.toString().padStart(2, '0')}</Text>
                    <TouchableOpacity onPress={() => setManualBedtime(prev => ({ ...prev, hour: (prev.hour + 23) % 24 }))} className="p-1 bg-slate-900 rounded-md">
                      <Text className="text-violet-400 text-[10px] font-bold">-</Text>
                    </TouchableOpacity>
                  </View>
                  <Text className="text-white text-lg font-bold">:</Text>
                  <View className="items-center">
                    <TouchableOpacity onPress={() => setManualBedtime(prev => ({ ...prev, minute: (prev.minute + 5) % 60 }))} className="p-1 bg-slate-900 rounded-md">
                      <Text className="text-violet-400 text-[10px] font-bold">+</Text>
                    </TouchableOpacity>
                    <Text className="text-white text-base font-extrabold my-1">{manualBedtime.minute.toString().padStart(2, '0')}</Text>
                    <TouchableOpacity onPress={() => setManualBedtime(prev => ({ ...prev, minute: (prev.minute + 55) % 60 }))} className="p-1 bg-slate-900 rounded-md">
                      <Text className="text-violet-400 text-[10px] font-bold">-</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Manual Waketime */}
              <View className="flex-1 bg-slate-950 p-4 rounded-2xl border border-slate-850 ml-2 items-center">
                <Text className="text-slate-400 text-xs font-semibold mb-2">Giờ dậy thực tế</Text>
                <View className="flex-row items-center gap-x-2">
                  <View className="items-center">
                    <TouchableOpacity onPress={() => setManualWaketime(prev => ({ ...prev, hour: (prev.hour + 1) % 24 }))} className="p-1 bg-slate-900 rounded-md">
                      <Text className="text-violet-400 text-[10px] font-bold">+</Text>
                    </TouchableOpacity>
                    <Text className="text-white text-base font-extrabold my-1">{manualWaketime.hour.toString().padStart(2, '0')}</Text>
                    <TouchableOpacity onPress={() => setManualWaketime(prev => ({ ...prev, hour: (prev.hour + 23) % 24 }))} className="p-1 bg-slate-900 rounded-md">
                      <Text className="text-violet-400 text-[10px] font-bold">-</Text>
                    </TouchableOpacity>
                  </View>
                  <Text className="text-white text-lg font-bold">:</Text>
                  <View className="items-center">
                    <TouchableOpacity onPress={() => setManualWaketime(prev => ({ ...prev, minute: (prev.minute + 5) % 60 }))} className="p-1 bg-slate-900 rounded-md">
                      <Text className="text-violet-400 text-[10px] font-bold">+</Text>
                    </TouchableOpacity>
                    <Text className="text-white text-base font-extrabold my-1">{manualWaketime.minute.toString().padStart(2, '0')}</Text>
                    <TouchableOpacity onPress={() => setManualWaketime(prev => ({ ...prev, minute: (prev.minute + 55) % 60 }))} className="p-1 bg-slate-900 rounded-md">
                      <Text className="text-violet-400 text-[10px] font-bold">-</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            {/* Notes */}
            <Text className="text-slate-400 text-xs font-bold uppercase mb-2">Ghi chú (Tùy chọn)</Text>
            <View className="bg-slate-950 border border-slate-850 rounded-2xl px-4 py-3.5 mb-6">
              <TextInput
                value={manualNotes}
                onChangeText={setManualNotes}
                placeholder="Đêm qua ngủ rất say, không thức giấc..."
                placeholderTextColor="#475569"
                className="text-white text-sm font-semibold p-0"
              />
            </View>

            {/* Action buttons */}
            <TouchableOpacity
              onPress={handleAddManualLog}
              className="w-full py-4 bg-violet-600 rounded-2xl items-center justify-center shadow-lg shadow-violet-500/10"
            >
              <Text className="text-white font-extrabold text-sm">Lưu Bản Ghi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

import React from "react";
import { View, Text, Switch, Platform, ScrollView } from "react-native";
import { LogOut, Flame, Sparkles, Volume2, Settings, Bell, User as UserIcon, Target, Plus, Minus } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import { useSettings, SpeechAccent } from "../context/SettingsContext";
import * as Speech from "expo-speech";
import { scheduleTestNotification } from "../api/notificationService";
import { ScreenWrapper } from "../components/ScreenWrapper";
import { Header } from "../components/Header";
import { Button, triggerHaptic } from "../components/Button";
import { Card } from "../components/Card";
import { updateUserProfile } from "../api/client";

export default function SettingScreen() {
  const { user, token, login, logout } = useAuth();

  const handleTargetChange = async (newTarget: number) => {
    if (newTarget < 1) return;
    try {
      const updatedUser = await updateUserProfile({ daily_target: newTarget }, token);
      if (token) {
        await login(token, updatedUser);
      }
      triggerHaptic('success');
    } catch (err) {
      console.error("Lỗi khi cập nhật mục tiêu hàng ngày:", err);
      triggerHaptic('error');
    }
  };

  const {
    accent,
    speechRate,
    reminderEnabled,
    reminderInterval,
    setAccent,
    setSpeechRate,
    setReminderEnabled,
    setReminderInterval,
  } = useSettings();

  const handleAccentChange = async (newAccent: SpeechAccent) => {
    await setAccent(newAccent);
    const testPhrase = newAccent === "en-US" ? "Welcome" : "Welcome";
    Speech.speak(testPhrase, {
      language: newAccent,
      pitch: 1.0,
      rate: speechRate,
    });
  };

  const handleRateChange = async (newRate: number) => {
    await setSpeechRate(newRate);
    Speech.speak("Hello", {
      language: accent,
      pitch: 1.0,
      rate: newRate,
    });
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <ScreenWrapper scroll={false}>
      {/* Top Header Bar */}
      <Header title="Cài Đặt" />

      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
      <Card className="mt-4">
        <View className="flex-row items-center">
          <Card variant="dark" className="h-16 w-16 items-center justify-center p-0 rounded-2xl mb-0">
            <Text className="text-white text-xl font-bold">
              {getInitials(user?.name || "Học Viên")}
            </Text>
          </Card>
          <View className="ml-4 flex-1">
            <Text className="text-zinc-900 text-lg font-bold">
              {user?.name || "Học viên"}
            </Text>
            <Text className="text-zinc-400 text-xs mt-0.5">
              @{user?.username || "username"}
            </Text>
          </View>
        </View>

        {/* Stats Bar */}
        <View className="flex-row border-t border-zinc-100 mt-5 pt-4">
          <View className="flex-1 flex-row items-center justify-center border-r border-zinc-100">
            <Flame size={18} color="#f97316" />
            <View className="ml-2">
              <Text className="text-zinc-900 text-sm font-bold">
                {user?.current_streak || 0} ngày
              </Text>
              <Text className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider">
                Học liên tục
              </Text>
            </View>
          </View>

          <View className="flex-1 flex-row items-center justify-center">
            <Sparkles size={18} color="#a855f7" />
            <View className="ml-2">
              <Text className="text-zinc-900 text-sm font-bold">
                {user?.words_reviewed_today || 0} từ
              </Text>
              <Text className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider">
                Đã học hôm nay
              </Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Section Title - Mục tiêu ngày */}
      <View className="flex-row items-center mb-3">
        <Target size={14} color="#71717a" />
        <Text className="text-zinc-400 text-xs font-bold uppercase tracking-widest ml-1.5">
          Mục tiêu học tập
        </Text>
      </View>

      {/* Daily Target Selection */}
      <Card>
        <Text className="text-zinc-800 text-sm font-bold mb-3">Mục tiêu ôn tập mỗi ngày</Text>
        <Text className="text-zinc-400 text-xs mb-4">
          Số lượng từ vựng bạn muốn ôn tập tối thiểu hàng ngày.
        </Text>
        
        <View className="flex-row items-center justify-between bg-zinc-50/50 border border-zinc-200/80 rounded-2xl p-4">
          <Button
            variant="outline"
            hapticType="none"
            onPress={() => handleTargetChange((user?.daily_target || 10) - 1)}
            disabled={user ? user.daily_target <= 1 : true}
            title=""
            icon={<Minus size={18} color={user && user.daily_target <= 1 ? "#a1a1aa" : "#09090b"} />}
            className="w-12 h-12 rounded-full border-zinc-200/80 bg-white"
          />
          
          <View className="flex-row items-baseline justify-center">
            <Text className="text-3xl font-black text-zinc-900">
              {user?.daily_target || 10}
            </Text>
            <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider ml-1.5">
              Từ / Ngày
            </Text>
          </View>
          
          <Button
            variant="outline"
            hapticType="none"
            onPress={() => handleTargetChange((user?.daily_target || 10) + 1)}
            title=""
            icon={<Plus size={18} color="#09090b" />}
            className="w-12 h-12 rounded-full border-zinc-200/80 bg-white"
          />
        </View>
      </Card>

      {/* Section Title */}
      <View className="flex-row items-center mb-3">
        <Settings size={14} color="#71717a" />
        <Text className="text-zinc-400 text-xs font-bold uppercase tracking-widest ml-1.5">
          Cài đặt phát âm (TTS)
        </Text>
      </View>

      {/* Accent Selection */}
      <Card>
        <Text className="text-zinc-800 text-sm font-bold mb-3">Giọng đọc tiếng Anh</Text>
        
        <View className="flex-row gap-3">
          <Button
            variant={accent === "en-US" ? "primary" : "outline"}
            onPress={() => handleAccentChange("en-US")}
            title="Anh - Mỹ (US)"
            icon={<Volume2 size={16} color={accent === "en-US" ? "#ffffff" : "#71717a"} />}
            className="flex-1 h-12"
            textClassName="text-xs"
          />

          <Button
            variant={accent === "en-GB" ? "primary" : "outline"}
            onPress={() => handleAccentChange("en-GB")}
            title="Anh - Anh (UK)"
            icon={<Volume2 size={16} color={accent === "en-GB" ? "#ffffff" : "#71717a"} />}
            className="flex-1 h-12"
            textClassName="text-xs"
          />
        </View>
      </Card>

      {/* Speed Rate Selection */}
      <Card>
        <Text className="text-zinc-800 text-sm font-bold mb-3">Tốc độ phát âm</Text>
        
        <View className="flex-row gap-2">
          {[
            { label: "Chậm (0.75x)", value: 0.75 },
            { label: "Thường (0.9x)", value: 0.9 },
            { label: "Nhanh (1.1x)", value: 1.1 },
          ].map((item) => {
            const isSelected = speechRate === item.value;
            return (
              <Button
                key={item.value}
                variant={isSelected ? "primary" : "outline"}
                onPress={() => handleRateChange(item.value)}
                title={item.label}
                className="flex-1 h-11"
                textClassName="text-xs"
              />
            );
          })}
        </View>
      </Card>

      {/* Vocabulary Reminders Options */}
      <View className="flex-row items-center mb-3">
        <Bell size={14} color="#71717a" />
        <Text className="text-zinc-400 text-xs font-bold uppercase tracking-widest ml-1.5">
          Nhắc nhở học từ vựng
        </Text>
      </View>

      {/* Toggle Reminder Switch */}
      <Card>
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-1 pr-4">
            <Text className="text-zinc-800 text-sm font-bold">Thông báo nhắc nhở</Text>
            <Text className="text-zinc-400 text-xs mt-1">
              Tự động gửi thông báo kèm nghĩa & phiên âm từ vựng cần học định kỳ trên màn hình khóa.
            </Text>
          </View>
          <Switch
            value={reminderEnabled}
            onValueChange={setReminderEnabled}
            trackColor={{ false: "#e4e4e7", true: "#000000" }}
            thumbColor={Platform.OS === "android" ? "#ffffff" : undefined}
          />
        </View>

        {reminderEnabled && (
          <View className="border-t border-zinc-100 pt-4 mt-2">
            <Text className="text-zinc-800 text-sm font-bold mb-3">Tần suất nhắc nhở</Text>
            <View className="flex-row gap-2">
              {[
                { label: "Mỗi 2h", value: 2 },
                { label: "Mỗi 4h", value: 4 },
                { label: "Mỗi 8h", value: 8 },
                { label: "Mỗi 12h", value: 12 },
              ].map((item) => {
                const isSelected = reminderInterval === item.value;
                return (
                  <Button
                    key={item.value}
                    variant={isSelected ? "primary" : "outline"}
                    onPress={() => setReminderInterval(item.value)}
                    title={item.label}
                    className="flex-1 h-10"
                    textClassName="text-xs"
                  />
                );
              })}
            </View>
          </View>
        )}

        {/* Test Notification Button */}
        {reminderEnabled && (
          <Button
            variant="outline"
            onPress={scheduleTestNotification}
            title="🔔 Gửi thử thông báo kiểm tra (sau 3s)"
            className="mt-4 h-12"
            textClassName="text-xs"
          />
        )}
      </Card>

      {/* System Options */}
      <View className="flex-row items-center mb-3">
        <UserIcon size={14} color="#71717a" />
        <Text className="text-zinc-400 text-xs font-bold uppercase tracking-widest ml-1.5">
          Hệ thống
        </Text>
      </View>

      <Button
        variant="danger"
        onPress={logout}
        title="Đăng xuất tài khoản"
        icon={<LogOut size={18} color="#ffffff" />}
      />
      </ScrollView>
    </ScreenWrapper>
  );
}

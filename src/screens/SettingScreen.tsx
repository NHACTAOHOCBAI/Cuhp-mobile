import React from "react";
import { View, Text, StatusBar, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LogOut, Flame, Sparkles, Check, Volume2, User, Settings } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import { useSettings, SpeechAccent } from "../context/SettingsContext";
import * as Speech from "expo-speech";

export default function SettingScreen() {
  const { user, logout } = useAuth();
  const { accent, speechRate, setAccent, setSpeechRate } = useSettings();
  const insets = useSafeAreaInsets();

  const handleAccentChange = async (newAccent: SpeechAccent) => {
    await setAccent(newAccent);
    // Play test speech automatically so user can hear the pronunciation difference
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

  // Get user avatar initials
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
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-zinc-50/60">
      <StatusBar barStyle="dark-content" />

      {/* Top Header Bar */}
      <View className="flex-row justify-between items-center px-6 py-4 border-b border-zinc-100 bg-white">
        <View className="flex-1">
          <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
            Cấu hình ứng dụng
          </Text>
          <Text className="text-2xl font-bold text-zinc-900 tracking-tight mt-0.5">
            Cài Đặt
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 }}>
        {/* Profile Card */}
        <View className="bg-white border border-zinc-200/80 rounded-3xl p-6 mb-6 shadow-sm shadow-zinc-100/50">
          <View className="flex-row items-center">
            <View className="h-16 w-16 bg-zinc-900 rounded-2xl items-center justify-center shadow-md shadow-zinc-900/10">
              <Text className="text-white text-xl font-bold">
                {getInitials(user?.name || "Học Viên")}
              </Text>
            </View>
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
        </View>

        {/* Section Title */}
        <View className="flex-row items-center mb-3">
          <Settings size={14} color="#71717a" />
          <Text className="text-zinc-400 text-xs font-bold uppercase tracking-widest ml-1.5">
            Cài đặt phát âm (TTS)
          </Text>
        </View>

        {/* Accent Selection */}
        <View className="bg-white border border-zinc-200/80 rounded-3xl p-5 mb-6 shadow-sm shadow-zinc-100/50">
          <Text className="text-zinc-800 text-sm font-bold mb-3">Giọng đọc tiếng Anh</Text>
          
          <View className="flex-row space-x-3 gap-3">
            <TouchableOpacity
              onPress={() => handleAccentChange("en-US")}
              className={`flex-1 flex-row items-center justify-between px-4 py-3.5 rounded-2xl border ${
                accent === "en-US"
                  ? "bg-black border-black"
                  : "bg-zinc-50 border-zinc-200"
              }`}
            >
              <View className="flex-row items-center">
                <Volume2 size={16} color={accent === "en-US" ? "#ffffff" : "#71717a"} />
                <Text className={`text-sm font-bold ml-2 ${accent === "en-US" ? "text-white" : "text-zinc-700"}`}>
                  Giọng Anh - Mỹ (US)
                </Text>
              </View>
              {accent === "en-US" && <Check size={16} color="#ffffff" />}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleAccentChange("en-GB")}
              className={`flex-1 flex-row items-center justify-between px-4 py-3.5 rounded-2xl border ${
                accent === "en-GB"
                  ? "bg-black border-black"
                  : "bg-zinc-50 border-zinc-200"
              }`}
            >
              <View className="flex-row items-center">
                <Volume2 size={16} color={accent === "en-GB" ? "#ffffff" : "#71717a"} />
                <Text className={`text-sm font-bold ml-2 ${accent === "en-GB" ? "text-white" : "text-zinc-700"}`}>
                  Giọng Anh - Anh (UK)
                </Text>
              </View>
              {accent === "en-GB" && <Check size={16} color="#ffffff" />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Speed Rate Selection */}
        <View className="bg-white border border-zinc-200/80 rounded-3xl p-5 mb-6 shadow-sm shadow-zinc-100/50">
          <Text className="text-zinc-800 text-sm font-bold mb-3">Tốc độ phát âm</Text>
          
          <View className="flex-row space-x-2 gap-2">
            {[
              { label: "Chậm (0.75x)", value: 0.75 },
              { label: "Bình thường (0.9x)", value: 0.9 },
              { label: "Nhanh (1.1x)", value: 1.1 },
            ].map((item) => {
              const isSelected = speechRate === item.value;
              return (
                <TouchableOpacity
                  key={item.value}
                  onPress={() => handleRateChange(item.value)}
                  className={`flex-1 py-3.5 rounded-xl border items-center justify-center ${
                    isSelected
                      ? "bg-black border-black"
                      : "bg-zinc-50 border-zinc-200"
                  }`}
                >
                  <Text className={`text-xs font-bold ${isSelected ? "text-white" : "text-zinc-600"}`}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* System Options */}
        <View className="flex-row items-center mb-3">
          <User size={14} color="#71717a" />
          <Text className="text-zinc-400 text-xs font-bold uppercase tracking-widest ml-1.5">
            Hệ thống
          </Text>
        </View>

        <TouchableOpacity
          onPress={logout}
          className="bg-white border border-red-100 rounded-3xl p-5 flex-row items-center justify-center shadow-sm shadow-red-50/30 active:bg-red-50/30"
        >
          <LogOut size={18} color="#ef4444" />
          <Text className="text-red-500 font-bold text-base ml-2">Đăng xuất tài khoản</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

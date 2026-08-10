import React from "react";
import { View, Text, StatusBar, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Headphones, LogOut } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";

export default function ListeningScreen() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-zinc-50/60">
      <StatusBar barStyle="dark-content" />

      {/* Top Header Bar */}
      <View className="flex-row justify-between items-center px-6 py-4 border-b border-zinc-100 bg-white">
        <View className="flex-1 pr-4">
          <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
            Xin chào, {user?.name || "Học viên"}
          </Text>
          <Text className="text-2xl font-bold text-zinc-900 tracking-tight mt-0.5">
            Luyện Nghe
          </Text>
        </View>
        <TouchableOpacity
          onPress={logout}
          className="bg-white border border-zinc-200 p-3 rounded-full active:bg-zinc-100 shadow-sm shadow-zinc-100/50"
        >
          <LogOut size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Placeholder Content */}
      <View className="flex-1 items-center justify-center px-6">
        <View className="h-20 w-20 bg-white border border-zinc-200/80 rounded-3xl items-center justify-center mb-6 shadow-sm shadow-zinc-100/50">
          <Headphones size={36} color="#000000" />
        </View>
        <Text className="text-xl font-bold text-zinc-800 text-center">
          Tính năng Luyện nghe
        </Text>
        <Text className="text-zinc-500 text-sm text-center mt-3 max-w-[280px] leading-relaxed">
          Nội dung luyện nghe đang được phát triển và sẽ sớm được ra mắt trong phiên bản tiếp theo.
        </Text>
      </View>
    </SafeAreaView>
  );
}

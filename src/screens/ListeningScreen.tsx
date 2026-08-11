import React from "react";
import { View, Text } from "react-native";
import { Headphones } from "lucide-react-native";
import { ScreenWrapper } from "../components/ScreenWrapper";
import { Header } from "../components/Header";
import { Card } from "../components/Card";

export default function ListeningScreen() {
  return (
    <ScreenWrapper scroll={false}>
      {/* Top Header Bar */}
      <Header title="Luyện Nghe" />

      {/* Placeholder Content */}
      <View className="flex-1 items-center justify-center px-6">
        <Card variant="default" className="h-20 w-20 items-center justify-center p-0 rounded-3xl mb-6 shadow-sm shadow-zinc-100/50">
          <Headphones size={36} color="#000000" />
        </Card>
        <Text className="text-xl font-bold text-zinc-800 text-center">
          Tính năng Luyện nghe
        </Text>
        <Text className="text-zinc-500 text-sm text-center mt-3 max-w-[280px] leading-relaxed">
          Nội dung luyện nghe đang được phát triển và sẽ sớm được ra mắt trong phiên bản tiếp theo.
        </Text>
      </View>
    </ScreenWrapper>
  );
}

import React from 'react';
import { Headphones } from 'lucide-react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { Header } from '../components/Header';
import { EmptyState } from '../components/EmptyState';
import { Colors } from '../theme';

export default function ListeningScreen() {
  return (
    <ScreenWrapper scroll={false}>
      <Header title="Luyện Nghe" />

      <EmptyState
        icon={<Headphones size={36} color={Colors.foreground} />}
        title="Tính năng Luyện nghe"
        body="Nội dung luyện nghe đang được phát triển và sẽ sớm được ra mắt trong phiên bản tiếp theo."
      />
    </ScreenWrapper>
  );
}

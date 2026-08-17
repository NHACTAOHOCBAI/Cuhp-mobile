import React from 'react';
import { View, Text, Switch, Platform, ScrollView } from 'react-native';
import {
  LogOut,
  Flame,
  Sparkles,
  Volume2,
  Settings as SettingsIcon,
  Bell,
  User as UserIcon,
  Target,
  Plus,
  Minus,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useSettings, SpeechAccent } from '../context/SettingsContext';
import * as Speech from 'expo-speech';
import { scheduleTestNotification } from '../api/notificationService';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { Header } from '../components/Header';
import {
  Button,
  ButtonPrimary,
  ButtonOutline,
  ButtonDanger,
  triggerHaptic,
} from '../components/Button';
import { Card } from '../components/Card';
import { IconButton } from '../components/IconButton';
import { IconTile } from '../components/IconTile';
import { SectionTitle } from '../components/SectionTitle';
import { updateUserProfile } from '../api/client';
import { Colors, typography } from '../theme';

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
      console.error('Lỗi khi cập nhật mục tiêu hàng ngày:', err);
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
    const testPhrase = newAccent === 'en-US' ? 'Welcome' : 'Welcome';
    Speech.speak(testPhrase, {
      language: newAccent,
      pitch: 1.0,
      rate: speechRate,
    });
  };

  const handleRateChange = async (newRate: number) => {
    await setSpeechRate(newRate);
    Speech.speak('Hello', {
      language: accent,
      pitch: 1.0,
      rate: newRate,
    });
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const subtitle = user
    ? `Xin chào, ${user.name || 'Học viên'}`
    : 'Xin chào, Học viên';

  const dailyTarget = user?.daily_target || 10;
  const isMinTarget = !!user && user.daily_target <= 1;

  return (
    <ScreenWrapper scroll={false}>
      <Header title="Cài Đặt" subtitle={subtitle} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Card className="mt-4">
          <View className="flex-row items-center">
            <View className="mr-4">
              <IconTile
                tone="dark"
                size="lg"
                shape="rounded"
                icon={
                  <Text className="text-on-dark text-xl font-bold">
                    {getInitials(user?.name || 'Học Viên')}
                  </Text>
                }
              />
            </View>
            <View className="flex-1">
              <Text className="text-foreground text-lg font-bold">
                {user?.name || 'Học viên'}
              </Text>
              <Text className="text-muted-foreground text-xs mt-0.5">
                @{user?.username || 'username'}
              </Text>
            </View>
          </View>

          {/* Stats Bar */}
          <View className="flex-row border-t border-border mt-5 pt-4">
            <View className="flex-1 flex-row items-center justify-center border-r border-border">
              <Flame size={18} color={Colors.streak} />
              <View className="ml-2">
                <Text className="text-foreground text-sm font-bold">
                  {user?.current_streak || 0} ngày
                </Text>
                <Text className={typography.eyebrowSm}>Học liên tục</Text>
              </View>
            </View>

            <View className="flex-1 flex-row items-center justify-center">
              <Sparkles size={18} color={Colors.purple} />
              <View className="ml-2">
                <Text className="text-foreground text-sm font-bold">
                  {user?.words_reviewed_today || 0} từ
                </Text>
                <Text className={typography.eyebrowSm}>Đã học hôm nay</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Section: Daily target */}
        <View className="mt-6">
          <SectionTitle icon={<Target size={14} color={Colors.iconMuted} />}>
            Mục tiêu học tập
          </SectionTitle>

          <Card>
            <Text className="text-foreground text-sm font-bold mb-3">
              Mục tiêu ôn tập mỗi ngày
            </Text>
            <Text className="text-muted-foreground text-xs mb-4">
              Số lượng từ vựng bạn muốn ôn tập tối thiểu hàng ngày.
            </Text>

            <View className="flex-row items-center justify-between bg-muted border border-border rounded-2xl p-4">
              <IconButton
                variant="outline"
                size="md"
                shape="circle"
                hapticType="none"
                onPress={() => handleTargetChange(dailyTarget - 1)}
                disabled={isMinTarget}
                accessibilityLabel="Giảm mục tiêu"
                icon={
                  <Minus
                    size={18}
                    color={isMinTarget ? Colors.iconMuted : Colors.foreground}
                  />
                }
                className="bg-background"
              />

              <View className="flex-row items-baseline justify-center">
                <Text className="text-3xl font-black text-foreground">
                  {dailyTarget}
                </Text>
                <Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider ml-1.5">
                  Từ / Ngày
                </Text>
              </View>

              <IconButton
                variant="outline"
                size="md"
                shape="circle"
                hapticType="none"
                onPress={() => handleTargetChange(dailyTarget + 1)}
                accessibilityLabel="Tăng mục tiêu"
                icon={<Plus size={18} color={Colors.foreground} />}
                className="bg-background"
              />
            </View>
          </Card>
        </View>

        {/* Section: TTS */}
        <View className="mt-6">
          <SectionTitle icon={<SettingsIcon size={14} color={Colors.iconMuted} />}>
            Cài đặt phát âm (TTS)
          </SectionTitle>

          <Card>
            <Text className="text-foreground text-sm font-bold mb-3">
              Giọng đọc tiếng Anh
            </Text>

            <View className="flex-row gap-3">
              <Button
                variant={accent === 'en-US' ? 'primary' : 'outline'}
                onPress={() => handleAccentChange('en-US')}
                title="Anh - Mỹ (US)"
                icon={
                  <Volume2
                    size={16}
                    color={accent === 'en-US' ? Colors.primaryForeground : Colors.iconMuted}
                  />
                }
                className="flex-1 h-12"
                textClassName="text-xs"
              />
              <Button
                variant={accent === 'en-GB' ? 'primary' : 'outline'}
                onPress={() => handleAccentChange('en-GB')}
                title="Anh - Anh (UK)"
                icon={
                  <Volume2
                    size={16}
                    color={accent === 'en-GB' ? Colors.primaryForeground : Colors.iconMuted}
                  />
                }
                className="flex-1 h-12"
                textClassName="text-xs"
              />
            </View>
          </Card>

          <Card className="mt-4">
            <Text className="text-foreground text-sm font-bold mb-3">
              Tốc độ phát âm
            </Text>

            <View className="flex-row gap-2">
              {[
                { label: 'Chậm (0.75x)', value: 0.75 },
                { label: 'Thường (0.9x)', value: 0.9 },
                { label: 'Nhanh (1.1x)', value: 1.1 },
              ].map((item) => {
                const isSelected = speechRate === item.value;
                return (
                  <Button
                    key={item.value}
                    variant={isSelected ? 'primary' : 'outline'}
                    onPress={() => handleRateChange(item.value)}
                    title={item.label}
                    className="flex-1 h-11"
                    textClassName="text-xs"
                  />
                );
              })}
            </View>
          </Card>
        </View>

        {/* Section: Reminder */}
        <View className="mt-6">
          <SectionTitle icon={<Bell size={14} color={Colors.iconMuted} />}>
            Nhắc nhở học từ vựng
          </SectionTitle>

          <Card>
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-1 pr-4">
                <Text className="text-foreground text-sm font-bold">
                  Thông báo nhắc nhở
                </Text>
                <Text className="text-muted-foreground text-xs mt-1">
                  Tự động gửi thông báo kèm nghĩa & phiên âm từ vựng cần học định
                  kỳ trên màn hình khóa.
                </Text>
              </View>
              <Switch
                value={reminderEnabled}
                onValueChange={setReminderEnabled}
                trackColor={{ false: Colors.trackOff, true: Colors.foreground }}
                thumbColor={Platform.OS === 'android' ? Colors.background : undefined}
              />
            </View>

            {reminderEnabled ? (
              <View className="border-t border-border pt-4 mt-2">
                <Text className="text-foreground text-sm font-bold mb-3">
                  Tần suất nhắc nhở
                </Text>
                <View className="flex-row gap-2">
                  {[
                    { label: 'Mỗi 2h', value: 2 },
                    { label: 'Mỗi 4h', value: 4 },
                    { label: 'Mỗi 8h', value: 8 },
                    { label: 'Mỗi 12h', value: 12 },
                  ].map((item) => {
                    const isSelected = reminderInterval === item.value;
                    return (
                      <Button
                        key={item.value}
                        variant={isSelected ? 'primary' : 'outline'}
                        onPress={() => setReminderInterval(item.value)}
                        title={item.label}
                        className="flex-1 h-10"
                        textClassName="text-xs"
                      />
                    );
                  })}
                </View>

                <ButtonOutline
                  onPress={scheduleTestNotification}
                  title="🔔 Gửi thử thông báo kiểm tra (sau 3s)"
                  className="mt-4 h-12"
                  textClassName="text-xs"
                />
              </View>
            ) : null}
          </Card>
        </View>

        {/* Section: System */}
        <View className="mt-6">
          <SectionTitle icon={<UserIcon size={14} color={Colors.iconMuted} />}>
            Hệ thống
          </SectionTitle>

          <ButtonDanger
            onPress={logout}
            title="Đăng xuất tài khoản"
            icon={<LogOut size={18} color={Colors.destructiveForeground} />}
          />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

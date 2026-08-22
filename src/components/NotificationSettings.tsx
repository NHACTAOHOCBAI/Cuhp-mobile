import React, { useState } from 'react';
import { View, Text, Switch, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { Bell, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { scheduleTestNotification } from '../api/notificationService';
import { Colors } from '../theme';
import { triggerHaptic } from './Button';

export const NotificationSettings: React.FC = () => {
  const {
    reminderEnabled,
    notificationPersonality,
    sleepStartHour,
    sleepEndHour,
    setReminderEnabled,
    setNotificationPersonality,
    setSleepStartHour,
    setSleepEndHour,
  } = useSettings();

  const { user } = useAuth();
  const dailyTarget = user?.daily_target || 5;

  const [startDropdownOpen, setStartDropdownOpen] = useState(false);
  const [endDropdownOpen, setEndDropdownOpen] = useState(false);

  // Danh sách giờ (0 - 23)
  const hoursList = Array.from({ length: 24 }, (_, i) => i);

  const handleTestNotification = () => {
    triggerHaptic('light');
    scheduleTestNotification(notificationPersonality);
  };

  return (
    <View className="bg-card border border-border/40 rounded-3xl p-6 shadow-sm shadow-[#193665]/3 mb-5">
      <View className="flex-row items-center mb-4">
        <View className="w-8 h-8 rounded-full bg-orange-500/10 items-center justify-center mr-3">
          <Bell size={16} color="#f97316" />
        </View>
        <Text className="text-foreground font-black text-base">Cấu hình thông báo</Text>
      </View>

      <View className="border-t border-border/40 pt-4 gap-y-4">
        {/* Bật/tắt nhắc nhở */}
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-foreground text-xs font-bold">Nhắc nhở học hàng ngày</Text>
            <Text className="text-muted-foreground text-[10px] mt-0.5">Nhận thông báo nhắc nhở học từ vựng</Text>
          </View>
          <Switch
            value={reminderEnabled}
            onValueChange={(val) => {
              setReminderEnabled(val);
              triggerHaptic('selection');
              if (val) {
                scheduleTestNotification(notificationPersonality);
              }
            }}
            trackColor={{ false: Colors.trackOff, true: Colors.foreground }}
            thumbColor={Platform.OS === 'android' ? Colors.background : undefined}
          />
        </View>

        {reminderEnabled && (
          <View className="bg-primary/5 rounded-2xl p-3 border border-primary/10">
            <Text className="text-primary text-[10px] leading-normal font-medium">
              💡 Hệ thống tự động chia đều giãn cách thông báo nhắc nhở trong thời gian thức để bạn hoàn thành mục tiêu học tập ({dailyTarget} từ/ngày).
            </Text>
          </View>
        )}

        {reminderEnabled && (
          <>
            {/* Cấu hình giờ giấc ngủ */}
            <View className="border-t border-border/10 pt-4">
              <Text className="text-foreground text-xs font-bold mb-2">Giờ yên lặng (Không làm phiền khi ngủ)</Text>
              <Text className="text-muted-foreground text-[10px] mb-3">
                Hệ thống sẽ không gửi thông báo trong khoảng thời gian này.
              </Text>
              
              <View className="flex-row gap-x-3 z-50">
                {/* Giờ bắt đầu ngủ */}
                <View className="flex-1 relative">
                  <Text className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Bắt đầu từ</Text>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      setStartDropdownOpen(!startDropdownOpen);
                      setEndDropdownOpen(false);
                      triggerHaptic('light');
                    }}
                    className="flex-row justify-between items-center bg-muted/40 border border-border/40 rounded-full px-4 py-2.5"
                  >
                    <Text className="text-foreground text-xs font-bold">{sleepStartHour}:00</Text>
                    {startDropdownOpen ? <ChevronUp size={14} color={Colors.iconMuted} /> : <ChevronDown size={14} color={Colors.iconMuted} />}
                  </TouchableOpacity>

                  {startDropdownOpen && (
                    <View className="absolute top-14 left-0 right-0 bg-popover border border-border/40 rounded-2xl max-h-40 z-50 shadow-lg shadow-black/10 overflow-hidden">
                      <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={false}>
                        {hoursList.map((h) => (
                          <TouchableOpacity
                            key={h}
                            onPress={() => {
                              setSleepStartHour(h);
                              setStartDropdownOpen(false);
                              triggerHaptic('selection');
                            }}
                            className={`px-4 py-2 border-b border-border/10 ${sleepStartHour === h ? 'bg-primary/5' : ''}`}
                          >
                            <Text className={`text-xs ${sleepStartHour === h ? 'text-primary font-bold' : 'text-foreground'}`}>
                              {h}:00
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>

                {/* Giờ thức dậy */}
                <View className="flex-1 relative">
                  <Text className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Thức dậy lúc</Text>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      setEndDropdownOpen(!endDropdownOpen);
                      setStartDropdownOpen(false);
                      triggerHaptic('light');
                    }}
                    className="flex-row justify-between items-center bg-muted/40 border border-border/40 rounded-full px-4 py-2.5"
                  >
                    <Text className="text-foreground text-xs font-bold">{sleepEndHour}:00</Text>
                    {endDropdownOpen ? <ChevronUp size={14} color={Colors.iconMuted} /> : <ChevronDown size={14} color={Colors.iconMuted} />}
                  </TouchableOpacity>

                  {endDropdownOpen && (
                    <View className="absolute top-14 left-0 right-0 bg-popover border border-border/40 rounded-2xl max-h-40 z-50 shadow-lg shadow-black/10 overflow-hidden">
                      <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={false}>
                        {hoursList.map((h) => (
                          <TouchableOpacity
                            key={h}
                            onPress={() => {
                              setSleepEndHour(h);
                              setEndDropdownOpen(false);
                              triggerHaptic('selection');
                            }}
                            className={`px-4 py-2 border-b border-border/10 ${sleepEndHour === h ? 'bg-primary/5' : ''}`}
                          >
                            <Text className={`text-xs ${sleepEndHour === h ? 'text-primary font-bold' : 'text-foreground'}`}>
                              {h}:00
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Cá tính thông báo */}
            <View className="border-t border-border/10 pt-4">
              <Text className="text-foreground text-xs font-bold mb-3">Cá tính nhắc nhở</Text>
              <View className="flex-row bg-muted rounded-2xl p-1 justify-between gap-x-1">
                {(['gentle', 'supportive', 'roast'] as const).map((p) => {
                  const isActive = notificationPersonality === p;
                  const labelMap = {
                    gentle: '🌸 Nhẹ nhàng',
                    supportive: '💪 Động viên',
                    roast: '🔥 Cà khịa',
                  };
                  return (
                    <TouchableOpacity
                      key={p}
                      onPress={() => {
                        setNotificationPersonality(p);
                        triggerHaptic('selection');
                        scheduleTestNotification(p);
                      }}
                      className={`flex-1 py-2.5 rounded-xl items-center justify-center ${
                        isActive ? 'bg-foreground shadow-sm shadow-foreground/20' : 'bg-transparent'
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-bold ${
                          isActive ? 'text-background' : 'text-muted-foreground'
                        }`}
                      >
                        {labelMap[p]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text className="text-muted-foreground text-[9px] mt-2 italic pl-1">
                {notificationPersonality === 'gentle' && 'Nhắc nhở lịch thiệp, dễ chịu để bạn thoải mái.'}
                {notificationPersonality === 'supportive' && 'Lời khích lệ đầy nhiệt huyết và tích cực!'}
                {notificationPersonality === 'roast' && 'Sát sao, hài hước và châm chọc nếu bạn lười biếng. 🔥'}
              </Text>
            </View>

            {/* Nút gửi thử thông báo */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleTestNotification}
              className="mt-2 bg-primary/10 border border-primary/5 rounded-full py-3 items-center justify-center"
            >
              <Text className="text-primary text-xs font-black">Gửi thông báo học thử</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

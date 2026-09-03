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
    <View className="bg-white border border-[#F0EAEB] rounded-3xl p-6 shadow-sm shadow-[#EFBCD5]/20 mb-5" style={{ borderColor: '#F0EAEB' }}>
      <View className="flex-row items-center mb-4">
        <View className="w-8 h-8 rounded-full bg-[#fcf1f5] border border-[#F0EAEB] items-center justify-center mr-3" style={{ borderColor: '#F0EAEB' }}>
          <Bell size={16} color="#C7739A" />
        </View>
        <Text className="text-[#1f1a1d] font-black text-base">Cấu hình thông báo</Text>
      </View>

      <View className="border-t border-[#F0EAEB] pt-4 gap-y-4" style={{ borderTopColor: '#F0EAEB' }}>
        {/* Bật/tắt nhắc nhở */}
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-[#1f1a1d] text-xs font-bold">Nhắc nhở học hàng ngày</Text>
            <Text className="text-[#706065] text-[10px] mt-0.5">Nhận thông báo nhắc nhở học từ vựng</Text>
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
            trackColor={{ false: Colors.trackOff, true: '#EFBCD5' }}
            thumbColor={Platform.OS === 'android' ? Colors.background : undefined}
          />
        </View>

        {reminderEnabled && (
          <View className="bg-[#fcf1f5] rounded-2xl p-3 border border-[#F0EAEB]" style={{ borderColor: '#F0EAEB' }}>
            <Text className="text-[#C7739A] text-[10px] leading-normal font-medium">
              💡 Hệ thống tự động chia đều giãn cách thông báo nhắc nhở trong thời gian thức để bạn hoàn thành mục tiêu học tập ({dailyTarget} từ/ngày).
            </Text>
          </View>
        )}

        {reminderEnabled && (
          <>
            {/* Cấu hình giờ giấc ngủ */}
            <View className="border-t border-[#F0EAEB] pt-4" style={{ borderTopColor: '#F0EAEB' }}>
              <Text className="text-[#1f1a1d] text-xs font-bold mb-2">Giờ yên lặng (Không làm phiền khi ngủ)</Text>
              <Text className="text-[#706065] text-[10px] mb-3">
                Hệ thống sẽ không gửi thông báo trong khoảng thời gian này.
              </Text>
              
              <View className="flex-row gap-x-3 z-50">
                {/* Giờ bắt đầu ngủ */}
                <View className="flex-1 relative">
                  <Text className="text-[9px] font-bold text-[#706065] uppercase tracking-widest mb-1.5">Bắt đầu từ</Text>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      setStartDropdownOpen(!startDropdownOpen);
                      setEndDropdownOpen(false);
                      triggerHaptic('light');
                    }}
                    style={{ borderColor: '#F0EAEB' }}
                    className="flex-row justify-between items-center bg-[#fcf1f5] border border-[#F0EAEB] rounded-full px-4 py-2.5"
                  >
                    <Text className="text-[#1f1a1d] text-xs font-bold">{sleepStartHour}:00</Text>
                    {startDropdownOpen ? <ChevronUp size={14} color="#706065" /> : <ChevronDown size={14} color="#706065" />}
                  </TouchableOpacity>

                  {startDropdownOpen && (
                    <View className="absolute top-14 left-0 right-0 bg-white border border-[#F0EAEB] rounded-2xl max-h-40 z-50 shadow-lg shadow-black/10 overflow-hidden" style={{ borderColor: '#F0EAEB' }}>
                      <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={false}>
                        {hoursList.map((h) => (
                          <TouchableOpacity
                            key={h}
                            onPress={() => {
                              setSleepStartHour(h);
                              setStartDropdownOpen(false);
                              triggerHaptic('selection');
                            }}
                            className={`px-4 py-2 border-b border-[#F0EAEB]/40 ${sleepStartHour === h ? 'bg-[#EFBCD5]/20' : ''}`}
                          >
                            <Text className={`text-xs ${sleepStartHour === h ? 'text-[#C7739A] font-bold' : 'text-[#1f1a1d]'}`}>
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
                  <Text className="text-[9px] font-bold text-[#706065] uppercase tracking-widest mb-1.5">Thức dậy lúc</Text>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      setEndDropdownOpen(!endDropdownOpen);
                      setStartDropdownOpen(false);
                      triggerHaptic('light');
                    }}
                    style={{ borderColor: '#F0EAEB' }}
                    className="flex-row justify-between items-center bg-[#fcf1f5] border border-[#F0EAEB] rounded-full px-4 py-2.5"
                  >
                    <Text className="text-[#1f1a1d] text-xs font-bold">{sleepEndHour}:00</Text>
                    {endDropdownOpen ? <ChevronUp size={14} color="#706065" /> : <ChevronDown size={14} color="#706065" />}
                  </TouchableOpacity>

                  {endDropdownOpen && (
                    <View className="absolute top-14 left-0 right-0 bg-white border border-[#F0EAEB] rounded-2xl max-h-40 z-50 shadow-lg shadow-black/10 overflow-hidden" style={{ borderColor: '#F0EAEB' }}>
                      <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={false}>
                        {hoursList.map((h) => (
                          <TouchableOpacity
                            key={h}
                            onPress={() => {
                              setSleepEndHour(h);
                              setEndDropdownOpen(false);
                              triggerHaptic('selection');
                            }}
                            className={`px-4 py-2 border-b border-[#F0EAEB]/40 ${sleepEndHour === h ? 'bg-[#EFBCD5]/20' : ''}`}
                          >
                            <Text className={`text-xs ${sleepEndHour === h ? 'text-[#C7739A] font-bold' : 'text-[#1f1a1d]'}`}>
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
            <View className="border-t border-[#F0EAEB] pt-4" style={{ borderTopColor: '#F0EAEB' }}>
              <Text className="text-[#1f1a1d] text-xs font-bold mb-3">Cá tính nhắc nhở</Text>
              <View className="flex-row bg-[#fcf1f5] border border-[#F0EAEB] rounded-2xl p-1 justify-between gap-x-1" style={{ borderColor: '#F0EAEB' }}>
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
                        isActive ? 'bg-[#1f1a1d] shadow-sm' : 'bg-transparent'
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-bold ${
                          isActive ? 'text-white' : 'text-[#706065]'
                        }`}
                      >
                        {labelMap[p]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text className="text-[#706065] text-[9px] mt-2 italic pl-1">
                {notificationPersonality === 'gentle' && 'Nhắc nhở lịch thiệp, dễ chịu để bạn thoải mái.'}
                {notificationPersonality === 'supportive' && 'Lời khích lệ đầy nhiệt huyết và tích cực!'}
                {notificationPersonality === 'roast' && 'Sát sao, hài hước và châm chọc nếu bạn lười biếng. 🔥'}
              </Text>
            </View>

            {/* Nút gửi thử thông báo */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleTestNotification}
              style={{ borderColor: '#F0EAEB' }}
              className="mt-2 bg-[#EFBCD5] border border-[#F0EAEB] rounded-full py-3 items-center justify-center"
            >
              <Text className="text-[#1f1a1d] text-xs font-black">Gửi thông báo học thử</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

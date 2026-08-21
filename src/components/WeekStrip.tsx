import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '../theme';

function formatDateLocal(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const WEEKDAY_SHORT_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface WeekStripProps {
  selectedDate: string;
  onSelectDate: (dateStr: string, date: Date) => void;
  baseDate: Date;
  onBaseDateChange: (date: Date) => void;
  showNavButtons?: boolean;
}

export const WeekStrip: React.FC<WeekStripProps> = ({
  selectedDate,
  onSelectDate,
  baseDate,
  onBaseDateChange,
  showNavButtons = true,
}) => {
  const scrollRef = useRef<ScrollView>(null);

  // Monday is first day of the week
  const getWeekDates = () => {
    const current = new Date(baseDate);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(current.setDate(diff));

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  const navigateWeek = (weeks: number) => {
    const next = new Date(baseDate);
    next.setDate(baseDate.getDate() + weeks * 7);
    onBaseDateChange(next);
  };

  const monthLabel = baseDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Auto-center selected date when dates change
  useEffect(() => {
    const idx = weekDates.findIndex((d) => formatDateLocal(d) === selectedDate);
    if (idx > 0 && scrollRef.current) {
      const cardWidth = 72; // card width + margin
      scrollRef.current.scrollTo({ x: Math.max(0, idx * cardWidth - 80), animated: true });
    }
  }, [selectedDate, baseDate]);

  return (
    <View className="mb-2">
      {/* Month eyebrow & Nav buttons */}
      <View className="flex-row justify-between items-center px-6 pt-4 pb-1">
        <Text className="text-foreground text-2xl font-black">{monthLabel}</Text>
        
        {showNavButtons && (
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => navigateWeek(-1)}
              className="px-2.5 py-1.5 rounded-lg bg-muted border border-border/40"
            >
              <Text className="text-foreground text-xs font-bold">← Tuần trước</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigateWeek(1)}
              className="px-2.5 py-1.5 rounded-lg bg-muted border border-border/40"
            >
              <Text className="text-foreground text-xs font-bold">Tuần sau →</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Week strip ScrollView */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 12 }}
      >
        {weekDates.map((date) => {
          const dateStr = formatDateLocal(date);
          const isSelected = selectedDate === dateStr;
          const weekday = WEEKDAY_SHORT_EN[date.getDay()];
          
          return (
            <TouchableOpacity
              key={dateStr}
              onPress={() => onSelectDate(dateStr, date)}
              activeOpacity={0.85}
              className={`mr-2 items-center justify-center w-16 h-[88px] rounded-2xl border ${
                isSelected
                  ? 'bg-purple/5 border-purple shadow-sm shadow-purple/20'
                  : 'bg-card border-border shadow-sm shadow-[#193665]/3'
              }`}
            >
              <Text
                className={`text-[10px] font-bold uppercase ${
                  isSelected ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {weekday}
              </Text>
              <Text
                className={`text-lg font-black mt-1 ${
                  isSelected ? 'text-foreground' : 'text-foreground/70'
                }`}
              >
                {date.getDate()}
              </Text>
              {isSelected ? (
                <View className="w-1.5 h-1.5 rounded-full bg-purple mt-1" />
              ) : (
                <View className="h-1.5 mt-1" />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

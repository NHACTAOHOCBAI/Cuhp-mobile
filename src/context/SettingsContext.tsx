import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { scheduleVocabularyReminders } from "../api/notificationService";
import { useAuth } from "./AuthContext";

export type SpeechAccent = "en-US" | "en-GB";
export type NotificationPersonality = "gentle" | "supportive" | "roast";

interface SettingsContextType {
  accent: SpeechAccent;
  speechRate: number;
  reminderEnabled: boolean;
  notificationPersonality: NotificationPersonality;
  sleepStartHour: number;
  sleepEndHour: number;
  setAccent: (accent: SpeechAccent) => Promise<void>;
  setSpeechRate: (rate: number) => Promise<void>;
  setReminderEnabled: (enabled: boolean) => Promise<void>;
  setNotificationPersonality: (personality: NotificationPersonality) => Promise<void>;
  setSleepStartHour: (hour: number) => Promise<void>;
  setSleepEndHour: (hour: number) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const dailyTarget = user?.daily_target || 5;

  const [accent, setAccentState] = useState<SpeechAccent>("en-US");
  const [speechRate, setSpeechRateState] = useState<number>(0.9);
  const [reminderEnabled, setReminderEnabledState] = useState<boolean>(true); // Mặc định là bật
  const [notificationPersonality, setNotificationPersonalityState] = useState<NotificationPersonality>("supportive");
  const [sleepStartHour, setSleepStartHourState] = useState<number>(22); // Mặc định 22h
  const [sleepEndHour, setSleepEndHourState] = useState<number>(8); // Mặc định 8h sáng

  // Lên lịch lại nhắc nhở mỗi khi mục tiêu học hàng ngày thay đổi
  useEffect(() => {
    scheduleVocabularyReminders(
      reminderEnabled,
      notificationPersonality,
      sleepStartHour,
      sleepEndHour,
      dailyTarget
    );
  }, [dailyTarget]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedAccent = await SecureStore.getItemAsync("settings-accent");
        const storedRate = await SecureStore.getItemAsync("settings-rate");
        const storedReminder = await SecureStore.getItemAsync("settings-reminder-enabled");
        const storedPersonality = await SecureStore.getItemAsync("settings-notification-personality");
        const storedSleepStart = await SecureStore.getItemAsync("settings-sleep-start");
        const storedSleepEnd = await SecureStore.getItemAsync("settings-sleep-end");

        if (storedAccent === "en-US" || storedAccent === "en-GB") {
          setAccentState(storedAccent);
        }
        if (storedRate) {
          setSpeechRateState(parseFloat(storedRate));
        }
        
        let currentEnabled = true;
        if (storedReminder !== null) {
          currentEnabled = storedReminder === "true";
          setReminderEnabledState(currentEnabled);
        }

        let currentPersonality: NotificationPersonality = "supportive";
        if (storedPersonality === "gentle" || storedPersonality === "supportive" || storedPersonality === "roast") {
          currentPersonality = storedPersonality;
          setNotificationPersonalityState(currentPersonality);
        }

        let currentSleepStart = 22;
        if (storedSleepStart !== null) {
          currentSleepStart = parseInt(storedSleepStart);
          setSleepStartHourState(currentSleepStart);
        }

        let currentSleepEnd = 8;
        if (storedSleepEnd !== null) {
          currentSleepEnd = parseInt(storedSleepEnd);
          setSleepEndHourState(currentSleepEnd);
        }

        // Tự động lập lịch lại mỗi lần mở app để cập nhật từ vựng mới nhất
        await scheduleVocabularyReminders(
          currentEnabled,
          currentPersonality,
          currentSleepStart,
          currentSleepEnd,
          dailyTarget
        );
      } catch (e) {
        console.warn("Lỗi tải cài đặt:", e);
      }
    };
    loadSettings();
  }, []);

  const setAccent = async (newAccent: SpeechAccent) => {
    try {
      await SecureStore.setItemAsync("settings-accent", newAccent);
      setAccentState(newAccent);
    } catch (e) {
      console.error("Lỗi lưu cài đặt accent:", e);
    }
  };

  const setSpeechRate = async (newRate: number) => {
    try {
      await SecureStore.setItemAsync("settings-rate", String(newRate));
      setSpeechRateState(newRate);
    } catch (e) {
      console.error("Lỗi lưu cài đặt speech rate:", e);
    }
  };

  const setReminderEnabled = async (enabled: boolean) => {
    try {
      await SecureStore.setItemAsync("settings-reminder-enabled", String(enabled));
      setReminderEnabledState(enabled);
      await scheduleVocabularyReminders(enabled, notificationPersonality, sleepStartHour, sleepEndHour, dailyTarget);
    } catch (e) {
      console.error("Lỗi lưu cài đặt reminderEnabled:", e);
    }
  };

  const setNotificationPersonality = async (newPersonality: NotificationPersonality) => {
    try {
      await SecureStore.setItemAsync("settings-notification-personality", newPersonality);
      setNotificationPersonalityState(newPersonality);
      await scheduleVocabularyReminders(reminderEnabled, newPersonality, sleepStartHour, sleepEndHour, dailyTarget);
    } catch (e) {
      console.error("Lỗi lưu cài đặt notificationPersonality:", e);
    }
  };

  const setSleepStartHour = async (hour: number) => {
    try {
      await SecureStore.setItemAsync("settings-sleep-start", String(hour));
      setSleepStartHourState(hour);
      await scheduleVocabularyReminders(reminderEnabled, notificationPersonality, hour, sleepEndHour, dailyTarget);
    } catch (e) {
      console.error("Lỗi lưu cài đặt sleepStartHour:", e);
    }
  };

  const setSleepEndHour = async (hour: number) => {
    try {
      await SecureStore.setItemAsync("settings-sleep-end", String(hour));
      setSleepEndHourState(hour);
      await scheduleVocabularyReminders(reminderEnabled, notificationPersonality, sleepStartHour, hour, dailyTarget);
    } catch (e) {
      console.error("Lỗi lưu cài đặt sleepEndHour:", e);
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        accent,
        speechRate,
        reminderEnabled,
        notificationPersonality,
        sleepStartHour,
        sleepEndHour,
        setAccent,
        setSpeechRate,
        setReminderEnabled,
        setNotificationPersonality,
        setSleepStartHour,
        setSleepEndHour,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings phải được sử dụng bên trong SettingsProvider");
  }
  return context;
};


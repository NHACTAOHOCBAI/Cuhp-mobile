import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { scheduleVocabularyReminders } from "../api/notificationService";

export type SpeechAccent = "en-US" | "en-GB";
export type NotificationPersonality = "gentle" | "supportive" | "roast";

interface SettingsContextType {
  accent: SpeechAccent;
  speechRate: number;
  reminderEnabled: boolean;
  reminderInterval: number; // tính bằng giờ
  notificationPersonality: NotificationPersonality;
  setAccent: (accent: SpeechAccent) => Promise<void>;
  setSpeechRate: (rate: number) => Promise<void>;
  setReminderEnabled: (enabled: boolean) => Promise<void>;
  setReminderInterval: (interval: number) => Promise<void>;
  setNotificationPersonality: (personality: NotificationPersonality) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accent, setAccentState] = useState<SpeechAccent>("en-US");
  const [speechRate, setSpeechRateState] = useState<number>(0.9);
  const [reminderEnabled, setReminderEnabledState] = useState<boolean>(true); // Mặc định là bật
  const [reminderInterval, setReminderIntervalState] = useState<number>(4); // Mặc định mỗi 4 tiếng
  const [notificationPersonality, setNotificationPersonalityState] = useState<NotificationPersonality>("supportive");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedAccent = await SecureStore.getItemAsync("settings-accent");
        const storedRate = await SecureStore.getItemAsync("settings-rate");
        const storedReminder = await SecureStore.getItemAsync("settings-reminder-enabled");
        const storedInterval = await SecureStore.getItemAsync("settings-reminder-interval");
        const storedPersonality = await SecureStore.getItemAsync("settings-notification-personality");

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
        
        let currentInterval = 4;
        if (storedInterval !== null) {
          currentInterval = parseInt(storedInterval);
          setReminderIntervalState(currentInterval);
        }

        let currentPersonality: NotificationPersonality = "supportive";
        if (storedPersonality === "gentle" || storedPersonality === "supportive" || storedPersonality === "roast") {
          currentPersonality = storedPersonality;
          setNotificationPersonalityState(currentPersonality);
        }

        // Tự động lập lịch lại mỗi lần mở app để cập nhật từ vựng mới nhất
        await scheduleVocabularyReminders(currentEnabled, currentInterval, currentPersonality);
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
      await scheduleVocabularyReminders(enabled, reminderInterval, notificationPersonality);
    } catch (e) {
      console.error("Lỗi lưu cài đặt reminderEnabled:", e);
    }
  };

  const setReminderInterval = async (interval: number) => {
    try {
      await SecureStore.setItemAsync("settings-reminder-interval", String(interval));
      setReminderIntervalState(interval);
      await scheduleVocabularyReminders(reminderEnabled, interval, notificationPersonality);
    } catch (e) {
      console.error("Lỗi lưu cài đặt reminderInterval:", e);
    }
  };

  const setNotificationPersonality = async (newPersonality: NotificationPersonality) => {
    try {
      await SecureStore.setItemAsync("settings-notification-personality", newPersonality);
      setNotificationPersonalityState(newPersonality);
      await scheduleVocabularyReminders(reminderEnabled, reminderInterval, newPersonality);
    } catch (e) {
      console.error("Lỗi lưu cài đặt notificationPersonality:", e);
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        accent,
        speechRate,
        reminderEnabled,
        reminderInterval,
        notificationPersonality,
        setAccent,
        setSpeechRate,
        setReminderEnabled,
        setReminderInterval,
        setNotificationPersonality,
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


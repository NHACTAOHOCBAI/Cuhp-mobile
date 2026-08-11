import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { scheduleVocabularyReminders } from "../api/notificationService";

export type SpeechAccent = "en-US" | "en-GB";

interface SettingsContextType {
  accent: SpeechAccent;
  speechRate: number;
  reminderEnabled: boolean;
  reminderInterval: number; // tính bằng giờ
  setAccent: (accent: SpeechAccent) => Promise<void>;
  setSpeechRate: (rate: number) => Promise<void>;
  setReminderEnabled: (enabled: boolean) => Promise<void>;
  setReminderInterval: (interval: number) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accent, setAccentState] = useState<SpeechAccent>("en-US");
  const [speechRate, setSpeechRateState] = useState<number>(0.9);
  const [reminderEnabled, setReminderEnabledState] = useState<boolean>(true); // Mặc định là bật
  const [reminderInterval, setReminderIntervalState] = useState<number>(4); // Mặc định mỗi 4 tiếng

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedAccent = await SecureStore.getItemAsync("settings-accent");
        const storedRate = await SecureStore.getItemAsync("settings-rate");
        const storedReminder = await SecureStore.getItemAsync("settings-reminder-enabled");
        const storedInterval = await SecureStore.getItemAsync("settings-reminder-interval");

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

        // Tự động lập lịch lại mỗi lần mở app để cập nhật từ vựng mới nhất
        await scheduleVocabularyReminders(currentEnabled, currentInterval);
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
      await scheduleVocabularyReminders(enabled, reminderInterval);
    } catch (e) {
      console.error("Lỗi lưu cài đặt reminderEnabled:", e);
    }
  };

  const setReminderInterval = async (interval: number) => {
    try {
      await SecureStore.setItemAsync("settings-reminder-interval", String(interval));
      setReminderIntervalState(interval);
      await scheduleVocabularyReminders(reminderEnabled, interval);
    } catch (e) {
      console.error("Lỗi lưu cài đặt reminderInterval:", e);
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        accent,
        speechRate,
        reminderEnabled,
        reminderInterval,
        setAccent,
        setSpeechRate,
        setReminderEnabled,
        setReminderInterval,
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


import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";

export type SpeechAccent = "en-US" | "en-GB";

interface SettingsContextType {
  accent: SpeechAccent;
  speechRate: number;
  setAccent: (accent: SpeechAccent) => Promise<void>;
  setSpeechRate: (rate: number) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accent, setAccentState] = useState<SpeechAccent>("en-US");
  const [speechRate, setSpeechRateState] = useState<number>(0.9);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedAccent = await SecureStore.getItemAsync("settings-accent");
        const storedRate = await SecureStore.getItemAsync("settings-rate");
        if (storedAccent === "en-US" || storedAccent === "en-GB") {
          setAccentState(storedAccent);
        }
        if (storedRate) {
          setSpeechRateState(parseFloat(storedRate));
        }
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

  return (
    <SettingsContext.Provider value={{ accent, speechRate, setAccent, setSpeechRate }}>
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

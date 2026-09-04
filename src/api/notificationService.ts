import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { fetchVocabularies } from "./client";
import { VocabularyItem } from "../types";

// Configure how notifications behave when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Register quick interaction buttons (Notification Actions).
 */
export async function registerNotificationCategory() {
  try {
    await Notifications.setNotificationCategoryAsync("vocab-reminder", [
      {
        identifier: "MARK_KNOWN",
        buttonTitle: "✅ Got it",
        options: {
          opensAppToForeground: true,
        },
      },
      {
        identifier: "PRONOUNCE",
        buttonTitle: "🔊 Pronounce",
        options: {
          opensAppToForeground: true,
        },
      },
      {
        identifier: "MARK_FORGOTTEN",
        buttonTitle: "❌ Review again",
        options: {
          opensAppToForeground: true,
        },
      },
    ]);

    await Notifications.setNotificationCategoryAsync("sleep-bedtime", [
      {
        identifier: "START_SLEEP",
        buttonTitle: "🌙 Go to sleep now",
        options: {
          opensAppToForeground: true,
        },
      },
    ]);

    await Notifications.setNotificationCategoryAsync("sleep-wakeup", [
      {
        identifier: "END_SLEEP",
        buttonTitle: "☀️ I just woke up",
        options: {
          opensAppToForeground: true,
        },
      },
    ]);

    console.log("Registered notification categories: vocab-reminder, sleep-bedtime, sleep-wakeup");
  } catch (error) {
    console.warn("Error registering notification categories:", error);
  }
}

/**
 * Initialize the Android notification channel with prominent sound.
 */
export async function setupNotificationChannel(): Promise<boolean> {
  if (Platform.OS === "android") {
    try {
      await Notifications.setNotificationChannelAsync("vocab-alerts", {
        name: "Vocabulary review reminders",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
        sound: "default",
        enableVibrate: true,
        showBadge: true,
      });
      console.log("Set up Android notification channel: vocab-alerts");
      return true;
    } catch (error) {
      // Stay silent on Expo Go
      return false;
    }
  }
  return false;
}

/**
 * Request notification permission from the user.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === "granted";
}

/**
 * Compute the next reminder trigger time, avoiding the dynamic sleep window.
 */
function getNextTriggerDate(
  startDate: Date,
  hoursOffset: number,
  sleepStart: number = 22,
  sleepEnd: number = 8
): Date {
  const date = new Date(startDate.getTime() + hoursOffset * 60 * 60 * 1000);
  const hour = date.getHours();

  if (sleepStart > sleepEnd) {
    // Example: sleep from 10pm to 8am the next day
    if (hour >= sleepStart || hour < sleepEnd) {
      if (hour >= sleepStart) {
        date.setDate(date.getDate() + 1);
      }
      date.setHours(sleepEnd, 0, 0, 0);
    }
  } else {
    // Example: sleep from 0am to 6am the same day
    if (hour >= sleepStart && hour < sleepEnd) {
      date.setHours(sleepEnd, 0, 0, 0);
    }
  }

  return date;
}

/**
 * Schedule notifications for vocabulary to review automatically based on the daily target.
 * @param enabled Whether reminders are enabled
 * @param personality Reminder personality ('gentle' | 'supportive' | 'roast')
 * @param sleepStart Sleep start hour
 * @param sleepEnd Wake-up hour
 * @param dailyTarget Daily words goal
 */
export async function scheduleVocabularyReminders(
  enabled: boolean,
  personality: "gentle" | "supportive" | "roast" = "supportive",
  sleepStart: number = 22,
  sleepEnd: number = 8,
  dailyTarget: number = 5
) {
  try {
    // 1. Cancel all previously scheduled notifications
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log("Cleared previously scheduled notifications");

    if (!enabled) {
      return;
    }

    // 2. Check notification permissions
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.warn("No notification permission, skipping reminder scheduling");
      return;
    }

    // 3. Get token to call the API
    const token = await SecureStore.getItemAsync("user-token");
    if (!token) {
      console.warn("Not logged in, cannot load vocabulary for reminders");
      return;
    }

    // 4. Load the vocabulary list to learn (fetch a larger batch for smart filtering)
    let vocabItems: VocabularyItem[] = [];
    try {
      // Fetch up to 40 words due for review
      const res = await fetchVocabularies({ due: true, page_size: 40 }, token);
      vocabItems = res.items || [];

      // If not enough due words, fetch more from the regular list
      if (vocabItems.length < 15) {
        const resAll = await fetchVocabularies({ page_size: 40 }, token);
        const allItems = resAll.items || [];
        // Merge and de-duplicate
        const existingIds = new Set(vocabItems.map(item => item.id));
        for (const item of allItems) {
          if (!existingIds.has(item.id)) {
            vocabItems.push(item);
          }
        }
      }
    } catch (e) {
      console.warn("Error loading vocabulary for notification scheduling:", e);
      return;
    }

    if (vocabItems.length === 0) {
      console.log("No vocabulary to schedule reminders for");
      return;
    }

    // Smart sort: prioritize lowest box first (not yet learned), then earliest next_review_at
    vocabItems.sort((a, b) => {
      if (a.box_number !== b.box_number) {
        return a.box_number - b.box_number; // Box 1, 2 first
      }
      const timeA = new Date(a.next_review_at || 0).getTime();
      const timeB = new Date(b.next_review_at || 0).getTime();
      return timeA - timeB;
    });

    // 5. Compute optimal reminder spacing based on wake hours and daily goal
    let wakeHours = 16; // Default: 16 hours awake
    if (sleepStart !== sleepEnd) {
      if (sleepStart > sleepEnd) {
        wakeHours = 24 - (sleepStart - sleepEnd);
      } else {
        wakeHours = 24 - (sleepEnd - sleepStart);
      }
    }
    // Interval = wake hours / daily target, clamped between 1h and 12h
    const finalInterval = Math.max(1, Math.min(12, wakeHours / Math.max(1, dailyTarget)));

    // 6. Set up categories & channel if not done yet
    await registerNotificationCategory();
    const isChannelCreated = await setupNotificationChannel();

    // 7. Schedule up to 15 notifications
    const now = new Date();
    let scheduledCount = 0;

    for (let i = 0; i < Math.min(vocabItems.length, 15); i++) {
      const item = vocabItems[i];
      const triggerDate = getNextTriggerDate(now, (i + 1) * finalInterval, sleepStart, sleepEnd);

      const triggerObj: any = {
        type: 'date',
        date: triggerDate,
      };
      if (isChannelCreated) {
        triggerObj.channelId = "vocab-alerts";
      }

      // Determine title and body based on personality
      let title = `💡 Word to remember: "${item.word}"`;
      let body = `${item.meaning}${item.pronunciation ? ` • /${item.pronunciation}/` : ""}`;

      if (personality === "gentle") {
        title = `🌸 Gentle reminder: "${item.word}"`;
        body = `A little knowledge for today: ${item.meaning}. Take 10 seconds to look!`;
      } else if (personality === "roast") {
        title = `🥱 Hey lazy! What does "${item.word}" mean?`;
        body = `Don't tell me you forgot "${item.meaning}"! Open it and study now! 🔥`;
      } else { // supportive
        title = `💪 Let's review a word: "${item.word}"`;
        body = `${item.meaning}${item.pronunciation ? ` • /${item.pronunciation}/` : ""}. You're doing great, keep it up!`;
      }

      // Schedule the notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { vocabId: item.id, word: item.word },
          categoryIdentifier: "vocab-reminder",
          sound: "default",
          vibrate: [0, 250, 250, 250],
          priority: Notifications.AndroidNotificationPriority.MAX, // Highest priority
        },
        trigger: triggerObj,
      });
      scheduledCount++;
    }

    console.log(`Successfully scheduled ${scheduledCount} vocabulary notifications (auto interval ${finalInterval.toFixed(1)}h, sleep ${sleepStart}h - ${sleepEnd}h, target ${dailyTarget} words/day)`);
  } catch (error) {
    console.warn("Error in notification scheduling:", error);
  }
}

/**
 * Send a test notification immediately (after 3 seconds).
 */
export async function scheduleTestNotification(personality: "gentle" | "supportive" | "roast" = "supportive") {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    alert("Please grant notification permission in your device settings!");
    return;
  }

  await registerNotificationCategory();
  const isChannelCreated = await setupNotificationChannel();

  const triggerObj: any = {
    type: 'timeInterval',
    seconds: 3,
  };
  if (isChannelCreated) {
    triggerObj.channelId = "vocab-alerts";
  }

  let title = '💡 Sample word: "Aesthetic"';
  let body = 'Means "relating to beauty" • /esˈθet.ɪk/. Tap to try the interactions!';

  if (personality === "gentle") {
    title = '🌸 Relax a little with: "Aesthetic"';
    body = 'It means "relating to beauty" • /esˈθet.ɪk/. Have a wonderful day!';
  } else if (personality === "roast") {
    title = '🥱 Brain flat yet? Remember "Aesthetic"?';
    body = 'It means "relating to beauty", you lazy. Stop scrolling and study! 🔥';
  } else {
    title = '💪 Today\'s motivation: "Aesthetic"';
    body = 'It means "relating to beauty" • /esˈθet.ɪk/. Keep closing those habit rings!';
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { vocabId: "test-vocab-id", word: "Aesthetic" },
      categoryIdentifier: "vocab-reminder",
      sound: "default",
      vibrate: [0, 250, 250, 250],
      priority: Notifications.AndroidNotificationPriority.MAX,
    },
    trigger: triggerObj,
  });
}

/**
 * Schedule daily bedtime and wake-up notifications.
 */
export async function scheduleSleepReminders(
  enabled: boolean,
  bedtimeStr: string = "22:00",
  wakeupStr: string = "06:00"
) {
  try {
    // Cancel previous sleep notifications
    const lastBedtimeId = await SecureStore.getItemAsync("notification-id-bedtime");
    const lastWakeupId = await SecureStore.getItemAsync("notification-id-wakeup");

    if (lastBedtimeId) {
      await Notifications.cancelScheduledNotificationAsync(lastBedtimeId).catch(() => null);
    }
    if (lastWakeupId) {
      await Notifications.cancelScheduledNotificationAsync(lastWakeupId).catch(() => null);
    }

    if (!enabled) {
      console.log("Sleep reminders disabled. Old notifications cancelled.");
      return;
    }

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.warn("No notification permission, skipping sleep reminder scheduling");
      return;
    }

    await registerNotificationCategory();

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("sleep-alerts", {
        name: "Sleep reminders",
        importance: Notifications.AndroidImportance.MAX,
        sound: "default",
        enableVibrate: true,
        showBadge: true,
      }).catch(() => null);
    }

    // Parse bedtimeStr (e.g. "22:00")
    const [bHour, bMinute] = bedtimeStr.split(":").map(Number);
    // Parse wakeupStr (e.g. "06:00")
    const [wHour, wMinute] = wakeupStr.split(":").map(Number);

    // Schedule bedtime notification
    const bedtimeNotificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "🌙 It's bedtime!",
        body: "Set work aside and get to bed on time. Tap 'Go to sleep now' to log your bedtime.",
        categoryIdentifier: "sleep-bedtime",
        sound: "default",
        vibrate: [0, 250, 250, 250],
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: {
        type: 'daily',
        hour: bHour,
        minute: bMinute,
      } as any,
    });
    await SecureStore.setItemAsync("notification-id-bedtime", bedtimeNotificationId);

    // Schedule wake-up notification
    const wakeupNotificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "☀️ Good morning!",
        body: "Time to wake up. Don't forget to tap 'I just woke up' to log your sleep.",
        categoryIdentifier: "sleep-wakeup",
        sound: "default",
        vibrate: [0, 250, 250, 250],
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: {
        type: 'daily',
        hour: wHour,
        minute: wMinute,
      } as any,
    });
    await SecureStore.setItemAsync("notification-id-wakeup", wakeupNotificationId);

    console.log(`Successfully scheduled sleep reminders: Bedtime ${bedtimeStr}, Wakeup ${wakeupStr}`);
  } catch (error) {
    console.warn("Error scheduling sleep reminders:", error);
  }
}

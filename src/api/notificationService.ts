import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { fetchVocabularies } from "./client";
import { VocabularyItem } from "../types";

// Cấu hình cách hiển thị thông báo khi app đang ở foreground
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
 * Đăng ký các nút tương tác nhanh (Notification Actions)
 */
export async function registerNotificationCategory() {
  try {
    await Notifications.setNotificationCategoryAsync("vocab-reminder", [
      {
        identifier: "MARK_KNOWN",
        buttonTitle: "✅ Đã thuộc",
        options: {
          opensAppToForeground: true,
        },
      },
      {
        identifier: "PRONOUNCE",
        buttonTitle: "🔊 Phát âm",
        options: {
          opensAppToForeground: true,
        },
      },
      {
        identifier: "MARK_FORGOTTEN",
        buttonTitle: "❌ Ôn lại",
        options: {
          opensAppToForeground: true,
        },
      },
    ]);
    console.log("Đã đăng ký danh mục thông báo vocab-reminder");
  } catch (error) {
    console.warn("Lỗi đăng ký category thông báo:", error);
  }
}

/**
 * Khởi tạo kênh thông báo (Android Channel) với âm thanh nổi bật
 */
export async function setupNotificationChannel(): Promise<boolean> {
  if (Platform.OS === "android") {
    try {
      await Notifications.setNotificationChannelAsync("vocab-alerts", {
        name: "Nhắc nhở học từ vựng",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
        sound: "default",
        enableVibrate: true,
        showBadge: true,
      });
      console.log("Đã thiết lập kênh thông báo vocab-alerts cho Android");
      return true;
    } catch (error) {
      // Hoàn toàn im lặng trên Expo Go
      return false;
    }
  }
  return false;
}

/**
 * Yêu cầu quyền thông báo từ người dùng
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
 * Tính toán thời gian nhắc nhở tiếp theo, tránh khung giờ ngủ (22:00 - 08:00)
 */
function getNextTriggerDate(startDate: Date, hoursOffset: number): Date {
  const date = new Date(startDate.getTime() + hoursOffset * 60 * 60 * 1000);
  const hour = date.getHours();
  
  // Nếu mốc thời gian rơi vào 22h tối đến 8h sáng hôm sau, đẩy về 9h sáng ngày hôm đó (hoặc hôm sau)
  if (hour >= 22) {
    date.setDate(date.getDate() + 1);
    date.setHours(9, 0, 0, 0);
  } else if (hour < 8) {
    date.setHours(9, 0, 0, 0);
  }
  
  return date;
}

/**
 * Lập lịch thông báo cho các từ vựng cần học
 * @param enabled Bật hay tắt nhắc nhở
 * @param intervalHours Khoảng thời gian giữa các thông báo (giờ)
 * @param personality Cá tính nhắc nhở ('gentle' | 'supportive' | 'roast')
 */
export async function scheduleVocabularyReminders(
  enabled: boolean,
  intervalHours: number = 4,
  personality: "gentle" | "supportive" | "roast" = "supportive"
) {
  try {
    // 1. Huỷ tất cả các thông báo đã lập lịch trước đó
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log("Đã xoá các thông báo đã lập lịch cũ");

    if (!enabled) {
      return;
    }

    // 2. Kiểm tra quyền thông báo
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.warn("Không có quyền thông báo, không lập lịch nhắc nhở");
      return;
    }

    // 3. Lấy token để gọi API
    const token = await SecureStore.getItemAsync("user-token");
    if (!token) {
      console.warn("Chưa đăng nhập, không thể lấy từ vựng để nhắc nhở");
      return;
    }

    // 4. Lấy danh sách từ vựng cần học (do/due)
    let vocabItems: VocabularyItem[] = [];
    try {
      // Đầu tiên thử lấy các từ cần ôn tập (due)
      const res = await fetchVocabularies({ due: true, page_size: 15 }, token);
      vocabItems = res.items || [];
      
      // Nếu không có từ nào cần ôn tập gấp, lấy danh sách từ bình thường để nhắc nhở
      if (vocabItems.length === 0) {
        const resAll = await fetchVocabularies({ page_size: 15 }, token);
        vocabItems = resAll.items || [];
      }
    } catch (e) {
      console.warn("Lỗi khi tải từ vựng để lập lịch thông báo:", e);
      return;
    }

    if (vocabItems.length === 0) {
      console.log("Không có từ vựng nào để lập lịch nhắc nhở");
      return;
    }

    // 5. Thiết lập danh mục & kênh nếu chưa làm
    await registerNotificationCategory();
    const isChannelCreated = await setupNotificationChannel();

    // 6. Lập lịch cho tối đa 15 thông báo
    const now = new Date();
    let scheduledCount = 0;

    for (let i = 0; i < Math.min(vocabItems.length, 15); i++) {
      const item = vocabItems[i];
      const triggerDate = getNextTriggerDate(now, (i + 1) * intervalHours);

      const triggerObj: any = {
        type: 'date',
        date: triggerDate,
      };
      if (isChannelCreated) {
        triggerObj.channelId = "vocab-alerts";
      }

      // Xác định tiêu đề và nội dung dựa trên cá tính
      let title = `💡 Từ vựng cần nhớ: "${item.word}"`;
      let body = `${item.meaning}${item.pronunciation ? ` • /${item.pronunciation}/` : ""}`;

      if (personality === "gentle") {
        title = `🌸 Nhắc nhở nhẹ nhàng: "${item.word}"`;
        body = `Một chút kiến thức hôm nay: ${item.meaning}. Dành 10 giây xem thử nhé!`;
      } else if (personality === "roast") {
        title = `🥱 Ê lười ơi! Từ này nghĩa là gì: "${item.word}"?`;
        body = `Đừng bảo bạn quên từ "${item.meaning}" này rồi nhé! Vào học ngay đi! 🔥`;
      } else { // supportive
        title = `💪 Cùng ôn từ vựng nào: "${item.word}"`;
        body = `${item.meaning}${item.pronunciation ? ` • /${item.pronunciation}/` : ""}. Bạn đang làm rất tốt, cố lên!`;
      }

      // Thêm thông báo
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { vocabId: item.id, word: item.word },
          categoryIdentifier: "vocab-reminder",
          sound: "default",
          vibrate: [0, 250, 250, 250],
          priority: Notifications.AndroidNotificationPriority.MAX, // Mức ưu tiên cao nhất
        },
        trigger: triggerObj,
      });
      scheduledCount++;
    }

    console.log(`Đã lập lịch thành công ${scheduledCount} thông báo từ vựng (khoảng cách ${intervalHours}h)`);
  } catch (error) {
    console.warn("Lỗi trong quá trình lập lịch thông báo:", error);
  }
}

/**
 * Gửi ngay lập tức một thông báo kiểm tra (Test Notification) sau 3 giây
 */
export async function scheduleTestNotification(personality: "gentle" | "supportive" | "roast" = "supportive") {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    alert("Vui lòng cấp quyền thông báo trong cài đặt máy!");
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

  let title = '💡 Từ vựng mẫu: "Aesthetic"';
  let body = 'Thẩm mỹ, có óc thẩm mỹ • /esˈθet.ɪk/. Nhấp để thử tương tác!';

  if (personality === "gentle") {
    title = '🌸 Thư giãn nhẹ nhàng cùng: "Aesthetic"';
    body = 'Ý nghĩa là "Thẩm mỹ" • /esˈθet.ɪk/. Một ngày tuyệt vời nhé!';
  } else if (personality === "roast") {
    title = '🥱 Cơ bắp teo, não phẳng kìa! Nhớ từ: "Aesthetic" không?';
    body = 'Ý nghĩa là "Thẩm mỹ" đấy đồ lười. Đừng có nằm lướt điện thoại nữa, học/tập ngay đi! 🔥';
  } else {
    title = '💪 Động lực hôm nay: "Aesthetic"';
    body = 'Có nghĩa là "Thẩm mỹ" • /esˈθet.ɪk/. Cố gắng khép kín các vòng tròn thói quen nhé!';
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

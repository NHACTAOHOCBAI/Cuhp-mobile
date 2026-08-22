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
 * Tính toán thời gian nhắc nhở tiếp theo, tránh khung giờ ngủ động
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
    // Ví dụ ngủ từ 22h tối đến 8h sáng hôm sau
    if (hour >= sleepStart || hour < sleepEnd) {
      if (hour >= sleepStart) {
        date.setDate(date.getDate() + 1);
      }
      date.setHours(sleepEnd, 0, 0, 0);
    }
  } else {
    // Ví dụ ngủ từ 0h sáng đến 6h sáng cùng ngày
    if (hour >= sleepStart && hour < sleepEnd) {
      date.setHours(sleepEnd, 0, 0, 0);
    }
  }
  
  return date;
}

/**
 * Lập lịch thông báo cho các từ vựng cần học tự động theo mục tiêu ngày
 * @param enabled Bật hay tắt nhắc nhở
 * @param personality Cá tính nhắc nhở ('gentle' | 'supportive' | 'roast')
 * @param sleepStart Giờ bắt đầu ngủ
 * @param sleepEnd Giờ thức dậy
 * @param dailyTarget Mục tiêu số từ học mỗi ngày
 */
export async function scheduleVocabularyReminders(
  enabled: boolean,
  personality: "gentle" | "supportive" | "roast" = "supportive",
  sleepStart: number = 22,
  sleepEnd: number = 8,
  dailyTarget: number = 5
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

    // 4. Lấy danh sách từ vựng cần học (tải bản ghi lớn hơn để sàng lọc thông minh)
    let vocabItems: VocabularyItem[] = [];
    try {
      // Tải tối đa 40 từ cần ôn tập
      const res = await fetchVocabularies({ due: true, page_size: 40 }, token);
      vocabItems = res.items || [];
      
      // Nếu không đủ từ cần ôn tập, lấy thêm từ bình thường
      if (vocabItems.length < 15) {
        const resAll = await fetchVocabularies({ page_size: 40 }, token);
        const allItems = resAll.items || [];
        // Gộp và loại trùng
        const existingIds = new Set(vocabItems.map(item => item.id));
        for (const item of allItems) {
          if (!existingIds.has(item.id)) {
            vocabItems.push(item);
          }
        }
      }
    } catch (e) {
      console.warn("Lỗi khi tải từ vựng để lập lịch thông báo:", e);
      return;
    }

    if (vocabItems.length === 0) {
      console.log("Không có từ vựng nào để lập lịch nhắc nhở");
      return;
    }

    // Sắp xếp thông minh: Ưu tiên từ có hộp thấp nhất (chưa thuộc) -> tiếp theo là thời gian hẹn ôn gần nhất
    vocabItems.sort((a, b) => {
      if (a.box_number !== b.box_number) {
        return a.box_number - b.box_number; // Hộp 1, 2 lên đầu
      }
      const timeA = new Date(a.next_review_at || 0).getTime();
      const timeB = new Date(b.next_review_at || 0).getTime();
      return timeA - timeB;
    });

    // 5. Tính toán khoảng cách thông báo tối ưu dựa theo giờ thức giấc và mục tiêu học
    let wakeHours = 16; // Mặc định thức 16 tiếng
    if (sleepStart !== sleepEnd) {
      if (sleepStart > sleepEnd) {
        wakeHours = 24 - (sleepStart - sleepEnd);
      } else {
        wakeHours = 24 - (sleepEnd - sleepStart);
      }
    }
    // Tính giãn cách = giờ thức / mục tiêu ngày, giới hạn từ 1h đến 12h
    const finalInterval = Math.max(1, Math.min(12, wakeHours / Math.max(1, dailyTarget)));

    // 6. Thiết lập danh mục & kênh nếu chưa làm
    await registerNotificationCategory();
    const isChannelCreated = await setupNotificationChannel();

    // 7. Lập lịch cho tối đa 15 thông báo
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

    console.log(`Đã lập lịch thành công ${scheduledCount} thông báo từ vựng (khoảng cách tự động ${finalInterval.toFixed(1)}h, giờ ngủ ${sleepStart}h - ${sleepEnd}h, mục tiêu ${dailyTarget} từ/ngày)`);
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

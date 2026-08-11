# CUHP Mobile - Ứng dụng Học Tiếng Anh (Expo)

Đây là ứng dụng di động trong hệ thống CUHP, được xây dựng bằng **React Native (Expo)** để giúp người dùng học từ vựng, ôn tập bằng thuật toán Leitner (SRS) và luyện nghe mọi lúc mọi nơi.

---

## 🚀 Công Nghệ Sử Dụng

* **Core:** React Native (0.86) & React (19)
* **Framework:** Expo SDK 57 (Sử dụng Expo Go để chạy thử nghiệm)
* **Ngôn ngữ:** TypeScript
* **Styling:** Nativewind v5 (TailwindCSS v4) + CSS Interop
* **Navigation:** React Navigation (Native Stack, Bottom Tabs)
* **Icons:** Lucide React Native
* **Text-to-Speech:** Expo Speech (Phát âm giọng đọc bản xứ)

---

## 🛠️ Cấu Trúc Thư Mục `src/`

```text
src/
├── api/             # Cấu hình API client kết nối với Backend
│   └── client.ts    # Hàm fetch, các endpoint đăng nhập, từ vựng, review
├── context/         # Quản lý State toàn cục của ứng dụng (AuthContext)
├── navigation/      # Cấu hình định tuyến (AppNavigator - Stack và Bottom Tabs)
├── screens/         # Các màn hình chính của ứng dụng
│   ├── LoginScreen.tsx       # Màn hình đăng nhập
│   ├── VocabularyScreen.tsx  # Danh sách sổ từ vựng cá nhân
│   ├── ReviewScreen.tsx      # Chế độ ôn tập Leitner (Flashcards / Gõ chính tả)
│   └── ListeningScreen.tsx   # Luyện nghe từ vựng/bài tập
└── types/           # Định nghĩa kiểu dữ liệu TypeScript (User, VocabularyItem,...)
```

---

## 🎯 Các Tính Năng Chính

1. **Đăng nhập & Xác thực:** Đăng nhập bằng tài khoản đồng bộ từ hệ thống. Lưu trữ token bảo mật để tự động đăng nhập những lần sau.
2. **Sổ Từ Vựng Cá Nhân:**
   * Hiển thị danh sách từ vựng mà người dùng đang theo học.
   * Phân loại từ theo nhãn: Danh từ, động từ, tính từ, trạng từ,...
   * Đồng bộ tiến độ học từ API Backend.
3. **Ôn Tập Thông Minh (Leitner SRS):**
   * **Thẻ Ghi Nhớ (Flashcards):** Xem từ vựng tiếng Anh, chạm để lật mặt sau xem nghĩa tiếng Việt và ví dụ minh họa.
   * **Gõ Chính Tả (Spelling):** Nghe phát âm tiếng Anh từ hệ thống (sử dụng TTS) và gõ lại từ vựng tương ứng. Hệ thống tự động kiểm tra đáp án.
   * **Đồng bộ SRS:** Kết quả ôn tập (đúng/sai) được gửi về Backend để tự động tính toán chu kỳ lặp lại (Leitner Interval), cập nhật tiến trình ôn tập và số ngày học liên tục (Streak).
4. **Luyện Nghe (Listening):** Hỗ trợ các bài nghe kiểm tra kỹ năng nghe hiểu và phát âm từ vựng.

---

## 🔧 Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### 1. Yêu cầu hệ thống
* Đã cài đặt **Node.js** (Khuyên dùng v20+).
* Đã cài đặt ứng dụng **Expo Go** trên thiết bị Android hoặc iOS.
* Đã bật chế độ gỡ lỗi USB (USB Debugging) trên điện thoại Android (nếu test trên máy thật).

### 2. Cài đặt các thư viện phụ thuộc
Di chuyển vào thư mục `mobile` và chạy lệnh cài đặt:
```bash
npm install
```
> **Lưu ý:** Dự án sử dụng `patch-package` để sửa một số lỗi mapping CSS tương thích Nativewind v5 của thư viện `react-native-css`. Bản vá này nằm ở `patches/` và sẽ tự động được áp dụng sau khi chạy lệnh `npm install`.

### 3. Kết nối với Backend cục bộ
Nếu bạn đang chạy Backend ở máy tính (`localhost:8000`) và muốn test ứng dụng qua thiết bị Android thật hoặc trình giả lập, bạn cần ánh xạ cổng kết nối thông qua **ADB**:
```bash
# Ánh xạ cổng API Backend
adb reverse tcp:8000 tcp:8000

# Ánh xạ cổng Metro Bundler (nếu kết nối USB)
adb reverse tcp:8081 tcp:8081
```

### 4. Khởi chạy ứng dụng
Chạy lệnh sau để khởi động Metro Bundler:
```bash
# Khởi động không kèm dev tools để tăng tốc độ chạy cục bộ
EXPO_NO_DEV_TOOLS=1 npx expo start -c --localhost
```
* Quét mã QR hiển thị ở terminal bằng ứng dụng **Expo Go** (Android) hoặc Camera (iOS) để bắt đầu trải nghiệm ứng dụng.

---

## 🩹 Thông Tin Bản Vá (`patches/`)

Trong quá trình phát triển, thư viện `react-native-css` (phiên bản `3.0.7`) có một lỗi tại hàm mapping style CSS sang prop của React Native. Thuộc tính `textAlign` (từ class `text-center`) và `backgroundColor` dạng boolean `true` bị crash do hàm gọi `.split(".")` trực tiếp trên kiểu dữ liệu boolean.

Bản vá lỗi đã được đóng gói và lưu tại:
* [react-native-css+3.0.7.patch](file:///home/aipowervn/Desktop/Cuhp/mobile/patches/react-native-css+3.0.7.patch)

Bản vá này tự động sửa đổi các tệp:
* `node_modules/react-native-css/src/native/styles/index.ts`
* `node_modules/react-native-css/dist/module/native/styles/index.js`
* `node_modules/react-native-css/dist/commonjs/native/styles/index.js`

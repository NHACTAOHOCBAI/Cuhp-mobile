# 📱 Ứng Dụng Di Động Cuhp (Mobile App)

Ứng dụng di động của **Cuhp** được xây dựng trên nền tảng **React Native** kết hợp với **Expo SDK 57** và **TypeScript**. Ứng dụng cung cấp giao diện hiện đại, tối ưu hóa trải nghiệm trên màn hình nhỏ và đồng bộ hoàn hảo với toàn bộ dữ liệu, API của phiên bản Web hiện tại.

---

## ✨ Các Tính Năng Chính

### 1. 🏠 Trang Chủ & Tiến Trình (Dashboard)
*   **Streak & Mục tiêu ngày**: Đếm chuỗi ngày học liên tục và hiển thị tỷ lệ hoàn thành mục tiêu học tập hàng ngày dưới dạng vòng tròn tiến độ động (SVG).
*   **Biểu đồ đóng góp tuần**: Hiển thị mức độ hoạt động học tập hàng ngày trong tuần qua.
*   **Lối tắt nhanh**: Điều hướng trực tiếp đến các phần chính (Học tiếng Anh, Todo, Tập Gym).

### 2. 🇬🇧 Trung Tâm Học Tiếng Anh (English Hub)
Gom nhóm toàn bộ các tính năng học tiếng Anh vào một tab lớn duy nhất tương tự phiên bản Web:
*   **Sổ từ vựng (Vocabulary)**:
    *   Quản lý danh sách từ vựng cá nhân (Thêm, Sửa, Xóa).
    *   **Tra cứu nhanh từ điển**: Nhập từ tiếng Anh và nhấn "Tra từ" để tự động điền phát âm, dịch nghĩa và phân loại từ từ API.
    *   Hỗ trợ phát âm từ vựng bằng giọng đọc máy (Expo Speech) dựa trên accent thiết lập.
*   **Ôn tập Flashcards**: Ôn tập các từ vựng đã lưu theo phương pháp Lặp lại ngắt quãng (Leitner System) với giao diện thẻ lật mượt mà.
*   **Đọc song ngữ (Reading)**:
    *   Xem danh sách bài đọc phân loại theo cấp độ (Dễ, Trung bình, Khó) với màu sắc trực quan.
    *   **Chạm vào từ để tra nghĩa**: Tách từ tự động trong bài đọc, chạm để hiển thị popup dịch nghĩa và cho phép lưu trực tiếp vào Sổ từ vựng cá nhân.
    *   Thảo luận và lưu bản dịch cá nhân (Luyện dịch câu).
*   **Nghe & Shadowing (Listening)**:
    *   Trình phát Audio Player tích hợp (`expo-av`) kèm thanh progress scrubber tự vẽ, hỗ trợ tua nhanh bằng cách chạm thanh tiến trình.
    *   Điều chỉnh tốc độ phát âm thanh (0.75x, 1x, 1.25x, 1.5x).
    *   **Shadow Dictation**: Nghe chép chính tả và so khớp đúng/sai trực quan.

### 3. 📅 Quản Lý Công Việc (Todo Tasks)
*   **Lịch trình (Planner)**: Calendar strip chọn ngày trong tuần giúp lên kế hoạch làm việc từng ngày rõ ràng.
*   **Hộp việc (Inbox)**: Nơi thu thập nhanh các công việc phát sinh chưa kịp lên lịch.
*   **Ma trận Eisenhower (Matrix)**: Phân loại công việc khoa học theo 4 nhóm ưu tiên: *Làm ngay (Do), Lên lịch (Schedule), Ủy quyền (Delegate), Loại bỏ (Eliminate)*.

### 4. 🏋️ Hỗ Trợ Tập Gym (Gym Planner)
*   **Lịch tập**: Theo dõi danh sách bài tập của ngày, số Sets x Reps, cân nặng tạ (kg) và checkbox hoàn thành.
*   **Sao chép lịch tập (Copy Day Forward)**: Sao chép toàn bộ lịch tập của ngày hiện tại sang các tuần tiếp theo một cách nhanh chóng.
*   **Quản lý nhóm cơ**: CRUD các nhóm cơ chính kèm nhãn màu sắc phân biệt.
*   **Thống kê nâng cao**: Biểu đồ cột SVG hiển thị tổng Volume tập luyện 7 ngày qua và lịch sử tiến trình nâng tạ tối đa (Max Weight) theo từng bài tập.

---

## 🛠️ Công Nghệ Sử Dụng

*   **Framework**: React Native & Expo (SDK 57)
*   **Ngôn ngữ**: TypeScript (đảm bảo type-safe 100%)
*   **Styling**: NativeWind (Tailwind CSS cho React Native)
*   **Navigation**: Expo Router / React Navigation (Bottom Tab Bar 5 tabs kết hợp Native Stack)
*   **Thư viện đa phương tiện**: `expo-av` (Phát âm thanh), `expo-speech` (Phát âm giọng đọc), `react-native-svg` (Vẽ biểu đồ và vòng tiến trình).

---

## 📂 Cấu Trúc Thư Mục

```bash
mobile/
├── src/
│   ├── api/
│   │   └── client.ts          # API Client kết nối Backend (Authentication, CRUD)
│   ├── components/            # Các component dùng chung (Card, Badge, Button, Input...)
│   ├── context/               # Quản lý State toàn cục (AuthContext, SettingsContext)
│   ├── navigation/
│   │   └── AppNavigator.tsx   # Cấu hình định tuyến Bottom Tab Bar và Stack Screens
│   ├── screens/               # Màn hình chính của ứng dụng
│   │   ├── DashboardScreen.tsx
│   │   ├── EnglishHubScreen.tsx
│   │   ├── VocabularyScreen.tsx
│   │   ├── ReadingDetailScreen.tsx
│   │   ├── ListeningDetailScreen.tsx
│   │   ├── TodoScreen.tsx
│   │   └── GymScreen.tsx
│   ├── theme/                 # Định nghĩa bảng màu và style nền tảng
│   ├── types/
│   │   └── index.ts           # Định nghĩa các TypeScript interfaces
│   └── utils/                 # Các hàm tiện ích (vocabulary helpers, date format...)
├── app.json                   # Cấu hình Expo App (tên, slug, plugins, SDK version)
├── package.json               # Danh sách dependencies & kịch bản chạy
└── tsconfig.json              # Cấu hình TypeScript compiler
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### Bước 1: Cài đặt Dependencies
Trong thư mục `mobile`, chạy lệnh sau để tải các gói thư viện cần thiết:
```bash
npm install
```

### Bước 2: Chạy Metro Bundler
Để khởi động máy chủ đóng gói mã nguồn JavaScript, chạy lệnh sau:
```bash
npm run start
# hoặc
npx expo start
```
*Mẹo: Nếu bạn vừa cài đặt thư viện native mới hoặc cập nhật code cấu hình, hãy khởi động lại bằng tùy chọn xóa cache:*
```bash
npx expo start -c
```

### Bước 3: Xem trên Thiết bị Di động
*   Tải ứng dụng **Expo Go** trên Google Play Store (Android) or Apple App Store (iOS).
*   Đảm bảo máy tính và điện thoại của bạn đang kết nối chung một mạng Wi-Fi.
*   Dùng camera điện thoại hoặc app Expo Go để quét mã **QR Code** hiển thị trên terminal máy tính.

---

## 🔍 Khắc Phục Lỗi Thường Gặp (Troubleshooting)

### 1. Lỗi `Cannot find native module 'ExponentAV'`
Lỗi này xảy ra khi Expo Go trên điện thoại của bạn chưa nhận dạng được module âm thanh native mới được cài đặt.
*   **Giải pháp 1: Xóa cache Expo Go trên điện thoại**:
    *   **Android**: Vào *Cài đặt -> Ứng dụng -> Expo Go -> Lưu trữ -> Xóa bộ nhớ đệm (Clear Cache) & Xóa dữ liệu (Clear Data)*.
    *   **iOS/Android**: Gỡ cài đặt ứng dụng Expo Go trên điện thoại và cài đặt lại bản mới nhất từ Store.
*   **Giải pháp 2: Xóa cache Metro**: Chạy lệnh `npx expo start -c` rồi quét lại mã QR mới.

### 2. Lỗi Kiểm Tra Kiểu TypeScript (Type Check)
Đảm bảo mã nguồn không chứa lỗi biên dịch bằng cách chạy lệnh sau trước khi build hoặc deploy:
```bash
npx tsc --noEmit
```

### 3. Đổi sang Development Build khi Expo Go không hỗ trợ Native Module
Nếu bạn cần build bản cài đặt riêng biệt bỏ qua Expo Go:
```bash
# Đối với thiết bị Android
npx expo run:android

# Đối với thiết bị iOS (yêu cầu macOS)
npx expo run:ios
```

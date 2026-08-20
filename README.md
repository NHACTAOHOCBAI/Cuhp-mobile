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

### Bước 3: Xem trên Thiết bị Di động (Expo Go)
* **Kết nối chung mạng Wi-Fi**:
  * Tải ứng dụng **Expo Go** trên Google Play Store (Android) hoặc Apple App Store (iOS).
  * Đảm bảo điện thoại và máy tính chạy Metro Bundler đang kết nối **chung một mạng Wi-Fi**.
  * Mở ứng dụng Expo Go trên điện thoại, chọn **Scan QR Code** và quét mã QR hiển thị ở terminal máy tính của bạn để mở app nhanh.
* **Kết nối qua cáp USB / Máy ảo Android (Sử dụng ADB)**:
  * Nếu bạn đang phát triển trên giả lập Android hoặc kết nối điện thoại qua cáp USB (đã bật USB Debugging), hãy chạy tuần tự các lệnh sau trong terminal:
    ```bash
    # Chuyển tiếp cổng kết nối Metro Bundler
    adb reverse tcp:8081 tcp:8081

    # Khởi động Metro Bundler
    npx expo start
    ```
    *(Sau đó bạn có thể mở ứng dụng trên điện thoại/máy ảo để kết nối trực tiếp đến máy chủ Metro tại localhost:8081).*

*Lưu ý: Vì Expo Go là môi trường ảo dựng sẵn, một số chức năng can thiệp hệ thống sâu như chạy nền âm thanh (Background Playback) có thể bị giới hạn hoặc ngắt kết nối sau vài phút do hệ điều hành Android thu hồi tài nguyên. Để trải nghiệm ứng dụng hoàn thiện nhất, bạn nên build ra file APK standalone (theo hướng dẫn bên dưới).*

---

## 📦 Hướng Dẫn Build App Cài Đặt Standalone (Android APK)

Ứng dụng đã được cấu hình sẵn dịch vụ **EAS Build (Expo Application Services)** với hồ sơ build `preview` để tạo ra file `.apk` cài đặt trực tiếp.

### Bước 1: Chuẩn bị tài khoản Expo
* Truy cập [expo.dev](https://expo.dev) để đăng ký một tài khoản Expo miễn phí (nếu chưa có).

### Bước 2: Cài đặt & Đăng nhập EAS CLI
Mở một terminal mới trong thư mục `mobile` và chạy lệnh đăng nhập:
```bash
npx eas-cli login
```
*(Nhập tài khoản và mật khẩu Expo của bạn để liên kết dự án).*

### Bước 3: Chạy lệnh build file APK
Gửi yêu cầu đóng gói ứng dụng lên máy chủ cloud của Expo bằng lệnh:
```bash
npx eas-cli build --platform android --profile preview
```
*   Hệ thống sẽ hỏi bạn có muốn cấu hình tự động (như tạo Keystore chữ ký số cho app...) hay không $\rightarrow$ Chọn **Yes/Đồng ý** cho tất cả các câu hỏi.
*   Máy chủ Expo sẽ tự động đóng gói dự án của bạn thành file `.apk` độc lập (quá trình này mất khoảng 5-10 phút).

### Bước 4: Tải file APK và cài đặt
* Sau khi quá trình build hoàn thành, terminal sẽ xuất ra một **đường dẫn tải file `.apk` trực tiếp** và một **mã QR**.
* Bạn chỉ cần quét mã QR bằng điện thoại để tải trực tiếp file APK về máy và cài đặt để kiểm thử các tính năng chạy nền như ứng dụng phát nhạc chuyên nghiệp.

---

## 🔍 Khắc Phục Lỗi Thường Gặp (Troubleshooting)

### 1. Lỗi `Cannot find native module 'ExponentAV'` hoặc 'ExpoAudio'
Lỗi này xảy ra khi Expo Go trên điện thoại của bạn chưa nhận dạng được module native mới cài đặt.
* **Giải pháp 1: Xóa bộ nhớ đệm ứng dụng**:
  * **Android**: Vào *Cài đặt -> Ứng dụng -> Expo Go -> Lưu trữ -> Xóa bộ nhớ đệm (Clear Cache) & Xóa dữ liệu (Clear Data)*.
  * **iOS**: Gỡ cài đặt ứng dụng Expo Go trên điện thoại và cài đặt lại từ App Store.
* **Giải pháp 2: Khởi động lại Metro Bundler xóa cache**: Chạy lệnh `npx expo start -c`.

### 2. Kiểm tra lỗi kiểu TypeScript
Đảm bảo mã nguồn không có bất kỳ lỗi biên dịch nào trước khi build:
```bash
npx tsc --noEmit
```

### 3. Tự build native nội bộ (Development Client)
Nếu bạn muốn build client chạy nội bộ để debug native trên thiết bị thật:
```bash
# Thiết bị Android
npx expo run:android

# Thiết bị iOS (yêu cầu máy macOS)
npx expo run:ios
```

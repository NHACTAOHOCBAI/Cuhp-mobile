import { useEffect, useState } from 'react';

/**
 * Trả về giá trị đã được debounce: chỉ cập nhật sau khi `value` không đổi
 * trong khoảng thời gian `delay` (ms). Phù hợp cho các ô input tìm kiếm
 * nhằm tránh gọi API / lọc danh sách liên tục trên mỗi keystroke.
 *
 * @param value  Giá trị cần debounce (thường là state của TextInput).
 * @param delay  Thời gian chờ tính bằng mili-giây. Mặc định 300ms.
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

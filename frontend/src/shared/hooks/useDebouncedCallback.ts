import { useCallback, useEffect, useRef } from "react"

/**
 * Trả về 1 hàm "debounced": mỗi lần gọi sẽ huỷ lịch chạy `callback` đang chờ
 * (nếu có) và đặt lịch chạy mới sau `delayMs`. `callback` CHỈ thực sự chạy
 * khi không có lần gọi nào khác xảy ra trong `delayMs` liên tiếp - giống cơ
 * chế debounce ô tìm kiếm (gõ liên tục không search ngay, chỉ search khi
 * người dùng đã dừng gõ).
 *
 * Dùng cho các sự kiện dồn dập (kéo thả nhiều lần liên tiếp...) mà chỉ cần
 * xử lý 1 LẦN DUY NHẤT sau khi người dùng thật sự dừng thao tác.
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delayMs: number
): (...args: Args) => void {
  const callbackRef = useRef(callback)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Luôn trỏ tới `callback` mới nhất mà KHÔNG làm đổi reference của hàm
  // debounced trả về bên dưới - nhờ vậy nơi gọi không cần liệt kê `callback`
  // (thường là 1 hàm được tạo lại mỗi render) vào dependency array.
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  // Huỷ timer đang chờ khi component unmount, tránh gọi callback "mồ côi".
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return useCallback(
    (...args: Args) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delayMs)
    },
    [delayMs]
  )
}

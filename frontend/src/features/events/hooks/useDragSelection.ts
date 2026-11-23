import { useCallback, useEffect, useRef } from 'react'

type DragMode = 'add' | 'remove'

/** Bỏ qua sự kiện chuột giả mà trình duyệt bắn ngay sau một cú chạm */
const SYNTHETIC_MOUSE_WINDOW_MS = 500
/** Ngưỡng (px) để quyết định cú vuốt là kéo chọn (ngang) hay cuộn trang (dọc) */
const GESTURE_THRESHOLD_PX = 6

interface UseDragSelectionOptions<T> {
  value: readonly T[]
  onChange: (next: T[]) => void
  /** Thuộc tính `data-*` trên từng ô để tìm ô dưới ngón tay khi vuốt */
  dataAttribute: string
  parseKey: (raw: string) => T
  isSelectable?: (key: T) => boolean
}

/**
 * Kéo để chọn/bỏ chọn nhiều ô liên tiếp. Chế độ (thêm hay bỏ) chốt theo ô đầu tiên.
 * Trên cảm ứng: chạm = bật/tắt 1 ô, vuốt ngang = kéo chọn, vuốt dọc = cuộn trang như bình thường.
 */
export function useDragSelection<T>({
  value,
  onChange,
  dataAttribute,
  parseKey,
  isSelectable = () => true,
}: UseDragSelectionOptions<T>) {
  const valueRef = useRef(value)
  const modeRef = useRef<DragMode | null>(null)
  const visitedRef = useRef(new Set<T>())
  const touchStartRef = useRef<{ x: number; y: number; key: T } | null>(null)
  const gestureRef = useRef<'horizontal' | 'vertical' | null>(null)
  const lastTouchRef = useRef(0)
  const optionsRef = useRef({ onChange, isSelectable, parseKey, dataAttribute })

  useEffect(() => {
    valueRef.current = value
    optionsRef.current = { onChange, isSelectable, parseKey, dataAttribute }
  })

  const apply = useCallback((key: T, mode: DragMode) => {
    const current = valueRef.current
    const has = current.includes(key)
    if (mode === 'add' && !has) valueRef.current = [...current, key]
    else if (mode === 'remove' && has) valueRef.current = current.filter((item) => item !== key)
    else return
    optionsRef.current.onChange([...valueRef.current])
  }, [])

  const begin = useCallback(
    (key: T) => {
      const mode: DragMode = valueRef.current.includes(key) ? 'remove' : 'add'
      modeRef.current = mode
      visitedRef.current = new Set([key])
      apply(key, mode)
    },
    [apply],
  )

  const extend = useCallback(
    (key: T) => {
      const mode = modeRef.current
      if (!mode || visitedRef.current.has(key) || !optionsRef.current.isSelectable(key)) return
      visitedRef.current.add(key)
      apply(key, mode)
    },
    [apply],
  )

  useEffect(() => {
    const endMouse = () => {
      modeRef.current = null
    }
    const endTouch = () => {
      const start = touchStartRef.current
      if (start && gestureRef.current === null) {
        apply(start.key, valueRef.current.includes(start.key) ? 'remove' : 'add')
      }
      touchStartRef.current = null
      gestureRef.current = null
      modeRef.current = null
    }
    window.addEventListener('mouseup', endMouse)
    window.addEventListener('touchend', endTouch)
    window.addEventListener('touchcancel', endTouch)
    return () => {
      window.removeEventListener('mouseup', endMouse)
      window.removeEventListener('touchend', endTouch)
      window.removeEventListener('touchcancel', endTouch)
    }
  }, [apply])

  const isSyntheticMouse = () => Date.now() - lastTouchRef.current < SYNTHETIC_MOUSE_WINDOW_MS

  const onItemMouseDown = useCallback(
    (key: T) => {
      if (isSyntheticMouse() || !optionsRef.current.isSelectable(key)) return
      begin(key)
    },
    [begin],
  )

  const onItemMouseEnter = useCallback(
    (key: T) => {
      if (!isSyntheticMouse()) extend(key)
    },
    [extend],
  )

  const onItemTouchStart = useCallback((key: T, event: React.TouchEvent) => {
    const touch = event.touches[0]
    if (!touch || !optionsRef.current.isSelectable(key)) return
    lastTouchRef.current = Date.now()
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, key }
    gestureRef.current = null
  }, [])

  const onContainerTouchMove = useCallback(
    (event: React.TouchEvent) => {
      const start = touchStartRef.current
      const touch = event.touches[0]
      if (!start || !touch) return

      if (gestureRef.current === null) {
        const dx = Math.abs(touch.clientX - start.x)
        const dy = Math.abs(touch.clientY - start.y)
        if (dx <= GESTURE_THRESHOLD_PX && dy <= GESTURE_THRESHOLD_PX) return
        gestureRef.current = dx > dy * 1.2 ? 'horizontal' : 'vertical'
        if (gestureRef.current === 'horizontal') begin(start.key)
      }
      if (gestureRef.current !== 'horizontal') return

      if (event.cancelable) event.preventDefault()
      const { dataAttribute: attribute, parseKey: parse } = optionsRef.current
      const raw = document
        .elementFromPoint(touch.clientX, touch.clientY)
        ?.closest(`[${attribute}]`)
        ?.getAttribute(attribute)
      if (raw) extend(parse(raw))
    },
    [begin, extend],
  )

  return { onItemMouseDown, onItemMouseEnter, onItemTouchStart, onContainerTouchMove }
}

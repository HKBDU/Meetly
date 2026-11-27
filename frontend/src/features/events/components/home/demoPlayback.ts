import { useEffect, useState, useSyncExternalStore, type RefObject } from 'react'

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/** Người dùng tắt chuyển động trong hệ điều hành thì demo đứng yên ở khung cuối */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  )
}

function subscribeVisibility(onChange: () => void) {
  document.addEventListener('visibilitychange', onChange)
  return () => document.removeEventListener('visibilitychange', onChange)
}

/**
 * Demo chỉ chạy khi đang nằm trong màn hình và tab đang mở, để không tốn CPU (và không "chạy mất"
 * đoạn đầu khi người dùng chưa cuộn tới).
 */
export function useDemoPlaying(ref: RefObject<HTMLElement | null>): boolean {
  const [inView, setInView] = useState(false)
  const pageVisible = useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState === 'visible',
    () => true,
  )

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.35 })
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])

  return inView && pageVisible
}

/**
 * Chạy lần lượt các khung của một kịch bản, mỗi khung dài `durations[i]` ms, hết thì quay lại từ đầu.
 * Tạm dừng khi `playing` là false; `jump` để người dùng tự chọn khung (VD bấm vào một tính năng).
 */
export function useFrameLoop(durations: readonly number[], playing: boolean) {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    if (!playing) return
    const timer = window.setTimeout(() => setFrame((current) => (current + 1) % durations.length), durations[frame])
    return () => window.clearTimeout(timer)
  }, [frame, playing, durations])

  return [frame, setFrame] as const
}

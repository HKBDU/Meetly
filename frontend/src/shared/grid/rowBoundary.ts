/** Viền trên của hàng: đậm ở giờ tròn, nét đứt ở nửa giờ */
export function rowBoundaryClass(startTime: string): string {
  const minute = startTime.slice(3, 5)
  if (minute === '00') return 'border-t border-solid border-t-grid-line'
  if (minute === '30') return 'border-t border-dashed border-t-grid-line-soft'
  return ''
}

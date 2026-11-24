/** Chỉ khai báo phần Chrome API mà popup dùng (không kéo cả @types/chrome) */
declare namespace chrome {
  namespace storage {
    interface StorageArea {
      get(keys: string | string[]): Promise<Record<string, unknown>>
      set(items: Record<string, unknown>): Promise<void>
    }
    const local: StorageArea
  }
  namespace tabs {
    function create(properties: { url: string }): Promise<unknown>
  }
}

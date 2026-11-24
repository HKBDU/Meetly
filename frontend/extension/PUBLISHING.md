# Phát hành Meetly Extension

Hướng dẫn đưa extension lên **Chrome Web Store** (và tuỳ chọn **Microsoft Edge Add-ons**) để mọi người cài bằng một cú bấm.

Code nằm ở `frontend/extension/`, dùng chung giao diện và logic trong `frontend/src/`. Build bằng `frontend/vite.extension.config.ts`.

---

## 0. Trước khi bắt đầu

- [ ] Web và backend production đã chạy code mới nhất (đã merge vào `main`). Nút **"Mở"** trong extension cần web có phần đọc phiên từ extension (`src/shared/lib/handoff.ts`).
- [ ] Trang `/privacy` đã có mục nói về extension (xem [mục 3](#3-chính-sách-quyền-riêng-tư)).
- [ ] Đã thử extension bản build production ít nhất một lượt (tạo sự kiện, chép link, mở trên web, tab "Sự kiện của tôi").

---

## 1. Build bản production

Extension đọc biến môi trường theo thứ tự: `.env` → `.env.extension` → `.env.extension.local` (file sau ghi đè file trước).

1. Kiểm tra extension sẽ trỏ đúng backend và web thật. Nếu `frontend/.env` đang là URL local, tạo `frontend/.env.extension.local` (đã được gitignore):

   ```env
   VITE_API_BASE_URL=https://meetly-du3b.onrender.com
   VITE_SIGNALR_HUB_URL=https://meetly-du3b.onrender.com/hubs/events
   VITE_APP_URL=https://meetly-soon.vercel.app
   ```

2. Tăng phiên bản ở `frontend/vite.extension.config.ts`:

   ```ts
   const version = '0.1.0' // mỗi lần gửi bản mới lên store phải lớn hơn bản trước
   ```

3. Build:

   ```bash
   cd frontend
   npm run build:extension
   ```

4. Kiểm tra `dist-extension/manifest.json`:
   - `version` đúng số vừa đặt.
   - `host_permissions` là domain backend **production**, không phải `localhost`.

5. Nén **nội dung bên trong** thư mục `dist-extension` (không nén cả thư mục cha):

   ```powershell
   # Windows (PowerShell), chạy trong thư mục frontend
   Compress-Archive -Path dist-extension\* -DestinationPath meetly-extension-v0.1.0.zip -Force
   ```

   ```bash
   # macOS / Linux
   cd dist-extension && zip -r ../meetly-extension-v0.1.0.zip . && cd ..
   ```

   Mở thử file zip: phải thấy `manifest.json` nằm ngay ở gốc, cạnh `popup.html`, `assets/`, `icons/`.

6. Cài thử bản vừa build: `chrome://extensions` → bật **Developer mode** → **Load unpacked** → chọn `dist-extension`. Chạy lại checklist ở mục 0.

> File `.zip` và `dist-extension/` không commit lên Git.

---

## 2. Đăng ký tài khoản nhà phát triển

1. Vào <https://chrome.google.com/webstore/devconsole> và đăng nhập bằng tài khoản Google sẽ quản lý extension lâu dài (nên dùng tài khoản chung của dự án, không phải tài khoản cá nhân).
2. Đồng ý điều khoản và trả **phí đăng ký 5 USD (một lần)**.
3. Xác minh email liên hệ. Email này hiển thị công khai trên trang extension.

---

## 3. Chính sách quyền riêng tư

Chrome Web Store bắt buộc có link chính sách quyền riêng tư: dùng `https://meetly-soon.vercel.app/privacy`.

Thêm vào `src/features/legal/content.ts` một mục cho extension (cả bản `en` và `vi`), rồi cập nhật `LAST_UPDATED`. Nội dung cần nói rõ:

- Extension lưu **trên máy người dùng** (`chrome.storage.local`): tên người tổ chức, danh sách sự kiện đã tạo, mã đăng nhập và **mật khẩu người tổ chức do extension tự tạo** cho từng sự kiện.
- Dữ liệu sự kiện được gửi tới máy chủ Meetly giống như khi dùng trang web.
- Extension **không** đọc nội dung các trang web bạn mở, **không** theo dõi lịch sử duyệt web và **không** dùng Google Analytics.
- Gỡ extension sẽ xoá toàn bộ dữ liệu nó lưu trên máy.

---

## 4. Tạo trang extension trên store

Trong Developer Dashboard: **New item** → tải file `.zip` lên.

### 4.1 Store listing

| Mục | Nội dung |
|---|---|
| Tên | Meetly – Quick group scheduling |
| Ngôn ngữ mặc định | English (thêm bản Tiếng Việt ở mục *Localization*) |
| Danh mục | Productivity |
| Icon | `extension/public/icons/128.png` |
| Ảnh chụp màn hình | 1–5 ảnh, đúng kích thước **1280×800** hoặc **640×400** |
| Ảnh quảng bá nhỏ (tuỳ chọn) | 440×280 |
| Website | https://meetly-soon.vercel.app |
| Email hỗ trợ | meetlysooner.admin@gmail.com |

**Mô tả ngắn** (tối đa 132 ký tự):

> Create a group scheduling poll in seconds, copy the link and find the time that works for everyone.

> *(VI)* Tạo lịch hẹn nhóm trong vài giây, chép link gửi mọi người và tìm thời gian ai cũng rảnh.

**Mô tả chi tiết** (bản tiếng Anh):

```text
Meetly helps your group find a time to meet, without the back-and-forth.

With the Meetly extension you can start a scheduling poll right from your browser toolbar:
• Name your event, pick dates or weekly days, choose the hours
• The invite link is copied automatically, ready to paste into any chat
• Everyone marks when they are free on meetly-soon.vercel.app, no sign-up needed
• Keep track of every event you created: who has responded and whether the time is finalized
• Open any event as the host in one click

Meetly is free and works in English and Vietnamese.
```

**Mô tả chi tiết** (bản tiếng Việt):

```text
Meetly giúp cả nhóm tìm được thời gian gặp nhau mà không phải nhắn qua nhắn lại.

Với Meetly Extension, bạn tạo lịch hẹn ngay trên thanh trình duyệt:
• Đặt tên sự kiện, chọn ngày cụ thể hoặc các thứ trong tuần, chọn khung giờ
• Link mời được chép sẵn, chỉ việc dán vào nhóm chat
• Mọi người tự đánh dấu lúc rảnh trên meetly-soon.vercel.app, không cần đăng ký
• Theo dõi mọi sự kiện đã tạo: bao nhiêu người đã điền lịch, đã chốt giờ hay chưa
• Mở sự kiện ở vai trò người tổ chức chỉ với một cú bấm

Meetly miễn phí, có tiếng Việt và tiếng Anh.
```

**Ảnh chụp nên có:**
1. Popup tab *Tạo nhanh* với một sự kiện đang điền dở.
2. Màn hình "Đã chép link" sau khi tạo.
3. Tab *Sự kiện của tôi* với vài sự kiện (có cái đã chốt).
4. Trang bản đồ nhiệt trên web khi đã có nhiều người điền lịch.

Popup chỉ rộng 360px, nên đặt ảnh popup lên một nền 1280×800 (màu thương hiệu hoặc ảnh chụp trang web làm nền) rồi xuất ra đúng kích thước.

### 4.2 Privacy practices

**Single purpose:**

> Create Meetly group scheduling polls from the browser toolbar and keep track of the polls the user created.

**Giải thích quyền:**

| Quyền | Lý do (dán nguyên văn) |
|---|---|
| `storage` | Stores the host's display name and the list of events created with the extension (including the generated host password for each event) on the user's device, so they can reopen and manage those events later. |
| Host permission `https://meetly-du3b.onrender.com/*` | Calls the Meetly API to create events and read their status (number of responses, finalized or not). No other sites are accessed. |

**Remote code:** chọn **No, I am not using remote code**. Toàn bộ JavaScript nằm trong gói, không tải script từ ngoài.

**Data usage**, tick các mục sau:
- *Personally identifiable information*: tên hiển thị người dùng nhập.
- *Authentication information*: mật khẩu người tổ chức do extension tạo và mã đăng nhập.
- *User activity*: **không** tick.
- *Website content*: **không** tick.

Và xác nhận cả 3 cam kết: không bán dữ liệu cho bên thứ ba, không dùng cho mục đích ngoài chức năng chính, không dùng để đánh giá tín dụng.

**Privacy policy URL:** `https://meetly-soon.vercel.app/privacy`

### 4.3 Distribution

- **Visibility:** *Public*. Có thể chọn *Unlisted* trước, chỉ ai có link mới cài được, để thử với nhóm nhỏ.
- **Regions:** tất cả.

Bấm **Submit for review**.

---

## 5. Chờ duyệt

- Thường mất **vài ngày đến khoảng 1 tuần**. Extension xin ít quyền như Meetly thường được duyệt nhanh.
- Nếu bị từ chối, email sẽ ghi lý do kèm mã vi phạm. Các lỗi hay gặp:
  - Mô tả quyền không khớp với cách dùng thật.
  - Thiếu hoặc sai link chính sách quyền riêng tư.
  - Ảnh chụp sai kích thước.

Sửa theo yêu cầu, tăng `version`, build và nén lại, rồi gửi duyệt lại.

---

## 6. Sau khi được duyệt

1. Lấy link trang extension dạng `https://chromewebstore.google.com/detail/<tên>/<id>`.
2. Trên trang chủ, đổi thông báo "Sắp ra mắt" và phần giới thiệu Meetly Extension thành nút **"Thêm vào Chrome"** trỏ tới link này (`src/features/events/pages/HomePage.tsx`).
3. Kiểm tra lại toàn bộ luồng từ bản cài trên store (không phải bản Load unpacked).

---

## 7. Phát hành bản cập nhật

1. Tăng `version` trong `vite.extension.config.ts` (VD `0.1.0` → `0.1.1`).
2. Build và nén lại như [mục 1](#1-build-bản-production).
3. Developer Dashboard → chọn Meetly → **Package** → **Upload new package** → **Submit for review**.
4. Sau khi được duyệt, Chrome tự cập nhật cho người dùng trong vài giờ.

Nếu bản mới **xin thêm quyền** (VD `notifications`, `alarms`, `contextMenus` ở giai đoạn 2), Chrome sẽ tạm tắt extension cho đến khi người dùng đồng ý quyền mới. Hãy cập nhật lại phần giải thích quyền (mục 4.2) và chính sách quyền riêng tư.

---

## 8. Microsoft Edge Add-ons (tuỳ chọn, miễn phí)

1. Vào <https://partner.microsoft.com/dashboard/microsoftedge> và đăng ký (không mất phí).
2. **Create new extension** → tải đúng file `.zip` đã dùng cho Chrome.
3. Điền mô tả, ảnh chụp, chính sách quyền riêng tư tương tự mục 4, rồi gửi duyệt (thường 1–7 ngày).

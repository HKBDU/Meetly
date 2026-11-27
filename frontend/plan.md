# Kế hoạch phần việc của Khuyên: link cuộc họp

Ngày rà soát: 27/11/2026. Nhánh: `feat/google-meet`.

## 1. Phạm vi và quyết định áp dụng

Đọc [đề xuất ban đầu](../Meetly%20-%20%C4%90%E1%BB%81%20xu%E1%BA%A5t%20t%C3%ADch%20h%E1%BB%A3p%20Google%20Meet%20%26%20Google%20Calendar.md), [phân công FE](../Meetly%20-%20Update%20context%20%26%20assign%20FE%20task.md), rồi [quyết định chốt ngày 27/11](../google-calendar.md). Nội dung tài liệu sau thay thế phần trùng hoặc mâu thuẫn của tài liệu trước.

Khuyên làm **frontend cho link cuộc họp**: admin có thể gắn link khi chốt lịch hoặc thêm/sửa/xoá link sau đó; người mở được event thấy và mở được link. Theo yêu cầu giao diện mới nhất, admin có nút thêm/sửa link; cả hai mở cùng một dialog tối giản với ô URL (icon Paste nằm bên phải bên trong ô), Xác nhận và Huỷ. Chỉ trạng thái thêm hiện câu hướng dẫn “Thêm vào đây link một cuộc họp online đã tạo sẵn để các thành viên có thể tự vào khi đến giờ hẹn”. Dialog sửa điền sẵn link cũ; xoá nội dung rồi xác nhận để xoá link. Người tham gia thấy một dòng `Meeting room: <link>` khi event có link. Ô link chấp nhận mọi URL `https` hợp lệ, gồm Meet, Zoom và Teams. Không có nút `meet.new` trong dialog, không gọi Google Calendar `events.insert`, không xin `calendar.events` hoặc `meetings.space.created`, không tự tạo phòng bằng API. Các phần API được hoãn tới khi có domain riêng và xác minh Google.

Phân công này **không gồm** sửa backend, triển khai tính năng nhập giờ bận của Uyên, làm lại tiện ích thêm vào lịch của Dương, hay thao tác cấu hình Google Cloud. Thay đổi BE ở mục 3 chỉ là điều kiện tích hợp FE.

## 2. Đối chiếu code hiện tại: đã có, không làm lại

| Nội dung | Bằng chứng trong code | Kết luận |
| --- | --- | --- |
| Hạ tầng OAuth dùng chung | `src/lib/google.ts` đã nạp GIS khi cần, xin token theo scope, giữ token trong bộ nhớ; `src/lib/env.ts`, `src/vite-env.d.ts`, `.env.example` đã có `VITE_GOOGLE_CLIENT_ID`; `tests/google-auth.test.mjs` kiểm tra lỗi, cache và cấp quyền. | Phần Khuyên được giao trước đây **đã làm**. Giữ nguyên; không mở rộng để tạo Meet. |
| Nhập giờ bận | `src/features/participants/googleFreeBusy.ts`, `hooks/useGoogleBusyImport.ts`, `pages/MySchedulePage.tsx`, `components/ScheduleActionsBar.tsx` và `tests/google-freebusy.test.mjs` đã nối `calendar.freebusy` với bản nháp. | Thuộc việc của Uyên và đã có trong FE; không đưa vào các bước triển khai của Khuyên. |
| Thêm vào lịch | `src/shared/lib/calendar.ts` tạo Google Calendar URL; `src/shared/components/AddToCalendarActions.tsx` đã có nút Google Calendar và tải `.ics`. `meetingUrl` hiện chỉ là tham số tùy chọn, chưa nhận dữ liệu từ event. | Tái sử dụng, chỉ nối `event.meetingUrl`; không viết lại URL builder hoặc sinh `.ics` ở FE. |
| Privacy về quyền Google | `src/features/legal/content.ts` bản vi/en chỉ mô tả `calendar.freebusy`, không còn `calendar.events`. | Yêu cầu **bỏ `calendar.events` đã xong**. Chỉ bổ sung thông tin về link cuộc họp nếu cần theo mục 4.5. |
| Lịch, email, múi giờ backend | `backend/src/Meetly.Service/Calendar/CalendarInvite.cs` đã dựng `.ics`/Google Calendar URL; email chốt lịch đã có nút Google Calendar và `invite.ics`; `Events.TimeZone` đã lấy múi giờ người tạo. | Không làm lại trong kế hoạch FE. |

**Chưa có:** `meetingUrl` thực trong `EventDetail`, API FE, database/DTO/API BE, email/`.ics` BE hoặc `MeetingUrlUpdated`. `src/features/events/components/home/GoogleFlowDemo.tsx` và copy vi/en vẫn mô phỏng Meetly tự tạo link. `src/features/events/pages/HomePage.tsx` và `src/shared/layouts/AppFooter.tsx` vẫn đánh dấu Meet là sắp ra mắt.

## 3. Điều kiện tích hợp do backend cung cấp, không giao Khuyên thực hiện

Trước khi nghiệm thu FE với server thật, đối chiếu BE với [mục 5 của quyết định mới nhất](../google-calendar.md):

- `GET /api/v1/events/{shortCode}` trả `meetingUrl: string | null` **ở cấp event**; không đặt vào `finalSchedule`.
- `POST /api/v1/events/{shortCode}/finalize` nhận `meetingUrl?` và response trả `meetingUrl` cùng cấp với `finalSchedule` và `revision`.
- `PUT /api/v1/events/{shortCode}/meeting-url` chỉ admin được dùng, nhận `{ "meetingUrl": string | null }`, cho phép thêm/sửa/xoá khi event Open hoặc Finalized, trả `{ meetingUrl, revision }`.
- URL được trim; rỗng thành `null`; chỉ nhận URL tuyệt đối `https`, không có khoảng trắng, tối đa 500 ký tự, không giới hạn host. URL sai trả 422 và không ghi dữ liệu.
- SignalR `EventFinalized` chứa `meetingUrl`; sự kiện mới `MeetingUrlUpdated` chứa `shortCode`, `meetingUrl`, `revision`. BE đưa link vào email chốt lịch, `.ics` và Google Calendar URL; đổi link sau khi chốt không gửi lại email.

Hiện [entity](../backend/src/Meetly.Repository/Entity/Events.cs), [request/response](../backend/src/Meetly.Service/Events/Request.cs), [controller](../backend/src/Meetly.API/Controllers/EventsController.cs) và [notifier](../backend/src/Meetly.API/Realtime/EventRealtimeNotifier.cs) chưa có contract này. Khuyên có thể dựng FE trên fixture đúng contract, sau đó kiểm tra lại khi BE merge. Không coi UI hoàn tất chỉ vì mock chạy.

## 4. Các bước Khuyên cần thực hiện

### 4.1. Model và API FE

1. Trong `src/shared/types/index.ts`, thêm `meetingUrl: string | null` vào `EventDetail`; giữ `FinalSchedule` chỉ gồm ngày/thứ và giờ.
2. Trong `src/shared/api/events.ts`, thêm `meetingUrl: string | null` vào `FinalizeResult` và thêm `updateMeetingUrl(shortCode, meetingUrl)` dùng endpoint PUT. `finalizeEvent` tiếp tục gửi lịch đã chọn; link đã được lưu riêng qua PUT trước khi chốt, nên không cần thêm ô link vào dialog chốt. Dùng `eventEndpoint` và `unwrap` hiện có để giữ mã event, token và thông báo lỗi nhất quán.
3. Khi response PUT/finalize thành công, cập nhật cache qua `patchEventCache` nếu response revision không cũ hơn cache. Không sửa cache trước khi server xác nhận; khi 422/401/403 giữ giá trị đang lưu và để dialog mở cho người dùng sửa.

**Tiêu chí:** dữ liệu link chỉ có một nguồn `event.meetingUrl`; client không đưa nó vào `FinalSchedule` hoặc `EditableEvent`. Link lưu trước khi chốt vẫn còn sau finalize; finalize không cần link vẫn chốt được.

### 4.2. Trường nhập và dialog thêm/sửa link

1. Tạo một trường nhập tái sử dụng cho hai nơi: `src/features/heatmap/components/MeetingLinkField.tsx`. Nó nhận giá trị và callback; icon **Paste** nằm bên phải **bên trong ô nhập**, có nút icon với nhãn truy cập được. Bấm icon mới gọi `navigator.clipboard.readText()` và điền kết quả vào ô. Nếu clipboard không khả dụng/bị từ chối, báo ngắn gọn và vẫn cho nhập tay. Không tự đọc clipboard khi mở dialog.
2. Tách kiểm tra đầu vào thuần sang `src/features/heatmap/meetingLink.ts`: trim; rỗng → `null`; từ chối quá 500 ký tự, khoảng trắng bên trong, URL không tuyệt đối hoặc khác `https`. FE báo lỗi ở trường nhập; BE vẫn là nguồn xác thực cuối cùng. Cho phép Meet, Zoom, Teams và URL HTTPS khác.
3. Tạo `src/features/heatmap/components/MeetingLinkDialog.tsx` cho cả thêm và sửa: dialog có tiêu đề cần cho truy cập, câu hướng dẫn chỉ ở trạng thái thêm, một ô URL, nút Xác nhận và Huỷ. Khi sửa, ô điền sẵn `event.meetingUrl`; khi thêm, ô trống. Giữ bản nháp nếu PUT lỗi; khoá xác nhận khi đang lưu; Huỷ không lưu gì. Xoá trắng rồi xác nhận gửi `null` để xoá link. Giữ `FinalizeDialog.tsx` như hiện tại, không thêm trường nào vào hộp chốt lịch.
4. Nối callback lưu link qua `src/features/heatmap/types.ts` → `pages/HeatmapPage.tsx` → `src/features/participants/pages/OverviewPage.tsx`. Điều kiện hiển thị nút thêm/sửa dựa vào `isAdmin` bất kể event Open hay Finalized. Sau khi lưu thành công, patch cache theo response revision.

**Tiêu chí:** chỉ admin thấy nút thêm/sửa; dialog có ô URL, icon Paste bên trong, Xác nhận và Huỷ; trạng thái thêm có câu hướng dẫn; PUT lưu link trước hoặc sau khi chốt mà không cần quyền Google.

### 4.3. Hiển thị, thêm/sửa/xoá link

1. Tạo dòng link chung ở `src/features/heatmap/components/MeetingRoomLine.tsx`: với người tham gia không phải admin, hiện `Meeting room: <link>` khi có link; URL là thẻ `<a>` mở tab mới an toàn. Khi không có link không hiện dòng trống. Nhãn này trung tính vì URL có thể là Zoom/Teams.
2. Trên trang event, admin có nút **Thêm link cuộc họp** (`Add Meeting Link` ở giao diện tiếng Anh) khi chưa có link và **Sửa link cuộc họp** (`Edit Meeting Link` ở giao diện tiếng Anh) khi đã có, ở cả Open và Finalized. Bố cục bên phải của `EventHeader.tsx`: hàng 1 My Schedule, hàng 2 Invite và nút link cuộc họp, hàng 3 `Event code: [mã sự kiện + icon Copy]`; nút mã hiển thị mã sự kiện và sao chép link đầy đủ của event. Hai trạng thái link dùng **cùng một dialog**, có ô URL với icon Paste, nút Xác nhận và nút Huỷ; trạng thái thêm hiện câu hướng dẫn phía trên ô nhập. Khi sửa, ô được điền sẵn link hiện tại; xoá trắng rồi xác nhận sẽ gọi `updateMeetingUrl(..., null)`. Không thêm nút tạo phòng, nút xoá hay các trường khác trong dialog. Chọn quyền bằng `isAdmin`, **không dùng `canEdit`** của `HeatmapPage` vì biến này chỉ đúng khi event Open.
3. Khi có link hợp lệ, admin thấy `Meeting room: [nút copy URL]` ngay dưới dòng số người tham gia và múi giờ trong `EventHeader.tsx`; nút URL rộng gấp đôi nút mã sự kiện. Người tham gia ở trang lịch cá nhân thấy `Meeting room: [link mở phòng]` ngay trên Select range trong `ScheduleActionsBar.tsx`; link rộng bằng Select range + Clear all tính cả khoảng cách giữa hai nút. URL dài chỉ chạy `react-fast-marquee` khi tràn, dừng khi hover/click và tôn trọng giảm chuyển động. Khi chưa có link, không hiện dòng này. Trang tổng quan của người tham gia và `FinalizedSchedulePopover.tsx` vẫn dùng link mở phòng. Form sửa chỉ có một vị trí trên trang tổng quan.
4. Trong `src/shared/components/AddToCalendarActions.tsx`, lấy link trực tiếp từ `event.meetingUrl` và truyền vào `buildGoogleCalendarUrl`; bỏ prop `meetingUrl` rời nếu không còn caller khác. Không sửa logic tải `.ics` qua BE. Khi xoá link, Google Calendar URL mới không chứa link; file `.ics` mới sẽ do BE dựng.

**Tiêu chí:** admin thêm/sửa/xoá link ở hai trạng thái event; dialog thêm có câu hướng dẫn, dialog sửa điền sẵn link cũ; người tham gia thấy đúng một dòng `Meeting room: <link>` ở khu vực thông tin chính; không có link thì UI và URL lịch không còn link cũ; link HTTPS ngoài Google Meet vẫn dùng được.

### 4.4. Realtime và đồng bộ cache

1. Trong `src/shared/hooks/useEventRealtime.ts`, thêm `meetingUrl` vào `EventFinalizedPayload`, định nghĩa `MeetingUrlUpdatedPayload`, đăng ký/huỷ listener `MeetingUrlUpdated`. Dùng quy tắc `shortCode` + revision đang có trước khi patch `event.meetingUrl`.
2. Với payload revision bằng/cũ hơn cache, bỏ qua. Khi thấy bước nhảy revision làm client có thể lỡ một payload riêng cho link, invalidate `eventQueryKey(shortCode)` để GET trả trạng thái đầy đủ; thao tác sửa link cục bộ cũng patch theo revision của response.
3. Không tạo state link độc lập trong popover, header hoặc dialog ngoài bản nháp đang sửa; các component đọc từ `useEventQuery` qua event hiện tại.

**Tiêu chí:** hai tab cùng event cập nhật link không cần reload; payload event khác/cũ không ghi đè; nếu mất một sự kiện realtime, GET khôi phục link đúng.

### 4.5. Nội dung và i18n

1. Trong `src/shared/i18n/vi.ts` và `en.ts`, thêm nhóm key cho dòng `Meeting room`, icon Paste, thêm/sửa link, xác nhận/huỷ và lỗi. Giữ copy của nút admin theo yêu cầu; dòng thông tin người tham gia dùng nhãn trung tính.
2. Trong `src/features/events/components/home/GoogleFlowDemo.tsx` và `googleScenes.ts`, thay cảnh “Meetly tự tạo link/đang tạo link” bằng các bước “admin dán link → cả nhóm tham gia”; cập nhật `home.gPoint2` và các key liên quan ở hai ngôn ngữ. Chỉ đổi trạng thái ra mắt của Meet trong `HomePage.tsx` và `src/shared/layouts/AppFooter.tsx` khi luồng hoạt động trên backend triển khai thật.
3. `src/features/legal/content.ts` đã bỏ `calendar.events`; không làm lại mục quyền Google. Bổ sung vào phần mô tả dữ liệu event và ai xem được event rằng link cuộc họp tùy chọn được lưu và hiện cho người có link/mã event, ở cả vi/en; kiểm tra không viết rằng Meetly tự tạo Meet hoặc đọc thêm dữ liệu Google.

**Tiêu chí:** thông điệp sản phẩm phản ánh luồng thủ công, scope Google duy nhất vẫn là `calendar.freebusy`, mọi nhãn mới có đủ vi/en.

## 5. Kiểm thử thuộc phạm vi Khuyên

Thêm test FE theo bộ `node:test` + Vite SSR đang dùng; mở rộng test hiện có nơi phù hợp, không tạo lại test OAuth/freeBusy:

| Nhóm | Trường hợp cần kiểm tra | File gợi ý |
| --- | --- | --- |
| Input | `null`/rỗng/khoảng trắng → `null`; trim URL; chấp nhận Meet, Zoom và HTTPS khác; từ chối `http`, `javascript:`, URL tương đối, khoảng trắng bên trong, >500 ký tự. | `tests/meeting-link.test.mjs` cho hàm thuần ở `meetingLink.ts` |
| API | `updateMeetingUrl` gửi PUT với URL hoặc `null`; đúng shortCode đã encode, Bearer token, response `meetingUrl`/revision; finalize vẫn gửi lịch đã chọn và nhận `meetingUrl` trong response; lỗi API không trả thành công giả. | Mở rộng `tests/heatmap-http.test.mjs` |
| Lịch và hiển thị | `AddToCalendarActions`/URL Google Calendar dùng `event.meetingUrl`; sau xoá không còn link; participant thấy dòng `Meeting room: <link>`; admin thấy nút thêm/sửa ở trạng thái Open và Finalized, participant không thấy; dialog thêm có câu hướng dẫn, dialog sửa điền sẵn URL; xoá trắng rồi xác nhận gửi `null`; Paste đưa clipboard vào ô. | Mở rộng test calendar/UI hiện có hoặc `tests/meeting-link.test.mjs` |
| Realtime | `EventFinalized` và `MeetingUrlUpdated` patch đúng cache; revision cũ, trùng hoặc sai shortCode bị bỏ; revision bị nhảy gây refetch. | Mở rộng `tests/participant-grid.test.mjs` hoặc test helper đồng bộ cache nếu được tách ra |
| Nội dung | Test smoke đảm bảo trang chủ vi/en không còn mô tả tự tạo Meet và privacy không nhắc `calendar.events`. | Mở rộng `tests/pages-smoke.test.mjs` |

Kiểm tra thủ công trên backend đã triển khai: clipboard được cấp/từ chối; icon Paste nằm trong ô nhập; dialog thêm có câu hướng dẫn và dialog sửa điền sẵn URL; link Meet và Zoom; admin chốt có/không có link; admin sửa/xoá bằng cách xoá trắng ô ở cả Open và Finalized; participant thấy dòng link; hai tab realtime; mở Google Calendar và tải `.ics` sau khi sửa/xoá. Email đã gửi không thay đổi khi sửa link về sau — đây là hành vi backend đã chốt, UI không được hứa khác.

## 6. Điều kiện hoàn thành

- Chỉ các file FE thuộc mục 4 và test FE tương ứng được Khuyên triển khai; không sửa BE để “mở khoá” PR FE.
- FE build, lint và test xanh: `npm run build`, `npm run lint`, `npm test` tại `frontend/`.
- Đối chiếu tích hợp với BE thật: GET, finalize, PUT và hai payload SignalR đúng contract; trạng thái link nhất quán sau reload, sửa/xoá và khi có hai tab.
- Không có lời gọi `calendar.events`/Meet REST API, không xin scope mới, không lưu Google token cho luồng link cuộc họp.

## 7. Trạng thái triển khai FE

- Đã làm: model/API `meetingUrl`, dialog shadcn thêm/sửa với icon Paste và hướng dẫn ở trạng thái thêm, kiểm tra URL, nút thêm/sửa link cuộc họp cạnh Invite, nút mã hiển thị code nhưng sao chép link đầy đủ, dòng Meeting room dưới thông tin người tham gia/múi giờ ở admin và trên Select range ở lịch cá nhân, marquee cho URL tràn, nối link vào Google Calendar URL, cập nhật SignalR/cache, nội dung trang chủ và privacy, test FE cho URL/API/hiển thị/quyền admin. `FinalizeDialog` giữ nguyên theo yêu cầu UI mới.
- Đã kiểm tra: TypeScript, ESLint và toàn bộ 66 test FE đạt. Build production với `--outDir dist-meeting-final` đạt; lệnh build mặc định vẫn có thể gặp `EPERM` khi xoá `dist/assets` có sẵn. Bước dựng trang tĩnh nay dùng cache Vite riêng để không tranh chấp cache của dev server.
- Còn phụ thuộc BE: mục 3 chưa có trong code backend hiện tại. Chỉ có thể nghiệm thu PUT/GET/realtime với server thật sau khi BE merge và deploy.

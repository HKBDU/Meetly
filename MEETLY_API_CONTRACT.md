# API CONTRACT - MEETLY

## 0. Quy ước chung

### Base URL

```text
/api/v1
```

### Event Type

```text
1 = Dates
2 = Weekdays
```

### Event Status

```text
1 = Open
2 = Finalized
3 = Closed
```

### DayOfWeek

Thống nhất theo `System.DayOfWeek` của .NET:

```text
0 = Sunday
1 = Monday
2 = Tuesday
3 = Wednesday
4 = Thursday
5 = Friday
6 = Saturday
```

### Authentication

Các API cần xác thực sử dụng:

```http
Authorization: Bearer {accessToken}
```

`accessToken` là token theo phạm vi Event, chứa tối thiểu:

```json
{
  "participantId": "uuid",
  "eventId": "uuid",
  "shortCode": "A1B2C3",
  "isAdmin": false
}
```

MVP **không sử dụng Refresh Token**.

### Response Format

Response thành công:

```json
{
  "isSuccess": true,
  "code": 200,
  "message": "Success",
  "value": {}
}
```

Response thất bại:

```json
{
  "isSuccess": false,
  "code": 400,
  "message": "Nội dung lỗi",
  "value": null
}
```

### Revision

Mỗi Event có `Revision BIGINT`. Revision tăng khi state ảnh hưởng đến Event thay đổi:

```text
Participant cập nhật availability
Admin chỉnh sửa Event
Admin finalize Event
```

Ví dụ:

```text
Revision 10
    ↓ Huy cập nhật lịch
Revision 11
    ↓ Admin sửa event
Revision 12
    ↓ Admin finalize
Revision 13
```

Revision được trả về cho FE và gửi kèm SignalR event.

---

# 1. Tạo sự kiện

## POST `/api/v1/events`

### Mô tả

Tạo Event mới đồng thời tạo `EventParticipant` đầu tiên với `IsAdmin = true`. Admin nhận `accessToken` ngay sau khi tạo Event.

### Request - EventType = Dates

```json
{
  "title": "Họp nhóm SWD",
  "eventType": 1,
  "availableDates": [
    "2026-09-10",
    "2026-09-11",
    "2026-09-12"
  ],
  "availableWeekdays": [],
  "dailyStartTime": "08:00",
  "dailyEndTime": "17:00",
  "admin": {
    "username": "Huy",
    "password": "123"
  }
}
```

`password` có thể là `null` hoặc chuỗi rỗng.

### Request - EventType = Weekdays

```json
{
  "title": "Weekly Meeting",
  "eventType": 2,
  "availableDates": [],
  "availableWeekdays": [1, 2, 4],
  "dailyStartTime": "08:00",
  "dailyEndTime": "17:00",
  "admin": {
    "username": "Huy",
    "password": null
  }
}
```

### Response - `201 Created`

```json
{
  "isSuccess": true,
  "code": 201,
  "message": "Tạo sự kiện thành công",
  "value": {
    "shortCode": "A1B2C3",
    "url": "https://meetly.com/A1B2C3",
    "participantId": "8fd2f02a-0cdc-4abc-a222-9bc3771a02fc",
    "isAdmin": true,
    "accessToken": "eyJhbGciOi...",
    "expiresAt": "2026-09-11T15:00:00+07:00",
    "status": 1,
    "revision": 0
  }
}
```

---

# 2. Load Event và Heatmap tổng

## GET `/api/v1/events/{shortCode}`

### Authentication

Không bắt buộc.

### Mô tả

Được gọi khi truy cập trang Event để lấy:

- Thông tin Event
- Các ngày/thứ được cấu hình
- Trạng thái Event
- Danh sách Participant
- Heatmap tổng
- Lịch đã finalize nếu có

API này **không trả lịch chi tiết của từng Participant**.

### Response

```json
{
  "isSuccess": true,
  "code": 200,
  "message": "Tải sự kiện thành công",
  "value": {
    "title": "Họp nhóm SWD",
    "shortCode": "A1B2C3",
    "url": "https://meetly.com/A1B2C3",
    "eventType": 1,
    "timezone": "Asia/Ho_Chi_Minh",
    "availableDates": [
      "2026-09-10",
      "2026-09-11",
      "2026-09-12"
    ],
    "availableWeekdays": [],
    "dailyStartTime": "08:00",
    "dailyEndTime": "17:00",
    "status": 1,
    "revision": 12,
    "participants": [
      { "username": "Huy" },
      { "username": "Uyên" },
      { "username": "Bảo" }
    ],
    "heatmapGrid": [
      {
        "specificDate": "2026-09-10",
        "dayOfWeek": null,
        "startTime": "08:00",
        "participants": ["Huy", "Uyên", "Bảo"],
        "count": 3
      },
      {
        "specificDate": "2026-09-10",
        "dayOfWeek": null,
        "startTime": "08:30",
        "participants": ["Uyên", "Bảo"],
        "count": 2
      }
    ],
    "finalSchedule": null
  }
}
```

Nếu Event đã Finalized:

```json
{
  "status": 2,
  "finalSchedule": {
    "specificDate": "2026-09-10",
    "dayOfWeek": null,
    "startTime": "08:00",
    "endTime": "09:00"
  }
}
```

---

# 3. Truy cập / tham gia Event

## POST `/api/v1/events/{shortCode}/participants/access`

### Mô tả

API dùng khi Participant nhập Username và Password (Optional).

Nếu username chưa tồn tại, BE tạo `EventParticipant` mới với `IsAdmin = false` và cấp `accessToken`.

Nếu username đã tồn tại, BE xác thực password nếu có, trả lại lịch cá nhân hiện tại và cấp `accessToken`.

### Request

```json
{
  "username": "Huy",
  "password": "123"
}
```

Hoặc:

```json
{
  "username": "Huy",
  "password": null
}
```

### Response

```json
{
  "isSuccess": true,
  "code": 200,
  "message": "Truy cập sự kiện thành công",
  "value": {
    "participantId": "8fd2f02a-0cdc-4abc-a222-9bc3771a02fc",
    "username": "Huy",
    "isAdmin": false,
    "isNewParticipant": false,
    "accessToken": "eyJhbGciOi...",
    "expiresAt": "2026-09-11T15:00:00+07:00",
    "eventStatus": 1,
    "revision": 12,
    "timeSlots": [
      {
        "specificDate": "2026-09-10",
        "dayOfWeek": null,
        "startTime": "08:00",
        "endTime": "10:00"
      },
      {
        "specificDate": "2026-09-11",
        "dayOfWeek": null,
        "startTime": "13:00",
        "endTime": "15:00"
      }
    ]
  }
}
```

Nếu User mới:

```json
{
  "isNewParticipant": true,
  "timeSlots": []
}
```

---

# 4. Load dữ liệu Participant hiện tại

## GET `/api/v1/events/{shortCode}/participants/me`

### Authentication

Required.

### Mô tả

Dùng khi FE đã có `accessToken`. Ví dụ user reload browser thì không cần nhập Username/Password lại.

### Response

```json
{
  "isSuccess": true,
  "code": 200,
  "message": "Tải lịch cá nhân thành công",
  "value": {
    "participantId": "8fd2f02a-0cdc-4abc-a222-9bc3771a02fc",
    "username": "Huy",
    "isAdmin": false,
    "timeSlots": [
      {
        "specificDate": "2026-09-10",
        "dayOfWeek": null,
        "startTime": "08:00",
        "endTime": "10:00"
      }
    ],
    "eventStatus": 1,
    "revision": 12
  }
}
```

---

# 5. Lưu / cập nhật lịch cá nhân

## PUT `/api/v1/events/{shortCode}/participants/me/availability`

### Authentication

Required.

### Mô tả

Thay thế toàn bộ lịch rảnh hiện tại của Participant bằng `timeSlots` mới.

FE luôn gửi **Free Time**. BE không cần biết người dùng đang thao tác bằng FREE Mode, BUSY Mode, Manual Input hay Drag Select.

### Request - Dates

```json
{
  "email": "user@example.com",
  "timeSlots": [
    {
      "specificDate": "2026-09-10",
      "dayOfWeek": null,
      "startTime": "08:00",
      "endTime": "10:00"
    },
    {
      "specificDate": "2026-09-11",
      "dayOfWeek": null,
      "startTime": "13:00",
      "endTime": "15:00"
    }
  ]
}
```

### Request - Weekdays

```json
{
  "email": null,
  "timeSlots": [
    {
      "specificDate": null,
      "dayOfWeek": 1,
      "startTime": "08:00",
      "endTime": "10:00"
    },
    {
      "specificDate": null,
      "dayOfWeek": 3,
      "startTime": "14:00",
      "endTime": "16:00"
    }
  ]
}
```

Nếu `email != null`, BE insert vào `EventEmails`. Nếu `(EventId, Email)` đã tồn tại thì không insert duplicate.

### BE Validate

```text
Event.Status == Open
StartTime < EndTime
TimeSlot nằm trong DailyStartTime → DailyEndTime
SpecificDate thuộc EventAvailableDates
hoặc DayOfWeek thuộc EventAvailableDates
```

### Response

```json
{
  "isSuccess": true,
  "code": 200,
  "message": "Cập nhật lịch rảnh thành công",
  "value": {
    "revision": 13
  }
}
```

Sau khi transaction thành công:

```text
Revision++
→ SignalR HeatmapUpdated
```

---

# 6. Gợi ý khung giờ phù hợp

## GET `/api/v1/events/{shortCode}/suggestions`

### Authentication

Admin Required.

### Query Params

```text
keyParticipant
minDuration
```

Có thể truyền chỉ `minDuration`, chỉ `keyParticipant`, hoặc cả hai.

### Ví dụ

```http
GET /api/v1/events/A1B2C3/suggestions?minDuration=120
GET /api/v1/events/A1B2C3/suggestions?keyParticipant=Huy
GET /api/v1/events/A1B2C3/suggestions?keyParticipant=Huy&minDuration=120
```

### Response

```json
{
  "isSuccess": true,
  "code": 200,
  "message": "Tìm khung giờ phù hợp thành công",
  "value": {
    "suggestedSlots": [
      {
        "specificDate": "2026-09-10",
        "dayOfWeek": null,
        "startTime": "08:00",
        "endTime": "10:00",
        "participantCount": 7,
        "totalParticipants": 8
      },
      {
        "specificDate": "2026-09-11",
        "dayOfWeek": null,
        "startTime": "14:00",
        "endTime": "16:30",
        "participantCount": 8,
        "totalParticipants": 8
      }
    ]
  }
}
```

FE dùng `suggestedSlots` để vẽ khung highlight trên Heatmap.

---

# 7. Chỉnh sửa Event

## PUT `/api/v1/events/{shortCode}`

### Authentication

Admin Required.

Không truyền `adminUsername` hoặc `adminPassword` trong Request Body. BE xác định Admin thông qua Bearer Token.

### Request - Dates

```json
{
  "title": "Họp nhóm SWD - Updated",
  "eventType": 1,
  "availableDates": [
    "2026-09-15",
    "2026-09-16"
  ],
  "availableWeekdays": [],
  "dailyStartTime": "09:00",
  "dailyEndTime": "18:00"
}
```

### Request - Weekdays

```json
{
  "title": "Weekly Meeting",
  "eventType": 2,
  "availableDates": [],
  "availableWeekdays": [1, 3, 5],
  "dailyStartTime": "09:00",
  "dailyEndTime": "17:00"
}
```

### BE xử lý khi thay đổi ngày hoặc giờ

Nếu Admin xóa ngày, BE xóa `EventAvailableDates` tương ứng và các `TimeSlots` thuộc ngày đó.

Nếu Admin thu hẹp thời gian, các TimeSlot vượt biên sẽ được truncate nếu vẫn còn phần hợp lệ; nếu hoàn toàn nằm ngoài range mới thì xóa.

Tất cả xử lý trong cùng Transaction.

### Response

```json
{
  "isSuccess": true,
  "code": 200,
  "message": "Cập nhật sự kiện thành công",
  "value": {
    "revision": 14
  }
}
```

Sau khi transaction thành công:

```text
Revision++
→ SignalR EventUpdated
```

---

# 8. Chốt lịch họp

## POST `/api/v1/events/{shortCode}/finalize`

### Authentication

Admin Required.

### Điều kiện

```text
Event.Status == Open
```

### Request - Dates Event

```json
{
  "specificDate": "2026-09-10",
  "dayOfWeek": null,
  "startTime": "08:00",
  "endTime": "09:00"
}
```

### Request - Weekdays Event

```json
{
  "specificDate": null,
  "dayOfWeek": 1,
  "startTime": "08:00",
  "endTime": "09:00"
}
```

### BE Validate

```text
Requester.IsAdmin == true
Event.Status == Open
SpecificDate / DayOfWeek thuộc EventAvailableDates
StartTime < EndTime
Khoảng thời gian nằm trong DailyStartTime → DailyEndTime
```

### BE xử lý

```text
Validate Admin
       ↓
Validate final slot
       ↓
Events.FinalDate / FinalDayOfWeek
       ↓
Events.FinalStartTime / FinalEndTime
       ↓
Status = Finalized
       ↓
Revision++
       ↓
Commit Transaction
       ↓
Gửi email
       ↓
SignalR EventFinalized
```

### Response

```json
{
  "isSuccess": true,
  "code": 200,
  "message": "Chốt lịch thành công",
  "value": {
    "status": 2,
    "finalSchedule": {
      "specificDate": "2026-09-10",
      "dayOfWeek": null,
      "startTime": "08:00",
      "endTime": "09:00"
    },
    "revision": 15
  }
}
```

---

# 9. SignalR liên quan đến API

## Hub

```text
/hubs/events
```

FE connect bằng `accessToken`.

## HeatmapUpdated

### Trigger

```text
PUT /events/{shortCode}/participants/me/availability
```

### Payload

```json
{
  "shortCode": "A1B2C3",
  "revision": 13,
  "heatmapGrid": [
    {
      "specificDate": "2026-09-10",
      "dayOfWeek": null,
      "startTime": "08:00",
      "participants": ["Huy", "Uyên", "Bảo"],
      "count": 3
    }
  ]
}
```

## EventUpdated

### Trigger

```text
PUT /events/{shortCode}
```

### Payload

```json
{
  "shortCode": "A1B2C3",
  "title": "Họp nhóm SWD - Updated",
  "eventType": 1,
  "availableDates": [
    "2026-09-15",
    "2026-09-16"
  ],
  "availableWeekdays": [],
  "dailyStartTime": "09:00",
  "dailyEndTime": "18:00",
  "revision": 14
}
```

## EventFinalized

### Trigger

```text
POST /events/{shortCode}/finalize
```

### Payload

```json
{
  "shortCode": "A1B2C3",
  "status": 2,
  "finalSchedule": {
    "specificDate": "2026-09-10",
    "dayOfWeek": null,
    "startTime": "08:00",
    "endTime": "09:00"
  },
  "revision": 15
}
```

---

# 10. Tổng hợp API

| Method | Endpoint | Auth | Chức năng |
|---|---|---|---|
| POST | `/api/v1/events` | No | Tạo Event + tạo Admin |
| GET | `/api/v1/events/{shortCode}` | No | Load Event + Heatmap |
| POST | `/api/v1/events/{shortCode}/participants/access` | No | Join/Login + lấy token |
| GET | `/api/v1/events/{shortCode}/participants/me` | User | Load lịch cá nhân |
| PUT | `/api/v1/events/{shortCode}/participants/me/availability` | User | Lưu/cập nhật lịch rảnh |
| GET | `/api/v1/events/{shortCode}/suggestions` | Admin | Gợi ý khung giờ |
| PUT | `/api/v1/events/{shortCode}` | Admin | Chỉnh sửa Event |
| POST | `/api/v1/events/{shortCode}/finalize` | Admin | Chốt lịch họp |

---

# 11. HTTP Status Codes

## `400 Bad Request`

Request không hợp lệ, ví dụ:

```text
StartTime >= EndTime
EventType không hợp lệ
Ngày không thuộc Event
```

## `401 Unauthorized`

```text
AccessToken thiếu
AccessToken hết hạn
Password không đúng
```

## `403 Forbidden`

Đã đăng nhập nhưng không có quyền, ví dụ Participant thường gọi API chỉnh sửa Event hoặc finalize.

## `404 Not Found`

```text
ShortCode không tồn tại
Participant không tồn tại
```

## `409 Conflict`

Ví dụ:

```text
Username đã tồn tại nhưng password không phù hợp
Event đã Finalized nhưng User cố cập nhật availability
Event đã Finalized nhưng Admin finalize lần nữa
```

## `422 Unprocessable Entity`

Request đúng format nhưng vi phạm business rule, ví dụ:

```text
SpecificDate không thuộc EventAvailableDates
DayOfWeek không thuộc EventAvailableDates
TimeSlot nằm ngoài DailyStartTime/DailyEndTime
```

---

# 12. Mapping API → Database

```text
POST /events
    │
    ├── Events
    ├── EventAvailableDates
    └── EventParticipants (Admin)
```

```text
POST /participants/access
    │
    └── EventParticipants
```

```text
PUT /participants/me/availability
    │
    ├── TimeSlots
    ├── EventEmails (nếu có email)
    └── Events.Revision++
```

```text
PUT /events/{shortCode}
    │
    ├── Events
    ├── EventAvailableDates
    ├── cleanup TimeSlots
    └── Events.Revision++
```

```text
POST /finalize
    │
    ├── Events.FinalDate / FinalDayOfWeek
    ├── Events.FinalStartTime
    ├── Events.FinalEndTime
    ├── Events.Status = Finalized
    ├── Events.Revision++
    └── EventEmails → gửi notification
```

---

# 13. Flow tổng thể FE ↔ BE

```text
ADMIN
  │
  │ POST /events
  ▼
Create Event + Admin
  │
  ├── shortCode
  ├── URL
  └── accessToken
       │
       ▼
GET /events/{shortCode}
       │
       ▼
Connect SignalR
       │
       ▼
Heatmap
```

```text
PARTICIPANT
  │
  │ ShortCode / Link
  ▼
POST /participants/access
  │
  ├── Create/Authenticate Participant
  ├── accessToken
  └── personal TimeSlots
       │
       ▼
Connect SignalR
       │
       ▼
GET Event
       │
       ▼
Heatmap
```

```text
Participant Save Availability
       │
       ▼
PUT /participants/me/availability
       │
       ├── Save TimeSlots
       ├── Revision++
       └── Commit
              │
              ▼
       HeatmapUpdated
              │
        ┌─────┼─────┐
        ▼     ▼     ▼
       FE A  FE B  FE C
```

```text
Admin Finalize
       │
       ▼
POST /finalize
       │
       ├── Status = Finalized
       ├── Save Final Schedule
       ├── Revision++
       ├── Send Emails
       └── EventFinalized
              │
        ┌─────┼─────┐
        ▼     ▼     ▼
       FE A  FE B  FE C
              │
              ▼
       Lock Heatmap
```

---

# 14. Ghi chú về Closed Status

Hiện tại chưa có API riêng để chuyển Event sang:

```text
Status = 3 (Closed)
```

Status này được giữ trong DB để mở rộng sau.

# Contributing Guidelines & Engineering Standards

Welcome to **Meetly**! This document defines our engineering standards, branching strategy, commit conventions, coding guidelines, and linter/formatter configurations.

---

## 1. Tech Stacks & Architecture

Meetly is an open-source, real-time clone of When2meet:

- **Frontend**: React 18+, Vite, Tailwind CSS, TypeScript
  - Folders: `components/`, `services/`, `hooks/`, `types/`, `utils/`
- **Backend (Kiến trúc 3 tầng - 3-Tier Architecture)**:
  - **Tầng 1 - Controller (Presentation Layer)**: `backend/src/Meetly.Api/Controllers/` & `Hubs/` (SignalR)
  - **Tầng 2 - Service (Business Logic Layer)**: `backend/src/Meetly.Api/Services/` (Xử lý nghiệp vụ)
  - **Tầng 3 - Repository (Data Access Layer)**: `backend/src/Meetly.Api/Repositories/` & `Data/` (Truy vấn EF Core)
  - Shared models: `Models/` (Entities) & `DTOs/` (Data Transfer Objects)
- **Database**: PostgreSQL 16 (via `Npgsql.EntityFrameworkCore.PostgreSQL`)
- **Containerization**: Docker Compose (`docker-compose.yml`)

---

## 2. Branching Strategy (Git Flow: `main` & `dev`)

Quy trình phân nhánh chia làm 2 tầng rõ ràng:

- **`main`**: Nhánh Production / Release chính thức. Luôn ổn định và sẵn sàng deploy. Không push trực tiếp lên `main`.
- **`dev`**: Nhánh Test & Tích hợp (Staging / Integration). Toàn bộ tính năng mới và bugfix được merge vào `dev` để test toàn diện trước khi đưa lên `main`.

```text
[feat/new-feature] ──┐
                     ├── (PR & Review) ──> [ dev (Testing) ] ── (Test hoàn chỉnh) ──> [ main (Production) ]
[fix/bug-fix]      ──┘
```

### Quy trình làm việc:

1. **Lấy code mới nhất từ `dev`**:
   ```bash
   git checkout dev
   git pull origin dev
   ```
2. **Tạo nhánh công việc từ `dev`**:
   ```bash
   git checkout -b <type>/<short-kebab-case-description>
   ```
   _Allowed types_: `feat/`, `fix/`, `docs/`, `style/`, `refactor/`, `perf/`, `test/`, `build/`, `ci/`, `chore/`.
   _Ví dụ_: `feat/event-creation`, `fix/timezone-conversion`.
3. **Mở Pull Request vào `dev`**:
   - Khi hoàn thành, tạo PR mục tiêu vào nhánh `dev`.
   - CI sẽ chạy kiểm tra lint, format, build và test.
   - Yêu cầu ít nhất 1 approval trước khi merge vào `dev`.
4. **Kiểm thử trên `dev`**:
   - Tiến hành test đầy đủ các tính năng đã tích hợp trên nhánh `dev`.
5. **Merge vào `main`**:
   - Sau khi test hoàn chỉnh trên `dev` và đảm bảo không có lỗi phát sinh, tạo Pull Request từ `dev` vào `main`.
   - Merge vào `main` để release chính thức.

---

## 3. Commit Convention (Conventional Commits)

Commit messages và tiêu đề PR phải tuân thủ chuẩn [Conventional Commits v1.0.0](https://www.conventionalcommits.org/):

```text
<type>(optional-scope): <imperative summary>
```

- **Scopes phổ biến**: `event`, `heatmap`, `availability`, `signalr`, `db`, `ui`, `deps`
- **Ví dụ**:
  - `feat(event): add endpoint to generate unique meeting slug`
  - `feat(signalr): broadcast real-time availability updates to room`
  - `fix(heatmap): correct participant count calculation on overlapping slots`
  - `chore(repo): configure 3-tier backend and dev test branch`

---

## 4. Coding Conventions

### Backend (.NET / C#) - 3 Tầng:

- **Controller**: Chỉ tiếp nhận HTTP request, validate model cơ bản và gọi Service tương ứng; không viết logic nghiệp vụ hay gọi trực tiếp DbContext trong Controller.
- **Service**: Nơi chứa toàn bộ logic xử lý nghiệp vụ, tính toán biểu đồ nhiệt (heatmap), gọi Repository và phát sự kiện real-time SignalR.
- **Repository**: Chỉ chứa các hàm truy vấn, thêm, sửa, xóa dữ liệu thông qua EF Core `MeetlyDbContext`.
- **Quy ước đặt tên C#**:
  - `PascalCase`: Classes, Records, Interfaces (`IEventService`, `IEventRepository`), Methods, Properties.
  - `camelCase`: Method parameters, local variables.
  - `_camelCase`: Private instance fields.
  - Sử dụng File-scoped namespaces (`namespace Meetly.Api.Services;`).
  - Suffix `Async` cho các phương thức bất đồng bộ.

### Frontend (React / TypeScript / Tailwind CSS):

- Tách thư mục theo vai trò: `components/`, `services/`, `hooks/`, `types/`, `utils/`.
- `PascalCase` cho Component (`TimeGrid.tsx`) và Types/Interfaces.
- `camelCase` cho custom hooks (`useSignalR.ts`, `useAvailability.ts`) và hàm tiện ích.
- Sử dụng class Tailwind CSS ngắn gọn, có cấu trúc.

---

## 5. Linters & Formatters

- **Frontend**:
  ```bash
  cd frontend
  npm run lint       # Kiểm tra ESLint
  npm run build      # Kiểm tra Type & Build bundle
  ```
- **Backend**:
  ```bash
  cd backend
  dotnet format --verify-no-changes   # Kiểm tra format chuẩn EditorConfig
  dotnet format                       # Tự động format code
  dotnet test                         # Chạy unit tests
  ```

---

## 6. Local Development Setup

1. **Khởi động PostgreSQL**:
   ```bash
   docker compose up -d
   ```
2. **Khởi động Backend**:
   ```bash
   cd backend/src/Meetly.Api
   dotnet run
   ```
3. **Khởi động Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

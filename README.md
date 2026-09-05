# Meetly (When2meet Clone)

Meetly is a modern, real-time group scheduling application inspired by When2meet. It allows organizers to create meeting polls, collect participant availability via an intuitive drag-and-paint time grid, and visualize overlapping free times with a live heatmap powered by WebSockets.

---

## 🚀 Tech Stacks

| Area                 | Technology                                                     | Purpose                                                                         |
| :------------------- | :------------------------------------------------------------- | :------------------------------------------------------------------------------ |
| **Frontend**         | React 18, Vite, Tailwind CSS, TypeScript                       | High-performance interactive UI with drag-to-select time grid & live heatmap    |
| **Backend**          | .NET 8 (C# Web API), SignalR, EF Core                          | 3-tier architecture (Controller, Service, Repository) with real-time WebSockets |
| **Database**         | PostgreSQL 16, Entity Framework Core                           | Relational persistence with code-first migrations via `Npgsql`                  |
| **DevOps & Tooling** | Docker Compose, ESLint, Prettier, EditorConfig, GitHub Actions | Reproducible environments, strict code quality, and automated CI pipelines      |

---

## 📁 Repository & Architecture Structure

```text
Meetly/
├── .github/
│   ├── workflows/
│   │   └── quality.yml          # CI pipeline running on 'main' and 'dev'
│   └── pull_request_template.md # PR description standard
├── backend/                     # .NET 8 Web API (3-Tier Architecture)
│   ├── Meetly.sln
│   ├── src/
│   │   └── Meetly.Api/
│   │       ├── Controllers/     # Tầng 1: Presentation (API Endpoints)
│   │       ├── Services/        # Tầng 2: Business Logic & SignalR dispatch
│   │       ├── Repositories/    # Tầng 3: Data Access (EF Core queries)
│   │       ├── Data/            # DbContext & migrations
│   │       ├── Hubs/            # SignalR Hubs (MeetingHub)
│   │       ├── Models/          # Entity models (Event, Participant, Slot)
│   │       └── DTOs/            # Data transfer objects
│   └── tests/
│       └── Meetly.Api.Tests/    # Unit tests
├── frontend/                    # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/          # UI components (Grid, Heatmap, Modals)
│   │   ├── services/            # API client & SignalR connection
│   │   ├── hooks/               # Custom hooks
│   │   ├── types/               # TypeScript models & types
│   │   └── utils/               # Helper utilities
│   ├── vite.config.ts
│   └── eslint.config.js
├── docker-compose.yml           # PostgreSQL 16 service for local dev
├── .editorconfig                # Unified formatting rules across IDEs
├── .gitignore                   # Git ignore for .NET, Node, and OS
├── .prettierrc.json             # Code formatting config
├── CONTRIBUTING.md              # Branching (main/dev), Commit, and Coding Conventions
└── README.md
```

---

## 🌿 Branching Strategy

- **`main`**: Nhánh Production / Release chính thức. Luôn ổn định.
- **`dev`**: Nhánh Test & Tích hợp (Staging / Testing). Toàn bộ `feat/*` và `fix/*` được merge vào `dev`. Khi test hoàn chỉnh, không còn lỗi thì mới tạo PR merge từ `dev` vào `main`.

---

## ⚡ Quick Start

### 1. Start PostgreSQL

```bash
docker compose up -d
```

### 2. Run Backend (.NET 8 + SignalR)

```bash
cd backend/src/Meetly.Api
dotnet run
```

- API Swagger UI: [http://localhost:5000/swagger](http://localhost:5000/swagger)
- SignalR Hub Endpoint: `http://localhost:5000/hubs/meeting`

### 3. Run Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

- Web Application: [http://localhost:5173](http://localhost:5173)

---

## 📋 Quality & Conventions

- **Branching Model**: Git Flow (`dev` for testing, `main` for release). See [CONTRIBUTING.md](CONTRIBUTING.md).
- **Commit Format**: Conventional Commits (`feat(event): ...`, `fix(heatmap): ...`).
- **Formatting & Linting**:
  - Frontend: `npm run lint` & `npm run build`
  - Backend: `dotnet format --verify-no-changes` & `dotnet test`

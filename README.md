# Meetly 

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
├── backend/                     # .NET 8 Multi-Project Solution (Clean / 3-Tier)
│   ├── Meetly.sln
│   ├── src/
│   │   ├── Meetly.API/          # Presentation Layer (Web API, Controllers, Middleware)
│   │   │   ├── Constants/
│   │   │   ├── Controllers/
│   │   │   ├── Extensions/
│   │   │   ├── Filters/
│   │   │   ├── Middleware/
│   │   │   ├── Hubs/            # SignalR Realtime Hubs
│   │   │   ├── Dockerfile
│   │   │   └── Program.cs
│   │   ├── Meetly.Repository/   # Data Access Layer (EF Core, DbContext, Entities)
│   │   │   ├── Abstraction/     # Repository interfaces
│   │   │   ├── Configurations/  # EF Core Fluent API configs
│   │   │   ├── Entity/          # Database entities
│   │   │   ├── Enum/            # Enums
│   │   │   ├── Migrations/      # EF Core database migrations
│   │   │   ├── AppDbContext.cs  # EF Core DbContext
│   │   │   └── AssemblyReference.cs
│   │   ├── Meetly.Service/      # Business Logic Layer
│   │   │   ├── Abstraction/     # Service interfaces
│   │   │   ├── Implementations/ # Service implementations
│   │   │   └── AssemblyReference.cs
│   │   └── Meetly.Contract/     # Shared DTOs & Contracts
│   │       ├── Abstraction/     # Base contracts
│   │       ├── DTOs/            # Request / Response DTOs
│   │       └── AssemblyReference.cs
│   └── tests/
│       └── Meetly.Api.Tests/    # Unit & Integration Tests
├── frontend/                    # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── assets/              # Static assets & images
│   │   ├── components/          # Reusable UI components
│   │   ├── contexts/            # React Context providers
│   │   ├── hooks/               # Custom hooks
│   │   ├── layouts/             # Page layouts
│   │   ├── pages/               # Route views / Pages
│   │   ├── services/            # API clients & SignalR connection
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
cd backend/src/Meetly.API
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

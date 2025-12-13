# 🌤️ SkyFlow - Organizational Project Management System

**SkyFlow** is a comprehensive organizational project management platform that integrates Google Workspace services (Calendar, Drive, Sheets, Docs) to provide a unified dashboard for **Teams**, **Managers**, and **Administrators**. The platform stores organizational metadata in PostgreSQL while leveraging Google APIs for real-time collaboration and file management.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Development Workflow](#-development-workflow)

---

## ✨ Features

### For Administrators
- ✅ **Organization Management** - Create and manage organizations
- ✅ **Team Member Invitations** - Invite users via email with role-based access
- ✅ **Project Oversight** - Monitor all organizational projects
- ✅ **Analytics Dashboard** - View organization-wide metrics and insights
- ✅ **Google Workspace Integration** - Seamless sync with Google services

### For Managers
- ✅ **Project Creation** - Create and configure new projects
- ✅ **Task Management** - Assign tasks to team members with deadlines
- ✅ **Team Coordination** - Manage project teams and roles
- ✅ **Meeting Scheduling** - Create events synced with Google Calendar
- ✅ **Progress Tracking** - Monitor project milestones and deliverables
- ✅ **File Management** - Organize project files via Google Drive

### For Team Members
- ✅ **Task Dashboard** - View assigned tasks with priorities and deadlines
- ✅ **Time Tracking** - Log work hours on tasks
- ✅ **Deliverable Submission** - Submit project outputs for review
- ✅ **Team Calendar** - Access unified team schedule
- ✅ **File Access** - View and collaborate on project files
- ✅ **Activity Updates** - Stay informed on project changes

---

## 🛠 Tech Stack

### Backend
- **Node.js** + **Express.js** - REST API server
- **TypeScript** - Type-safe development
- **PostgreSQL** - Organizational metadata storage
- **Google APIs** - Calendar, Drive, Sheets, Docs integration
- **OAuth 2.0** + **JWT** - Secure authentication
- **Winston** - Logging

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe UI development
- **TailwindCSS** - Utility-first styling
- **Lucide React** - Icon library
- **Recharts** - Data visualization

### Infrastructure
- **Docker** - PostgreSQL containerization
- **Redis** - Session management (optional)

---

## 📁 Project Structure

```
SkyFlow.Google/
├── backend/                      # Express.js API server
│   ├── src/
│   │   ├── config/              # Database, Google API, logger config
│   │   │   ├── database.ts
│   │   │   ├── google.ts
│   │   │   └── logger.ts
│   │   ├── services/            # Business logic
│   │   │   └── google/
│   │   │       ├── auth.service.ts
│   │   │       ├── calendar.service.ts
│   │   │       ├── drive.service.ts
│   │   │       └── sheets.service.ts
│   │   ├── routes/              # API endpoints
│   │   │   ├── auth.routes.ts
│   │   │   ├── organization.routes.ts
│   │   │   ├── project.routes.ts
│   │   │   ├── task.routes.ts
│   │   │   ├── calendar.routes.ts
│   │   │   ├── drive.routes.ts
│   │   │   └── sheets.routes.ts
│   │   ├── middleware/          # Auth, validation
│   │   │   └── auth.middleware.ts
│   │   └── server.ts            # Express app entry point
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                     # Next.js frontend
│   ├── src/
│   │   ├── app/                 # Next.js 14 App Router
│   │   │   ├── auth/
│   │   │   │   └── login/
│   │   │   ├── dashboard/
│   │   │   ├── projects/
│   │   │   ├── tasks/
│   │   │   ├── calendar/
│   │   │   ├── drive/
│   │   │   ├── invite/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   ├── auth/            # Login & invitation components
│   │   │   ├── dashboards/      # Role-based dashboards
│   │   │   ├── projects/        # Project management components
│   │   │   ├── tasks/           # Task management components
│   │   │   ├── shared/          # Reusable components
│   │   │   └── ui/              # UI primitives
│   │   ├── lib/
│   │   │   ├── api/             # API client functions
│   │   │   └── utils/
│   │   └── types/               # TypeScript types
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   └── next.config.js
│
├── database/
│   ├── schema.sql               # PostgreSQL schema
│   ├── migrations/              # Database migrations
│   └── seeds/                   # Seed data
│
├── .env.example                 # Environment variables template
├── .gitignore
├── docker-compose.yml           # PostgreSQL + Redis setup
├── package.json                 # Root workspace config
└── README.md
```

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **PostgreSQL** (v15 or higher) OR **Docker**
- **Google Cloud Project** with OAuth 2.0 credentials

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd SKyFlow.Google
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Set Up PostgreSQL Database

#### Option A: Using Docker (Recommended)

```bash
# From project root
docker-compose up -d
```

This will start PostgreSQL on `localhost:5432` with the credentials from `docker-compose.yml`.

#### Option B: Local PostgreSQL

1. Create a database named `skyflow_db`
2. Run the schema:

```bash
psql -U postgres -d skyflow_db -f database/schema.sql
```

---

## ⚙️ Configuration

### 1. Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the following APIs:
   - Google Classroom API
   - Google Calendar API
   - Google Drive API
   - Google Sheets API
4. Create OAuth 2.0 credentials:
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorized redirect URIs: `http://localhost:3001/api/auth/google/callback`
5. Download the credentials (Client ID and Client Secret)

### 2. Environment Variables

#### Backend (.env)

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
# Database
DATABASE_URL=postgresql://skyflow_user:skyflow_password@localhost:5432/skyflow_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skyflow_db
DB_USER=skyflow_user
DB_PASSWORD=skyflow_password

# Server
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Google OAuth 2.0
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

# Session
SESSION_SECRET=your_session_secret_change_this_in_production

# Logging
LOG_LEVEL=debug
```

#### Frontend (.env.local)

```bash
# In frontend directory
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=SkyFlow
```

---

## 🏃 Running the Application

### Development Mode

#### Option 1: Run Both (Recommended)

```bash
# From project root
npm run dev
```

This runs both frontend and backend concurrently.

#### Option 2: Run Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/health

---

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/google?invite=token` | Get Google OAuth URL |
| GET | `/api/auth/google/callback` | OAuth callback handler |
| GET | `/api/auth/me` | Get current user info with organizations |
| GET | `/api/auth/invite/:token` | Get invitation details |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout user |

### Organization Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/organizations` | Create new organization |
| GET | `/api/organizations` | Get user's organizations |
| GET | `/api/organizations/:id` | Get organization details |
| PUT | `/api/organizations/:id` | Update organization |
| POST | `/api/organizations/:id/invite` | Invite user to organization |
| GET | `/api/organizations/:id/members` | Get organization members |
| DELETE | `/api/organizations/:id/members/:userId` | Remove member |

### Project Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/projects` | Create new project |
| GET | `/api/projects` | Get projects (filtered) |
| GET | `/api/projects/:id` | Get project details |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| GET | `/api/projects/:id/members` | Get project members |
| POST | `/api/projects/:id/members` | Add member to project |
| DELETE | `/api/projects/:id/members/:userId` | Remove member |

### Task Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tasks` | Create new task |
| GET | `/api/tasks` | Get tasks (filtered) |
| GET | `/api/tasks/:id` | Get task details |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| POST | `/api/tasks/:id/comments` | Add comment to task |
| POST | `/api/tasks/:id/time` | Log time entry |

### Calendar Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/calendar/events` | Get upcoming events |
| POST | `/api/calendar/events` | Create new event |
| PUT | `/api/calendar/events/:eventId` | Update event |
| DELETE | `/api/calendar/events/:eventId` | Delete event |

### Drive Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/drive/files` | List user's files |
| POST | `/api/drive/upload` | Upload file to Drive |
| DELETE | `/api/drive/files/:fileId` | Delete file |

### Sheets Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sheets/project/:projectId` | Get project analytics |
| POST | `/api/sheets/sync` | Sync data from Google Sheets |

---

## 🗄 Database Schema

The PostgreSQL database stores organizational metadata:

### Core Tables

- **organizations** - Organization entities
- **users** - User accounts (synced from Google OAuth)
- **organization_members** - User-organization relationships with roles
- **organization_invitations** - Pending organization invites
- **projects** - Project entities
- **project_members** - Project team assignments
- **tasks** - Task entities with assignments
- **task_comments** - Task discussion threads
- **milestones** - Project milestones
- **deliverables** - Project outputs and submissions
- **calendar_events** - Events (synced from Google Calendar)
- **event_attendees** - Event participant tracking
- **drive_files** - File references (Google Drive)
- **time_entries** - Time tracking for tasks
- **project_analytics** - Analytics snapshots (from Google Sheets)
- **activity_logs** - System activity tracking

See `database/schema.sql` for complete schema definition.

---

## 🔧 Development Workflow

### Code Structure Guidelines

1. **Services** - Business logic and Google API interactions
2. **Routes** - API endpoint definitions
3. **Middleware** - Authentication, validation, error handling
4. **Controllers** - Request/response handling (optional, can be in routes)

### Adding a New Feature

1. Create service in `backend/src/services/`
2. Add routes in `backend/src/routes/`
3. Register routes in `backend/src/server.ts`
4. Create frontend API client in `frontend/src/lib/api/`
5. Build UI components in `frontend/src/components/`

### Database Migrations

```bash
cd backend
npm run db:migrate
```

### Linting

```bash
# Backend
cd backend
npm run lint

# Frontend
cd frontend
npm run lint
```

---

## 🔐 Security Notes

- Never commit `.env` files
- Use strong JWT secrets in production
- Enable HTTPS in production
- Implement rate limiting for API endpoints
- Validate all user inputs
- Use prepared statements for database queries (already implemented)

---

## 🚧 TODO / Future Enhancements

- [ ] Email notification system for invitations
- [ ] Real-time collaboration (WebSockets)
- [ ] Kanban board view for tasks
- [ ] Gantt chart for project timelines
- [ ] Advanced analytics and reporting
- [ ] Mobile app support
- [ ] Implement caching with Redis
- [ ] Add comprehensive test suite
- [ ] Set up CI/CD pipeline
- [ ] Add API rate limiting
- [ ] File upload progress tracking
- [ ] Slack/Teams integration
- [ ] AI-powered project insights

---

## 📝 License

This project is for academic purposes (Capstone Project).

---

## 👥 Contributors

- Your Name - Developer

---

## 📞 Support

For issues or questions, please create an issue in the repository.

---

**Built with ❤️ for academic excellence**

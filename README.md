# 🌤️ SkyFlow - Academic Management Platform

**SkyFlow** is a comprehensive academic management system that integrates multiple Google services (Classroom, Calendar, Drive, Sheets) to provide a unified dashboard for **Teachers** and **Students**. The platform stores metadata in PostgreSQL while leveraging Google APIs for core functionality.

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

### For Teachers
- ✅ **Google Classroom Integration** - Create and manage assignments
- ✅ **Grade Management** - Import grades from Google Sheets
- ✅ **Calendar Scheduling** - Create class schedules and exam dates
- ✅ **Attendance Tracking** - Record and view student attendance
- ✅ **Performance Analytics** - View class-wide performance trends
- ✅ **File Management** - Upload and share files via Google Drive

### For Students
- ✅ **Assignment Dashboard** - View all assignments with deadlines
- ✅ **Submission Tracking** - Submit work and track submission status
- ✅ **Grade Viewing** - Access current grades and performance metrics
- ✅ **Attendance History** - View personal attendance records
- ✅ **Calendar Integration** - See unified academic schedule
- ✅ **File Access** - Access shared files and resources

---

## 🛠 Tech Stack

### Backend
- **Node.js** + **Express.js** - REST API server
- **TypeScript** - Type-safe development
- **PostgreSQL** - Metadata storage
- **Google APIs** - Classroom, Calendar, Drive, Sheets integration
- **JWT** - Authentication
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
│   │   │   ├── google/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── classroom.service.ts
│   │   │   │   ├── calendar.service.ts
│   │   │   │   ├── drive.service.ts
│   │   │   │   └── sheets.service.ts
│   │   │   └── attendance.service.ts
│   │   ├── routes/              # API endpoints
│   │   │   ├── auth.routes.ts
│   │   │   ├── classroom.routes.ts
│   │   │   ├── calendar.routes.ts
│   │   │   ├── drive.routes.ts
│   │   │   ├── sheets.routes.ts
│   │   │   ├── attendance.routes.ts
│   │   │   └── dashboard.routes.ts
│   │   ├── middleware/          # Auth, validation
│   │   │   └── auth.middleware.ts
│   │   └── server.ts            # Express app entry point
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                     # Next.js frontend
│   ├── src/
│   │   ├── app/                 # Next.js 14 App Router
│   │   │   ├── (auth)/
│   │   │   │   └── login/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── student/
│   │   │   │   └── teacher/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   ├── auth/            # Login components
│   │   │   ├── dashboards/      # Student/Teacher dashboards
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
| GET | `/api/auth/google?role=student\|teacher` | Get Google OAuth URL |
| GET | `/api/auth/google/callback` | OAuth callback handler |
| GET | `/api/auth/me` | Get current user info |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout user |

### Dashboard Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/student` | Get student dashboard data |
| GET | `/api/dashboard/teacher` | Get teacher dashboard data |

### Classroom Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/classroom/courses` | Get user's courses |
| POST | `/api/classroom/courses/sync` | Sync courses from Google Classroom |
| GET | `/api/classroom/courses/:courseId/assignments` | Get course assignments |
| POST | `/api/classroom/assignments` | Create new assignment |

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
| GET | `/api/sheets/grades` | Get student grades |
| POST | `/api/sheets/grades/sync` | Sync grades from Google Sheets |
| GET | `/api/sheets/class/:classId/stats` | Get class grade statistics |

### Attendance Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/attendance/student/:studentId` | Get student attendance |
| POST | `/api/attendance/record` | Record attendance |
| POST | `/api/attendance/bulk` | Bulk record attendance |

---

## 🗄 Database Schema

The PostgreSQL database stores metadata for Google services:

### Core Tables

- **users** - User accounts (synced from Google OAuth)
- **classes** - Courses (mirrored from Google Classroom)
- **class_enrollments** - Student-class relationships
- **assignments** - Assignments (mirrored from Classroom)
- **submissions** - Student submissions metadata
- **calendar_events** - Events (synced from Google Calendar)
- **drive_files** - File references (Google Drive)
- **attendance** - Attendance records
- **grade_summaries** - Grade data (from Google Sheets)
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

- [ ] Implement remaining API route handlers
- [ ] Add real-time notifications (WebSockets)
- [ ] Implement AI-powered insights (Phase 2)
- [ ] Add mobile app support
- [ ] Implement caching with Redis
- [ ] Add comprehensive test suite
- [ ] Set up CI/CD pipeline
- [ ] Add API rate limiting
- [ ] Implement file upload progress tracking
- [ ] Add email notifications

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

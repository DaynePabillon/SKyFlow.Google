# 🚀 Quick Start Guide

## ✅ What's Been Done

All your files have been organized into the proper structure:
- ✅ Backend installed and ready
- ✅ Frontend installed and ready
- ✅ Files organized in clean folders
- ✅ Admin role removed (Students & Teachers only)

---

## 🏃 How to Run SkyFlow

### Option 1: Run Both Servers Together (Recommended)

Open PowerShell in the project root and run:

```powershell
npm run dev
```

This will start:
- **Backend** on http://localhost:3001
- **Frontend** on http://localhost:3000

### Option 2: Run Servers Separately

**Terminal 1 - Backend:**
```powershell
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```

---

## 🌐 Access the Application

Once running, open your browser:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/health

---

## 📋 Before You Start

### 1. Set Up Database (Required)

Start PostgreSQL with Docker:

```powershell
docker-compose up -d
```

This creates the database with all tables automatically.

### 2. Configure Google OAuth (Required for Login)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project
3. Enable these APIs:
   - Google Classroom API
   - Google Calendar API
   - Google Drive API
   - Google Sheets API
4. Create OAuth 2.0 credentials
5. Copy `.env.example` to `.env` and add your credentials

---

## 🎯 Current Features

### For Students
- View assignments and deadlines
- Check grades
- See attendance history
- View class schedule

### For Teachers
- Create and manage assignments
- Track student performance
- Record attendance
- Manage class schedules

---

## 🔧 Troubleshooting

### "Cannot connect to database"
```powershell
docker-compose up -d
```

### "Port already in use"
Check if another app is using ports 3000 or 3001:
```powershell
netstat -ano | findstr :3000
netstat -ano | findstr :3001
```

### TypeScript errors
These should be gone after `npm install`. If not:
```powershell
cd backend
npm install
cd ../frontend
npm install
```

---

## 📁 Project Structure

```
SkyFlow.Google/
├── backend/          ✅ Express.js API (Port 3001)
├── frontend/         ✅ Next.js 14 App (Port 3000)
├── database/         ✅ PostgreSQL Schema
└── docker-compose.yml ✅ Database Setup
```

---

## 🎉 You're Ready!

Run `npm run dev` and start building! 🚀

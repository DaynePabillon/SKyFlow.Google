# 📂 File Organization Guide

This guide explains how to organize your existing frontend files into the new clean structure.

## Current Files (Root Directory)

Your existing UI components are currently in the root directory. Here's where each file should be moved:

### ✅ Move to `frontend/src/app/`

| Current File | New Location | Notes |
|--------------|--------------|-------|
| `layout.tsx` | `frontend/src/app/layout.tsx` | Root layout |
| `page.tsx` | `frontend/src/app/page.tsx` | Home page |
| `globals.css` | `frontend/src/app/globals.css` | Global styles |

### ✅ Move to `frontend/src/components/auth/`

| Current File | New Location |
|--------------|--------------|
| `login-page.tsx` | `frontend/src/components/auth/login-page.tsx` |

### ✅ Move to `frontend/src/components/dashboards/`

| Current File | New Location |
|--------------|--------------|
| `student-dashboard.tsx` | `frontend/src/components/dashboards/student-dashboard.tsx` |
| `teacher-dashboard.tsx` | `frontend/src/components/dashboards/teacher-dashboard.tsx` |

### ✅ Move to `frontend/src/components/shared/`

| Current File | New Location |
|--------------|--------------|
| `task-card.tsx` | `frontend/src/components/shared/task-card.tsx` |
| `class-card.tsx` | `frontend/src/components/shared/class-card.tsx` |
| `attendance-card.tsx` | `frontend/src/components/shared/attendance-card.tsx` |
| `analytics-widget.tsx` | `frontend/src/components/shared/analytics-widget.tsx` |
| `performance-chart.tsx` | `frontend/src/components/shared/performance-chart.tsx` |
| `schedule-widget.tsx` | `frontend/src/components/shared/schedule-widget.tsx` |
| `school-analytics.tsx` | `frontend/src/components/shared/school-analytics.tsx` |
| `school-metrics.tsx` | `frontend/src/components/shared/school-metrics.tsx` |
| `user-overview.tsx` | `frontend/src/components/shared/user-overview.tsx` |
| `recent-submissions.tsx` | `frontend/src/components/shared/recent-submissions.tsx` |

---

## 🔧 Required Import Path Updates

After moving files, you'll need to update import paths. Here are the changes:

### In `frontend/src/app/page.tsx`

**Before:**
```typescript
import StudentDashboard from "@/components/dashboards/student-dashboard"
import TeacherDashboard from "@/components/dashboards/teacher-dashboard"
import LoginPage from "@/components/auth/login-page"
```

**After:** (No change needed if using `@/` alias)
```typescript
import StudentDashboard from "@/components/dashboards/student-dashboard"
import TeacherDashboard from "@/components/dashboards/teacher-dashboard"
import LoginPage from "@/components/auth/login-page"
```

### In Dashboard Components

**Before:**
```typescript
import TaskCard from "@/components/shared/task-card"
```

**After:** (No change needed)
```typescript
import TaskCard from "@/components/shared/task-card"
```

---

## 📋 Step-by-Step Migration Instructions

### Step 1: Create Frontend Directory Structure

```bash
cd frontend
mkdir -p src/app
mkdir -p src/components/auth
mkdir -p src/components/dashboards
mkdir -p src/components/shared
mkdir -p src/components/ui
mkdir -p src/lib/api
mkdir -p src/lib/utils
mkdir -p src/types
mkdir -p public
```

### Step 2: Move Files

#### PowerShell Commands (Windows):

```powershell
# From project root
cd "c:\Users\Dayne Pabillon\Desktop\SkyFlow\SKyFlow.Google"

# Move app files
Move-Item layout.tsx frontend\src\app\
Move-Item page.tsx frontend\src\app\
Move-Item globals.css frontend\src\app\

# Move auth components
Move-Item login-page.tsx frontend\src\components\auth\

# Move dashboard components
Move-Item student-dashboard.tsx frontend\src\components\dashboards\
Move-Item teacher-dashboard.tsx frontend\src\components\dashboards\

# Move shared components
Move-Item task-card.tsx frontend\src\components\shared\
Move-Item class-card.tsx frontend\src\components\shared\
Move-Item attendance-card.tsx frontend\src\components\shared\
Move-Item analytics-widget.tsx frontend\src\components\shared\
Move-Item performance-chart.tsx frontend\src\components\shared\
Move-Item schedule-widget.tsx frontend\src\components\shared\
Move-Item school-analytics.tsx frontend\src\components\shared\
Move-Item school-metrics.tsx frontend\src\components\shared\
Move-Item user-overview.tsx frontend\src\components\shared\
Move-Item recent-submissions.tsx frontend\src\components\shared\
```

### Step 3: Install Dependencies

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

### Step 4: Set Up Environment Variables

```bash
# Copy .env.example to .env (backend)
cp .env.example .env

# Copy .env.local.example to .env.local (frontend)
cd frontend
cp .env.local.example .env.local
```

### Step 5: Start Database

```bash
# From project root
docker-compose up -d
```

### Step 6: Test the Application

```bash
# From project root
npm run dev
```

Visit:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001/health

---

## 🎨 Additional Files to Create

### Create `frontend/src/lib/api/client.ts`

```typescript
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

### Create `frontend/src/lib/utils/cn.ts`

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Create `frontend/src/types/index.ts`

```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher';
  profilePicture?: string;
}

export interface Assignment {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  points?: number;
  className: string;
  status: 'pending' | 'submitted' | 'graded' | 'overdue';
  progress?: number;
}

export interface Class {
  id: string;
  name: string;
  code: string;
  section?: string;
  students?: number;
  avgGrade?: number;
  nextClass?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  eventType: 'class' | 'exam' | 'assignment' | 'meeting' | 'other';
}
```

### Create `frontend/tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

### Create `frontend/postcss.config.js`

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

---

## ✅ Verification Checklist

After migration, verify:

- [ ] All files are in their correct locations
- [ ] No import errors in the code
- [ ] `npm install` runs successfully in both backend and frontend
- [ ] Database starts with `docker-compose up -d`
- [ ] Backend starts with `cd backend && npm run dev`
- [ ] Frontend starts with `cd frontend && npm run dev`
- [ ] No TypeScript errors (after installing dependencies)
- [ ] Application loads at http://localhost:3000

---

## 🚨 Common Issues & Solutions

### Issue: "Cannot find module '@/components/...'"

**Solution:** Ensure `tsconfig.json` has the correct path mapping:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Issue: TypeScript errors about missing types

**Solution:** Install dependencies:
```bash
cd backend && npm install
cd ../frontend && npm install
```

### Issue: Database connection errors

**Solution:** 
1. Ensure Docker is running
2. Run `docker-compose up -d`
3. Check `.env` file has correct database credentials

---

## 📞 Need Help?

If you encounter any issues during migration, check:
1. All files are moved to correct locations
2. Dependencies are installed (`npm install`)
3. Environment variables are set up
4. Database is running

**Happy coding! 🚀**

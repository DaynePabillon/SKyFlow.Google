# SkyFlow Migration Summary: Education → Organizational Project Management

## Overview
SkyFlow has been completely restructured from an **Academic Management Platform** (teacher/student) to an **Organizational Project Management System** (admin/manager/member).

---

## Major Changes

### 1. Database Schema (`database/schema.sql`)

#### Removed Tables
- `classes` (Google Classroom courses)
- `class_enrollments` (student-class relationships)
- `assignments` (classroom assignments)
- `submissions` (student submissions)
- `attendance` (attendance records)
- `grade_summaries` (student grades)
- `analytics_snapshots` (student performance)

#### New Tables
- `organizations` - Organization entities
- `organization_members` - User-organization relationships with roles (admin/manager/member)
- `organization_invitations` - Email-based invitation system
- `projects` - Project management
- `project_members` - Project team assignments
- `tasks` - Task management with assignments
- `task_comments` - Task discussion threads
- `milestones` - Project milestones
- `deliverables` - Project outputs
- `event_attendees` - Calendar event participants
- `time_entries` - Time tracking for tasks
- `project_analytics` - Project metrics from Google Sheets

#### Modified Tables
- `users` - Removed `role` column (no longer student/teacher)
- `calendar_events` - Added `organization_id`, `project_id`, changed event types
- `drive_files` - Added `project_id`, `task_id` for better organization
- `activity_logs` - Added `organization_id` for scoping

---

### 2. Backend Routes

#### New Routes Created
- `organization.routes.ts` - Organization CRUD, member management, invitations
- `project.routes.ts` - Project CRUD, team assignments
- `task.routes.ts` - Task CRUD, comments, time tracking

#### Removed Routes
- `classroom.routes.ts` - No longer needed
- `attendance.routes.ts` - No longer needed
- `dashboard.routes.ts` - Will be replaced with role-based dashboards

#### Updated Routes
- `auth.routes.ts` - Removed student/teacher role, added invitation processing
- `calendar.routes.ts` - Updated for organizational context
- `drive.routes.ts` - Updated for project/task context
- `sheets.routes.ts` - Updated for project analytics

---

### 3. Backend Services

#### Updated Services
- `auth.service.ts`:
  - Removed `role` parameter from `upsertUser()`
  - Removed `role` from `getAuthUrl()`
  - Added `processInvitation()` method
  - Updated JWT payload (removed role)

#### Services to Update (Next Steps)
- `calendar.service.ts` - Update for organizational events
- `drive.service.ts` - Update for project/task file management
- `sheets.service.ts` - Update for project analytics

---

### 4. Server Configuration

#### Updated `server.ts`
```typescript
// Old imports
import classroomRoutes from './routes/classroom.routes';
import attendanceRoutes from './routes/attendance.routes';
import dashboardRoutes from './routes/dashboard.routes';

// New imports
import organizationRoutes from './routes/organization.routes';
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';

// Old routes
app.use('/api/classroom', classroomRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/dashboard', dashboardRoutes);

// New routes
app.use('/api/organizations', organizationRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
```

---

### 5. API Endpoints

#### Authentication
- `GET /api/auth/google?invite=token` - OAuth with optional invitation
- `GET /api/auth/invite/:token` - Get invitation details
- `GET /api/auth/me` - Returns user with organizations

#### Organizations
- `POST /api/organizations` - Create organization
- `GET /api/organizations` - List user's organizations
- `GET /api/organizations/:id` - Get organization details
- `PUT /api/organizations/:id` - Update organization
- `POST /api/organizations/:id/invite` - Invite user via email
- `GET /api/organizations/:id/members` - List members
- `DELETE /api/organizations/:id/members/:userId` - Remove member

#### Projects
- `POST /api/projects` - Create project
- `GET /api/projects` - List projects (filtered)
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `GET /api/projects/:id/members` - List project team
- `POST /api/projects/:id/members` - Add team member
- `DELETE /api/projects/:id/members/:userId` - Remove member

#### Tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks` - List tasks (filtered)
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/comments` - Add comment
- `POST /api/tasks/:id/time` - Log time entry

---

### 6. User Roles & Permissions

#### Old System
- **Teacher**: Create classes, assignments, manage grades
- **Student**: View assignments, submit work, view grades

#### New System
- **Admin**: Full organization control, invite users, manage all projects
- **Manager**: Create projects, assign tasks, manage project teams
- **Member**: View assigned tasks, submit deliverables, log time

---

### 7. Invitation Flow

#### How It Works
1. Admin/Manager invites user via email
2. System generates unique token, stores in `organization_invitations`
3. User receives email with invitation link: `/invite/{token}`
4. User clicks link, redirects to Google OAuth with token
5. After OAuth, system processes invitation:
   - Validates token and email match
   - Adds user to organization with specified role
   - Marks invitation as accepted

---

### 8. Google Workspace Integration

#### Maintained Integrations
- **Google Calendar** - Team meetings, project deadlines
- **Google Drive** - Project files, deliverables
- **Google Sheets** - Project analytics, metrics

#### Removed Integrations
- **Google Classroom** - No longer needed

---

## Frontend Changes Needed

### Components to Update/Create

#### Remove
- `components/dashboards/student-dashboard.tsx`
- `components/dashboards/teacher-dashboard.tsx`
- All classroom-related components

#### Create
- `components/dashboards/admin-dashboard.tsx`
- `components/dashboards/manager-dashboard.tsx`
- `components/dashboards/member-dashboard.tsx`
- `components/organizations/organization-list.tsx`
- `components/organizations/organization-settings.tsx`
- `components/organizations/invite-member.tsx`
- `components/projects/project-list.tsx`
- `components/projects/project-board.tsx`
- `components/projects/project-settings.tsx`
- `components/tasks/task-list.tsx`
- `components/tasks/task-kanban.tsx`
- `components/tasks/task-detail.tsx`
- `components/tasks/time-tracker.tsx`

#### Update
- `components/auth/login-page.tsx` - Remove role selection
- `app/page.tsx` - Update landing page
- `app/calendar/page.tsx` - Update for organizational context
- `app/drive/page.tsx` - Update for project/task context

---

## Environment Variables

### No Changes Required
The `.env` file structure remains the same:
- Database credentials
- Google OAuth credentials
- JWT secrets
- Server configuration

---

## Database Migration

### To Apply Changes

```bash
# Backup existing database
pg_dump skyflow_db > backup_$(date +%Y%m%d).sql

# Drop and recreate (DEVELOPMENT ONLY)
psql -U postgres -c "DROP DATABASE IF EXISTS skyflow_db;"
psql -U postgres -c "CREATE DATABASE skyflow_db;"

# Apply new schema
psql -U postgres -d skyflow_db -f database/schema.sql
```

### For Production
Create proper migration scripts to:
1. Export existing data
2. Transform data to new schema
3. Import transformed data

---

## Testing Checklist

### Backend
- [ ] User can authenticate via Google OAuth
- [ ] User can create organization
- [ ] Admin can invite users to organization
- [ ] Invitation flow works end-to-end
- [ ] Manager can create projects
- [ ] Manager can assign tasks
- [ ] Members can view and update tasks
- [ ] Time tracking works
- [ ] Calendar events sync properly
- [ ] Drive files link to projects/tasks

### Frontend
- [ ] Login page works without role selection
- [ ] Dashboard shows based on user's role in organization
- [ ] Organization management UI works
- [ ] Project creation and management works
- [ ] Task board displays correctly
- [ ] Calendar integration works
- [ ] Drive integration works

---

## Next Steps

1. **Update Frontend Components** - Create new organizational UI
2. **Update Google Services** - Adapt calendar, drive, sheets services
3. **Email System** - Implement invitation email sending
4. **Testing** - Comprehensive testing of all flows
5. **Documentation** - Update API docs, user guides
6. **Deployment** - Deploy to staging environment

---

## Breaking Changes

⚠️ **This is a complete system overhaul. All existing data will be incompatible.**

- User roles completely changed
- All classroom/student data will be lost
- Authentication flow modified
- API endpoints completely different
- Frontend components need full rewrite

---

## Rollback Plan

If needed to revert:
1. Restore database from backup
2. Checkout previous git commit
3. Restore old `.env` configuration
4. Restart services

---

**Migration Date**: December 11, 2024  
**Status**: Backend Complete, Frontend Pending  
**Estimated Completion**: TBD

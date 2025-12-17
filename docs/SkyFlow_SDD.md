# SkyFlow - Software Design Document (SDD)

**Version:** 1.0  
**Date:** December 17, 2025  
**Project:** SkyFlow - Cloud-Based Project Management System

---

## 1. Introduction

### 1.1 Purpose

This Software Design Document (SDD) provides a comprehensive technical specification for SkyFlow, a cloud-based project management and team collaboration platform. The document describes the system architecture, detailed component design, data structures, and module interactions to serve as a reference for development, testing, and maintenance teams.

### 1.2 Scope

SkyFlow is a full-stack web application that enables organizations to:
- Manage projects and tasks with role-based access control
- Collaborate with team members in real-time
- Integrate with Google Workspace (Drive, Sheets, Calendar)
- Track activity and notifications
- Visualize data through customizable chart widgets

**In Scope:**
- User authentication via Google OAuth 2.0
- Organization and team management
- Project and task management
- Google API integrations
- Notification system
- Analytics and reporting

**Out of Scope:**
- Mobile native applications
- Third-party integrations beyond Google Workspace
- Payment processing

### 1.3 Definitions and Acronyms

| Term | Definition |
|------|------------|
| API | Application Programming Interface |
| CRUD | Create, Read, Update, Delete operations |
| ERD | Entity Relationship Diagram |
| JWT | JSON Web Token for authentication |
| OAuth | Open Authorization protocol |
| RBAC | Role-Based Access Control |
| REST | Representational State Transfer |
| SDD | Software Design Document |
| SPA | Single Page Application |
| SSO | Single Sign-On |
| UUID | Universally Unique Identifier |

### 1.4 References

| Reference | Description |
|-----------|-------------|
| Next.js 14 Documentation | https://nextjs.org/docs |
| Express.js Documentation | https://expressjs.com |
| PostgreSQL Documentation | https://postgresql.org/docs |
| Google OAuth 2.0 | https://developers.google.com/identity/protocols/oauth2 |
| Google Drive API | https://developers.google.com/drive/api |
| Google Sheets API | https://developers.google.com/sheets/api |
| Google Calendar API | https://developers.google.com/calendar/api |
| Tailwind CSS | https://tailwindcss.com/docs |
| Recharts Library | https://recharts.org |

---

## 2. Architectural Design

### 2.1 System Block Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌─────────────────┐    ┌──────────────────────────────────────────────┐   │
│  │   Web Browser   │───▶│  Next.js Frontend (React 18 + TypeScript)    │   │
│  └─────────────────┘    │  - Tailwind CSS                              │   │
│                         │  - Lucide Icons                               │   │
│                         │  - Recharts                                   │   │
│                         │  - React Context API                          │   │
│                         └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │ HTTP/REST
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY                                     │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    Express.js Server (Port 3001)                      │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │  │
│  │  │ Auth Middleware │  │ Permission      │  │ Route Handlers      │  │  │
│  │  │ (JWT Validation)│  │ Middleware      │  │ (REST Endpoints)    │  │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              ▼                       ▼                       ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│   BACKEND SERVICES  │  │   EXTERNAL APIS     │  │    DATA LAYER       │
│  ┌───────────────┐  │  │  ┌───────────────┐  │  │  ┌───────────────┐  │
│  │ Auth Service  │  │  │  │ Google OAuth  │  │  │  │  PostgreSQL   │  │
│  │ Org Service   │  │  │  │ Google Drive  │  │  │  │  Database     │  │
│  │ Project Svc   │  │  │  │ Google Sheets │  │  │  │               │  │
│  │ Task Service  │  │  │  │ Google Cal    │  │  │  │  Connection   │  │
│  │ Notif Service │  │  │  └───────────────┘  │  │  │  Pool         │  │
│  │ Activity Svc  │  │  │                     │  │  └───────────────┘  │
│  └───────────────┘  │  │                     │  │                     │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
```

### 2.2 Technology Stack Summary

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Frontend | Next.js | 14.x | React framework with SSR |
| Frontend | React | 18.x | UI component library |
| Frontend | TypeScript | 5.x | Type-safe JavaScript |
| Frontend | Tailwind CSS | 3.x | Utility-first CSS |
| Frontend | Lucide React | Latest | Icon library |
| Frontend | Recharts | 2.x | Chart visualization |
| Backend | Node.js | 20.x | JavaScript runtime |
| Backend | Express.js | 4.x | HTTP server framework |
| Backend | TypeScript | 5.x | Type-safe JavaScript |
| Database | PostgreSQL | 15.x | Relational database |
| Auth | JWT | - | Token-based authentication |
| Auth | Google OAuth 2.0 | - | SSO provider |

---

## Module 1: Authentication & User Management

### 1.1 Transaction: User Login via Google OAuth

#### User Interface Design

The login interface presents a clean, branded page with Google Sign-In button featuring the SkyFlow cloud theme with animated background elements.

**UI Components:**
- Animated cloud background with floating particles
- Centered login card with SkyFlow branding
- "Sign in with Google" button with Google icon
- Terms and privacy links in footer

#### Front-end Component(s)

| Component Name | Description and Purpose | Component Type |
|---------------|------------------------|----------------|
| LoginPage | Main login page with Google OAuth button and animated cloud background | Page Component (TSX) |
| OnboardingBackground | Animated cloud particles background for visual appeal | Presentational Component |
| OnboardingPage | Post-login user preference collection (role, team size, focus areas) | Page Component (TSX) |

#### Back-end Component(s)

| Component Name | Description and Purpose | Component Type |
|---------------|------------------------|----------------|
| auth.routes.ts | Handles OAuth callback, token generation, user creation | Express Router |
| auth.middleware.ts | Validates JWT tokens on protected routes | Middleware |
| google.ts | Configures Google OAuth clients and API access | Configuration |

#### Object-Oriented Components

**Class Diagram:**

```
┌─────────────────────────────────────┐
│              User                    │
├─────────────────────────────────────┤
│ + id: UUID                          │
│ + google_id: String                 │
│ + email: String                     │
│ + name: String                      │
│ + profile_picture: String           │
│ + access_token: String              │
│ + refresh_token: String             │
│ + onboarding_data: JSON             │
│ + created_at: Timestamp             │
├─────────────────────────────────────┤
│ + authenticate()                    │
│ + refreshToken()                    │
└─────────────────────────────────────┘
           ▲
           │ validates
┌─────────────────────────────────────┐
│         AuthMiddleware               │
├─────────────────────────────────────┤
│ + authenticateToken(req, res, next) │
│ + verifyJWT(token)                  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│       GoogleOAuthClient              │
├─────────────────────────────────────┤
│ + clientId: String                  │
│ + clientSecret: String              │
│ + redirectUri: String               │
├─────────────────────────────────────┤
│ + getAuthUrl()                      │
│ + getTokens(code)                   │
│ + getUserInfo(accessToken)          │
└─────────────────────────────────────┘
```

**Sequence Diagram:**

```
User        Frontend        Backend        Google OAuth       Database
 │              │               │                │                │
 │──Click Login─▶               │                │                │
 │              │──Redirect────▶│                │                │
 │              │               │───Auth URL────▶│                │
 │◀─────────────────────────────────────────────Show Consent      │
 │──Grant Permissions──────────────────────────▶│                │
 │              │◀──Auth Code────────────────────│                │
 │              │               │◀──Auth Code────│                │
 │              │               │──Exchange Code─▶│                │
 │              │               │◀──Tokens────────│                │
 │              │               │──Get User Info─▶│                │
 │              │               │◀──Profile───────│                │
 │              │               │───Upsert User──────────────────▶│
 │              │               │◀──User Data─────────────────────│
 │              │               │──Generate JWT──│                │
 │              │◀──JWT + User──│                │                │
 │              │──Store Local──│                │                │
 │◀─Redirect Dashboard          │                │                │
```

#### Data Design

**Users Table Schema:**

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    profile_picture TEXT,
    access_token TEXT,
    refresh_token TEXT,
    onboarding_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 1.2 Transaction: User Onboarding

#### User Interface Design

A multi-step onboarding wizard that collects user preferences including role, team size, and focus areas to personalize the dashboard experience.

#### Front-end Component(s)

| Component Name | Description and Purpose | Component Type |
|---------------|------------------------|----------------|
| OnboardingPage | Multi-step wizard for collecting user preferences | Page Component |
| OnboardingBackground | Animated particle background | Presentational Component |

#### Back-end Component(s)

| Component Name | Description and Purpose | Component Type |
|---------------|------------------------|----------------|
| user.routes.ts | PATCH endpoint to update user preferences | Express Router |

#### Object-Oriented Components

**Sequence Diagram:**

```
User          Frontend         Backend          Database
 │                │                │                │
 │──Complete Steps─▶               │                │
 │                │──Validate──────│                │
 │                │──PATCH /preferences────────────▶│
 │                │                │──UPDATE users──▶│
 │                │                │◀──Success───────│
 │                │◀──200 OK───────│                │
 │                │──Store Local───│                │
 │◀──Redirect Dashboard            │                │
```

#### Data Design

**Onboarding Data JSON Schema:**

```json
{
  "purpose": "string",
  "role": "string",
  "teamSize": "string",
  "focusAreas": ["string"],
  "hearAbout": "string",
  "completedAt": "timestamp"
}
```

---

## Module 2: Organization & Team Management

### 2.1 Transaction: Create Organization

#### User Interface Design

Organization creation flow with name input and automatic admin role assignment for the creator.

#### Front-end Component(s)

| Component Name | Description and Purpose | Component Type |
|---------------|------------------------|----------------|
| CreateOrgModal | Modal form for creating new organization | Modal Component |
| AppLayout | Main layout with organization switcher dropdown | Layout Component |

#### Back-end Component(s)

| Component Name | Description and Purpose | Component Type |
|---------------|------------------------|----------------|
| organization.routes.ts | POST /api/organizations - Creates org and adds creator as admin | Express Router |

#### Object-Oriented Components

**Class Diagram:**

```
┌─────────────────────────────────────┐
│          Organization                │
├─────────────────────────────────────┤
│ + id: UUID                          │
│ + name: String                      │
│ + description: String               │
│ + domain: String                    │
│ + created_at: Timestamp             │
├─────────────────────────────────────┤
│ + create()                          │
│ + update()                          │
│ + delete()                          │
└─────────────────────────────────────┘
           │ 1
           │
           │ has *
           ▼
┌─────────────────────────────────────┐
│      OrganizationMember              │
├─────────────────────────────────────┤
│ + id: UUID                          │
│ + organization_id: UUID             │
│ + user_id: UUID                     │
│ + role: String (admin/manager/member)│
│ + status: String                    │
│ + joined_at: Timestamp              │
├─────────────────────────────────────┤
│ + changeRole()                      │
│ + remove()                          │
└─────────────────────────────────────┘
           ▲
           │ belongs to *
           │ 1
┌─────────────────────────────────────┐
│              User                    │
├─────────────────────────────────────┤
│ + id: UUID                          │
│ + name: String                      │
│ + email: String                     │
└─────────────────────────────────────┘
```

**Sequence Diagram:**

```
User          Frontend         Backend          Database
 │                │                │                │
 │──Submit Org Name─▶              │                │
 │                │──POST /organizations───────────▶│
 │                │                │──INSERT org───▶│
 │                │                │◀──Org Data─────│
 │                │                │──INSERT member (admin)─▶
 │                │                │◀──Success──────│
 │                │◀──201 Created──│                │
 │                │──Update List───│                │
 │◀──Show New Org──│               │                │
```

#### Data Design

**Organizations Table:**

```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    domain VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) CHECK (role IN ('admin', 'manager', 'member')),
    status VARCHAR(20) DEFAULT 'active',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, user_id)
);
```

---

### 2.2 Transaction: Manage Team Roles

#### User Interface Design

Admin-only interface for viewing team members, changing roles via dropdown, and removing members with confirmation modal.

#### Front-end Component(s)

| Component Name | Description and Purpose | Component Type |
|---------------|------------------------|----------------|
| AdminTeamView | Admin view of team members with role management | Page Component |
| RoleManagement | Component for changing roles and removing members | Functional Component |
| usePermissions | Hook for checking user permissions | Custom Hook |

#### Back-end Component(s)

| Component Name | Description and Purpose | Component Type |
|---------------|------------------------|----------------|
| organization.routes.ts | PATCH /members/:id/role, DELETE /members/:id | Express Router |
| permission.middleware.ts | requireRole(), hasPermission() checks | Middleware |

#### Object-Oriented Components

**Class Diagram:**

```
┌─────────────────────────────────────┐
│       PermissionMiddleware           │
├─────────────────────────────────────┤
│ + ROLE_HIERARCHY: Object            │
│ + PERMISSIONS: Object               │
├─────────────────────────────────────┤
│ + hasPermission(userRole, required) │
│ + canPerform(userRole, action)      │
│ + requireRole(minRole)              │
│ + requirePermission(permission)     │
└─────────────────────────────────────┘
           │ authorizes
           ▼
┌─────────────────────────────────────┐
│        RoleManagement                │
├─────────────────────────────────────┤
│ + members: Member[]                 │
│ + organizationId: string            │
├─────────────────────────────────────┤
│ + handleRoleChange(id, role)        │
│ + handleRemoveMember(id)            │
└─────────────────────────────────────┘
```

**Sequence Diagram:**

```
Admin        Frontend        Backend       Middleware       Database
 │              │               │              │               │
 │──Change Role─▶               │              │               │
 │              │──PATCH /role──▶              │               │
 │              │               │──Check Admin─▶               │
 │              │               │              │──Get Role────▶│
 │              │               │              │◀──"admin"─────│
 │              │               │◀──Authorized─│               │
 │              │               │──UPDATE role─────────────────▶
 │              │               │◀──Success────────────────────│
 │              │◀──200 OK──────│              │               │
 │              │──Refresh──────│              │               │
 │◀──Updated Role│              │              │               │
```

#### Data Design

**Role Hierarchy:**

```
Role Levels:
  admin: 3    (Full access - manage team, delete projects)
  manager: 2  (Manage projects and tasks, invite members)
  member: 1   (View and update assigned tasks only)

Permission Mapping:
  REMOVE_MEMBER: requires 'admin'
  CHANGE_MEMBER_ROLE: requires 'admin'
  CREATE_PROJECT: requires 'manager'
  DELETE_PROJECT: requires 'admin'
  CREATE_TASK: requires 'manager'
  ASSIGN_TASK: requires 'manager'
```

---

## Module 3: Project Management

### 3.1 Transaction: Create Project

#### User Interface Design

Project creation form with name, description, status selection, accessible to admins and managers.

#### Front-end Component(s)

| Component Name | Description and Purpose | Component Type |
|---------------|------------------------|----------------|
| ProjectsPage | Main projects listing page | Page Component |
| AdminProjectView | Admin view with full CRUD capabilities | View Component |
| ManagerProjectView | Manager view with create/edit access | View Component |
| MemberProjectView | Read-only project view for members | View Component |

#### Back-end Component(s)

| Component Name | Description and Purpose | Component Type |
|---------------|------------------------|----------------|
| project.routes.ts | CRUD operations for projects | Express Router |

#### Object-Oriented Components

**Class Diagram:**

```
┌─────────────────────────────────────┐
│          Organization                │
├─────────────────────────────────────┤
│ + id: UUID                          │
│ + name: String                      │
└─────────────────────────────────────┘
           │ 1
           │ contains *
           ▼
┌─────────────────────────────────────┐
│            Project                   │
├─────────────────────────────────────┤
│ + id: UUID                          │
│ + organization_id: UUID             │
│ + name: String                      │
│ + description: String               │
│ + status: String                    │
│ + created_by: UUID                  │
│ + created_at: Timestamp             │
├─────────────────────────────────────┤
│ + create()                          │
│ + update()                          │
│ + delete()                          │
│ + getTasks()                        │
└─────────────────────────────────────┘
           │ 1
           │ contains *
           ▼
┌─────────────────────────────────────┐
│              Task                    │
├─────────────────────────────────────┤
│ + id: UUID                          │
│ + project_id: UUID                  │
│ + title: String                     │
│ + status: String                    │
│ + priority: String                  │
└─────────────────────────────────────┘
```

**Sequence Diagram:**

```
Manager       Frontend         Backend          Database
 │                │                │                │
 │──Fill Form─────▶                │                │
 │                │──POST /projects───────────────▶│
 │                │                │──Verify Role──│
 │                │                │──INSERT───────▶│
 │                │                │◀──Project──────│
 │                │◀──201 Created──│                │
 │                │──Add to List───│                │
 │◀──Show Success──│               │                │
```

#### Data Design

**Projects Table:**

```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    calendar_id VARCHAR(255),
    drive_folder_id VARCHAR(255),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 3.2 Transaction: View Project Dashboard

#### User Interface Design

Dashboard view showing project statistics, task breakdown by status, and team members assigned to the project.

#### Front-end Component(s)

| Component Name | Description and Purpose | Component Type |
|---------------|------------------------|----------------|
| ProfessionalDashboard | Statistics and charts for professional theme | Dashboard Component |
| ChartWidget | Customizable chart component using Recharts | Widget Component |
| ChartWidgetPicker | Modal for selecting widget types | Modal Component |

#### Back-end Component(s)

| Component Name | Description and Purpose | Component Type |
|---------------|------------------------|----------------|
| project.routes.ts | GET /api/projects/:id with task counts | Express Router |
| widget.routes.ts | CRUD for dashboard widgets | Express Router |

#### Data Design

**Board Widgets Table:**

```sql
CREATE TABLE board_widgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    widget_type VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    config JSONB DEFAULT '{}',
    position INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Module 4: Task Management

### 4.1 Transaction: Create Task

#### User Interface Design

Task creation modal with title, description, priority, due date, and assignee selection. Available in both Professional and Aviation themes.

#### Front-end Component(s)

| Component Name | Description and Purpose | Component Type |
|---------------|------------------------|----------------|
| TasksPage | Main tasks listing with filters | Page Component |
| AdminTaskView | Full CRUD task view for admins | View Component |
| ManagerTaskView | Task management for managers | View Component |
| MemberTaskView | Assigned tasks view for members | View Component |
| ProfessionalTeamBoard | Monday.com-style board view | Board Component |
| FlightManifest | Aviation-themed task board | Board Component |
| BoardingPassCard | Aviation-themed task card | Card Component |

#### Back-end Component(s)

| Component Name | Description and Purpose | Component Type |
|---------------|------------------------|----------------|
| task.routes.ts | CRUD operations for tasks | Express Router |
| activity.service.ts | Logs task activities | Service |
| notification.service.ts | Creates notifications on assignment | Service |

#### Object-Oriented Components

**Class Diagram:**

```
┌─────────────────────────────────────┐
│              Task                    │
├─────────────────────────────────────┤
│ + id: UUID                          │
│ + project_id: UUID                  │
│ + title: String                     │
│ + description: String               │
│ + status: String                    │
│ + priority: String                  │
│ + due_date: Date                    │
│ + assigned_to: UUID                 │
│ + created_by: UUID                  │
│ + created_at: Timestamp             │
├─────────────────────────────────────┤
│ + create()                          │
│ + update()                          │
│ + delete()                          │
│ + changeStatus()                    │
│ + assign()                          │
└─────────────────────────────────────┘
           │ 1              │ 1
           │ has *          │ tracks *
           ▼                ▼
┌──────────────────┐  ┌──────────────────┐
│   TaskComment    │  │    TimeEntry     │
├──────────────────┤  ├──────────────────┤
│ + id: UUID       │  │ + id: UUID       │
│ + task_id: UUID  │  │ + task_id: UUID  │
│ + user_id: UUID  │  │ + user_id: UUID  │
│ + content: String│  │ + hours: Decimal │
│ + created_at     │  │ + notes: String  │
├──────────────────┤  │ + entry_date     │
│ + create()       │  ├──────────────────┤
│ + delete()       │  │ + create()       │
└──────────────────┘  │ + delete()       │
                      └──────────────────┘
```

**Sequence Diagram:**

```
Manager    Frontend     Backend    ActivitySvc   NotifSvc    Database
 │            │            │            │            │           │
 │──Submit────▶            │            │            │           │
 │            │──POST /tasks──────────────────────────────────────▶
 │            │            │◀──Return Task────────────────────────│
 │            │            │──Log Activity─▶            │           │
 │            │            │            │──INSERT──────────────────▶
 │            │            │──Create Notification──────▶│           │
 │            │            │            │            │──INSERT───▶│
 │            │◀──201 Created│           │            │           │
 │◀──Success──│            │            │            │           │
```

#### Data Design

**Tasks Table:**

```sql
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'todo' 
        CHECK (status IN ('todo', 'in-progress', 'review', 'done', 'archived')),
    priority VARCHAR(20) DEFAULT 'medium' 
        CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    due_date TIMESTAMP,
    assigned_to UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);
```

---

### 4.2 Transaction: Update Task Status (Kanban Drag)

#### User Interface Design

Drag-and-drop Kanban board allowing users to move tasks between status columns (Todo, In Progress, Review, Done).

#### Front-end Component(s)

| Component Name | Description and Purpose | Component Type |
|---------------|------------------------|----------------|
| ProfessionalKanban | Kanban board with drag-drop support | Board Component |
| ControlTower | Aviation-themed status board | Board Component |
| CloudGroup | Status column container | Container Component |

#### Back-end Component(s)

| Component Name | Description and Purpose | Component Type |
|---------------|------------------------|----------------|
| task.routes.ts | PATCH /api/tasks/:id for status updates | Express Router |

#### Sequence Diagram

```
User          Frontend         Backend          Database
 │                │                │                │
 │──Drag to Done──▶                │                │
 │                │──Update Local──│                │
 │                │──PATCH {status: "done"}────────▶│
 │                │                │──UPDATE────────▶│
 │                │                │◀──Success───────│
 │                │◀──200 OK───────│                │
 │◀──Confirm Change│               │                │
```

---

## Module 5: Google Workspace Integration

### 5.1 Transaction: Access Google Drive Files

#### User Interface Design

File browser interface showing Google Drive files with grid/list views, file preview, and upload capabilities.

#### Front-end Component(s)

| Component Name | Description and Purpose | Component Type |
|---------------|------------------------|----------------|
| DrivePage | Google Drive file browser | Page Component |
| Portal | Modal portal for file preview | Utility Component |

#### Back-end Component(s)

| Component Name | Description and Purpose | Component Type |
|---------------|------------------------|----------------|
| drive.routes.ts | Proxy to Google Drive API | Express Router |
| google.ts | Google API client configuration | Configuration |

#### Object-Oriented Components

**Class Diagram:**

```
┌─────────────────────────────────────┐
│       GoogleDriveService             │
├─────────────────────────────────────┤
│ + drive: DriveClient                │
├─────────────────────────────────────┤
│ + listFiles(folderId)               │
│ + uploadFile(file, folderId)        │
│ + deleteFile(fileId)                │
│ + createFolder(name)                │
└─────────────────────────────────────┘
           │ manages
           ▼
┌─────────────────────────────────────┐
│           DriveFile                  │
├─────────────────────────────────────┤
│ + id: String                        │
│ + name: String                      │
│ + mimeType: String                  │
│ + size: String                      │
│ + modifiedTime: String              │
│ + webViewLink: String               │
│ + thumbnailLink: String             │
└─────────────────────────────────────┘
```

**Sequence Diagram:**

```
User          Frontend         Backend        Google Drive API
 │                │                │                │
 │──Open Drive────▶                │                │
 │                │──GET /drive/files─────────────▶│
 │                │                │──Get Tokens───│
 │                │                │──drive.files.list()──────────▶
 │                │                │◀──Files Array────────────────│
 │                │◀──Return Files─│                │
 │◀──Display Grid──│               │                │
```

#### Data Design

**Drive Files Cache (Optional):**

```sql
CREATE TABLE drive_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    google_drive_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100),
    size BIGINT,
    web_view_link TEXT,
    owner_id UUID REFERENCES users(id),
    project_id UUID REFERENCES projects(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 5.2 Transaction: Create Google Sheet

#### User Interface Design

Modal for creating new Google Sheets with title input, directly embedded editor view after creation.

#### Front-end Component(s)

| Component Name | Description and Purpose | Component Type |
|---------------|------------------------|----------------|
| SheetsPage | Google Sheets browser and viewer | Page Component |
| CreateSheetModal | Modal for new spreadsheet creation | Modal Component |

#### Back-end Component(s)

| Component Name | Description and Purpose | Component Type |
|---------------|------------------------|----------------|
| sheets.routes.ts | POST /api/sheets/create, GET /api/sheets/list | Express Router |

#### Sequence Diagram

```
User          Frontend         Backend        Google Sheets API
 │                │                │                │
 │──New Sheet─────▶                │                │
 │──Enter Title───▶                │                │
 │                │──POST /sheets/create───────────▶│
 │                │                │──spreadsheets.create()───────▶
 │                │                │◀──Spreadsheet Data───────────│
 │                │◀──{id, name, url}│              │
 │                │──Open Editor────│                │
 │◀──Show Sheet────│               │                │
```

---

## Module 6: Notifications & Activity

### 6.1 Transaction: View Notifications

#### User Interface Design

Bell icon in navbar with unread count badge, dropdown showing recent notifications with mark-as-read functionality.

#### Front-end Component(s)

| Component Name | Description and Purpose | Component Type |
|---------------|------------------------|----------------|
| NotificationBell | Navbar bell with dropdown | Functional Component |
| AppLayout | Contains notification bell in header | Layout Component |

#### Back-end Component(s)

| Component Name | Description and Purpose | Component Type |
|---------------|------------------------|----------------|
| notification.routes.ts | GET, PATCH for notifications | Express Router |
| notification.service.ts | Create notifications on events | Service |

#### Object-Oriented Components

**Class Diagram:**

```
┌─────────────────────────────────────┐
│       NotificationService            │
├─────────────────────────────────────┤
│ + create(userId, type, title, msg)  │
│ + markAsRead(notificationId)        │
│ + markAllAsRead(userId)             │
│ + getUnreadCount(userId)            │
└─────────────────────────────────────┘
           │ creates
           ▼
┌─────────────────────────────────────┐
│          Notification                │
├─────────────────────────────────────┤
│ + id: UUID                          │
│ + user_id: UUID                     │
│ + type: String                      │
│ + title: String                     │
│ + message: String                   │
│ + is_read: Boolean                  │
│ + related_task_id: UUID             │
│ + created_at: Timestamp             │
└─────────────────────────────────────┘
```

**Sequence Diagram:**

```
User          Frontend         Backend          Database
 │                │                │                │
 │                │  [Every 30 seconds]             │
 │                │──GET /notifications────────────▶│
 │                │                │──SELECT unread─▶│
 │                │                │◀──Notifications─│
 │                │◀──Return Array─│                │
 │                │──Update Badge──│                │
 │                │                │                │
 │──Click Bell────▶                │                │
 │◀──Show Dropdown│                │                │
 │──Click Notif───▶                │                │
 │                │──PATCH /read───────────────────▶│
 │                │                │──UPDATE────────▶│
 │◀──Navigate─────│                │                │
```

#### Data Design

**Notifications Table:**

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    related_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    related_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);
```

---

### 6.2 Transaction: Activity Feed

#### User Interface Design

Chronological feed showing recent actions within the organization (task created, status changed, comments added).

#### Front-end Component(s)

| Component Name | Description and Purpose | Component Type |
|---------------|------------------------|----------------|
| ActivityFeed | Scrollable activity list with icons | Functional Component |

#### Back-end Component(s)

| Component Name | Description and Purpose | Component Type |
|---------------|------------------------|----------------|
| activity.routes.ts | GET /api/organizations/:id/activity | Express Router |
| activity.service.ts | Log activity on various events | Service |

#### Data Design

**Activity Log Table:**

```sql
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    entity_name VARCHAR(255),
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_org_time ON activity_log(organization_id, created_at DESC);
```

---

## Complete Entity Relationship Diagram

```
┌─────────────────┐     ┌─────────────────────┐     ┌─────────────────┐
│     USERS       │     │ ORGANIZATION_MEMBERS│     │  ORGANIZATIONS  │
├─────────────────┤     ├─────────────────────┤     ├─────────────────┤
│ id (PK)         │◀────│ user_id (FK)        │     │ id (PK)         │
│ google_id (UK)  │     │ organization_id(FK) │────▶│ name            │
│ email (UK)      │     │ role                │     │ description     │
│ name            │     │ status              │     │ domain          │
│ profile_picture │     │ joined_at           │     │ created_at      │
│ access_token    │     └─────────────────────┘     └─────────────────┘
│ refresh_token   │                                          │
│ onboarding_data │                                          │ contains
│ created_at      │                                          ▼
└─────────────────┘                                 ┌─────────────────┐
        │                                           │    PROJECTS     │
        │ assigned_to                               ├─────────────────┤
        │                                           │ id (PK)         │
        ▼                                           │ organization_id │
┌─────────────────┐                                 │ name            │
│     TASKS       │◀────────────────────────────────│ description     │
├─────────────────┤                                 │ status          │
│ id (PK)         │                                 │ created_by (FK) │
│ project_id (FK) │                                 │ created_at      │
│ title           │                                 └─────────────────┘
│ description     │
│ status          │          ┌─────────────────┐
│ priority        │          │  TASK_COMMENTS  │
│ due_date        │          ├─────────────────┤
│ assigned_to(FK) │──────────│ task_id (FK)    │
│ created_by (FK) │          │ user_id (FK)    │
│ created_at      │          │ content         │
│ completed_at    │          │ created_at      │
└─────────────────┘          └─────────────────┘
        │
        │          ┌─────────────────┐
        └─────────▶│   TIME_ENTRIES  │
                   ├─────────────────┤
                   │ task_id (FK)    │
                   │ user_id (FK)    │
                   │ hours           │
                   │ notes           │
                   │ entry_date      │
                   └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  NOTIFICATIONS  │     │  ACTIVITY_LOG   │     │  BOARD_WIDGETS  │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │     │ id (PK)         │
│ user_id (FK)    │     │ organization_id │     │ organization_id │
│ type            │     │ user_id (FK)    │     │ widget_type     │
│ title           │     │ action          │     │ title           │
│ message         │     │ entity_type     │     │ config (JSONB)  │
│ is_read         │     │ entity_id       │     │ position        │
│ related_task_id │     │ entity_name     │     │ created_by (FK) │
│ created_at      │     │ details (JSONB) │     │ created_at      │
└─────────────────┘     │ created_at      │     └─────────────────┘
                        └─────────────────┘
```

---

## Appendix A: API Endpoints Summary

| Method | Endpoint | Description | Required Role |
|--------|----------|-------------|---------------|
| POST | /api/auth/google/callback | OAuth callback | Public |
| GET | /api/auth/me | Get current user | Authenticated |
| PATCH | /api/users/preferences | Update user preferences | Authenticated |
| GET | /api/organizations | List user's organizations | Authenticated |
| POST | /api/organizations | Create organization | Authenticated |
| GET | /api/organizations/:id/members | List members | Member |
| PATCH | /api/organizations/:id/members/:mid/role | Change role | Admin |
| DELETE | /api/organizations/:id/members/:mid | Remove member | Admin |
| GET | /api/organizations/:id/projects | List projects | Member |
| POST | /api/organizations/:id/projects | Create project | Manager |
| DELETE | /api/projects/:id | Delete project | Admin |
| GET | /api/organizations/:id/tasks | List tasks | Member |
| POST | /api/tasks | Create task | Manager |
| PATCH | /api/tasks/:id | Update task | Member (own) |
| DELETE | /api/tasks/:id | Delete task | Manager |
| GET | /api/notifications | Get notifications | Authenticated |
| PATCH | /api/notifications/:id/read | Mark as read | Authenticated |
| GET | /api/drive/files | List Drive files | Authenticated |
| POST | /api/sheets/create | Create spreadsheet | Authenticated |
| GET | /api/organizations/:id/widgets | Get widgets | Member |
| POST | /api/organizations/:id/widgets | Add widget | Member |
| DELETE | /api/widgets/:id | Remove widget | Member |

---

*End of Software Design Document*

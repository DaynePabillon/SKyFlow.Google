# SkyFlow - Mermaid Diagram Codes

Copy each code block into [mermaid.live](https://mermaid.live) and export as PNG/SVG.

---

## System Block Diagram

```mermaid
graph TB
    subgraph CLIENT["🖥️ Client Layer"]
        Browser["Web Browser"]
        NextJS["Next.js 14<br/>React 18 + TypeScript"]
    end

    subgraph FRONTEND["🎨 Frontend Technologies"]
        Tailwind["Tailwind CSS"]
        Lucide["Lucide Icons"]
        Recharts["Recharts"]
        Context["React Context API"]
    end

    subgraph API["⚡ API Gateway"]
        Express["Express.js Server<br/>Port 3001"]
        AuthMW["Auth Middleware<br/>JWT Validation"]
        PermMW["Permission Middleware<br/>RBAC"]
    end

    subgraph SERVICES["🔧 Backend Services"]
        AuthSvc["Auth Service"]
        OrgSvc["Organization Service"]
        ProjectSvc["Project Service"]
        TaskSvc["Task Service"]
        NotifSvc["Notification Service"]
        ActivitySvc["Activity Service"]
    end

    subgraph GOOGLE["☁️ Google APIs"]
        OAuth["Google OAuth 2.0"]
        Drive["Google Drive API"]
        Sheets["Google Sheets API"]
        Calendar["Google Calendar API"]
    end

    subgraph DATA["💾 Data Layer"]
        Postgres["PostgreSQL<br/>Database"]
        Pool["Connection Pool"]
    end

    Browser --> NextJS
    NextJS --> Tailwind
    NextJS --> Lucide
    NextJS --> Recharts
    NextJS --> Context

    NextJS -->|"HTTP/REST"| Express
    Express --> AuthMW
    AuthMW --> PermMW
    
    PermMW --> AuthSvc
    PermMW --> OrgSvc
    PermMW --> ProjectSvc
    PermMW --> TaskSvc
    PermMW --> NotifSvc
    PermMW --> ActivitySvc

    AuthSvc --> OAuth
    TaskSvc --> Drive
    TaskSvc --> Sheets
    TaskSvc --> Calendar

    AuthSvc --> Pool
    OrgSvc --> Pool
    ProjectSvc --> Pool
    TaskSvc --> Pool
    NotifSvc --> Pool
    ActivitySvc --> Pool
    Pool --> Postgres
```

---

## Module 1: Authentication & User Management

### 1.1 User Login via Google OAuth - Sequence Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant G as Google OAuth
    participant DB as PostgreSQL

    U->>F: Click "Sign in with Google"
    F->>G: Redirect to Google OAuth
    G->>U: Show consent screen
    U->>G: Grant permissions
    G->>F: Redirect with auth code
    F->>B: POST /api/auth/google/callback
    B->>G: Exchange code for tokens
    G->>B: Return access_token, refresh_token
    B->>G: Get user info
    G->>B: Return user profile
    B->>DB: Upsert user record
    DB->>B: Return user data
    B->>B: Generate JWT
    B->>F: Return JWT + user data
    F->>F: Store in localStorage
    F->>U: Redirect to dashboard
```

### 1.1 User Login via Google OAuth - Class Diagram

```mermaid
classDiagram
    class User {
        +UUID id
        +String google_id
        +String email
        +String name
        +String profile_picture
        +String access_token
        +String refresh_token
        +JSON onboarding_data
        +Timestamp created_at
        +authenticate()
        +refreshToken()
    }

    class AuthMiddleware {
        +authenticateToken(req, res, next)
        +verifyJWT(token) Boolean
        +extractToken(header) String
    }

    class GoogleOAuthClient {
        +String clientId
        +String clientSecret
        +String redirectUri
        +getAuthUrl() String
        +getTokens(authCode) TokenResponse
        +getUserInfo(accessToken) UserProfile
    }

    class AuthService {
        +handleCallback(code) User
        +generateJWT(user) String
        +findOrCreateUser(profile) User
    }

    AuthMiddleware --> User : validates
    AuthService --> GoogleOAuthClient : uses
    AuthService --> User : creates
```

---

### 1.2 User Onboarding - Sequence Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as Database

    U->>F: Complete onboarding steps
    F->>F: Validate inputs
    F->>B: PATCH /api/users/preferences
    B->>B: Authenticate token
    B->>DB: UPDATE users SET onboarding_data
    DB->>B: Success
    B->>F: 200 OK
    F->>F: Store preferences locally
    F->>U: Redirect to personalized dashboard
```

### 1.2 User Onboarding - Class Diagram

```mermaid
classDiagram
    class User {
        +UUID id
        +String email
        +String name
        +JSON onboarding_data
        +updatePreferences(data)
    }

    class OnboardingData {
        +String purpose
        +String role
        +String teamSize
        +Array focusAreas
        +String hearAbout
        +Timestamp completedAt
    }

    class UserService {
        +updatePreferences(userId, data) User
        +getPreferences(userId) OnboardingData
    }

    User --> OnboardingData : contains
    UserService --> User : updates
```

---

## Module 2: Organization & Team Management

### 2.1 Create Organization - Sequence Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as Database

    U->>F: Submit organization name
    F->>B: POST /api/organizations
    B->>B: Authenticate user
    B->>DB: INSERT INTO organizations
    DB->>B: Return org data
    B->>DB: INSERT INTO organization_members with role admin
    DB->>B: Success
    B->>F: 201 Created with org data
    F->>F: Update organization list
    F->>U: Show new organization
```

### 2.1 Create Organization - Class Diagram

```mermaid
classDiagram
    class Organization {
        +UUID id
        +String name
        +String description
        +String domain
        +Timestamp created_at
        +create()
        +update()
        +delete()
    }

    class OrganizationMember {
        +UUID id
        +UUID organization_id
        +UUID user_id
        +String role
        +String status
        +Timestamp joined_at
        +changeRole()
        +remove()
    }

    class User {
        +UUID id
        +String name
        +String email
    }

    Organization "1" --o "*" OrganizationMember : has
    User "1" --o "*" OrganizationMember : belongs to
```

---

### 2.2 Manage Team Roles - Sequence Diagram

```mermaid
sequenceDiagram
    participant A as Admin
    participant F as Frontend
    participant B as Backend
    participant M as Middleware
    participant DB as Database

    A->>F: Change member role to manager
    F->>B: PATCH /api/organizations/:orgId/members/:memberId/role
    B->>M: Check admin permission
    M->>DB: Get user role
    DB->>M: Return admin
    M->>B: Authorized
    B->>DB: UPDATE organization_members SET role
    DB->>B: Success
    B->>F: 200 OK
    F->>F: Refresh member list
    F->>A: Show updated role
```

### 2.2 Manage Team Roles - Class Diagram

```mermaid
classDiagram
    class PermissionMiddleware {
        +Object ROLE_HIERARCHY
        +Object PERMISSIONS
        +hasPermission(userRole, requiredRole) Boolean
        +canPerform(userRole, action) Boolean
        +requireRole(minRole) Middleware
        +requirePermission(permission) Middleware
    }

    class RoleManagement {
        +Array members
        +String organizationId
        +String currentUserId
        +handleRoleChange(memberId, newRole)
        +handleRemoveMember(memberId)
    }

    class OrganizationMember {
        +UUID id
        +UUID user_id
        +String role
        +String status
    }

    PermissionMiddleware --> RoleManagement : authorizes
    RoleManagement --> OrganizationMember : manages
```

---

## Module 3: Project Management

### 3.1 Create Project - Sequence Diagram

```mermaid
sequenceDiagram
    participant M as Manager
    participant F as Frontend
    participant B as Backend
    participant DB as Database

    M->>F: Fill project form
    F->>B: POST /api/organizations/:orgId/projects
    B->>B: Verify manager or admin role
    B->>DB: INSERT INTO projects
    DB->>B: Return project data
    B->>F: 201 Created
    F->>F: Add to project list
    F->>M: Show success message
```

### 3.1 Create Project - Class Diagram

```mermaid
classDiagram
    class Project {
        +UUID id
        +UUID organization_id
        +String name
        +String description
        +String status
        +UUID created_by
        +Timestamp created_at
        +create()
        +update()
        +delete()
        +getTasks()
    }

    class Organization {
        +UUID id
        +String name
    }

    class Task {
        +UUID id
        +UUID project_id
        +String title
        +String status
    }

    Organization "1" --o "*" Project : contains
    Project "1" --o "*" Task : contains
```

---

### 3.2 View Project Dashboard - Sequence Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as Database

    U->>F: Navigate to project
    F->>B: GET /api/projects/:id
    B->>DB: SELECT project with task counts
    DB->>B: Return project data
    B->>F: Return project with stats
    F->>B: GET /api/organizations/:id/widgets
    B->>DB: SELECT board_widgets
    DB->>B: Return widgets
    B->>F: Return widget config
    F->>F: Render dashboard with charts
    F->>U: Display project dashboard
```

### 3.2 View Project Dashboard - Class Diagram

```mermaid
classDiagram
    class ProjectDashboard {
        +Project project
        +Array stats
        +Array widgets
        +fetchProject()
        +fetchWidgets()
        +renderCharts()
    }

    class ChartWidget {
        +UUID id
        +String widget_type
        +String title
        +JSON config
        +Number position
        +render()
        +remove()
    }

    class ChartWidgetPicker {
        +Boolean isOpen
        +Array widgetTypes
        +onSelect(type)
        +onClose()
    }

    ProjectDashboard --> ChartWidget : displays
    ProjectDashboard --> ChartWidgetPicker : opens
```

---

## Module 4: Task Management

### 4.1 Create Task - Sequence Diagram

```mermaid
sequenceDiagram
    participant M as Manager
    participant F as Frontend
    participant B as Backend
    participant AS as ActivityService
    participant NS as NotificationService
    participant DB as Database

    M->>F: Submit task form
    F->>B: POST /api/tasks
    B->>DB: INSERT INTO tasks
    DB->>B: Return task
    B->>AS: Log activity
    AS->>DB: INSERT INTO activity_log
    B->>NS: Create notification for assignee
    NS->>DB: INSERT INTO notifications
    B->>F: 201 Created
    F->>M: Show success
```

### 4.1 Create Task - Class Diagram

```mermaid
classDiagram
    class Task {
        +UUID id
        +UUID project_id
        +String title
        +String description
        +String status
        +String priority
        +Date due_date
        +UUID assigned_to
        +UUID created_by
        +Timestamp created_at
        +create()
        +update()
        +delete()
        +changeStatus()
        +assign()
    }

    class TaskComment {
        +UUID id
        +UUID task_id
        +UUID user_id
        +String content
        +Timestamp created_at
        +create()
        +delete()
    }

    class TimeEntry {
        +UUID id
        +UUID task_id
        +UUID user_id
        +Decimal hours
        +String notes
        +Date entry_date
        +create()
        +delete()
    }

    Task "1" --o "*" TaskComment : has
    Task "1" --o "*" TimeEntry : tracks
```

---

### 4.2 Update Task Status (Kanban) - Sequence Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as Database

    U->>F: Drag task to Done column
    F->>F: Update local state optimistically
    F->>B: PATCH /api/tasks/:id
    Note over B: body: {status: "done"}
    B->>DB: UPDATE tasks SET status, completed_at
    DB->>B: Success
    B->>F: 200 OK
    F->>U: Confirm status change
```

### 4.2 Update Task Status (Kanban) - Class Diagram

```mermaid
classDiagram
    class KanbanBoard {
        +Array columns
        +Array tasks
        +onDragEnd(result)
        +moveTask(taskId, newStatus)
        +refreshTasks()
    }

    class KanbanColumn {
        +String status
        +String title
        +Array tasks
        +render()
    }

    class TaskCard {
        +Task task
        +onClick()
        +onDrag()
    }

    KanbanBoard "1" --o "*" KanbanColumn : contains
    KanbanColumn "1" --o "*" TaskCard : displays
```

---

## Module 5: Google Workspace Integration

### 5.1 Access Google Drive - Sequence Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant G as Google Drive API

    U->>F: Open Drive page
    F->>B: GET /api/drive/files
    B->>B: Get user tokens from DB
    B->>G: drive.files.list()
    G->>B: Return files array
    B->>F: Return files
    F->>U: Display file grid
    U->>F: Click file
    F->>F: Open preview modal
    F->>U: Show embedded preview
```

### 5.1 Access Google Drive - Class Diagram

```mermaid
classDiagram
    class DrivePage {
        +Array files
        +String viewMode
        +String searchQuery
        +DriveFile selectedFile
        +fetchFiles()
        +uploadFile()
        +deleteFile()
        +handleFileClick()
    }

    class DriveFile {
        +String id
        +String name
        +String mimeType
        +String size
        +String modifiedTime
        +String webViewLink
        +String thumbnailLink
    }

    class GoogleDriveService {
        +listFiles(folderId) Array
        +uploadFile(file) DriveFile
        +deleteFile(fileId) Boolean
        +createFolder(name) DriveFile
    }

    DrivePage --> DriveFile : displays
    GoogleDriveService --> DriveFile : manages
```

---

### 5.2 Create Google Sheet - Sequence Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant G as Google Sheets API

    U->>F: Click New Sheet
    F->>F: Show create modal
    U->>F: Enter title
    F->>B: POST /api/sheets/create
    Note over B: body: {title: "My Sheet"}
    B->>G: sheets.spreadsheets.create()
    G->>B: Return spreadsheet data
    B->>F: Return id, name, webViewLink
    F->>F: Open embedded editor
    F->>U: Display editable spreadsheet
```

### 5.2 Create Google Sheet - Class Diagram

```mermaid
classDiagram
    class SheetsPage {
        +Array spreadsheets
        +Spreadsheet selectedSheet
        +Boolean showCreateModal
        +String newSheetTitle
        +fetchSpreadsheets()
        +createSpreadsheet()
        +deleteSpreadsheet()
        +handleSheetClick()
    }

    class Spreadsheet {
        +String id
        +String name
        +String modifiedTime
        +String webViewLink
        +Array owners
    }

    class GoogleSheetsService {
        +listSpreadsheets() Array
        +createSpreadsheet(title) Spreadsheet
        +getSpreadsheet(id) Spreadsheet
    }

    SheetsPage --> Spreadsheet : displays
    GoogleSheetsService --> Spreadsheet : creates
```

---

## Module 6: Notifications & Activity

### 6.1 View Notifications - Sequence Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as Database

    loop Every 30 seconds
        F->>B: GET /api/notifications
        B->>DB: SELECT FROM notifications WHERE user_id AND NOT is_read
        DB->>B: Return notifications
        B->>F: Return notifications array
        F->>F: Update bell badge count
    end

    U->>F: Click notification bell
    F->>U: Show dropdown
    U->>F: Click notification
    F->>B: PATCH /api/notifications/:id/read
    B->>DB: UPDATE notifications SET is_read = true
    DB->>B: Success
    B->>F: 200 OK
    F->>U: Navigate to related item
```

### 6.1 View Notifications - Class Diagram

```mermaid
classDiagram
    class NotificationBell {
        +Array notifications
        +Number unreadCount
        +Boolean isOpen
        +fetchNotifications()
        +markAsRead(id)
        +markAllAsRead()
        +handleClick(notification)
    }

    class Notification {
        +UUID id
        +UUID user_id
        +String type
        +String title
        +String message
        +Boolean is_read
        +UUID related_task_id
        +Timestamp created_at
    }

    class NotificationService {
        +create(userId, type, title, message) Notification
        +markAsRead(notificationId) Boolean
        +markAllAsRead(userId) Boolean
        +getUnreadCount(userId) Number
    }

    NotificationBell --> Notification : displays
    NotificationService --> Notification : creates
```

---

### 6.2 Activity Feed - Sequence Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as Database

    U->>F: Open dashboard or activity view
    F->>B: GET /api/organizations/:id/activity
    B->>DB: SELECT FROM activity_log ORDER BY created_at DESC LIMIT 50
    DB->>B: Return activity records
    B->>F: Return activity array
    F->>F: Render activity feed with icons
    F->>U: Display recent activities
```

### 6.2 Activity Feed - Class Diagram

```mermaid
classDiagram
    class ActivityFeed {
        +Array activities
        +Boolean loading
        +String organizationId
        +fetchActivities()
        +renderActivity(activity)
        +getActivityIcon(action)
    }

    class ActivityLog {
        +UUID id
        +UUID organization_id
        +UUID user_id
        +String action
        +String entity_type
        +UUID entity_id
        +String entity_name
        +JSON details
        +Timestamp created_at
    }

    class ActivityService {
        +log(orgId, userId, action, entity) ActivityLog
        +getByOrganization(orgId, limit) Array
    }

    ActivityFeed --> ActivityLog : displays
    ActivityService --> ActivityLog : creates
```

---

## Complete ERD (Entity Relationship Diagram)

```mermaid
erDiagram
    USERS {
        uuid id PK
        string google_id UK
        string email UK
        string name
        string profile_picture
        text access_token
        text refresh_token
        jsonb onboarding_data
        timestamp created_at
    }

    ORGANIZATIONS {
        uuid id PK
        string name
        text description
        string domain
        timestamp created_at
    }

    ORGANIZATION_MEMBERS {
        uuid id PK
        uuid organization_id FK
        uuid user_id FK
        string role
        string status
        timestamp joined_at
    }

    PROJECTS {
        uuid id PK
        uuid organization_id FK
        string name
        text description
        string status
        uuid created_by FK
        timestamp created_at
    }

    TASKS {
        uuid id PK
        uuid project_id FK
        string title
        text description
        string status
        string priority
        timestamp due_date
        uuid assigned_to FK
        uuid created_by FK
        timestamp created_at
        timestamp completed_at
    }

    TASK_COMMENTS {
        uuid id PK
        uuid task_id FK
        uuid user_id FK
        text content
        timestamp created_at
    }

    TIME_ENTRIES {
        uuid id PK
        uuid task_id FK
        uuid user_id FK
        decimal hours
        text notes
        date entry_date
    }

    NOTIFICATIONS {
        uuid id PK
        uuid user_id FK
        string type
        string title
        text message
        boolean is_read
        uuid related_task_id FK
        timestamp created_at
    }

    ACTIVITY_LOG {
        uuid id PK
        uuid organization_id FK
        uuid user_id FK
        string action
        string entity_type
        uuid entity_id
        string entity_name
        jsonb details
        timestamp created_at
    }

    BOARD_WIDGETS {
        uuid id PK
        uuid organization_id FK
        string widget_type
        string title
        jsonb config
        int position
        uuid created_by FK
    }

    USERS ||--o{ ORGANIZATION_MEMBERS : belongs_to
    ORGANIZATIONS ||--o{ ORGANIZATION_MEMBERS : has
    ORGANIZATIONS ||--o{ PROJECTS : contains
    ORGANIZATIONS ||--o{ ACTIVITY_LOG : logs
    ORGANIZATIONS ||--o{ BOARD_WIDGETS : displays
    PROJECTS ||--o{ TASKS : contains
    USERS ||--o{ TASKS : assigned_to
    USERS ||--o{ TASKS : created_by
    TASKS ||--o{ TASK_COMMENTS : has
    TASKS ||--o{ TIME_ENTRIES : tracks
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ TASK_COMMENTS : writes
    USERS ||--o{ TIME_ENTRIES : logs
```

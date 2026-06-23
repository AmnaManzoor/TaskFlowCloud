# TaskFlow Web

Enterprise Angular frontend for the TaskFlow task management platform. Includes a production-ready authentication module, layout shell, theming, HTTP infrastructure, and shared UI components — ready for feature modules in upcoming prompts.

## Technology Stack

| Technology | Purpose |
| ---------- | ------- |
| Angular 20 | Application framework |
| TypeScript (strict) | Type-safe development |
| Standalone Components | Tree-shakable, module-free architecture |
| Angular Signals | Reactive state without NgRx |
| Angular Material 3 | Enterprise UI components |
| Angular CDK | Layout breakpoints, overlays |
| RxJS | Async streams (HTTP, router) |
| SCSS | Theming and design tokens |
| ESLint + Prettier | Code quality and formatting |
| Karma + Jasmine | Unit testing |

## Project Structure

```text
client/
├── src/
│   ├── app/
│   │   ├── core/                 # Singleton services, guards, interceptors, stores
│   │   │   ├── authentication/   # Auth module (services, pages, guards, stores)
│   │   │   ├── config/           # App config token, preloading, i18n prep
│   │   │   ├── error-handling/   # Global error handler
│   │   │   ├── guards/           # Re-exports auth guards
│   │   │   ├── interceptors/     # loading, jwt, auth, error
│   │   │   ├── logging/          # LoggerService (console)
│   │   │   ├── services/         # ApiBaseService, LoadingService, ThemeService
│   │   │   ├── stores/           # Auth, App, Theme, Notification (signals)
│   │   │   └── utils/            # Storage, trackBy helpers
│   │   ├── shared/               # Reusable UI, pipes, directives, validators
│   │   │   ├── components/       # Spinner, cards, badges, table, dialogs, etc.
│   │   │   ├── directives/
│   │   │   ├── pipes/
│   │   │   └── validators/
│   │   ├── layout/               # Main/auth layouts, header, sidebar, footer
│   │   ├── features/             # Lazy-loaded feature placeholders
│   │   │   ├── auth/
│   │   │   ├── dashboard/        # Dashboard module (KPIs, charts, widgets)
│   │   │   ├── projects/           # Project management module
│   │   │   ├── tasks/
│   │   │   ├── users/
│   │   │   ├── organizations/    # Org, team, user management module
│   │   │   ├── settings/
│   │   │   ├── profile/
│   │   │   └── errors/
│   │   ├── app.ts
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── environments/             # Strongly typed environment config
│   ├── styles/                   # SCSS partials (variables, theme, utilities)
│   └── styles.scss
├── angular.json
├── eslint.config.js
└── package.json
```

## Path Aliases

| Alias | Path |
| ----- | ---- |
| `@core/*` | `src/app/core/*` |
| `@shared/*` | `src/app/shared/*` |
| `@layout/*` | `src/app/layout/*` |
| `@features/*` | `src/app/features/*` |
| `@env/*` | `src/environments/*` |

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Install

```bash
cd client
npm install
```

### Development Server

```bash
npm start
```

Open `http://localhost:4200`. The dev server proxies `/api` to the backend (`proxy.conf.json` → `http://localhost:5277`).

Ensure the TaskFlow API is running before signing in.

### Build

```bash
npm run build          # production build
npm run build:prod     # explicit production configuration
```

Output: `dist/taskflow-web/`

### Test

```bash
npm test               # watch mode
npm run test:ci        # single run (headless)
```

### Lint & Format

```bash
npm run lint
npm run format
```

## Routing

| Route | Layout | Auth | Description |
| ----- | ------ | ---- | ----------- |
| `/login` | Auth | Guest | Sign in |
| `/register` | Auth | Guest | Create account |
| `/forgot-password` | Auth | Guest | Request password reset |
| `/reset-password` | Auth | Guest | Reset password (code via form) |
| `/verify-email` | Auth | Guest | Verify email / resend |
| `/dashboard` | Main | Required | Enterprise dashboard overview |
| `/profile` | Main | Required | View/edit profile |
| `/change-password` | Main | Required | Change password |
| `/projects` | Main | Required | Project list, details, members, settings |
| `/tasks` | Main | Required | Task board, list, calendar, details drawer |
| `/organizations` | Main | Required | Organization list, details, members, teams, settings |
| `/users` | Main | Required | User list, details, profile admin, lifecycle actions |
| `/settings` | Main | Required | Settings placeholder |
| `/forbidden` | None | — | 403 unauthorized |
| `/session-expired` | None | — | Session expired |
| `/not-found` | None | — | 404 page |
| `/server-error` | None | — | 500 page |

All feature routes use **lazy loading**. Dashboard uses `data: { preload: true }`.

## Authentication Module

### Folder Structure

```text
core/authentication/
├── components/       # login-form, register-form, password-input, password-strength
├── guards/           # authGuard, guestGuard, roleGuard
├── models/           # AuthResponse, UserProfile, request DTOs
├── pages/            # login, register, forgot/reset password, verify email, profile
├── services/         # AuthService, AuthApiService, TokenService
├── stores/           # AuthStore (signals)
├── utils/            # API error parsing
└── validators/       # email, password, strength rules
```

### Authentication Flow

```text
Login/Register → API returns AuthResponse (access + refresh tokens + user)
       ↓
TokenService stores tokens (localStorage if Remember Me, else sessionStorage)
       ↓
AuthStore.setSession(accessToken, user)
       ↓
Navigate to /dashboard (or returnUrl)
       ↓
jwtInterceptor attaches Bearer token on API calls
       ↓
Proactive refresh 60s before access token expiry
       ↓
On 401 → refreshTokens() → retry request (or /session-expired)
       ↓
Logout → revoke refresh token → clear storage → /login
```

### Token Storage Strategy

| Item | Storage key | Location |
| ---- | ----------- | -------- |
| Access token | `taskflow_access_token` | localStorage (remember me) or sessionStorage |
| Refresh token | `taskflow_refresh_token` | Same as access token |
| Expiration | `taskflow_access_token_expires_at` | Same as access token |
| Remember me flag | `taskflow_remember_me` | localStorage |

JWT access tokens are **never** placed in URLs. Email verification and password reset codes are entered via forms (query params may pre-fill email only).

### Route Guard Strategy

| Guard | Purpose |
| ----- | ------- |
| `authGuard` | Protects main layout routes; restores session from storage; redirects to `/login?returnUrl=` |
| `guestGuard` | Blocks authenticated users from login/register pages |
| `roleGuard(roles)` | Factory guard for role-based routes → `/forbidden` |

### API Endpoints Consumed

| Method | Endpoint | Purpose |
| ------ | -------- | ------- |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/logout` | Revoke refresh token |
| POST | `/api/auth/refresh-token` | Rotate tokens |
| POST | `/api/auth/change-password` | Change password |
| POST | `/api/auth/forgot-password` | Request reset |
| POST | `/api/auth/reset-password` | Reset password |
| POST | `/api/auth/verify-email` | Verify email |
| POST | `/api/auth/resend-verification` | Resend verification |
| GET | `/api/auth/me` | Current user profile |
| PUT | `/api/users/{id}` | Update profile |

### AuthStore

Signal-based state (no NgRx):

| Signal | Description |
| ------ | ----------- |
| `user` | Current `UserProfile` |
| `accessToken` | JWT access token |
| `isAuthenticated` | Computed from access token |
| `roles` | Computed from user.roles |
| `permissions` | Derived permission strings |
| `isLoading` | Auth operation in progress |
| `error` | Last auth error message |

## Theming

- **Light**, **Dark**, and **System** modes via header theme menu
- Preference persisted in `localStorage` (`taskflow_theme`)
- Material 3 CSS variables via `@angular/material` theming
- Body classes: `theme-light` / `theme-dark`

## State Management

Signal-based stores in `@core/stores/` — no NgRx:

| Store | Purpose |
| ----- | ------- |
| `AuthStore` | User, tokens, roles, permissions, loading/error |
| `ThemeStore` | Theme mode + resolved theme |
| `AppStore` | Sidebar, online status, init flag |
| `NotificationStore` | Notification list placeholder |
| `DashboardStore` | Dashboard data, filters, loading/error state |

## Dashboard Module

Enterprise SaaS dashboard with KPI cards, Chart.js analytics, activity timeline, notifications widget, and responsive widget grid.

### Folder Structure

```text
features/dashboard/
├── components/
│   ├── activity-chart/          # Monthly activity trend (completion report)
│   ├── activity-feed/           # Activity timeline
│   ├── calendar-widget/         # Upcoming due dates
│   ├── dashboard-header/        # Greeting, search UI, refresh, date range
│   ├── notifications-widget/    # Recent notifications + mark read
│   ├── priority-chart/          # Tasks by priority
│   ├── productivity-chart/      # Weekly productivity trend
│   ├── project-progress/        # Project completion chart
│   ├── quick-actions/           # Shortcut buttons
│   ├── recent-projects/         # Recent project list
│   ├── recent-tasks/            # Recent task list
│   ├── stat-card/               # KPI statistic card
│   ├── task-status-chart/       # Task status distribution
│   └── workload-chart/          # Workload by assignee
├── models/                      # API DTOs + view models
├── pages/dashboard-page/        # Page shell + responsive grid
├── services/dashboard.service.ts
└── stores/dashboard.store.ts
```

Shared dashboard UI (`shared/components/`): `chart-canvas`, `chart-card`, `dashboard-widget`, `section-header`, `progress-bar`, `status-chip`, `priority-chip`, `quick-action-button`, `user-avatar-group`, `widget-error`.

### Component Hierarchy

```text
DashboardPageComponent
├── DashboardHeaderComponent (search placeholder, refresh, date filter)
├── StatCardComponent × 8 (KPI grid)
├── Charts row
│   ├── TaskStatusChartComponent
│   ├── PriorityChartComponent
│   ├── ProductivityChartComponent
│   ├── ActivityChartComponent
│   ├── WorkloadChartComponent
│   └── ProjectProgressComponent
├── RecentTasksComponent
├── RecentProjectsComponent
└── Sidebar widgets
    ├── ActivityFeedComponent
    ├── NotificationsWidgetComponent
    ├── QuickActionsComponent
    └── CalendarWidgetComponent
```

Each chart/list widget wraps `DashboardWidgetComponent` for consistent loading, empty, and error states.

### State Management (`DashboardStore`)

Signal-based store — no NgRx. The store orchestrates a parallel API bundle via `DashboardService.loadDashboard()` and exposes readonly signals to presentational components.

| Signal / Computed | Description |
| ----------------- | ----------- |
| `personal` | Personal dashboard response from `/api/dashboard/me` |
| `statCards` | Computed KPI view models mapped from API fields |
| `recentTasks`, `recentProjects` | From task/project reports |
| `activity`, `notifications` | Activity feed + notification list |
| `statusChart`, `priorityChart`, etc. | Chart data from report endpoints |
| `calendarEvents` | Computed from personal due counts + overdue report |
| `loading`, `refreshing`, `error` | UX state |
| `filters`, `dateRange`, `selectedOrganizationId` | Filter state |

Methods: `load()`, `refresh()`, `setDateRange()`, `setOrganizationId()`, `markNotificationRead()`, `markAllNotificationsRead()`.

### API Endpoints Consumed

| Method | Endpoint | Dashboard use |
| ------ | -------- | ------------- |
| GET | `/api/dashboard/me` | Personal KPIs, recent projects/activity/notifications |
| GET | `/api/notifications/count` | Unread badge |
| GET | `/api/notifications` | Notification widget list |
| PATCH | `/api/notifications/{id}/read` | Mark as read |
| PATCH | `/api/notifications/read-all` | Mark all read |
| GET | `/api/activity` | Activity timeline |
| GET | `/api/reports/tasks` | Recent tasks + task breakdown |
| GET | `/api/reports/projects` | Project stats + recent projects |
| GET | `/api/reports/status` | Task status chart |
| GET | `/api/reports/priority` | Priority chart |
| GET | `/api/reports/productivity` | Weekly productivity chart |
| GET | `/api/reports/completion` | Monthly activity chart |
| GET | `/api/reports/workload` | Workload distribution chart |
| GET | `/api/reports/overdue` | Calendar overdue items |

All statistics are sourced from the backend — the client maps API fields to view models without aggregating raw data.

### Widget Design

- **DashboardWidgetComponent** — shared shell with title, skeleton loading, empty state, inline error + retry
- **StatCardComponent** — icon, value, description, trend label, skeleton state
- **ChartCanvasComponent** — Chart.js wrapper (bar, line, doughnut) with theme-aware colors
- **WidgetErrorComponent** — full-page error with retry for failed dashboard load

### Responsive Strategy

- **BreakpointObserver** (`max-width: 959px`) for mobile collapsible activity feed
- CSS grid breakpoints at 600px, 960px, 1280px
- Mobile: stacked single-column cards
- Tablet: 2-column stat grid + 2-column charts
- Desktop: 4-column stats, 3-column charts, 2-column main + sidebar

Dashboard API calls use `skipLoading: true` so the global overlay does not block the page; widgets show skeleton loaders instead.

## Organization, Team & User Management

Enterprise admin module (Azure DevOps / Teams Admin Center style) for workspaces, teams, and user lifecycle.

### Folder Structure

```text
features/organizations/
├── components/          # organization-card, organization-table, member-table, role-badge, shell, search-toolbar
├── dialogs/             # add-member, update-member-role
├── models/              # Organization, Team, User DTOs + PagedResult
├── pages/               # organization list/create/details/edit/members
├── teams/               # team list/create/details/edit/members pages
├── users/               # user list/details/profile pages (also mounted at /users)
├── services/            # OrganizationService, TeamService, UserManagementService
├── stores/              # OrganizationStore, TeamStore, UserStore (signals)
├── utils/               # permissions.util (role-based UI visibility)
└── routes.ts            # ORGANIZATION_MANAGEMENT_ROUTES + USER_MANAGEMENT_ROUTES
```

### Routing

| Route | Page |
| ----- | ---- |
| `/organizations` | Organization list (table/card toggle, search, pagination) |
| `/organizations/new` | Create organization |
| `/organizations/:id/overview` | Organization overview |
| `/organizations/:id/members` | Member management |
| `/organizations/:id/teams` | Team list |
| `/organizations/:id/teams/new` | Create team |
| `/organizations/:id/teams/:teamId` | Team details |
| `/organizations/:id/teams/:teamId/members` | Assign/remove team members |
| `/organizations/:id/settings` | Edit organization / settings |
| `/users` | User list (admin) |
| `/users/:id` | User details (roles, activate/deactivate, lock/unlock) |
| `/users/:id/profile` | Edit user profile |

All routes are lazy-loaded. `/users` re-exports routes from `features/organizations/routes.ts`.

### Component Hierarchy

```text
OrganizationListPage
├── PageHeader + SearchToolbar
├── OrganizationTable / OrganizationCard grid
└── Pagination

OrganizationShell (tab layout + breadcrumb)
├── OrganizationDetailsPage (overview)
├── OrganizationMembersPage → MemberTable + AddMemberDialog
├── TeamListPage → team table + pagination
├── TeamDetailsPage / TeamEditPage / TeamMembersPage
└── OrganizationEditPage (settings)

UserListPage → Material table + SearchToolbar + Pagination
UserDetailsPage → roles chips + lifecycle action buttons
UserProfilePage → profile edit form
```

### State Management

Three signal stores, each mirroring the dashboard pattern:

| Store | Responsibility |
| ----- | -------------- |
| `OrganizationStore` | Org list/detail, members, pagination, search, filters, `currentMemberRole` computed |
| `TeamStore` | Teams scoped by organization, members, CRUD |
| `UserStore` | User list/detail, profile update, activate/deactivate/lock/unlock |

### API Endpoints

**Organizations:** `GET/POST /api/organizations`, `GET/PUT/DELETE /api/organizations/{id}`, member CRUD at `/members`

**Teams:** `GET/POST /api/teams`, `GET/PUT/DELETE /api/teams/{id}`, member add/remove at `/members`

**Users:** `GET /api/users`, `GET/PUT /api/users/{id}`, `POST .../activate|deactivate|lock|unlock`

Organization roles (Member/Manager/Administrator/Owner) are managed via org member endpoints. System roles are read-only on user detail.

### Authorization

UI actions gated via `permissions.util.ts`:

- `canManageOrganization` — Owner/Administrator or SuperAdmin/Admin
- `canManageTeams` — adds Manager role
- `canManageUsers` — SuperAdmin/Admin system roles

Backend enforces fine-grained access; UI hides unauthorized actions.

## Project Management Module

Enterprise project module for browsing, creating, and managing projects within organizations.

### Folder Structure

```text
features/projects/
├── components/
│   ├── project-card/           # Grid view card
│   ├── project-table/          # Sortable list table
│   ├── project-form/           # Shared create/edit reactive form
│   ├── project-header/         # Detail page header
│   ├── project-summary/        # Statistics cards
│   ├── project-status/         # Status chip
│   ├── project-priority/       # Priority badge
│   ├── project-progress/       # Progress bar
│   ├── project-toolbar/        # Search + filters
│   ├── project-filter/         # Organization, status, priority filters
│   ├── project-shell/          # Tab layout (overview, members, settings, tasks, activity)
│   └── member-list/            # Project members table
├── dialogs/                    # add-member, update-role, transfer-owner
├── models/                     # DTOs, enums, utils
├── pages/                      # list, create, details, members, settings
├── services/
│   ├── project-api.service.ts  # HTTP layer (all /api/projects endpoints)
│   └── project.service.ts      # List orchestration (list vs search)
├── stores/project.store.ts     # Signal store
├── utils/project-permissions.util.ts
└── routes.ts
```

### Routing

| Route | Page |
| ----- | ---- |
| `/projects` | Project list (table/grid, search, filters, pagination) |
| `/projects/new` | Create project |
| `/projects/:id/overview` | Project overview + statistics |
| `/projects/:id/members` | Member management |
| `/projects/:id/settings` | Edit, status/priority, archive/restore/delete, transfer owner |
| `/projects/:id/tasks` | Redirects to task board filtered by project |
| `/projects/:id/activity` | Activity placeholder |

### State Management (`ProjectStore`)

| Signal | Description |
| ------ | ----------- |
| `items` | Paginated project list |
| `selected` | Current project detail |
| `members` | Project members array |
| `loading`, `saving`, `error` | UX state |
| `page`, `totalCount`, `search`, `filters`, `sortBy` | List query state |
| `currentUserRole` | Computed from members + auth user |

Methods cover full CRUD, archive/restore, status/priority patches, member management, and ownership transfer.

### API Integration

All 15 project endpoints consumed via `ProjectApiService`:

- `GET/POST /api/projects`, `GET /api/projects/search`
- `GET/PUT/DELETE /api/projects/{id}`
- `POST .../archive`, `POST .../restore`, `POST .../transfer-owner`
- `PATCH .../status`, `PATCH .../priority`
- Member CRUD at `/api/projects/{id}/members`

Server-side pagination, sorting, and filtering — no client-side aggregation.

### Component Communication

Pages inject `ProjectStore` and read signals. Dialogs return results to pages/stores. `ProjectFormComponent` is a presentational reactive form used by create and settings pages. Permission checks use `project-permissions.util.ts` + `AuthStore`.

## Task Management Module

Enterprise task module with Kanban board, data table, calendar, and detail drawer.

### Folder Structure

```text
features/tasks/
├── components/
│   ├── kanban-board/           # CDK drag-drop board
│   ├── kanban-column/          # Status column with collapse
│   ├── task-card/              # Board card
│   ├── task-list-table/        # Sortable paginated table
│   ├── task-form/              # Shared create/edit form
│   ├── task-details-panel/     # Drawer content
│   ├── task-sidebar/           # Shell layout + drawer
│   ├── task-toolbar/           # Search, filters, view nav
│   ├── task-filter/            # Project, status, priority filters
│   ├── task-header/            # Detail header + quick actions
│   ├── task-status/            # Status chip
│   ├── task-priority/          # Priority badge
│   ├── task-progress/          # Progress bar
│   ├── task-checklist/         # Checklist CRUD
│   ├── task-labels/            # Label chips
│   ├── task-assignees/         # Avatar group
│   ├── task-time-tracking/     # Hours + progress
│   ├── task-activity/          # Activity timeline (legacy)
│   └── (drawer embeds TaskCollaborationPanel from collaboration module)
├── dialogs/                    # assign, move, delete, status, label
├── models/                     # DTOs, enums, utils
├── pages/                      # board, list, calendar, create, edit
├── services/
│   ├── task-api.service.ts     # HTTP layer (/api/tasks, /api/activity)
│   └── task.service.ts         # List vs search orchestration
├── stores/task.store.ts        # Signal store
├── utils/task-permissions.util.ts
└── routes.ts
```

### Routing

| Route | Page |
| ----- | ---- |
| `/tasks/board` | Kanban board (default) |
| `/tasks/list` | Paginated task table |
| `/tasks/calendar` | Month/week/day calendar |
| `/tasks/new` | Create task |
| `/tasks/:id/edit` | Edit task |
| `?task={id}` | Opens detail drawer on any view |

### Board Architecture

Six columns map to `TaskStatus` (Backlog → Completed). `@angular/cdk/drag-drop` handles card drag; dropping across columns calls `PATCH /api/tasks/{id}/status`. Columns support collapse/expand and horizontal scroll. Board loads up to 100 tasks server-side per filter set.

### State Management (`TaskStore`)

| Signal | Description |
| ------ | ----------- |
| `items` | Paginated list view data |
| `boardItems` / `boardGroups` | Kanban data grouped by status |
| `calendarItems` | Calendar range data |
| `selected` | Task loaded in drawer |
| `activity` | Activity timeline for selected task |
| `loading`, `boardLoading`, `calendarLoading`, `saving`, `error` | UX state |
| `page`, `search`, `filters`, `sortBy`, `viewMode` | Query state |

### API Integration

All task endpoints consumed via `TaskApiService`:

- `GET/POST /api/tasks`, `GET /api/tasks/search`
- `GET/PUT/DELETE /api/tasks/{id}`
- `PATCH .../status`, `PATCH .../priority`, `PATCH .../hours`
- `POST .../assign`, `DELETE .../assign/{userId}`
- `POST/DELETE .../labels`, checklist CRUD
- `POST .../move`
- Activity via `GET /api/activity?entityType=Task&entityId={id}`

### Component Communication

`TasksShellComponent` hosts toolbar, child routes, and `MatSidenav` drawer. Query param `?task=` triggers `TaskStore.loadById`. Pages emit open/edit/delete; shell orchestrates dialogs and store mutations. Presentational components receive task data via inputs. Task detail drawer embeds `TaskCollaborationPanel` from the Collaboration module (comments, attachments, activity).

### Animations

- Page enter fade/slide via `@angular/animations`
- Stat card stagger on load
- Widget hover elevation
- `prefers-reduced-motion` disables animations

## Collaboration Module

Comments, threaded replies, markdown editor, mentions, emojis, file attachments, and activity feed — integrated into the task detail drawer and available as standalone routes.

### Folder Structure

```text
features/collaboration/
├── components/
│   ├── task-collaboration-panel/   # MatTabs: Comments | Attachments | Activity
│   ├── comment-list/                 # Top-level comments + new comment editor
│   ├── comment-thread/             # Recursive reply threads
│   ├── comment-item/                 # Single comment + inline actions
│   ├── comment-editor/               # Markdown toolbar, mentions, emoji
│   ├── attachment-list/              # Upload zone + file grid
│   ├── attachment-card/              # File row with actions
│   ├── attachment-upload/            # Drag-drop + progress
│   ├── attachment-preview/           # Image/PDF preview dialog
│   ├── attachment-toolbar/           # Bulk actions
│   ├── activity-panel/               # Activity timeline
│   ├── emoji-picker/
│   ├── mention-dropdown/ + mention-chip
│   └── file-icon/
├── dialogs/                          # delete-comment, delete-file, rename-file
├── models/                           # DTOs, enums, utils
├── pages/                            # task-comments, task-attachments
├── services/
│   ├── comment-api.service.ts        # Comment CRUD + replies
│   ├── attachment-api.service.ts     # Multipart upload with progress
│   └── collaboration.service.ts      # Activity feed
├── stores/
│   ├── comment.store.ts
│   └── attachment.store.ts
├── collaboration.routes.ts
└── routes.ts
```

### Routing

| Route | Page |
| ----- | ---- |
| `/collaboration/tasks/:taskId/comments` | Full-page comments view |
| `/collaboration/tasks/:taskId/attachments` | Full-page attachments view |

Task drawer uses `TaskCollaborationPanel` directly (no route change).

### Architecture

```text
TaskDetailsPanel
  └── TaskCollaborationPanel (MatTabs)
        ├── CommentList → CommentThread (recursive) → CommentItem + CommentEditor
        ├── AttachmentList → AttachmentUpload + AttachmentCard
        └── ActivityPanel → CollaborationService
```

`TaskCollaborationPanel` receives `taskId` as input, loads comments/attachments on init, and clears both stores on destroy to avoid stale data when switching tasks.

### State Management

**CommentStore** (`providedIn: 'root'`)

| Signal / method | Description |
| --------------- | ----------- |
| `items` | Flat comment list for current task |
| `tree` | Threaded tree built from flat list |
| `loading`, `saving`, `error` | UX state |
| `loadByTask`, `create`, `reply`, `update`, `delete` | CRUD orchestration |

**AttachmentStore** (`providedIn: 'root'`)

| Signal / method | Description |
| --------------- | ----------- |
| `items` | Attachments for current task |
| `uploadProgress` | Per-file upload % |
| `loading`, `uploading`, `error` | UX state |
| `loadByTask`, `upload`, `download`, `delete`, `replace` | File operations |

### API Integration

**Comments** (`CommentApiService`):

- `GET/POST /api/tasks/{taskId}/comments`
- `GET/PUT/DELETE /api/comments/{id}`
- `POST /api/comments/{id}/replies`

**Attachments** (`AttachmentApiService`):

- `GET/POST /api/tasks/{taskId}/attachments` (multipart field `file`, max 25 MB)
- `GET/DELETE /api/attachments/{id}`
- `PUT /api/attachments/{id}` (replace file)
- Download via blob response

**Activity** (`CollaborationService`):

- `GET /api/activity?entityType=Task&entityId={taskId}`

### Component Communication

- **Stores** are the single source of truth; components inject `CommentStore` / `AttachmentStore` and bind to signals.
- **Presentational flow**: `CommentList` owns the root editor; `CommentThread` recurses for replies; `CommentItem` emits edit/delete/reply events upward.
- **Dialogs** (`MatDialog`) confirm destructive actions and return results to the calling component, which delegates to the store.
- **Upload progress** uses raw `HttpClient` with `reportProgress` in `AttachmentApiService` (not `ApiBaseService`).

### Tests

- `collaboration.utils.spec.ts` — markdown/mention helpers
- `comment.store.spec.ts` — load, create, reply, delete

## Notifications & Activity Module

Enterprise notification center, activity timeline, header badge, sidebar badge, and responsive drawer with REST polling (no SignalR).

### Folder Structure

```text
features/notifications/
├── components/
│   ├── notification-badge/
│   ├── notification-card/
│   ├── notification-list/
│   ├── notification-toolbar/
│   ├── notification-filter/
│   ├── notification-empty/
│   ├── notification-drawer/
│   ├── activity-list/
│   ├── activity-card/
│   ├── activity-filter/
│   ├── activity-timeline/
│   └── date-separator/
├── dialogs/notification-settings-dialog/
├── models/                     # enums, DTOs, utils
├── pages/
│   ├── notification-center/
│   └── activity-center/
├── services/
│   ├── notification-api.service.ts
│   ├── activity-api.service.ts
│   └── notification.service.ts   # polling orchestration
├── stores/
│   ├── notification.store.ts
│   └── activity.store.ts
├── routes.ts
└── notifications.routes.ts
```

### Routing

| Route | Page |
| ----- | ---- |
| `/notifications` | Notification center (list + detail panel) |
| `/notifications/activity` | Activity center (timeline) |
| `/notifications/:id` | Notification center with selected detail |

Header icon opens the notification drawer; drawer links to the full center.

### Component Hierarchy

```text
MainLayout
  ├── Header → NotificationIcon → NotificationBadge
  ├── Sidebar → NavItem badge
  └── NotificationDrawer → NotificationCard[]

NotificationCenterPage
  ├── NotificationToolbar
  ├── NotificationFilter
  ├── NotificationList → DateSeparator + NotificationCard
  └── Detail panel (selected notification)

ActivityCenterPage
  ├── ActivityFilter
  └── ActivityTimeline → ActivityList → ActivityCard
```

### State Management

**NotificationStore**

| Signal / method | Description |
| --------------- | ----------- |
| `items`, `drawerItems` | Paginated list + drawer preview |
| `selected` | Detail panel selection |
| `unreadCount` | Badge count (synced to header/sidebar/dashboard) |
| `filters`, `groupedItems` | Server + client filters, date groups |
| `loading`, `loadingMore`, `error` | UX state |
| `loadInitial`, `loadMore`, `loadDrawerPreview` | Pagination / infinite scroll |
| `markRead`, `markUnread`, `markAllRead`, `delete`, `deleteAllRead` | Mutations |

**ActivityStore**

| Signal / method | Description |
| --------------- | ----------- |
| `items`, `groupedItems` | Timeline data grouped by date |
| `filters` | Scope (all/personal/project/org), entity, dates |
| `loading`, `loadingMore`, `error` | UX state |
| `loadInitial`, `loadMore`, `refresh` | Pagination |

### Polling Strategy

`NotificationsService` (feature) polls `GET /api/notifications/count` every 30–60s (default 45s) using RxJS `interval` + `exhaustMap` to prevent duplicate in-flight requests. Manual refresh available from toolbar and drawer open. Settings stored in `localStorage` via notification settings dialog.

**Future SignalR migration:** replace polling body in `NotificationsService.startPolling()` with a hub subscription; keep `NotificationStore.setUnreadCount()` and mutation methods unchanged.

### API Integration

**Notifications** (`NotificationApiService`):

- `GET /api/notifications`, `GET /api/notifications/unread`
- `GET /api/notifications/count`, `GET /api/notifications/{id}`
- `PATCH .../read`, `PATCH .../unread`, `PATCH .../read-all`
- `DELETE /api/notifications/{id}`, `DELETE /api/notifications/read`

**Activity** (`ActivityApiService`):

- `GET /api/activity`
- `GET /api/activity/user/{userId}`
- `GET /api/activity/project/{projectId}`

### Tests

- `notification.utils.spec.ts`
- `notification.store.spec.ts`
- `activity.store.spec.ts`
- `notification.service.spec.ts` (polling)

## Reports & Analytics Module

Enterprise analytics dashboard and individual reports consuming backend `/api/reports` and `/api/dashboard` endpoints. All KPIs and chart data are server-calculated — the client only renders API responses.

### Folder Structure

```text
features/reports/
├── components/
│   ├── reports-shell/          # Side navigation + outlet
│   ├── report-detail/          # Shared report page layout
│   ├── kpi-card/ statistics-card/ chart-card/
│   ├── filter-panel/ date-range-picker/ export-menu/
│   ├── report-table/ summary-widget/ progress-widget/
│   ├── report-card/ empty-report/
├── models/                     # enums, DTOs, utils, nav config
├── pages/                      # dashboard + individual report pages
├── services/
│   ├── report-api.service.ts   # All report HTTP endpoints
│   └── analytics.service.ts    # Dashboard bundle + export
├── stores/
│   ├── analytics.store.ts      # Analytics dashboard state
│   └── report.store.ts         # Individual report state
├── routes.ts
└── reports.routes.ts
```

### Routing

| Route | Page |
| ----- | ---- |
| `/reports/dashboard` | Analytics dashboard (KPIs + charts + widgets) |
| `/reports/tasks` | Task report |
| `/reports/projects` | Project report |
| `/reports/organizations` | Organization report |
| `/reports/users` | User productivity |
| `/reports/workload` | Workload analysis |
| `/reports/productivity` | Productivity report |
| `/reports/completion` | Completion trends |
| `/reports/priority` | Priority distribution |
| `/reports/status` | Status distribution |
| `/reports/overdue` | Overdue tasks |
| `/reports/activity` | Activity report |
| `/reports/audit` | Audit report |

### Architecture

```text
ReportsShell
  └── child routes
        ├── AnalyticsDashboardPage → AnalyticsStore → AnalyticsService (forkJoin)
        └── *ReportPage → ReportDetailComponent → ReportStore → ReportApiService
```

**Chart rendering:** `ReportChartCardComponent` wraps shared `ChartCanvasComponent` (Chart.js). Chart labels/values come directly from API `DistributionChart` / `TrendChart` items — no client-side aggregation.

**Export workflow:** Backend export endpoints are not yet available. `AnalyticsService.exportTable()` generates CSV/Excel (TSV) downloads and printable HTML from the **already-fetched** report table rows, with progress signals (`ExportStatus`, `ExportProgress`) shown in `ExportMenuComponent`.

### State Management

**AnalyticsStore** — dashboard bundle, KPI cards (computed from `StatisticsResponse` + `PersonalDashboardResponse`), chart series, recent task/project/activity/audit widgets, filters, date range.

**ReportStore** — per-report data, shared filters, pagination, delegates export to `AnalyticsService`.

### API Integration

- `GET /api/dashboard/me`, `/dashboard/project/{id}`, `/dashboard/organization/{id}`
- `GET /api/reports/statistics`, `/tasks`, `/projects`, `/organizations`, `/users`
- `GET /api/reports/workload`, `/productivity`, `/overdue`, `/completion`
- `GET /api/reports/priority`, `/status`, `/activity`, `/audit`

### Tests

- `report.utils.spec.ts`
- `report.store.spec.ts`
- `analytics.store.spec.ts`

## HTTP Layer

| Component | Role |
| --------- | ---- |
| `ApiBaseService` | Typed GET/POST/PUT/PATCH/DELETE wrapper |
| `loadingInterceptor` | Global loading indicator |
| `jwtInterceptor` | Bearer token + automatic refresh on 401 |
| `errorInterceptor` | 403/500 handling + snackbar notifications |
| `NotificationService` | Global MatSnackBar messages |
| `GlobalErrorHandler` | Unhandled exception logging |

## Coding Standards

- Standalone components with `ChangeDetectionStrategy.OnPush`
- `inject()` for dependency injection
- Signal-based inputs/outputs (`input()`, `output()`)
- Strong typing — no `any`
- SCSS with shared design tokens under `src/styles/`
- Business logic deferred to future feature prompts

## Environment Configuration

| File | Usage |
| ---- | ----- |
| `environment.ts` | Default (replaced at build time) |
| `environment.development.ts` | `ng serve` / development build |
| `environment.production.ts` | Production build |

Key settings: `apiBaseUrl`, `logLevel`, `tokenStorageKey`, pagination defaults.

## Accessibility

- Semantic landmarks (`header`, `main`, `footer`, `nav`)
- ARIA labels on icon buttons
- Focus-visible outlines
- `prefers-reduced-motion` respected in animations
- Skip target: `#main-content`

## Internationalization

Prepared via `I18N_CONFIG` in `@core/config/i18n.config.ts`. Translations not implemented in this prompt.

## Next Steps

Ready for feature modules:

1. Comments and attachments (full implementation)
2. Notifications center page
3. Settings module
4. Reports detail pages

---

Built as part of the TaskFlow enterprise platform. Backend API: see repository root `README.md`.

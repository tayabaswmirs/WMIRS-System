# Project File Organization & Directory Architecture

This document defines the strict directory structure, file placement rules, and coding boundaries for the WMIRS-SYSTEM. 

> [!IMPORTANT]
> **AI AGENT CONSTRAINTS & DEVELOPMENT COMPLIANCE**
> A significant portion of this codebase is developed and modified by agentic AI tools. To maintain code health, avoid circular dependencies, and prevent duplicate implementations, all developers (both human and AI) **MUST** strictly adhere to the definitions, structures, and naming conventions defined in this document. Any deviation will trigger immediate linting or refactoring requirements.

---

## 1. Directory Tree Overview

All source code must reside inside the `src/` folder, structured into the following designated subfolders:

```text
src/
├── assets/             # Static visual media assets
├── components/         # Pure, reusable UI building blocks
│   ├── common/         # Atomic UI (Buttons, Inputs, Spinners)
│   └── layout/         # Structural UI elements (Navbar, Sidebar, Footer)
├── context/            # React global state providers (Auth, Theme)
├── firebase/           # Exclusive Firebase configurations & services
│   ├── config.js       # Firebase initialization code
│   └── services/       # DB CRUD, Auth methods, Storage triggers
├── hooks/              # Custom React hooks (useAuth, useFirestore)
├── pages/              # Route views (Login, Dashboard, Admin)
├── routes/             # App navigation maps and route-guards
├── services/           # NON-Firebase external APIs & third-party integrations
├── styles/             # Dedicated global and utility CSS files
├── utils/              # Pure JavaScript logic & helper functions
├── App.jsx             # Root layout and global provider setup
└── main.jsx            # Application mount point
```

---

## 2. Directory Definitions & Boundary Rules

### `src/assets/`
*   **Purpose:** Houses all static visual resources.
*   **Contents:** `.png`, `.jpg`, `.svg`, `.webp` files, and logos.
*   **Constraint:** Do not place CSS files, JavaScript logic, or raw text templates here. All media must be imported using ESM imports (e.g., `import logo from '../assets/logo.svg'`).

### `src/components/`
*   **Purpose:** Building-block UI components that are stateless or contain localized state. They do not bind directly to routes.
*   **Subfolders:**
    *   `common/`: Reusable individual atoms (e.g., `<Button />`, `<InputField />`, `<Modal />`).
    *   `layout/`: Reusable page arrangements (e.g., `<Navbar />`, `<Sidebar />`, `<DashboardLayout />`).
*   **Constraint:** **Components must never represent entire pages.** They must receive data and handlers via React props.

### `src/context/`
*   **Purpose:** React Contexts providing global state to the application.
*   **Example:** `AuthContext.jsx` provides the currently logged-in user profile, loading state, and core auth handlers.
*   **Constraint:** Restrict context to global concerns only (e.g., Authentication, App Theme). Do not create contexts for single-page states.

### `src/firebase/`
*   **Purpose:** The exclusive hub for Firebase interaction.
*   **Contents:** 
    *   `config.js`: Initializes Firebase App, Firestore, Auth, and Storage.
    *   `services/`: Sub-services handling actual operations (e.g., `authService.js` for login/logout, `reportService.js` for database queries).
*   **Constraint:** **All direct Firestore and Auth calls must live here.** Pages and UI components are strictly forbidden from executing `signInWithEmailAndPassword` or `collection()` directly. They must call functions imported from this directory.

### `src/hooks/`
*   **Purpose:** Reusable, stateful logic encapsulated into custom React hooks.
*   **Contents:** Files starting with the prefix `use` (e.g., `useAuth.js`, `useFirestoreQuery.js`).
*   **Constraint:** Hooks must be functional and return state variables or action functions. They must not render UI.

### `src/pages/`
*   **Purpose:** Full-screen views mapped to a specific web route.
*   **Example:** `Login.jsx`, `Dashboard.jsx`, `Settings.jsx`.
*   **Constraint:** Pages act as coordinates. They compose reusable `components/`, utilize `hooks/`, and dispatch calls to `firebase/` services. They must not contain inline base styles (utilize `styles/` or common classes instead).

### `src/routes/`
*   **Purpose:** Manages system URL pathways and router configurations.
*   **Contents:** 
    *   `AppRoutes.jsx`: Definitively maps paths (e.g., `/login`, `/dashboard`) to Page components.
    *   `ProtectedRoute.jsx`: A route-guard wrapper preventing unauthorized access.
*   **Constraint:** Route guarding logic must be kept clean and run against `AuthContext` status.

### `src/services/`
*   **Purpose:** Houses integrations with external services **outside of Firebase** (e.g., third-party reporting tools, email APIs).
*   **Constraint:** If an API or query relates to Firebase, it **must** go to `src/firebase/services/` instead.

### `src/styles/`
*   **Purpose:** Cleans up the project root by centralizing stylesheets.
*   **Contents:** `index.css`, `App.css`, and custom UI-theme stylesheets.
*   **Constraint:** Do not scatter `.css` files in page or utility directories. All styles must live in this dedicated directory.

### `src/utils/`
*   **Purpose:** Pure, non-React JavaScript utility functions.
*   **Contents:** Date formatters, validation regexes, mathematical converters.
*   **Constraint:** Utilities must remain **side-effect free** (pure functions). They cannot call React hooks or modify UI state.

---

## 3. Strict Naming Conventions

To keep file references predictable for Agentic AI workflows, the system enforces strict casing rules:

| Directory / File Type | Convention | Example |
| :--- | :--- | :--- |
| **Component Files** | `PascalCase.jsx` | `InputField.jsx`, `DashboardLayout.jsx` |
| **Page Files** | `PascalCase.jsx` | `Login.jsx`, `Dashboard.jsx` |
| **Utility Files** | `camelCase.js` | `formatDate.js`, `emailValidator.js` |
| **Custom Hooks** | `camelCase.js` (Prefix `use`) | `useAuth.js`, `useReports.js` |
| **Firebase Services** | `camelCase.js` (Suffix `Service`) | `authService.js`, `dbService.js` |
| **Assets** | `kebab-case.png/svg` | `company-logo.svg`, `hero-banner.png` |
| **Style Files** | `kebab-case.css` or `camelCase.css` | `global.css`, `dashboardStyles.css` |

---

## 4. Code Import Rules

1.  **No Direct Database Queries from UI:**
    *   *Bad:* `db.collection('users').get()` inside a page component.
    *   *Good:* `import { fetchUsers } from '@/firebase/services/userService'` then calling `fetchUsers()`.
2.  **Relative Imports Routing:**
    Keep paths structured. Ensure clean relative path resolution (e.g., `../../components/common/Button`) or configure path aliases if supported.
3.  **Strict Props Validation:**
    Reusable components under `src/components/common/` should define clear arguments to enable predictable integration.

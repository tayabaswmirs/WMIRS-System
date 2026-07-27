# WMIRS System - Water Management & Incident Reporting System

## 📋 Table of Contents
- [Overview](#overview)
- [Core Features](#core-features)
- [System Architecture](#system-architecture)
- [Folder Organization](#folder-organization)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [Technology Stack](#technology-stack)

---

## 🎯 Overview

**WMIRS** (Water Management & Incident Reporting System) is a comprehensive full-stack web application designed to monitor, track, and report environmental incidents and water-related concerns. Built for municipalities and environmental agencies, WMIRS provides a centralized platform for citizens and organizations to report environmental hazards, track monitoring activities, and manage incident resolution workflows.

The system operates as a collaborative platform connecting field reporters, administrators, and monitoring specialists in real-time using Firebase cloud infrastructure.

---

## ✨ Core Features

### **1. Incident Reporting & Management**
- **Real-time Report Submission**: Citizens can report environmental incidents with detailed descriptions, location data, and evidence attachments
- **Multi-category Support**: Incident categories include water pollution, biodiversity threats, compliance violations, and more
- **Severity Classification**: Reports are categorized by severity levels (Critical, High, Medium, Low) for prioritization
- **Evidence Attachment**: Support for multiple file uploads with progress tracking
- **Status Tracking**: Monitor incident lifecycle from submission through resolution

### **2. Environmental Monitoring**
- **Biodiversity Monitoring (BMS)**: Avian surveys and protected fauna tracking with systematic census data
- **Water Resource Monitoring**: Aquatic condition logs and pollution risk assessment
- **Compliance Audits**: Waste collection tracking and plastic bag ban compliance verification
- **Wildlife Observation**: Non-avian fauna sightings and habitat condition documentation
- **Water Conservation**: Ecosystem conservation logs and aquatic pollution indicators

### **3. User Role Management**
- **Citizen/Reporter Role**: Submit incident reports and monitor their own reports
- **Admin Role**: Full system management, user administration, and report oversight
- **Monitoring Specialist Role**: Dedicated environmental monitoring data collection

### **4. Dashboard & Analytics**
- **Personal Dashboard**: Quick overview of submitted reports with status and severity indicators
- **Admin Dashboard**: System-wide incident statistics and monitoring summaries
- **Real-time Updates**: Live subscription-based data synchronization using Firestore
- **Historical Records**: Complete audit trail of incidents and monitoring activities

### **5. Authentication & Authorization**
- **Secure Login**: Firebase Authentication with email/password support
- **Role-based Access Control**: Differentiated access and permissions per user role
- **Session Management**: Automatic session handling with protected routes

### **6. Data Management**
- **CRUD Operations**: Create, read, update, and delete operations for incidents and monitoring logs
- **File Storage**: Cloud-based evidence storage with Firebase Cloud Storage
- **Firestore Database**: NoSQL database for scalable incident and user data management

---

## 🏗️ System Architecture

### **Frontend Architecture (React + Vite)**

```
Client Browser (React App)
        ↓
    [Router Layer] → Route-based page navigation
        ↓
    [Pages] → Full-screen views (Dashboard, Incidents, Monitoring)
        ↓
    [Components] → Reusable UI building blocks
        ↓
    [Hooks] → Custom React state logic (useAuth, useGlobalLoading)
        ↓
    [Services Layer] → Firebase service calls
        ↓
    [Firebase] → Cloud services (Auth, Firestore, Storage)
```

### **Backend Architecture (Firebase Cloud Functions)**

```
HTTPS Triggers (Express-like endpoints)
        ↓
    [Admin Functions] → User management, role assignment
    [Triggers] → Database change handlers, real-time updates
        ↓
    [Validation] → Zod schema validation for input security
        ↓
    [Firestore] → Primary database with security rules
    [Cloud Storage] → File storage for evidence/attachments
```

### **Technology Stack**

| Layer | Technology |
|-------|-----------|
| **Frontend Framework** | React 19.2.6 + Vite 8.0.12 |
| **Styling** | TailwindCSS 4.3.0 |
| **Routing** | React Router DOM 7.15.1 |
| **Backend Runtime** | Firebase Cloud Functions (Node.js 22) |
| **Database** | Firestore (NoSQL) |
| **Authentication** | Firebase Authentication |
| **File Storage** | Firebase Cloud Storage |
| **Admin SDK** | firebase-admin 13.0.0 |
| **Validation** | Zod 3.23.8 |
| **Linting** | ESLint 10.3.0 |

---

## 📁 Folder Organization

The project follows a strict directory structure to maintain code clarity and AI-agent compatibility:

### **Frontend Structure** (`src/`)

```
src/
├── App.jsx                          # Root component and global provider setup
├── main.jsx                         # Application mount point
├── assets/                          # Static images, logos, media files
├── components/
│   ├── common/                      # Atomic UI components (Buttons, Modals, Forms, Tables)
│   │   ├── IncidentForm.jsx
│   │   ├── UserEditModal.jsx
│   │   ├── ConfirmationModal.jsx
│   │   └── monitoring/              # Monitoring-specific forms
│   │       ├── AvianTrackingForm.jsx
│   │       ├── WildlifeObservationForm.jsx
│   │       ├── WaterMonitoringForm.jsx
│   │       └── ... (other monitoring forms)
│   └── layout/                      # Structural components
│       ├── DashboardLayout.jsx      # Main dashboard wrapper
│       └── Sidebar.jsx              # Navigation sidebar
├── context/
│   ├── AuthContext.jsx              # Global authentication state
│   └── LoadingContext.jsx           # Global loading state
├── firebase/
│   ├── firebase.js                  # Firebase initialization
│   └── services/
│       ├── authService.js           # Login, logout, session management
│       ├── incidentService.js       # Incident CRUD operations
│       ├── monitoringService.js     # Monitoring logs management
│       └── userService.js           # User profile management
├── hooks/
│   ├── useAuth.js                   # Authentication hook
│   ├── useGlobalLoading.js          # Global loading state hook
│   └── useLoadingLock.js            # Loading lock hook
├── pages/                           # Full-screen route views
│   ├── Dashboard.jsx                # User dashboard
│   ├── Incidents.jsx                # Incident submission
│   ├── IncidentHistory.jsx          # User's incident history
│   ├── Monitoring.jsx               # Monitoring form selection
│   ├── MonitoringHistory.jsx        # Monitoring logs history
│   ├── AdminDashboard.jsx           # Admin statistics overview
│   ├── AdminIncidents.jsx           # Admin incident management
│   ├── AdminMonitoring.jsx          # Admin monitoring management
│   ├── UserManagement.jsx           # User administration
│   ├── Profile.jsx                  # User profile management
│   └── Login.jsx                    # Authentication page
├── routes/
│   ├── AppRoutes.jsx                # Route configuration and mapping
│   └── ProtectedRoute.jsx           # Route guard wrapper
├── styles/
│   ├── index.css                    # Global styles
│   ├── App.css                      # App-level styles
│   ├── dashboard.css                # Dashboard styles
│   └── login.css                    # Login page styles
└── utils/
    ├── incidentConstants.js         # Incident categories and types
    └── monitoringUtils.js           # Monitoring utility functions
```

### **Backend Structure** (`functions/`)

```
functions/
├── index.js                         # Cloud Functions entry point
├── package.json
└── src/
    ├── config/
    │   └── firebaseAdmin.js         # Firebase Admin SDK initialization
    └── triggers/
        ├── db/
        │   └── onUserUpdate.js      # Firestore change triggers
        └── https/
            ├── adminDeleteUser.js           # User deletion endpoint
            ├── adminSetRole.js              # Role assignment endpoint
            ├── adminUpdateUser.js           # User update endpoint
            ├── selfDeleteAccount.js         # Account self-deletion
            └── testSecureEndpoint.js        # Security testing endpoint
```

### **Configuration Files** (Project Root)

- **`firebase.json`** – Firebase CLI configuration and deployment settings
- **`firestore.rules`** – Security rules for Firestore database access
- **`firestore.indexes.json`** – Database index definitions for query optimization
- **`storage.rules`** – Security rules for Cloud Storage access
- **`vite.config.js`** – Vite build configuration
- **`eslint.config.js`** – ESLint rules and standards
- **`FILE_ORGANIZATION.md`** – Detailed directory structure guidelines
- **`SECURITY_CODING.md`** – Security and architecture constraints

---

## 🚀 Installation & Setup

### **Prerequisites**

- **Node.js**: Version 22.0.0 or higher
- **npm**: Included with Node.js
- **Firebase CLI**: For deployment and local emulation (optional)
- **Git**: For version control

### **Step 1: Clone or Download the Project**

```bash
cd WMIRS-System
```

### **Step 2: Install Frontend Dependencies**

```bash
npm install
```

This installs all frontend dependencies specified in `package.json`:
- React 19.2.6
- React Router DOM 7.15.1
- Firebase 12.13.0
- TailwindCSS 4.3.0
- Vite 8.0.12

### **Step 3: Install Backend Dependencies** (Optional)

If deploying Cloud Functions:

```bash
cd functions
npm install
cd ..
```

This installs backend dependencies:
- firebase-admin 13.0.0
- firebase-functions 6.0.0
- Zod 3.23.8

### **Step 4: Configure Firebase**

1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Set up authentication, Firestore database, and Cloud Storage
3. Create a `.env.local` file in the project root with your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID
```

4. Update `src/firebase/firebase.js` with the correct initialization code

### **Step 5: Verify Lint Rules** (Optional)

```bash
npm run lint
```

This checks code quality using ESLint and ensures adherence to project coding standards.

---

## 🎮 Running the Application

### **Development Mode**

Start the Vite development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

**Benefits:**
- Instant code reloading on file changes
- Error reporting in the browser console
- Source map debugging

### **Production Build**

Create an optimized production build:

```bash
npm run build
```

Output is generated in the `dist/` directory with:
- Minified JavaScript and CSS
- Tree-shaking for unused code removal
- Asset optimization

### **Preview Production Build**

Test the production build locally:

```bash
npm run preview
```

### **Deploy Cloud Functions** (Optional)

Deploy backend functions to Firebase:

```bash
cd functions
npm run deploy
```

### **Local Firebase Emulation** (Optional)

Run Firebase locally for testing:

```bash
firebase emulators:start
```

---

## 🛠️ Technology Stack Details

### **Frontend Framework - React 19.2.6**
- Component-based UI architecture
- React Hooks for state management
- Context API for global state (Auth, Loading)

### **Build Tool - Vite 8.0.12**
- Lightning-fast HMR and cold starts
- Native ES modules
- Optimized production builds

### **Styling - TailwindCSS 4.3.0**
- Utility-first CSS framework
- Dark mode support
- Responsive design capabilities

### **Routing - React Router DOM 7.15.1**
- Client-side navigation
- Protected routes with role-based access
- Nested routing support

### **Backend - Firebase Ecosystem**

| Service | Purpose |
|---------|---------|
| **Firebase Authentication** | User sign-in and session management |
| **Firestore Database** | Real-time NoSQL data storage with security rules |
| **Cloud Storage** | File attachment storage for incidents and evidence |
| **Cloud Functions** | Serverless backend logic and admin operations |
| **Firebase Admin SDK** | Backend server-side Firebase operations |

### **Data Validation - Zod**
- Runtime schema validation
- Type-safe input parsing
- Custom error messages

### **Code Quality - ESLint**
- Enforces consistent code style
- Catches common JavaScript errors
- React-specific rule compliance

---

## 📖 Project Documentation

Additional documentation files for development:

- **FILE_ORGANIZATION.md** – Comprehensive guide to directory structure and file placement rules
- **SECURITY_CODING.md** – Security best practices and architectural constraints
- **mongodb-DESIGN.md** – Database schema and data model documentation

---

## 🔐 Security Features

- **Zero Trust Input Validation**: All user inputs validated against strict schemas
- **XSS Prevention**: No `dangerouslySetInnerHTML`; sanitized HTML rendering
- **Role-Based Access Control**: Firestore security rules enforce authorization
- **Environment Variable Protection**: Secrets stored in `.env.local`, never committed
- **Cloud Function Validation**: Zod schema validation on all endpoints
- **Secure Error Handling**: Generic error messages to clients; detailed logs server-side

---

## 🤝 Development Workflow

1. **Create a feature branch** from `main`
2. **Follow the file organization** structure defined in FILE_ORGANIZATION.md
3. **Run linting** before committing: `npm run lint`
4. **Test in development mode**: `npm run dev`
5. **Build and preview**: `npm run build && npm run preview`
6. **Deploy**: Follow deployment steps above

---

## 📞 Support

For questions or issues:
1. Check the project documentation files
2. Review security and architecture guidelines
3. Verify environment variable configuration
4. Check browser console for error details

---

## 📄 License

This project is part of the WMIRS System initiative for environmental monitoring and incident reporting.

---

**Last Updated**: July 2026 | **System Version**: 1.0.0

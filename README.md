# ALAM ENGAZ PORT - Email Signature Hub

A comprehensive enterprise web application and Progressive Web App (PWA) for **ALAM ENGAZ PORT SERVICES CO.** to generate, manage, preview, and deploy standardized, corporate HTML email signatures across the organization.

![ALAM ENGAZ Logo](public/logo.png)

---

## 🌟 Key Features

### 1. 💼 Signature Studio & Generator
- **Multi-Template Support**: Standard Modern Corporate, Executive Minimal, Compact Sidebar, and Custom Enterprise layouts.
- **Real-Time Interactive Preview**: Live rendering with color theme customization, typography controls, and contact adjustments.
- **Copy & Export Options**:
  - Direct 1-click Rich Text / HTML Clipboard Copy for Gmail, Outlook, Apple Mail, Thunderbird.
  - Download Standalone HTML file.
  - Native Email Client installation instructions.

### 2. 👥 Employee Directory & Self-Service Portal
- Directory of company employees with pre-filled signature profiles.
- One-click profile selection to instantly generate signatures.
- Dedicated self-service portal for employees to copy or update their signatures.

### 3. 🛡️ Management & Admin Panel
- **Employee Management**: Add, edit, remove, and categorize employees by department.
- **Activity & Audit Logs**: Real-time logging of employee updates, signature copies, and administrative actions.
- **Media Library**: Upload and manage company logos, profile pictures, promotional banners, and social badges.
- **System Settings & Content Manager**: Dynamically customize corporate contact details, disclaimer notices, address information, and portal announcements.
- **Analytics Module**: Usage statistics, copy counts, department distributions, and platform telemetry.

### 4. 📱 Progressive Web App (PWA) & Offline Capabilities
- Installable on Desktop (Chrome, Edge, macOS) and Mobile (iOS Safari, Android Chrome).
- Offline asset caching with Service Worker (`sw.js`).
- Complete web app manifest with responsive icons and shortcuts.

### 5. ☁️ Firebase Cloud Sync
- Firestore database for cloud persistence of employees, logs, media assets, and system configurations.
- Integrated Firebase Authentication for administrative roles.

---

## 🏗️ Tech Stack

- **Framework**: React 19 + TypeScript
- **Bundler / Build Tool**: Vite 6
- **Icons**: Lucide React
- **Cloud Backend**: Firebase (Firestore, Authentication, Analytics)
- **Styling**: Vanilla CSS Design System with CSS variables and responsive glassmorphic UI
- **PWA**: Custom Service Worker + Web App Manifest

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or newer recommended)
- npm / yarn / pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/basim2004/alam-engaz-port-email-signature-hub.git
   cd alam-engaz-port-email-signature-hub
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

5. Preview production build:
   ```bash
   npm run preview
   ```

---

## 📁 Project Structure

```
├── public/
│   ├── assets/              # Icons, banners, company logos, image assets
│   ├── favicon.ico / .png   # Web favicons
│   ├── logo.png             # Official company logo
│   ├── app-icon.png         # Official PWA app icon
│   ├── manifest.json        # Web App Manifest
│   └── sw.js                # PWA Service Worker
├── src/
│   ├── components/          # Reusable UI components & Admin modules
│   │   ├── admin/           # ActivityLogs, AdminUsers, Analytics, MediaLibrary, WebsiteManager
│   │   ├── Header.tsx       # Main navigation header
│   │   ├── Footer.tsx       # Corporate footer
│   │   ├── OfficialSignature.tsx # HTML Email Signature Generator & Previewer
│   │   └── ...
│   ├── constants/           # Asset definitions & constants
│   ├── data/                # Initial employee seeds & support FAQ data
│   ├── services/            # Firebase, Auth, System Settings & Content APIs
│   ├── styles/              # Global CSS & Design System
│   ├── utils/               # Signature HTML generator, download utilities
│   ├── views/               # Page views (Home, Studio, Employees, Admin, Portal, Support)
│   ├── App.tsx              # Root application router and layout
│   └── main.tsx             # Entry point
├── index.html               # Main HTML entry
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies and scripts
```

---

## 🔒 Security & Privacy

- Client-side public configurations are securely isolated.
- Authentication required for administrative operations and system modifications.
- Sensitive environment configurations are excluded via `.gitignore`.

---

## 🏢 ALAM ENGAZ PORT SERVICES CO.

Corporate Email Signature Management Portal — Built for seamless branding consistency across all official communications.

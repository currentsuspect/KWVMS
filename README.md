# Kajiado Water Vending Management System (KWVMS)

A web-based platform to facilitate water delivery in Kajiado County using vendors who transport water via donkeys. The system connects users (buyers), vendors (donkey water carriers), and an admin for efficient order management.

---

## Table of Contents
- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Installation & Setup (Windows)](#installation--setup-windows)
- [Usage Guide](#usage-guide)
- [Deployment](#deployment)
- [Troubleshooting & Support](#troubleshooting--support)
- [License](#license)

---

## Project Overview
This system is designed for the KNEC Diploma in Information Technology project. It streamlines water delivery in Kajiado by connecting buyers, vendors, and administrators on a single platform. The system is optimized for mobile and low-end devices, supports both English and Swahili, and features a minimalist, user-friendly interface.

## Key Features
### Admin Panel
- Dashboard with analytics (orders, vendors, revenue)
- Manage users (add, edit, delete, suspend)
- Manage vendors (approve, track performance)
- Set water pricing per liter
- Monitor delivery status
- View and resolve customer complaints

### User Area
- Account creation and login
- Order water (specify location and quantity)
- Track vendor arrival (with estimated time)
- View order history
- Chat with vendors
- Rate and review vendors

### Vendor Panel
- Register and await admin approval
- Accept/decline orders
- View assigned deliveries on a map
- Mark deliveries as "In Progress" or "Completed"
- Track earnings
- Chat with customers

## Technology Stack
- **Frontend:** HTML, CSS, JavaScript (Vanilla JS)
- **Backend:** Firebase (Firestore, Authentication, Hosting)
- **Database:** Firestore
- **Styling:** Tailwind CSS

## Installation & Setup (Windows)

### Prerequisites
- [Node.js & npm](https://nodejs.org/) (LTS recommended)
- [Firebase CLI](https://firebase.google.com/docs/cli)
- Git (optional, for cloning)

### Steps
1. **Clone the repository** (or download ZIP):
   ```powershell
   git clone https://github.com/currentsuspect/KWVMS.git
   cd KWVMS
   ```
2. **Install dependencies:**
   ```powershell
   npm install
   ```
3. **Set up Firebase:**
   - Go to [Firebase Console](https://console.firebase.google.com/) and create a new project.
   - Enable **Authentication** and **Firestore**.
   - Copy your Firebase config and paste it into `js/firebase-config.js` (replace the placeholder values).
4. **Deploy Firestore rules and indexes:**
   ```powershell
   firebase deploy --only firestore:rules,firestore:indexes
   ```
5. **Build Tailwind CSS:**
   ```powershell
   npm run build
   ```
6. **Start a local server (optional for testing):**
   You can use the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension in VS Code, or run:
   ```powershell
   npx serve .
   ```

## Usage Guide
- **Admin:** Log in, manage users/vendors/orders, set pricing, resolve complaints.
- **User:** Register/login, order water, track delivery, chat, rate vendors.
- **Vendor:** Register, await approval, accept/complete orders, chat, track earnings.

## Deployment
1. **Build the project:**
   ```powershell
   npm run build
   ```
2. **Deploy to Firebase Hosting:**
   ```powershell
   firebase deploy
   ```

## Troubleshooting & Support
- If you encounter permission errors, ensure your Firestore rules are deployed and correct.
- For missing indexes, follow the Firebase Console prompts or deploy with the command above.
- For any issues, check the browser console for error messages.
- For further help, consult the included `FIXES.md`, `ORDER_CONFIRMATION_FIX.md`, `VENDOR_FIXES.md`, and `LOCATION_FIXES.md` files for solutions to common problems.

## License
This project is intended for educational use (KNEC Diploma in IT). If you require a formal license, create a `LICENSE` file (MIT or as required by your institution).

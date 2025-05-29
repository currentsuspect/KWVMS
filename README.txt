Kajiado Water Vending Management System (KWVMS)
==================================================

This is a web-based system for managing water delivery in Kajiado County using donkey vendors. It connects buyers, vendors, and an admin for easy order management.

Main Features:
- Admin dashboard for managing users, vendors, orders, and pricing
- Users can order water, track deliveries, chat with vendors, and rate service
- Vendors can accept/decline orders, mark deliveries, and track earnings

Technology Used:
- HTML, CSS, JavaScript (Vanilla JS)
- Firebase (Firestore, Authentication, Hosting)
- Tailwind CSS for styling

Quick Installation (Windows):
1. Make sure you have Node.js and npm installed
2. (Optional) Install Git for cloning
3. Open PowerShell and run:
   git clone https://github.com/currentsuspect/KWVMS.git
   cd KWVMS
   npm install
4. Set up your Firebase project and copy your config to js/firebase-config.js
5. Deploy Firestore rules and indexes:
   firebase deploy --only firestore:rules,firestore:indexes
6. Build CSS:
   npm run build
7. (Optional) Start a local server for testing:
   npx serve .

For more details, see the main README.md file in this folder.

Note: This project is for educational use (KNEC Diploma in IT). 
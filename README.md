# Kajiado Water Vending Management System (KWVMS)

A web-based platform designed to facilitate water delivery in Kajiado using vendors who transport water via donkeys. The system connects users (buyers) who need water, vendors (donkey water carriers) who deliver it, and an admin who manages orders, users, and vendors.

## Features

### Admin Panel
- Dashboard with analytics (e.g., total orders, active vendors, revenue)
- Manage users (add, edit, delete, suspend)
- Manage vendors (approve, track performance)
- Set water pricing per liter
- Monitor delivery status
- View customer complaints and resolve issues

### User Main Area
- Create an account and log in
- Order water by specifying location and quantity (e.g., 50L, 100L, etc.)
- Track vendor arrival status (estimated time based on distance)
- View order history
- Contact vendor via chat
- Rate and review vendors

### Vendor Panel
- Register as a vendor and get admin approval
- Accept or decline orders
- View assigned deliveries on a map
- Mark deliveries as "In Progress" and "Completed"
- Earnings tracking (commission-based or fixed pricing)
- Chat with customers

## Technology Stack
- **Frontend:** HTML, CSS, JavaScript (Vanilla JS)
- **Backend:** Firebase
- **Database:** Firestore
- **Authentication:** Firebase Authentication
- **Hosting:** Firebase Hosting

## Installation and Setup
1. Clone the repository: `git clone https://github.com/yourusername/KWVMS.git`
2. Navigate to the project directory: `cd KWVMS`
3. Install dependencies: `npm install`
4. Configure Firebase:
   - Create a new Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Enable Authentication and Firestore
   - Add your Firebase configuration to `js/firebase-config.js`
5. Deploy Firestore rules: `firebase deploy --only firestore:rules`
6. Start the development server: `npm start`

## Usage
1. **Admin:**
   - Log in with admin credentials
   - Access the admin dashboard to manage users, vendors, and orders
   - Set water pricing and monitor system performance

2. **User:**
   - Create an account and log in
   - Place an order by specifying location and quantity
   - Track order status and chat with the assigned vendor
   - Rate and review vendors after delivery

3. **Vendor:**
   - Register as a vendor and wait for admin approval
   - Log in to the vendor dashboard
   - View available orders and accept those within your delivery radius
   - Update order status (In Progress, Completed)
   - Chat with customers and track earnings

## Deployment
1. Build the project: `npm run build`
2. Deploy to Firebase: `firebase deploy`

## Contributing
1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit them: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Submit a pull request

## License
This project is licensed under the MIT License - see the LICENSE file for details.

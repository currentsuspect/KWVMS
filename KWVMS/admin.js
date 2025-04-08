// Initialize Firebase
// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAtXdkPCyjEgCnnag7Hg3Pl71e3lC9GLB8",
    authDomain: "kajiadowatersystem-bb4fb.firebaseapp.com",
    projectId: "kajiadowatersystem-bb4fb",
    storageBucket: "kajiadowatersystem-bb4fb.firebasestorage.app",
    messagingSenderId: "532591308443",
    appId: "1:532591308443:web:bd3eab186207e0f4b8203e",
    measurementId: "G-KM0M5V1HV4"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const totalUsersElement = document.getElementById('totalUsers');
const activeVendorsElement = document.getElementById('activeVendors');
const pendingOrdersElement = document.getElementById('pendingOrders');
const totalRevenueElement = document.getElementById('totalRevenue');
const recentActivityElement = document.getElementById('recentActivity');

// Check authentication state
auth.onAuthStateChanged(async (user) => {
    console.log("Auth state changed:", user ? "User logged in" : "No user");
    
    if (!user) {
        console.log("No user found, redirecting to index.html");
        window.location.href = 'index.html';
        return;
    }

    try {
        // Check if user is admin
        console.log("Checking admin role for user:", user.uid);
        const userDoc = await db.collection('users').doc(user.uid).get();
        console.log("User document exists:", userDoc.exists);
        
        if (!userDoc.exists) {
            console.log("User document not found in Firestore");
            window.location.href = 'index.html';
            return;
        }

        const userData = userDoc.data();
        console.log("User role:", userData.role);
        
        if (userData.role !== 'admin') {
            console.log("User is not an admin");
            window.location.href = 'index.html';
            return;
        }

        console.log("User is admin, loading dashboard");
        // Load dashboard data
        loadDashboardData();
    } catch (error) {
        console.error("Error checking admin role:", error);
        window.location.href = 'index.html';
    }
});

// Load all dashboard data
async function loadDashboardData() {
    try {
        // Load statistics
        await Promise.all([
            loadTotalUsers(),
            loadActiveVendors(),
            loadPendingOrders(),
            loadTotalRevenue()
        ]);

        // Load recent activity
        await loadRecentActivity();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showToast('Error loading dashboard data', 'error');
    }
}

// Load total users count
async function loadTotalUsers() {
    try {
        const snapshot = await db.collection('users').get();
        totalUsersElement.textContent = snapshot.size;
    } catch (error) {
        console.error('Error loading total users:', error);
        totalUsersElement.textContent = 'Error';
    }
}

// Load active vendors count
async function loadActiveVendors() {
    try {
        const snapshot = await db.collection('users')
            .where('role', '==', 'vendor')
            .where('status', '==', 'active')
            .get();
        activeVendorsElement.textContent = snapshot.size;
    } catch (error) {
        console.error('Error loading active vendors:', error);
        activeVendorsElement.textContent = 'Error';
    }
}

// Load pending orders count
async function loadPendingOrders() {
    try {
        const snapshot = await db.collection('orders')
            .where('status', '==', 'pending')
            .get();
        pendingOrdersElement.textContent = snapshot.size;
    } catch (error) {
        console.error('Error loading pending orders:', error);
        pendingOrdersElement.textContent = 'Error';
    }
}

// Load total revenue
async function loadTotalRevenue() {
    try {
        const snapshot = await db.collection('orders')
            .where('status', '==', 'completed')
            .where('paymentStatus', '==', 'paid')
            .get();
        
        const total = snapshot.docs.reduce((sum, doc) => {
            return sum + (doc.data().totalAmount || 0);
        }, 0);
        
        totalRevenueElement.textContent = `KES ${total.toLocaleString()}`;
    } catch (error) {
        console.error('Error loading total revenue:', error);
        totalRevenueElement.textContent = 'Error';
    }
}

// Load recent activity
async function loadRecentActivity() {
    try {
        // Get recent orders
        const ordersSnapshot = await db.collection('orders')
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();

        // Get recent user registrations
        const usersSnapshot = await db.collection('users')
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();

        // Combine and sort activities
        const activities = [
            ...ordersSnapshot.docs.map(doc => ({
                type: 'order',
                data: doc.data(),
                timestamp: doc.data().createdAt
            })),
            ...usersSnapshot.docs.map(doc => ({
                type: 'user',
                data: doc.data(),
                timestamp: doc.data().createdAt
            }))
        ].sort((a, b) => b.timestamp - a.timestamp)
         .slice(0, 5);

        // Clear loading message
        recentActivityElement.innerHTML = '';

        // Add activities to the list
        activities.forEach(activity => {
            const activityElement = document.createElement('div');
            activityElement.className = 'flex items-center space-x-3 p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg';

            // Activity icon
            const iconElement = document.createElement('div');
            iconElement.className = 'p-2 rounded-full';
            
            if (activity.type === 'order') {
                iconElement.className += ' bg-primary-50 dark:bg-primary-900/20';
                iconElement.innerHTML = `
                    <svg class="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                `;
            } else {
                iconElement.className += ' bg-accent-50 dark:bg-accent-900/20';
                iconElement.innerHTML = `
                    <svg class="w-5 h-5 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                `;
            }

            // Activity content
            const contentElement = document.createElement('div');
            contentElement.className = 'flex-1 min-w-0';
            
            if (activity.type === 'order') {
                contentElement.innerHTML = `
                    <p class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        New order #${activity.data.orderId || 'N/A'}
                    </p>
                    <p class="text-sm text-neutral-500 dark:text-neutral-400">
                        ${activity.data.status || 'Unknown status'}
                    </p>
                `;
            } else {
                contentElement.innerHTML = `
                    <p class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        New ${activity.data.role || 'user'} registered
                    </p>
                    <p class="text-sm text-neutral-500 dark:text-neutral-400">
                        ${activity.data.name || activity.data.email || 'Unknown user'}
                    </p>
                `;
            }

            // Timestamp
            const timeElement = document.createElement('div');
            timeElement.className = 'text-xs text-neutral-500 dark:text-neutral-400';
            timeElement.textContent = formatTimestamp(activity.timestamp);

            // Assemble activity item
            activityElement.appendChild(iconElement);
            activityElement.appendChild(contentElement);
            activityElement.appendChild(timeElement);
            recentActivityElement.appendChild(activityElement);
        });

        // Show message if no activities
        if (activities.length === 0) {
            recentActivityElement.innerHTML = `
                <p class="text-neutral-500 dark:text-neutral-400 text-sm">
                    No recent activity
                </p>
            `;
        }
    } catch (error) {
        console.error('Error loading recent activity:', error);
        recentActivityElement.innerHTML = `
            <p class="text-error-500 dark:text-error-400 text-sm">
                Error loading recent activity
            </p>
        `;
    }
}

// Format timestamp to relative time
function formatTimestamp(timestamp) {
    if (!timestamp) return 'Unknown time';
    
    const now = new Date();
    const date = timestamp.toDate();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
}

// Show toast notification
function showToast(message, type = 'info') {
    // Implementation depends on your UI utils
    if (typeof window.showToast === 'function') {
        window.showToast(message, type);
    } else {
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
} 
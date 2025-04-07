// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get references to Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const orderListContainer = document.getElementById('orderListContainer');

// --- Authentication and Authorization Check ---
document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            console.log("Admin orders page: User authenticated", user.uid);
            // Check if the user has admin role
            try {
                const userDocRef = db.collection('users').doc(user.uid);
                const userDoc = await userDocRef.get();

                if (userDoc.exists && userDoc.data().role === 'admin') {
                    console.log("User is authorized as admin.");
                    loadOrders(); // Proceed to load order data
                } else {
                    console.warn("User is not an admin. Redirecting...");
                    alert("Access Denied: You do not have permission to view this page.");
                    window.location.href = 'index.html'; // Redirect non-admins
                }
            } catch (error) {
                console.error("Error checking admin role:", error);
                orderListContainer.innerHTML = '<p class="p-6 text-red-600">Error verifying your permissions. Please try again later.</p>';
            }
        } else {
            console.log("Admin orders page: No user authenticated. Redirecting to login...");
            window.location.href = 'index.html'; // Redirect if not logged in
        }
    });
});

// --- Load Orders Function ---
async function loadOrders() {
    if (!orderListContainer) {
        console.error("Order list container not found.");
        return;
    }
    orderListContainer.innerHTML = '<p class="p-6 text-gray-500">Loading orders...</p>';

    try {
        // Query orders collection, ordered by creation date
        const ordersQuery = db.collection('orders').orderBy('createdAt', 'desc');
        const ordersSnapshot = await ordersQuery.get();

        if (ordersSnapshot.empty) {
            orderListContainer.innerHTML = '<p class="p-6 text-gray-600">No orders found in the system.</p>';
            return;
        }

        // Start building the table structure
        let tableHtml = `
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor ID</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
        `;

        ordersSnapshot.forEach(doc => {
            const order = doc.data();
            const orderId = doc.id;
            
            const createdAtDate = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : 'N/A';
            const statusText = typeof formatStatus === 'function' ? formatStatus(order.status) : (order.status || 'Unknown'); // Use helper if available
            const statusColors = typeof getStatusColorClasses === 'function' ? getStatusColorClasses(order.status) : { text: 'text-gray-500', bg: 'bg-gray-100' }; // Use helper if available

            tableHtml += `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${orderId.substring(0, 8)}...</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500" title="${order.userId || 'N/A'}">${(order.userId || 'N/A').substring(0, 8)}...</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${order.quantityLiters || 'N/A'} L</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                         <span class="${statusColors.text} ${statusColors.bg} px-2 py-0.5 rounded-full text-xs inline-block">${statusText}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${createdAtDate}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500" title="${order.assignedVendorId || 'N/A'}">${(order.assignedVendorId || 'N/A').substring(0, 8)}...</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button class="text-indigo-600 hover:text-indigo-900" disabled>Details</button>
                        <button class="text-blue-600 hover:text-blue-900" disabled>Reassign</button> 
                    </td>
                </tr>
            `;
        });

        tableHtml += `
                </tbody>
            </table>
        `;

        orderListContainer.innerHTML = tableHtml;

    } catch (error) {
        console.error("Error loading orders:", error);
        if (error.code === 'permission-denied') {
             orderListContainer.innerHTML = '<p class="p-6 text-red-600">Error: Insufficient permissions to load orders. Ensure Firestore rules allow admin read access to the orders collection.</p>';
        } else if (error.code === 'failed-precondition') {
             // This might happen if ordering by createdAt needs an index, though usually not for a single orderBy
             orderListContainer.innerHTML = '<p class="p-6 text-red-600">Error: Database query failed, potentially missing an index. Check console for details.</p>';
             console.error("Firestore query error:", error);
        } else {
            orderListContainer.innerHTML = '<p class="p-6 text-red-600">Could not load orders. Please try again later.</p>';
        }
    }
}

// --- Action Functions (Placeholders) ---
// function handleViewOrderDetails(orderId) { ... }
// function handleReassignOrder(orderId) { ... } 
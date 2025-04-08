// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get references to Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const vendorListContainer = document.getElementById('vendorListContainer');

// --- Authentication and Authorization Check ---
document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            console.log("Admin vendors page: User authenticated", user.uid);
            // Check if the user has admin role
            try {
                const userDocRef = db.collection('users').doc(user.uid);
                const userDoc = await userDocRef.get();

                if (userDoc.exists && userDoc.data().role === 'admin') {
                    console.log("User is authorized as admin.");
                    loadVendors(); // Proceed to load vendor data
                } else {
                    console.warn("User is not an admin. Redirecting...");
                    showToast("Access Denied: You do not have permission to view this page.", "error");
                    window.location.href = 'index.html'; // Redirect non-admins
                }
            } catch (error) {
                console.error("Error checking admin role:", error);
                vendorListContainer.innerHTML = '<p class="p-6 text-red-600">Error verifying your permissions. Please try again later.</p>';
                showToast("Error verifying your permissions. Please try again later.", "error");
            }
        } else {
            console.log("Admin vendors page: No user authenticated. Redirecting to login...");
            window.location.href = 'index.html'; // Redirect if not logged in
        }
    });
});

// --- Load Vendors Function ---
async function loadVendors() {
    if (!vendorListContainer) {
        console.error("Vendor list container not found.");
        return;
    }
    vendorListContainer.innerHTML = '<p class="p-6 text-gray-500">Loading vendors...</p>';

    try {
        // Query users collection, filtering by role == 'vendor'
        const vendorsQuery = db.collection('users').where('role', '==', 'vendor').orderBy('createdAt', 'desc');
        const vendorsSnapshot = await vendorsQuery.get();

        if (vendorsSnapshot.empty) {
            vendorListContainer.innerHTML = '<p class="p-6 text-gray-600">No vendors found in the system.</p>';
            return;
        }

        // Start building the table structure
        let tableHtml = `
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
        `;

        vendorsSnapshot.forEach(doc => {
            const vendor = doc.data();
            const vendorId = doc.id;
            // Determine status - needs refinement based on actual vendor lifecycle
            // For now, assume 'approved' if they exist, could check for 'accountSuspended' later
            const statusText = vendor.accountSuspended ? 'Suspended' : (vendor.status === 'approved' || vendor.status === 'available' || vendor.status === 'busy' ? 'Approved' : 'Pending Approval'); 
            const statusColor = vendor.accountSuspended ? 'text-red-600' : (statusText === 'Approved' ? 'text-green-600' : 'text-yellow-600');

            tableHtml += `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${vendor.name || 'N/A'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${vendor.email || 'N/A'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${vendor.phone || 'N/A'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold ${statusColor}">${statusText}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        ${statusText !== 'Approved' ? 
                            `<button onclick="handleApproveVendor('${vendorId}')" class="text-green-600 hover:text-green-900">Approve</button>` : ''}
                        ${!vendor.accountSuspended ? 
                            `<button onclick="handleSuspendVendor('${vendorId}', true)" class="text-red-600 hover:text-red-900">Suspend</button>` : 
                            `<button onclick="handleSuspendVendor('${vendorId}', false)" class="text-yellow-600 hover:text-yellow-900">Unsuspend</button>`}
                    </td>
                </tr>
            `;
        });

        tableHtml += `
                </tbody>
            </table>
        `;

        vendorListContainer.innerHTML = tableHtml;

    } catch (error) {
        console.error("Error loading vendors:", error);
        if (error.code === 'permission-denied') {
             vendorListContainer.innerHTML = '<p class="p-6 text-red-600">Error: Insufficient permissions to load vendors. Ensure Firestore rules allow admin read access filtered by role.</p>';
        } else if (error.code === 'failed-precondition') {
            // This error usually means a composite index is required by Firestore
             vendorListContainer.innerHTML = `<p class="p-6 text-red-600">Error: Database requires an index for this query. Please create a composite index on the 'users' collection for fields 'role' (ascending) and 'createdAt' (descending).</p>`;
             console.error("Firestore indexing error. Go to the Firestore console link provided in the error details to create the index.");
        } else {
            vendorListContainer.innerHTML = '<p class="p-6 text-red-600">Could not load vendors. Please try again later.</p>';
        }
    }
}

// --- Action Functions (Implement logic and add Firestore rules) ---
async function handleApproveVendor(vendorId) {
    console.log(`Attempting to approve vendor: ${vendorId}`);
    if (!confirm('Are you sure you want to approve this vendor?')) return;

    try {
        const vendorRef = db.collection('users').doc(vendorId);
        await vendorRef.update({ 
            status: 'available'
        });
        showToast('Vendor approved successfully!', 'success');
        loadVendors(); // Refresh the list
    } catch (error) {
        console.error("Error approving vendor:", error);
        showToast(`Failed to approve vendor: ${error.message}. Check Firestore rules.`, 'error');
    }
}

async function handleSuspendVendor(vendorId, suspend) {
    const action = suspend ? 'suspend' : 'unsuspend';
    console.log(`Attempting to ${action} vendor: ${vendorId}`);
    if (!confirm(`Are you sure you want to ${action} this vendor?`)) return;

    try {
        const vendorRef = db.collection('users').doc(vendorId);
        await vendorRef.update({ 
            accountSuspended: suspend,
            ...(suspend && { status: 'unavailable' })
        });
        showToast(`Vendor ${action}ed successfully!`, 'success');
        loadVendors(); // Refresh the list
    } catch (error) {
        console.error(`Error ${action}ing vendor:`, error);
        showToast(`Failed to ${action} vendor: ${error.message}. Check Firestore rules.`, 'error');
    }
} 
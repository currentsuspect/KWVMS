// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get references to Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const userListContainer = document.getElementById('userListContainer');

// --- Authentication and Authorization Check ---
document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            console.log("Admin page: User authenticated", user.uid);
            // Check if the user has admin role
            try {
                const userDocRef = db.collection('users').doc(user.uid);
                const userDoc = await userDocRef.get();

                if (userDoc.exists && userDoc.data().role === 'admin') {
                    console.log("User is authorized as admin.");
                    loadUsers(); // Proceed to load user data
                } else {
                    console.warn("User is not an admin. Redirecting...");
                    alert("Access Denied: You do not have permission to view this page.");
                    window.location.href = 'index.html'; // Redirect non-admins
                }
            } catch (error) {
                console.error("Error checking admin role:", error);
                userListContainer.innerHTML = '<p class="p-6 text-red-600">Error verifying your permissions. Please try again later.</p>';
                // Optionally redirect or show a more permanent error
            }
        } else {
            console.log("Admin page: No user authenticated. Redirecting to login...");
            window.location.href = 'index.html'; // Redirect if not logged in
        }
    });
});

// --- Load Users Function ---
async function loadUsers() {
    if (!userListContainer) {
        console.error("User list container not found.");
        return;
    }
    userListContainer.innerHTML = '<p class="p-6 text-gray-500">Loading users...</p>';

    try {
        const usersSnapshot = await db.collection('users').orderBy('createdAt', 'desc').get();

        if (usersSnapshot.empty) {
            userListContainer.innerHTML = '<p class="p-6 text-gray-600">No users found in the system.</p>';
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
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
        `;

        usersSnapshot.forEach(doc => {
            const user = doc.data();
            tableHtml += `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${user.name || 'N/A'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.email || 'N/A'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.phone || 'N/A'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.role || 'N/A'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button class="text-indigo-600 hover:text-indigo-900" disabled>Edit</button>
                        <button class="text-red-600 hover:text-red-900" disabled>Suspend</button>
                    </td>
                </tr>
            `;
        });

        tableHtml += `
                </tbody>
            </table>
        `;

        userListContainer.innerHTML = tableHtml;

    } catch (error) {
        console.error("Error loading users:", error);
        // Specific check for permission errors which are likely until rules are updated
        if (error.code === 'permission-denied') {
             userListContainer.innerHTML = '<p class="p-6 text-red-600">Error: Insufficient permissions to load users. Ensure Firestore rules allow admin read access to the users collection.</p>';
        } else {
            userListContainer.innerHTML = '<p class="p-6 text-red-600">Could not load users. Please try again later.</p>';
        }
    }
}

// --- Action Functions (Placeholders) ---
// function handleEditUser(userId) { ... }
// function handleSuspendUser(userId) { ... } 
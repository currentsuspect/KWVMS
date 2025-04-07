// Firebase v9+ Modular Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    getDoc, // Import getDoc for potential future use
    addDoc, // <-- Add this import for adding new documents
    onSnapshot,
    serverTimestamp,
    enableIndexedDbPersistence, // For enabling offline persistence
    query,
    where,
    orderBy,
    getDocs
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// REMOVED Firebase Configuration - Now in js/firebase-config.js

// Initialize Firebase
// Ensure firebaseConfig is loaded from js/firebase-config.js before this script runs
const app = initializeApp(firebaseConfig);

// Get Firebase Services
const auth = getAuth(app);
const db = getFirestore(app);

// Enable Firestore Persistence (Re-enabled with v9 syntax)
try {
  await enableIndexedDbPersistence(db);
  console.log("Firestore persistence enabled.");
} catch (err) {
  if (err.code == 'failed-precondition') {
    console.warn('Firestore persistence failed: Multiple tabs open?');
  } else if (err.code == 'unimplemented') {
    console.warn('Firestore persistence failed: Browser does not support required features.');
  }
}

// Get Reference to Main Content Area
const appContent = document.getElementById('app-content');

// --- Application Logic Will Go Here ---

// Example: Log to console to confirm initialization
console.log("Firebase Initialized Successfully (v9 Modular)");
console.log("Auth service:", auth);
console.log("Firestore service:", db);

// Function to clear content area
function clearContent() {
    appContent.innerHTML = '';
}

// Function to show loading state
function showLoading() {
    clearContent();
    appContent.innerHTML = '<p>Loading...</p>';
}

// --- View Rendering Functions ---

function renderLoginView() {
    clearContent();
    // Apply Tailwind classes for a modern look
    const loginHtml = `
        <div class="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div class="max-w-md w-full space-y-8">
                <!-- Added Application Title -->
                <div class="text-center">
                     <img class="mx-auto h-12 w-auto" src="images/logo_placeholder.png" alt="Logo"> <!-- Optional: Add a logo -->
                     <h1 class="text-xl font-semibold text-gray-700">Kajiado Water Vending Management System</h1>
                </div>
                <div class="bg-white p-8 rounded-lg shadow-md space-y-6"> 
                    <div>
                        <h2 class="text-center text-2xl font-bold text-gray-900">
                            Sign in to your account
                        </h2>
                    </div>
                    <form id="login-form" class="space-y-6">
                        <input type="hidden" name="remember" value="true">
                        <div class="rounded-md shadow-sm -space-y-px">
                            <div>
                                <label for="login-email" class="sr-only">Email address</label>
                                <input id="login-email" name="email" type="email" autocomplete="email" required 
                                       class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                       placeholder="Email address">
                            </div>
                            <div>
                                <label for="login-password" class="sr-only">Password</label>
                                <input id="login-password" name="password" type="password" autocomplete="current-password" required 
                                       class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                       placeholder="Password">
                            </div>
                        </div>

                        <!-- Refined Auth Error Styling -->
                        <div id="auth-error" class="p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm hidden"></div> 

                        <div>
                            <button type="submit" 
                                    class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                Sign in
                            </button>
                        </div>
                    </form>
                     <p class="text-center text-sm text-gray-600">
                        Don't have an account? 
                        <button id="go-to-register" class="font-medium text-indigo-600 hover:text-indigo-500">
                            Register here
                        </button>
                    </p>
                </div>
            </div>
        </div>
    `;
    appContent.innerHTML = loginHtml;

    // Add event listeners
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('go-to-register').addEventListener('click', renderRegisterView);
    // Error message styling handled by CSS, logic to show/hide in handleLogin
}

function renderRegisterView() {
    clearContent();
    // Apply Tailwind classes for a modern look
    const registerHtml = `
       <div class="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div class="max-w-md w-full space-y-8">
                 <!-- Added Application Title -->
                <div class="text-center">
                     <img class="mx-auto h-12 w-auto" src="images/logo_placeholder.png" alt="Logo"> <!-- Optional: Add a logo -->
                     <h1 class="text-xl font-semibold text-gray-700">Kajiado Water Vending Management System</h1>
                </div>
                <div class="bg-white p-8 rounded-lg shadow-md space-y-6">
                    <div>
                        <h2 class="text-center text-2xl font-bold text-gray-900">
                            Create your account
                        </h2>
                    </div>
                    <form id="register-form" class="space-y-6">
                        <div class="space-y-4">
                            <div>
                                <label for="register-name" class="sr-only">Full Name</label>
                                <input id="register-name" name="name" type="text" required 
                                       class="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                       placeholder="Full Name">
                            </div>
                             <div>
                                <label for="register-email" class="sr-only">Email address</label>
                                <input id="register-email" name="email" type="email" autocomplete="email" required 
                                       class="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                       placeholder="Email address">
                            </div>
                             <div>
                                <label for="register-phone" class="sr-only">Phone Number</label>
                                <input id="register-phone" name="phone" type="tel" autocomplete="tel" required 
                                       class="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                       placeholder="Phone Number">
                            </div>
                            <div>
                                <label for="register-password" class="sr-only">Password</label>
                                <input id="register-password" name="password" type="password" autocomplete="new-password" required minlength="6"
                                       class="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                       placeholder="Password (min. 6 characters)">
                            </div>
                             <div>
                                <label for="register-role" class="block text-sm font-medium text-gray-700 mb-1">Register as:</label>
                                <select id="register-role" name="role" required
                                        class="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm">
                                    <option value="user" selected>Water Buyer (User)</option>
                                    <option value="vendor">Water Vendor</option>
                                </select>
                            </div>
                        </div>

                        <!-- Refined Auth Error Styling -->
                        <div id="auth-error" class="p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm hidden"></div>

                        <div>
                            <button type="submit" 
                                    class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                Register
                            </button>
                        </div>
                    </form>
                     <p class="text-center text-sm text-gray-600">
                        Already have an account? 
                        <button id="go-to-login" class="font-medium text-indigo-600 hover:text-indigo-500">
                            Login here
                        </button>
                    </p>
                </div>
            </div>
        </div>
    `;
    appContent.innerHTML = registerHtml;

    // Add event listeners
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('go-to-login').addEventListener('click', renderLoginView);
    // Error message styling handled by CSS, logic to show/hide in handleRegister
}

// --- Placeholder Dashboard/Panel Views ---

function renderUserDashboard(user, userData) {
    clearContent();
    // Apply Tailwind classes for a modern user dashboard
    appContent.innerHTML = `
        <div class="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
            <div class="max-w-4xl mx-auto">
                <div class="flex justify-end items-center mb-6">
                     <button id="logout-button" class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                        Logout
                    </button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <!-- Profile Section -->
                    <div class="md:col-span-1 bg-white p-6 rounded-lg shadow">
                        <h3 class="text-lg font-medium leading-6 text-gray-900 border-b border-gray-200 pb-2 mb-4">My Profile</h3>
                        <div class="space-y-3 text-sm text-gray-700">
                            <p><strong>Name:</strong> ${userData.name || 'N/A'}</p>
                            <p><strong>Email:</strong> ${user.email}</p>
                            <p><strong>Phone:</strong> ${userData.phone || 'N/A'}</p>
                            <p><strong>Role:</strong> ${userData.role}</p>
                        </div>
                        <button id="edit-profile-button" class="mt-4 w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" disabled>
                            Edit Profile (Soon)
                        </button>
                    </div>

                    <!-- Actions & Order History Section -->
                    <div class="md:col-span-2 space-y-6">
                        <!-- Actions Card -->
                        <div class="bg-white p-6 rounded-lg shadow">
                             <h3 class="text-lg font-medium leading-6 text-gray-900 border-b border-gray-200 pb-2 mb-4">Actions</h3>
                            <button id="order-water-button" class="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                Order Water
                            </button>
                        </div>

                        <!-- Order History Card -->
                        <div class="bg-white p-6 rounded-lg shadow">
                            <h3 class="text-lg font-medium leading-6 text-gray-900 border-b border-gray-200 pb-2 mb-4">My Order History</h3>
                            <div id="user-order-list" class="space-y-4">
                                <!-- Orders will be loaded here -->
                                <p class="text-gray-500">Loading order history...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add event listeners
    document.getElementById('logout-button').addEventListener('click', handleLogout);
    document.getElementById('order-water-button').addEventListener('click', renderOrderWaterView);
    // Add listeners for other buttons when implemented
    // document.getElementById('edit-profile-button').addEventListener('click', handleEditProfile);
    
    // Load the user's order history
    loadUserOrderHistory(user.uid);
}

function renderVendorPanel(user, userData) {
    clearContent();
    // Apply Tailwind classes for a modern vendor panel
    appContent.innerHTML = `
        <div class="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
            <div class="max-w-4xl mx-auto">
                 <div class="flex justify-end items-center mb-6">
                    <button id="logout-button" class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                        Logout
                    </button>
                </div>

                <div class="bg-white p-6 rounded-lg shadow mb-6">
                    <h3 class="text-lg font-medium leading-6 text-gray-900 border-b border-gray-200 pb-2 mb-4">Welcome, ${userData.name || user.email}!</h3>
                    <div class="space-y-3 text-sm text-gray-700">
                        <p><strong>Role:</strong> ${userData.role}</p>
                        <p><strong>Your UID:</strong> ${user.uid}</p>
                        <p><strong>Phone:</strong> ${userData.phone || 'N/A'}</p>
                         <a href="vendor-dashboard.html" class="mt-5 w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Go to Full Delivery Management
                         </a>
                    </div>
                </div>

                 <!-- Placeholder Section -->
                 <div class="bg-white p-6 rounded-lg shadow">
                     <h3 class="text-lg font-medium leading-6 text-gray-900 border-b border-gray-200 pb-2 mb-4">Quick Info</h3>
                     <p class="text-gray-500 text-sm">Key information or quick actions might appear here later. For full details, use the button above.</p>
                 </div>
            </div>
        </div>
    `;
     document.getElementById('logout-button').addEventListener('click', handleLogout);
}

function renderAdminPanel(user, userData) {
    clearContent();
    console.log(`Rendering Admin Panel for: ${userData.name || user.email}`);

    // Admin Panel Layout with Tailwind
    appContent.innerHTML = `
        <div class="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
            <div class="max-w-7xl mx-auto">
                <div class="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-gray-300">
                    <h1 class="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 sm:mb-0">Admin Dashboard</h1>
                    <div class="flex items-center space-x-4">
                         <span class="text-sm text-gray-600 hidden sm:inline">Welcome, ${userData.name || user.email}</span>
                         <button id="logout-button" class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                            Logout
                        </button>
                    </div>
                </div>

                <!-- Placeholder Cards for Admin Sections -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    
                    <!-- Manage Users Card -->
                    <div class="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
                        <h3 class="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Manage Users</h3>
                        <p class="text-sm text-gray-600 mb-4">View, edit, or suspend user accounts.</p>
                        <a href="admin-users.html" class="block w-full text-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Go to User Management
                        </a>
                    </div>

                    <!-- Manage Vendors Card -->
                    <div class="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
                        <h3 class="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Manage Vendors</h3>
                        <p class="text-sm text-gray-600 mb-4">Approve new vendors, track performance.</p>
                        <button class="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" disabled>Go (Soon)</button>
                    </div>

                    <!-- Manage Orders Card -->
                    <div class="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
                        <h3 class="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Manage Orders</h3>
                        <p class="text-sm text-gray-600 mb-4">View all orders, monitor status, resolve issues.</p>
                        <button class="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" disabled>Go (Soon)</button>
                    </div>

                    <!-- Settings / Pricing Card -->
                    <div class="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
                        <h3 class="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Settings / Pricing</h3>
                        <p class="text-sm text-gray-600 mb-4">Set water price per liter, manage system settings.</p>
                        <button class="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" disabled>Go (Soon)</button>
                    </div>
                    
                </div>
            </div>
        </div>
    `;

    // Add event listeners
    document.getElementById('logout-button').addEventListener('click', handleLogout);
    // Add listeners for other admin buttons when implemented
}

// --- Add New View for Ordering Water ---
function renderOrderWaterView() {
    clearContent();
    const user = auth.currentUser;
    if (!user) {
        console.error("Cannot render order view: No user logged in.");
        renderLoginView();
        return;
    }

    // Modernized Order Form with Tailwind
    appContent.innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div class="max-w-lg w-full space-y-8">
                <div class="bg-white p-8 rounded-lg shadow-md space-y-6">
                    <div>
                        <h2 class="text-center text-2xl font-bold text-gray-900">
                            Place New Water Order
                        </h2>
                    </div>
                    <form id="order-form" class="space-y-6">
                        <div>
                            <label for="order-quantity-slider" class="block text-sm font-medium text-gray-700">Quantity (Liters): <span id="order-quantity-value" class="font-semibold text-indigo-600">100</span>L</label>
                            <input type="range" id="order-quantity-slider" name="quantity" 
                                   min="20" max="200" step="10" value="100" required 
                                   class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 mt-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                        </div>
                        <div>
                            <label for="order-location" class="block text-sm font-medium text-gray-700">Delivery Location Details:</label>
                            <textarea id="order-location" name="location" rows="4" required 
                                      class="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                      placeholder="Please provide specific details like house number, street, nearest landmark, etc."></textarea>
                        </div>
                        
                        <!-- Styled Error Message -->
                        <div id="order-error" class="text-red-600 text-sm mt-2 hidden"></div>
                        
                        <div class="flex items-center justify-between space-x-4">
                            <button type="button" id="cancel-order-button" 
                                    class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                Cancel
                            </button>
                            <button type="submit" 
                                    class="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                Submit Order
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    // --- Add JS for Slider Value Display ---
    const slider = document.getElementById('order-quantity-slider');
    const quantityDisplay = document.getElementById('order-quantity-value');

    if (slider && quantityDisplay) {
        // Set initial value display
        quantityDisplay.textContent = slider.value;
        
        // Update display on slider input
        slider.addEventListener('input', () => {
            quantityDisplay.textContent = slider.value;
        });
    } else {
        console.error("Could not find slider or quantity display element.");
    }
    // --- End Slider JS ---

    // Add event listeners for the form actions
    document.getElementById('order-form').addEventListener('submit', handlePlaceOrder);
    document.getElementById('cancel-order-button').addEventListener('click', () => {
        // Reload user dashboard (will refetch data)
        setupFirestoreListener(user);
    });
}

// --- Function to handle placing the order ---
async function handlePlaceOrder(event) {
    event.preventDefault();
    const user = auth.currentUser;
    if (!user) {
        console.error("User not logged in, cannot place order.");
        return;
    }

    const quantity = document.getElementById('order-quantity-slider').value; // Get value from slider
    const locationDetails = document.getElementById('order-location').value;
    const errorDiv = document.getElementById('order-error');
    errorDiv.textContent = ''; // Clear previous error
    errorDiv.classList.add('hidden');

    console.log(`Placing order: ${quantity}L, Location: ${locationDetails.substring(0, 30)}...`);

    try {
        // Add order to Firestore
        const ordersCollection = collection(db, "orders");
        await addDoc(ordersCollection, {
            userId: user.uid,
            quantityLiters: parseInt(quantity, 10),
            location: { 
                address: locationDetails 
            },
            status: 'pending', // Initial status
            createdAt: serverTimestamp()
        });

        console.log("Order placed successfully!");
        alert("Order placed successfully!"); // Simple feedback

        // Go back to user dashboard
        setupFirestoreListener(user); 

    } catch (error) {
        console.error("Error placing order:", error);
        errorDiv.textContent = `Error: ${error.message}`;
        errorDiv.classList.remove('hidden');
    }
}

// --- Authentication Logic Handlers ---

async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('auth-error');
    
    errorDiv.textContent = ''; // Clear previous errors
    errorDiv.classList.add('hidden'); // Hide error div initially

    try {
        console.log(`Attempting login for: ${email}`);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("Login successful for user:", user.uid);
        // Auth state change will handle redirecting to the correct dashboard
    } catch (error) {
        console.error("Login failed:", error);
        errorDiv.textContent = `Login Error: ${error.message}`;
        errorDiv.classList.remove('hidden'); // Show error div
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const phone = document.getElementById('register-phone').value;
    const password = document.getElementById('register-password').value;
    const role = document.getElementById('register-role').value;
    const errorDiv = document.getElementById('auth-error');

    errorDiv.textContent = ''; // Clear previous errors
    errorDiv.classList.add('hidden'); // Hide error div initially

    if (password.length < 6) {
        errorDiv.textContent = 'Password must be at least 6 characters long.';
        errorDiv.classList.remove('hidden');
        return;
    }

    try {
        console.log(`Attempting registration for: ${email}, Role: ${role}`);
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("Registration successful, UID:", user.uid);

        // Store additional user info in Firestore
        const userDocRef = doc(db, "users", user.uid); // Use v9 doc()
        await setDoc(userDocRef, {
            uid: user.uid,
            name: name,
            email: email,
            phone: phone,
            role: role,
            createdAt: serverTimestamp() // Use v9 serverTimestamp()
        });

        console.log("User profile created in Firestore for UID:", user.uid);

        // Clear form or let auth state listener handle redirect
        // document.getElementById('register-form').reset(); 

    } catch (error) {
        console.error("Registration failed:", error);
        errorDiv.textContent = `Registration Error: ${error.message}`;
        errorDiv.classList.remove('hidden'); // Show error div
    }
}

async function handleLogout() { // Mark async
    try {
        await signOut(auth);
        console.log('User signed out successfully.');
        // Auth state listener will render login view
    } catch (error) {
        console.error('Sign out error:', error);
    }
}

// --- Function to Setup Firestore Listener (with retries) ---
let retryCount = 0;
const MAX_RETRIES = 3;
let firestoreListenerUnsubscribe = null; // Define here, outside the function

function setupFirestoreListener(user) {
    // Unsubscribe from any previous listener
    if (firestoreListenerUnsubscribe) {
        console.log("Unsubscribing from previous Firestore listener before new setup.");
        firestoreListenerUnsubscribe();
        firestoreListenerUnsubscribe = null;
    }

    if (!user) return;

    showLoading();
    console.log(`Setting up Firestore listener (Attempt ${retryCount + 1}/${MAX_RETRIES})...`);

    const userDocRef = doc(db, "users", user.uid); // Get DocumentReference

    firestoreListenerUnsubscribe = onSnapshot(userDocRef, (docSnapshot) => { // Pass docRef here
        console.log("Firestore snapshot received.");
        retryCount = 0; // Reset retry count on successful snapshot

        if (docSnapshot.exists()) { // Use docSnapshot.exists()
            const userData = docSnapshot.data(); // Use docSnapshot.data()
            console.log("User data found:", userData);
            // Render view based on role
            switch (userData.role) {
                case 'user':
                    renderUserDashboard(user, userData);
                    break;
                case 'vendor':
                    renderVendorPanel(user, userData);
                    break;
                case 'admin':
                    // Call the new function for admin users
                    renderAdminPanel(user, userData); 
                    break;
                default:
                    console.error("Unknown user role:", userData.role);
                    clearContent();
                    appContent.innerHTML = '<p>Error: Unknown user role.</p> <button id="logout-button">Logout</button>';
                    if(document.getElementById('logout-button')){
                        document.getElementById('logout-button').addEventListener('click', handleLogout);
                    }
            }
        } else {
            console.error("User data not found in Firestore for UID:", user.uid);
            clearContent();
            appContent.innerHTML = '<p>Error: Could not load user data.</p> <button id="logout-button">Logout</button>';
             if(document.getElementById('logout-button')){
                 document.getElementById('logout-button').addEventListener('click', handleLogout);
             }
        }
    }, (error) => {
        console.error("Error listening to user data:", error);
        clearContent();

        if (error.code === 'unavailable' && retryCount < MAX_RETRIES) {
             retryCount++;
             appContent.innerHTML = `<p>Network unavailable. Retrying connection (${retryCount}/${MAX_RETRIES})...</p>`;
             setTimeout(() => setupFirestoreListener(user), 2000 * retryCount);
        } else if (error.code === 'unavailable') {
             appContent.innerHTML = '<p>Network connection failed after retries. Check connection and refresh.</p>';
        } else {
             appContent.innerHTML = '<p>Error loading user data.</p> <button id="logout-button">Logout</button>';
             if(document.getElementById('logout-button')){
                 document.getElementById('logout-button').addEventListener('click', handleLogout);
             }
        }
    });
}

// --- Authentication State Listener ---

onAuthStateChanged(auth, (user) => { // Pass auth service here
    // Unsubscribe from the previous listener if it exists
    if (firestoreListenerUnsubscribe) {
        console.log("Unsubscribing from previous Firestore listener due to auth state change.");
        firestoreListenerUnsubscribe();
        firestoreListenerUnsubscribe = null;
    }
    retryCount = 0; // Reset retry count

    if (user) {
        console.log("Auth state changed: User signed in", user.uid);
        setupFirestoreListener(user);
    } else {
        console.log("Auth state changed: User signed out");
        renderLoginView();
    }
});

// Initial UI state is handled by the onAuthStateChanged listener
console.log("App initialized, waiting for auth state...");

// Helper function to get Tailwind text/background color classes based on status
function getStatusColorClasses(status) {
    switch (status) {
        case 'pending':     return { text: 'text-blue-600', bg: 'bg-blue-100' };
        case 'assigned':    return { text: 'text-yellow-600', bg: 'bg-yellow-100' };
        case 'in_progress': return { text: 'text-orange-600', bg: 'bg-orange-100' };
        case 'completed':   return { text: 'text-green-600', bg: 'bg-green-100' };
        case 'cancelled':   return { text: 'text-red-600', bg: 'bg-red-100' };
        default:            return { text: 'text-gray-500', bg: 'bg-gray-100' };
    }
}

// Helper function to format status text
function formatStatus(status) {
    if (!status) return 'Unknown';
    // Capitalize first letter, replace underscores with spaces
    return status
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Function to Load User's Order History
async function loadUserOrderHistory(userId) {
    console.log("Loading order history for user:", userId);
    const orderListElement = document.getElementById('user-order-list');
    if (!orderListElement) {
        console.error("Could not find user-order-list element.");
        return;
    }

    orderListElement.innerHTML = '<p class="text-gray-500 p-4">Loading order history...</p>'; // Show loading state with padding

    try {
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
        console.log("Executing Firestore query for orders...");

        const querySnapshot = await getDocs(q);
        console.log(`Query completed. Found ${querySnapshot.size} orders.`);
        console.log(`Is query snapshot empty? ${querySnapshot.empty}`);

        if (querySnapshot.empty) {
            orderListElement.innerHTML = '<p class="text-gray-600 text-sm p-4">You haven\'t placed any orders yet.</p>';
            return;
        }

        orderListElement.innerHTML = '';
        let count = 0;

        querySnapshot.forEach((doc) => {
            count++;
            const order = doc.data();
            order.id = doc.id;
            console.log(`Processing order ${count}: ID=${order.id}, Status=${order.status}`);

            const orderDate = order.createdAt && order.createdAt.toDate
                              ? order.createdAt.toDate().toLocaleDateString()
                              : 'Date Unknown';
            const orderStatus = order.status ? formatStatus(order.status) : 'Status Unknown';
            const statusColors = getStatusColorClasses(order.status);

            // Use Tailwind classes for styling list items
            const orderItemHtml = `
                <div class="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between hover:bg-gray-50">
                    <div class="mb-2 sm:mb-0 flex-grow">
                        <p class="text-sm font-medium text-gray-900">Order #${order.id.substring(0, 8)}</p>
                        <p class="text-xs text-gray-500">Placed on: ${orderDate}</p>
                    </div>
                    <div class="text-sm text-right flex flex-col sm:flex-row items-end sm:items-center sm:space-x-4 mt-1 sm:mt-0">
                         <p class="text-gray-700 mb-1 sm:mb-0">${order.quantityLiters || 'N/A'} Liters</p>
                         <span class="font-semibold ${statusColors.text} ${statusColors.bg} px-2 py-0.5 rounded-full text-xs inline-block">${orderStatus}</span>
                    </div>
                </div>
            `;

            orderListElement.insertAdjacentHTML('beforeend', orderItemHtml); // Use insertAdjacentHTML for better performance
        });

    } catch (error) {
        console.error("Error loading user order history:", error);
        // Ensure you have appropriate Firestore indexes for the query
        if (error.code === 'failed-precondition') {
             orderListElement.innerHTML = '<p class="text-red-600 text-sm p-4">Error: Missing database index. Check console for details.</p>';
             console.error("Firestore indexing error. Please create the required composite index for the 'orders' collection query."); 
        } else {
            orderListElement.innerHTML = '<p class="text-red-600 text-sm p-4">Could not load order history. Please try again later.</p>';
        }
    }
}

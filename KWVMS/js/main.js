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
    getDocs,
    updateDoc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// <<< ADD TOP LEVEL LOG HERE >>>
console.log("--- main.js script executing --- ");

// REMOVED Firebase Configuration - Now in js/firebase-config.js

// Initialize Firebase
// Ensure firebaseConfig is loaded from js/firebase-config.js before this script runs
const app = initializeApp(firebaseConfig);

// Get Firebase Services
const auth = getAuth(app);
const db = getFirestore(app);

// Global variables for navigation elements
let navLinks = {};
let sections = {};
let mobileMenuButton = null;
let mobileMenu = null;
let currentUserData = null; // Store user data globally for easy access
let selectedVendorId = null;
let selectedVendorName = null;
let firestoreListenerUnsubscribe = null; // Define here, outside the function
let retryCount = 0;
const MAX_RETRIES = 3;

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
// const appContent = document.getElementById('app-content');

// --- Application Logic Will Go Here ---

// Example: Log to console to confirm initialization
console.log("Firebase Initialized Successfully (v9 Modular)");
console.log("Auth service:", auth);
console.log("Firestore service:", db);

// Function to show loading state
function showLoading() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.classList.remove('hidden');
        console.log("Loading indicator shown.");
    } else {
        console.warn("Attempted to show loading, but indicator element not found.");
    }
}

// Function to hide loading state
function hideLoading() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.classList.add('hidden');
        console.log("Loading indicator hidden.");
    } else {
        console.warn("Attempted to hide loading, but indicator element not found.");
    }
}

// --- View Rendering Functions ---

function renderLoginView() {
    console.log("Rendering Login View");
    // Hide main app sections
    document.getElementById('appNavBar')?.classList.add('hidden');
    document.getElementById('userDashboard')?.classList.add('hidden'); 
    document.getElementById('appFooter')?.classList.add('hidden');
    document.getElementById('loadingIndicator')?.classList.add('hidden'); // Ensure loading is hidden
    
    // Show login section
    const loginSection = document.getElementById('loginSection');
    if (!loginSection) {
        console.error("Login section element not found!");
        document.body.innerHTML = '<h1>Error: Login UI failed to load.</h1>'; // Fallback
        return;
    }
    loginSection.classList.remove('hidden');
    document.getElementById('registerSection')?.classList.add('hidden');

    // Populate login section's inner div
    const loginContainer = loginSection.querySelector('.max-w-md.w-full.space-y-8');
    if (!loginContainer) {
         console.error("Login container div not found within #loginSection!");
         loginSection.innerHTML = '<h1>Error: Login UI structure incomplete.</h1>';
         return;
    }

    const loginHtml = `
        <div class="text-center">
             <svg class="mx-auto h-10 w-10 text-primary-600 dark:text-primary-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 256 256">
                 <path d="M174,47.75a256.11,256.11,0,0,0-41.45-38.3,8,8,0,0,0-9.1,0,256.11,256.11,0,0,0-41.45,38.3C61.79,77.42,49.5,123.61,49.51,169.25c0,45.63,17.18,89.44,48.46,121.87A88.45,88.45,0,0,0,128,232a88.45,88.45,0,0,0,30-41.13c31.28-32.43,48.46-76.24,48.46-121.87C206.5,123.61,194.21,77.42,174,47.75ZM128,216a72.49,72.49,0,0,1-23.31-3.93,74.91,74.91,0,0,1-21.41-11.38C77.93,172.17,65,134.21,65,169.25c0-38.52,10.39-75.3,28.47-105.59a240.3,240.3,0,0,1,34.54-31.57,240.3,240.3,0,0,1,34.54,31.57C180.61,94,191,130.73,191,169.25c0-35,0-12.92-18.28,31.44a74.91,74.91,0,0,1-21.41,11.38A72.49,72.49,0,0,1,128,216Z" fill="currentColor"></path>
             </svg>
             <h1 class="mt-2 text-xl font-semibold text-neutral-700 dark:text-neutral-300">Kajiado Water</h1>
        </div>
        <div class="bg-white dark:bg-neutral-800 p-8 rounded-lg shadow-md space-y-6"> 
            <div><h2 class="text-center text-2xl font-bold text-neutral-700 dark:text-neutral-100">Sign in</h2></div>
            <form id="login-form" class="space-y-6">
                <input type="hidden" name="remember" value="true">
                <div class="rounded-md shadow-sm -space-y-px">
                    <div>
                        <label for="login-email" class="sr-only">Email</label>
                        <input id="login-email" name="email" type="email" autocomplete="email" required class="appearance-none rounded-none relative block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 placeholder-neutral-500 dark:placeholder-neutral-400 text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-700 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm" placeholder="Email address">
                    </div>
                    <div>
                        <label for="login-password" class="sr-only">Password</label>
                        <input id="login-password" name="password" type="password" autocomplete="current-password" required class="appearance-none rounded-none relative block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 placeholder-neutral-500 dark:placeholder-neutral-400 text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-700 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm" placeholder="Password">
                    </div>
                </div>
                <div id="auth-error" class="p-3 bg-error-100 dark:bg-error-900 border border-error-300 dark:border-error-700 text-error-700 dark:text-error-200 rounded-md text-sm hidden"></div> 
                <div>
                    <button type="submit" class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">Sign in</button>
                </div>
            </form>
            <p class="text-center text-sm text-neutral-600 dark:text-neutral-400">
                Don't have an account? 
                <button id="go-to-register" class="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300">Register here</button>
            </p>
        </div>
    `;
    loginContainer.innerHTML = loginHtml;

    // Add event listeners
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('go-to-register').addEventListener('click', renderRegisterView);
}

function renderRegisterView() {
    console.log("Rendering Register View");
    // Hide main app sections
    document.getElementById('appNavBar')?.classList.add('hidden');
    document.getElementById('userDashboard')?.classList.add('hidden'); 
    document.getElementById('appFooter')?.classList.add('hidden');
    document.getElementById('loadingIndicator')?.classList.add('hidden');
    
    // Show register section
    const registerSection = document.getElementById('registerSection');
    if (!registerSection) {
        console.error("Register section element not found!");
        document.body.innerHTML = '<h1>Error: Registration UI failed to load.</h1>'; 
        return;
    }
    registerSection.classList.remove('hidden');
    document.getElementById('loginSection')?.classList.add('hidden');
    
    const registerContainer = registerSection.querySelector('.max-w-md.w-full.space-y-8');
     if (!registerContainer) {
         console.error("Register container div not found within #registerSection!");
         registerSection.innerHTML = '<h1>Error: Register UI structure incomplete.</h1>';
         return;
    }

    const registerHtml = `
       <div class="text-center">
            <svg class="mx-auto h-10 w-10 text-primary-600 dark:text-primary-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 256 256">
                 <path d="M174,47.75a256.11,256.11,0,0,0-41.45-38.3,8,8,0,0,0-9.1,0,256.11,256.11,0,0,0-41.45,38.3C61.79,77.42,49.5,123.61,49.51,169.25c0,45.63,17.18,89.44,48.46,121.87A88.45,88.45,0,0,0,128,232a88.45,88.45,0,0,0,30-41.13c31.28-32.43,48.46-76.24,48.46-121.87C206.5,123.61,194.21,77.42,174,47.75ZM128,216a72.49,72.49,0,0,1-23.31-3.93,74.91,74.91,0,0,1-21.41-11.38C77.93,172.17,65,134.21,65,169.25c0-38.52,10.39-75.3,28.47-105.59a240.3,240.3,0,0,1,34.54-31.57,240.3,240.3,0,0,1,34.54,31.57C180.61,94,191,130.73,191,169.25c0-35,0-12.92-18.28,31.44a74.91,74.91,0,0,1-21.41,11.38A72.49,72.49,0,0,1,128,216Z" fill="currentColor"></path>
             </svg>
             <h1 class="mt-2 text-xl font-semibold text-neutral-700 dark:text-neutral-300">Kajiado Water</h1>
       </div>
       <div class="bg-white dark:bg-neutral-800 p-8 rounded-lg shadow-md space-y-6">
            <div><h2 class="text-center text-2xl font-bold text-neutral-900 dark:text-neutral-100">Create your account</h2></div>
            <form id="register-form" class="space-y-6">
                <div class="space-y-4">
                    <div>
                        <label for="register-name" class="sr-only">Full Name</label>
                        <input id="register-name" name="name" type="text" required class="appearance-none rounded relative block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 placeholder-neutral-500 dark:placeholder-neutral-400 text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-700 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm" placeholder="Full Name">
                    </div>
                    <div>
                        <label for="register-email" class="sr-only">Email</label>
                        <input id="register-email" name="email" type="email" required class="appearance-none rounded relative block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 placeholder-neutral-500 dark:placeholder-neutral-400 text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-700 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm" placeholder="Email address">
                    </div>
                    <div>
                        <label for="register-phone" class="sr-only">Phone</label>
                        <input id="register-phone" name="phone" type="tel" required class="appearance-none rounded relative block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 placeholder-neutral-500 dark:placeholder-neutral-400 text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-700 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm" placeholder="Phone Number">
                    </div>
                    <div>
                        <label for="register-password" class="sr-only">Password</label>
                        <input id="register-password" name="password" type="password" required minlength="6" class="appearance-none rounded relative block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 placeholder-neutral-500 dark:placeholder-neutral-400 text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-700 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm" placeholder="Password (min. 6 characters)">
                    </div>
                    <div>
                        <label for="register-role" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Register as:</label>
                        <select id="register-role" name="role" required class="appearance-none rounded relative block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm">
                            <option value="user" selected>Water Buyer (User)</option>
                            <option value="vendor">Water Vendor</option>
                        </select>
                    </div>
                </div>
                <div id="auth-error" class="p-3 bg-error-100 dark:bg-error-900 border border-error-300 dark:border-error-700 text-error-700 dark:text-error-200 rounded-md text-sm hidden"></div>
                <div>
                    <button type="submit" class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">Register</button>
                </div>
            </form>
            <p class="text-center text-sm text-neutral-600 dark:text-neutral-400">
                Already have an account? 
                <button id="go-to-login" class="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300">Login here</button>
            </p>
       </div>
    `;
    registerContainer.innerHTML = registerHtml;

    // Add event listeners
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('go-to-login').addEventListener('click', renderLoginView);
}

// Update renderUserDashboard to show app elements
function renderUserDashboard(user, userData) {
    console.log("Rendering user dashboard...");
    
    // Hide auth sections, show app sections
    document.getElementById('loginSection')?.classList.add('hidden');
    document.getElementById('registerSection')?.classList.add('hidden');
    document.getElementById('appNavBar')?.classList.remove('hidden');
    document.getElementById('appFooter')?.classList.remove('hidden');
    const userDashboard = document.getElementById('userDashboard');
    if (userDashboard) userDashboard.classList.remove('hidden');
    else console.warn("User dashboard element not found during render.");
    
    const userNameSpan = document.getElementById('userName');
    if (userNameSpan) userNameSpan.textContent = userData.name || user.email;
    
    // Setup nav, load data, hide loading
    loadUserOrderHistory(user.uid); 
    loadAvailableVendors(); 
    hideLoading(); 
}

// Comment out clearContent in vendor/admin panels (they likely load separate pages)
function renderVendorPanel(user, userData) {
    // clearContent(); // Assume this loads vendor-dashboard.html or similar
    console.log("Rendering vendor redirect/info view for:", userData.name || user.email);
    // Hide main app sections if they were somehow visible
    document.getElementById('appNavBar')?.classList.add('hidden');
    document.getElementById('userDashboard')?.classList.add('hidden'); 
    document.getElementById('appFooter')?.classList.add('hidden');
    document.getElementById('loginSection')?.classList.add('hidden');
    document.getElementById('registerSection')?.classList.add('hidden');
    hideLoading(); // Ensure loading indicator is hidden

    // Replace body content with themed placeholder
    document.body.innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 py-12 px-4 sm:px-6 lg:px-8">
             <div class="max-w-md w-full space-y-8">
                  <div class="text-center">
                     <svg class="mx-auto h-10 w-10 text-primary-600 dark:text-primary-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 256 256">
                          <path d="M174,47.75a256.11,256.11,0,0,0-41.45-38.3,8,8,0,0,0-9.1,0,256.11,256.11,0,0,0-41.45,38.3C61.79,77.42,49.5,123.61,49.51,169.25c0,45.63,17.18,89.44,48.46,121.87A88.45,88.45,0,0,0,128,232a88.45,88.45,0,0,0,30-41.13c31.28-32.43,48.46-76.24,48.46-121.87C206.5,123.61,194.21,77.42,174,47.75ZM128,216a72.49,72.49,0,0,1-23.31-3.93,74.91,74.91,0,0,1-21.41-11.38C77.93,172.17,65,134.21,65,169.25c0-38.52,10.39-75.3,28.47-105.59a240.3,240.3,0,0,1,34.54-31.57,240.3,240.3,0,0,1,34.54,31.57C180.61,94,191,130.73,191,169.25c0-35,0-12.92-18.28,31.44a74.91,74.91,0,0,1-21.41,11.38A72.49,72.49,0,0,1,128,216Z" fill="currentColor"></path>
                      </svg>
                      <h1 class="mt-2 text-xl font-semibold text-neutral-700 dark:text-neutral-300">Kajiado Water</h1>
                  </div>
                  <div class="bg-white dark:bg-neutral-800 p-8 rounded-lg shadow-md space-y-6 text-center">
                    <h2 class="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Welcome Vendor!</h2>
                    <p class="text-neutral-600 dark:text-neutral-300">Welcome, ${userData.name || user.email}. Your vendor dashboard awaits.</p>
                    
                    <a href="vendor-dashboard.html" class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                        Go to Vendor Dashboard
                    </a>
                    <button id="logout-button" class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 mt-4">
                         Logout
                    </button>
                 </div>
            </div>
         </div>
     `;
     // Re-attach logout listener as we replaced the body content
     document.getElementById('logout-button')?.addEventListener('click', handleLogout);
}

function renderAdminPanel(user, userData) {
    // clearContent(); // Assume this loads admin.html or similar
    console.log("Redirecting to admin dashboard for:", userData.name || user.email);
     document.body.innerHTML = `
         <div class="min-h-screen flex flex-col items-center justify-center bg-neutral-100 dark:bg-neutral-900 p-4">
             <h1 class="text-xl mb-4">Welcome Admin: ${userData.name || user.email}</h1>
             <a href="admin.html" class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Go to Admin Panel</a>
              <button id="logout-button" class="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Logout</button>
         </div>
     `;
     document.getElementById('logout-button')?.addEventListener('click', handleLogout);
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

    const userDocRef = doc(db, "users", user.uid); 

    firestoreListenerUnsubscribe = onSnapshot(userDocRef, (docSnapshot) => { 
        console.log("Firestore snapshot received.");
        retryCount = 0; 

        if (docSnapshot.exists()) { 
            currentUserData = docSnapshot.data(); // <<< Store user data globally
            console.log("User data found and stored:", currentUserData);
            
            // Render view based on role
            switch (currentUserData.role) { // Use stored data
                case 'user':
                    renderUserDashboard(user, currentUserData);
                    break;
                case 'vendor':
                    renderVendorPanel(user, currentUserData);
                    break;
                case 'admin':
                    renderAdminPanel(user, currentUserData);
                    break;
                default:
                    console.error("Unknown user role:", currentUserData.role);
                    // Handle unknown role - maybe render a generic error view
                    // clearContent();
                    // appContent.innerHTML = '<p>Error: Unknown user role.</p> <button id="logout-button">Logout</button>';
                    // if(document.getElementById('logout-button')){
                    //     document.getElementById('logout-button').addEventListener('click', handleLogout);
                    // }
            }
        } else {
             currentUserData = null; // Clear stored data if doc doesn't exist
            console.error("User data not found in Firestore for UID:", user.uid);
             // Handle case where user exists in Auth but not Firestore
            // clearContent();
             // appContent.innerHTML = '<p>Error: User profile not found in database.</p> <button id="logout-button">Logout</button>';
             // if(document.getElementById('logout-button')){
             //     document.getElementById('logout-button').addEventListener('click', handleLogout);
             // }
        }
    }, (error) => {
         currentUserData = null; // Clear stored data on error
        console.error("Error listening to user data:", error);
         // Handle listener errors (retries already implemented inside setupFirestoreListener call structure)
        // clearContent();
         if (error.code === 'unavailable') {
             // Error handled by retry logic in setupFirestoreListener structure
             // appContent.innerHTML = `<p>Network error. Please check connection. Retrying...</p>`; // Give user feedback
        } else {
             // appContent.innerHTML = '<p>Error loading profile data.</p> <button id="logout-button">Logout</button>';
             // if(document.getElementById('logout-button')){
             //     document.getElementById('logout-button').addEventListener('click', handleLogout);
             // }
        }
    });
}

// Update onAuthStateChanged
onAuthStateChanged(auth, (user) => { 
    if (firestoreListenerUnsubscribe) {
        firestoreListenerUnsubscribe();
        firestoreListenerUnsubscribe = null;
    }
    retryCount = 0; 

    if (user) {
        console.log("Auth state changed: User signed in", user.uid);
        setupFirestoreListener(user); // This will trigger appropriate render function
    } else {
        console.log("Auth state changed: User signed out");
        // <<< Call updated renderLoginView >>>
        renderLoginView(); 
    }
});

// Initial UI state is handled by the onAuthStateChanged listener
console.log("App initialized, waiting for auth state...");

// Helper function to get Tailwind text/background color classes based on status
function getStatusColorClasses(status) {
    switch (status) {
        case 'pending':     return { text: 'text-primary-600', bg: 'bg-primary-100' };
        case 'assigned':    return { text: 'text-warning-600', bg: 'bg-warning-100' };
        case 'in_progress': return { text: 'text-warning-600', bg: 'bg-warning-100' };
        case 'completed':   return { text: 'text-accent-600', bg: 'bg-accent-100' };
        case 'cancelled':   return { text: 'text-error-600', bg: 'bg-error-100' };
        default:            return { text: 'text-neutral-500', bg: 'bg-neutral-100' };
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

            // --- Formatting Data --- 
            const orderDateTime = order.createdAt && order.createdAt.toDate 
                                ? order.createdAt.toDate().toLocaleString() // Use locale string for date & time
                                : 'Date Unknown';
            const orderStatus = order.status ? formatStatus(order.status) : 'Status Unknown';
            const statusColors = getStatusColorClasses(order.status);
            const price = order.totalPrice ? `KES ${order.totalPrice.toFixed(2)}` : 'N/A';
            const quantity = order.quantityLiters ? `${order.quantityLiters} Liters` : 'N/A';
            const vendorInfo = order.assignedVendorId ? `Vendor ID: ${order.assignedVendorId.substring(0, 6)}...` : 'Unassigned'; // Show partial vendor ID if assigned
            const locationEstimate = order.location && order.location.estimated ? 
                                     '<span class="text-xs italic text-warning-600 dark:text-warning-400">(Est. Loc.)</span>' : '';
            
            // --- Improved HTML Structure --- 
            const orderItemHtml = `
                <div class="p-4 border-b border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition duration-150 ease-in-out">
                    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                        <p class="text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-1 sm:mb-0">Order <span class="font-mono text-xs">#${order.id}</span> ${locationEstimate}</p>
                        <span class="text-xs text-neutral-500 dark:text-neutral-400">${orderDateTime}</span>
                    </div>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-sm">
                        <div>
                            <span class="font-medium text-neutral-700 dark:text-neutral-300">Status:</span> 
                            <span class="${statusColors.text} ${statusColors.bg} px-2 py-0.5 rounded-full text-xs font-semibold ml-1">${orderStatus}</span>
                        </div>
                        <div><span class="font-medium text-neutral-700 dark:text-neutral-300">Qty:</span> <span class="text-neutral-600 dark:text-neutral-400">${quantity}</span></div>
                        <div><span class="font-medium text-neutral-700 dark:text-neutral-300">Price:</span> <span class="text-neutral-600 dark:text-neutral-400">${price}</span></div>
                        <div><span class="font-medium text-neutral-700 dark:text-neutral-300">Vendor:</span> <span class="text-neutral-600 dark:text-neutral-400 text-xs">${vendorInfo}</span></div>
                    </div>
                    <!-- Optional: Add Details Button later -->
                    <!-- 
                    <div class="mt-2 text-right">
                        <button class="text-xs text-primary-600 hover:underline">View Details</button>
                    </div>
                    -->
                </div>
            `;

            orderListElement.insertAdjacentHTML('beforeend', orderItemHtml); 
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

// Toast notification system
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2';
        document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `px-4 py-2 rounded-lg shadow-lg text-white transform transition-all duration-300 translate-x-full ${
        type === 'success' ? 'bg-green-500' :
        type === 'error' ? 'bg-red-500' :
        type === 'warning' ? 'bg-yellow-500' :
        'bg-blue-500'
    }`;
    toast.textContent = message;

    // Add toast to container
    toastContainer.appendChild(toast);

    // Animate in
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
    }, 100);

    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => {
            toastContainer.removeChild(toast);
            if (toastContainer.children.length === 0) {
                document.body.removeChild(toastContainer);
            }
        }, 300);
    }, 3000);
}

// <<< Moved updateActiveLink and updateActiveMobileLink to global scope >>>
function updateActiveLink(linkElement, isActive) {
    if (!linkElement) return;
    // Tailwind classes for active/inactive states
    const activeClasses = ['border-indigo-500', 'dark:border-indigo-400', 'text-gray-900', 'dark:text-white'];
    const inactiveClasses = ['border-transparent', 'text-gray-500', 'dark:text-gray-400', 'hover:border-gray-300', 'dark:hover:border-gray-700', 'hover:text-gray-700', 'dark:hover:text-gray-300'];
    
    linkElement.classList.remove(...(isActive ? inactiveClasses : activeClasses));
    linkElement.classList.add(...(isActive ? activeClasses : inactiveClasses));
}

function updateActiveMobileLink(linkElement, isActive) {
    if (!linkElement) return;
    // Tailwind classes for active/inactive mobile states
    const activeClasses = ['bg-indigo-50', 'dark:bg-indigo-900', 'border-indigo-500', 'dark:border-indigo-400', 'text-indigo-700', 'dark:text-indigo-300'];
    const inactiveClasses = ['border-transparent', 'text-gray-600', 'dark:text-gray-400', 'hover:bg-gray-50', 'dark:hover:bg-gray-700', 'hover:border-gray-300', 'dark:hover:border-gray-700', 'hover:text-gray-800', 'dark:hover:text-gray-300'];
    
    linkElement.classList.remove(...(isActive ? inactiveClasses : activeClasses));
    linkElement.classList.add(...(isActive ? activeClasses : inactiveClasses));
}

function showSection(sectionId, skipLoad = false) {
    console.log(`Showing section: ${sectionId}`);
    Object.values(sections).forEach(section => {
        if (section) section.classList.add('hidden');
    });
    if (sections[sectionId]) {
        sections[sectionId].classList.remove('hidden');
        // If showing profile, populate it
        if (sectionId === 'profile') {
            populateProfileSection();
        }
         // If showing vendors and not skipping load, load them
        if (sectionId === 'vendors' && !skipLoad) {
             loadAvailableVendors();
        }
    } else {
        console.error(`Section with ID ${sectionId} not found.`);
    }

    // Update active link styles
    console.log(`Inside showSection - typeof updateActiveLink: ${typeof updateActiveLink}`);
    updateActiveLink(navLinks.order, sectionId === 'order');
    updateActiveLink(navLinks.vendors, sectionId === 'vendors');
    updateActiveLink(navLinks.history, sectionId === 'history');
    updateActiveLink(navLinks.profile, sectionId === 'profile');
    
    updateActiveMobileLink(navLinks.mobileOrder, sectionId === 'order');
    updateActiveMobileLink(navLinks.mobileVendors, sectionId === 'vendors');
    updateActiveMobileLink(navLinks.mobileHistory, sectionId === 'history');
    updateActiveMobileLink(navLinks.mobileProfile, sectionId === 'profile');

    // Close mobile menu if open
    if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
        mobileMenu.classList.add('hidden');
        // Update burger icon state if needed (optional)
        const icons = mobileMenuButton.querySelectorAll('svg');
        icons[0].classList.remove('hidden'); // Show burger
        icons[1].classList.add('hidden'); // Hide close
    }
}

// --- Function to handle the mock payment confirmation --- 
// <<< MOVED this function definition BEFORE setupNavigation >>>
async function handleMockPayment(orderId) {
    console.log(`Processing mock payment for order ID: ${orderId}`);
    const paymentScreen = document.getElementById('mock-payment-screen');
    const confirmBtn = document.getElementById('confirm-payment-btn');
    const cancelBtn = document.getElementById('cancel-payment-btn');

    if(confirmBtn) confirmBtn.disabled = true;
    if(cancelBtn) cancelBtn.disabled = true;
    if(confirmBtn) confirmBtn.textContent = 'Processing...';

    try {
        const orderRef = doc(db, "orders", orderId);
        await updateDoc(orderRef, {
            paymentStatus: 'paid',
            paidAt: serverTimestamp()
        });

        console.log(`Mock payment successful for order ID: ${orderId}`);
        showToast('Payment successful! Your order is confirmed.', 'success');
        if(paymentScreen) paymentScreen.remove();
        // Show the main dashboard again if needed
        // document.getElementById('userDashboard').classList.remove('hidden');
        // Maybe switch to the order history view
        showSection('history'); // This call should now work

    } catch (error) {
        console.error("Error processing mock payment:", error);
        showToast(`Payment failed: ${error.message}`, 'error');
        if(confirmBtn) confirmBtn.disabled = false;
        if(cancelBtn) cancelBtn.disabled = false;
        if(confirmBtn) confirmBtn.textContent = confirmBtn.textContent.replace('Processing...', 'Pay Now (Mock)');
    }
}

// --- Navigation Handling ---

function setupNavigation() {
    // <<< Populate GLOBAL navLinks object >>>
    navLinks = {
        order: document.getElementById('nav-order'),
        vendors: document.getElementById('nav-vendors'),
        history: document.getElementById('nav-history'),
        mobileOrder: document.getElementById('mobile-nav-order'),
        mobileVendors: document.getElementById('mobile-nav-vendors'),
        mobileHistory: document.getElementById('mobile-nav-history'),
        profile: document.getElementById('nav-profile'),
        mobileProfile: document.getElementById('mobile-nav-profile'),
    };

    // <<< Populate GLOBAL sections object >>>
    sections = {
        order: document.getElementById('order-section'),
        vendors: document.getElementById('vendors-section'),
        history: document.getElementById('history-section'),
        profile: document.getElementById('profile-section'),
    };

    // <<< Populate GLOBAL mobileMenuButton and mobileMenu >>>
    mobileMenuButton = document.getElementById('mobile-menu-button');
    mobileMenu = document.getElementById('mobile-menu');

    // Desktop Nav Clicks (Call GLOBAL showSection)
    if (navLinks.order) navLinks.order.addEventListener('click', (e) => { e.preventDefault(); showSection('order'); });
    if (navLinks.vendors) navLinks.vendors.addEventListener('click', (e) => { e.preventDefault(); showSection('vendors'); }); 
    if (navLinks.history) navLinks.history.addEventListener('click', (e) => { e.preventDefault(); showSection('history'); }); 
    if (navLinks.profile) navLinks.profile.addEventListener('click', (e) => { e.preventDefault(); showSection('profile'); }); 

    // Mobile Nav Clicks (Call GLOBAL showSection)
    if (navLinks.mobileOrder) navLinks.mobileOrder.addEventListener('click', (e) => { e.preventDefault(); showSection('order'); });
    if (navLinks.mobileVendors) navLinks.mobileVendors.addEventListener('click', (e) => { e.preventDefault(); showSection('vendors'); });
    if (navLinks.mobileHistory) navLinks.mobileHistory.addEventListener('click', (e) => { e.preventDefault(); showSection('history'); });
    if (navLinks.mobileProfile) navLinks.mobileProfile.addEventListener('click', (e) => { e.preventDefault(); showSection('profile'); }); 

    // Mobile Menu Toggle (Uses GLOBAL mobileMenuButton and mobileMenu)
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            const isOpen = !mobileMenu.classList.contains('hidden');
            mobileMenu.classList.toggle('hidden');
            // Toggle icons
            const icons = mobileMenuButton.querySelectorAll('svg');
            icons[0].classList.toggle('hidden', !isOpen); // burger
            icons[1].classList.toggle('hidden', isOpen);  // close
        });
    }

    // <<< Set initial state using GLOBAL showSection >>>
    showSection('vendors', true); // Show vendors section initially, skip loading here (renderUserDashboard will load)
}

// Function to load and display available vendors
async function loadAvailableVendors() {
    console.log("--- Starting loadAvailableVendors --- ");
    const vendorsListDiv = document.getElementById('availableVendorsList'); 
    const vendorsSection = document.getElementById('vendors-section'); 
    
    console.log("Checking for required elements:");
    console.log(`  vendorsListDiv exists? ${!!vendorsListDiv}`);
    console.log(`  vendorsSection exists? ${!!vendorsSection}`);

    if (!vendorsListDiv || !vendorsSection) {
        console.error("Required elements for vendor loading not found (list or section).");
        if (vendorsSection && !vendorsSection.classList.contains('hidden')) {
             const errorTarget = vendorsListDiv || vendorsSection;
             errorTarget.innerHTML = '<p class="text-red-500 dark:text-red-400 p-4">Error: Could not initialize vendor display. Please refresh.</p>';
        }
        return; 
    }
    
    console.log("Required elements found.");

    // --- Show Skeleton Loader --- 
    let skeletonHTML = '';
    for (let i = 0; i < 3; i++) { // Show 3 skeleton cards
         skeletonHTML += `
            <div class="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-4 animate-pulse">
                <div class="flex items-center space-x-4 mb-3">
                    <div class="flex-shrink-0">
                        <div class="h-12 w-12 rounded-full bg-neutral-300 dark:bg-neutral-700"></div>
                    </div>
                    <div class="flex-1 min-w-0 space-y-2">
                        <div class="h-4 bg-neutral-300 dark:bg-neutral-700 rounded w-3/4"></div>
                        <div class="h-3 bg-neutral-300 dark:bg-neutral-700 rounded w-1/2"></div>
                    </div>
                </div>
                <div class="mb-3 space-y-2">
                    <div class="h-3 bg-neutral-300 dark:bg-neutral-700 rounded w-5/6"></div>
                    <div class="h-3 bg-neutral-300 dark:bg-neutral-700 rounded w-1/3"></div>
                </div>
                <div class="mt-auto">
                    <div class="h-10 bg-neutral-300 dark:bg-neutral-700 rounded"></div>
                </div>
            </div>
         `;
    }
    vendorsListDiv.innerHTML = skeletonHTML;
    // --- End Skeleton Loader --- 

    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef,
            where('role', '==', 'vendor'),
            where('status', '==', 'available')
        );
        const querySnapshot = await getDocs(q);

        // Clear skeleton AFTER query completes
        vendorsListDiv.innerHTML = ''; 

        if (querySnapshot.empty) {
            vendorsListDiv.innerHTML = '<p class="text-neutral-500 dark:text-neutral-400 col-span-full">No vendors currently available.</p>';
        } else {
            querySnapshot.forEach((doc) => {
                const vendor = doc.data();
                const vendorId = doc.id;
                if (!vendor.name) {
                    console.warn(`Vendor with ID ${vendorId} is missing a name.`);
                }
                const card = document.createElement('div');
                card.className = 'bg-white dark:bg-neutral-800 rounded-lg shadow-md p-4 flex flex-col justify-between'; 
                const rating = (Math.random() * (5 - 3.5) + 3.5).toFixed(1); 
                const completedOrders = vendor.completedOrdersCount || 0;
                card.innerHTML = `
                    <div class="flex items-center space-x-4 mb-3">
                        <div class="flex-shrink-0">
                            <!-- Placeholder Avatar -->
                            <span class="inline-flex items-center justify-center h-12 w-12 rounded-full bg-neutral-200 dark:bg-neutral-700">
                                <svg class="h-6 w-6 text-neutral-500 dark:text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </span>
                        </div>
                        <div class="flex-1 min-w-0">
                            <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 truncate">${vendor.name || 'Unnamed Vendor'}</h3>
                            <p class="text-sm text-neutral-600 dark:text-neutral-400 truncate">Phone: ${vendor.phone || 'N/A'}</p>
                        </div>
                    </div>
                    <div class="mb-3 space-y-1">
                        <div class="flex items-center text-sm">
                             <span class="text-yellow-500 mr-1">★</span> 
                             <span class="font-medium text-neutral-700 dark:text-neutral-300">${rating}</span>
                             <span class="text-neutral-500 dark:text-neutral-400 ml-2">(${completedOrders} orders completed)</span>
                        </div>
                         <!-- Maybe hide raw coords or show simplified text -->
                         ${vendor.location ? '<p class="text-xs text-neutral-500 dark:text-neutral-400 italic">Location available</p>' : ''}
                    </div>
                    <div class="mt-auto"> <!-- Push button to bottom -->
                        <button data-vendor-id="${vendorId}" data-vendor-name="${vendor.name || 'this vendor'}" class="order-from-vendor-btn w-full py-2 px-4 rounded-md font-medium text-white transition duration-150 ease-in-out bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed">
                            Order Water
                        </button>
                    </div>
                `;
                vendorsListDiv.appendChild(card);

            });
            addOrderFromVendorListeners(); // Add listeners after appending cards
        }
    } catch (error) {
        console.error("Error loading available vendors:", error);
        vendorsListDiv.innerHTML = '<p class="text-red-500 dark:text-red-400 col-span-full">Error loading vendors. Please try again.</p>'; // Display error in the list div
    }
}

// <<< Add this function back >>>
// Function to add listeners to vendor 'Order Water' buttons
function addOrderFromVendorListeners() {
    const orderButtons = document.querySelectorAll('.order-from-vendor-btn');
    console.log(`Found ${orderButtons.length} vendor order buttons to add listeners to.`); // Log how many buttons found
    orderButtons.forEach(button => {
        // Remove existing listener to prevent duplicates if function is called multiple times
        button.removeEventListener('click', handleOrderFromVendorClick);
        // Add the new listener
        button.addEventListener('click', handleOrderFromVendorClick);
    });
}

// Handler for clicking 'Order Water' on a vendor card
function handleOrderFromVendorClick(event) {
    // <<< Assign directly to global variables >>>
    selectedVendorId = event.target.dataset.vendorId;
    selectedVendorName = event.target.dataset.vendorName;
    console.log(`Order button clicked for vendor: ${selectedVendorName} (ID: ${selectedVendorId})`);

    // Get the confirm order section elements
    const confirmSection = document.getElementById('confirm-order-section');
    const confirmVendorNameSpan = document.getElementById('confirm-vendor-name');
    const confirmVendorIdInput = document.getElementById('confirm-vendor-id');
    const confirmQuantitySlider = document.getElementById('confirm-quantity-slider');
    const confirmQuantityValue = document.getElementById('confirm-quantity-value');
    const estimatedPriceSpan = document.getElementById('confirm-estimated-price');
    const confirmForm = document.getElementById('confirm-order-form');
    const cancelConfirmBtn = document.getElementById('cancel-confirm-button');

    if (!confirmSection || !confirmVendorNameSpan || !confirmVendorIdInput || !confirmQuantitySlider || !confirmQuantityValue || !estimatedPriceSpan || !confirmForm || !cancelConfirmBtn) {
        console.error("Confirm order section elements not found! Check IDs in index.html.");
        showToast("Error: Could not open order confirmation.", "error");
        return;
    }

    // Populate confirm section
    confirmVendorNameSpan.textContent = selectedVendorName;
    confirmVendorIdInput.value = selectedVendorId;
    confirmQuantitySlider.value = 100; // Reset slider to default
    confirmQuantityValue.textContent = '100';
    estimatedPriceSpan.textContent = 'Calculating...'; // Reset price display

    // Function to calculate and display price (can be called on slider input)
    const calculatePrice = async () => {
        estimatedPriceSpan.textContent = 'Calculating...'; // Show calculating initially
        try {
            console.log("Calculating price estimate...");
            const settingsRef = doc(db, "settings", "main");
            const settingsSnap = await getDoc(settingsRef);
            let pricePerLiter = 1.0; // Default price

            // <<< Add detailed logging >>>
            if (settingsSnap.exists()) {
                console.log("Settings document exists.");
                const settingsData = settingsSnap.data();
                console.log("Settings data:", settingsData);
                if (settingsData && typeof settingsData.pricePerLiter === 'number') {
                    pricePerLiter = settingsData.pricePerLiter;
                    console.log(`Using price per liter from settings: ${pricePerLiter}`);
                } else {
                    console.warn('pricePerLiter field missing or not a number in settings. Using default.');
                }
            } else {
                console.warn("Settings document (/settings/main) does not exist. Using default price.");
            }
            // <<< End detailed logging >>>

            const quantity = parseInt(confirmQuantitySlider.value, 10);
            if (isNaN(quantity)) { // Add check for quantity parsing
                 console.error("Could not parse quantity from slider value:", confirmQuantitySlider.value);
                 estimatedPriceSpan.textContent = 'Invalid Qty';
                 return;
            }
            
            estimatedPriceSpan.textContent = `KES ${(quantity * pricePerLiter).toFixed(2)}`;
            console.log(`Price estimate updated: ${estimatedPriceSpan.textContent}`);

        } catch (error) {
            console.error("Error fetching price for estimate:", error); // Log the full error object
            console.error(`Error Code: ${error.code}, Message: ${error.message}`); // Log specific parts
            estimatedPriceSpan.textContent = 'Error';
        }
    };
    
    // Calculate price immediately and on slider change
    calculatePrice();
    confirmQuantitySlider.oninput = () => { 
        confirmQuantityValue.textContent = confirmQuantitySlider.value;
        calculatePrice(); 
    };

    // Add submit listener for the confirm form
    confirmForm.onsubmit = handleConfirmOrderSubmit; // Assign function directly

    // Add listener for the cancel button
    cancelConfirmBtn.onclick = () => { 
        confirmSection.classList.add('hidden'); 
        // No need to explicitly show vendors section, it should remain visible underneath
    };

    // Show the confirm section
    confirmSection.classList.remove('hidden');
    
    // Hide the main dashboard sections (optional, confirm section is an overlay)
    // document.getElementById('userDashboard').classList.add('hidden'); // Or hide individual sections
}

// Re-introduced function for Firestore Logic - defined BEFORE handleConfirmOrderSubmit
async function processOrderPlacement(userLocation, quantity, isEstimated = false) {
    const user = auth.currentUser;
    const errorDiv = document.getElementById('confirm-order-error');
    const submitButton = document.getElementById('confirm-submit-button');
    const cancelButton = document.getElementById('cancel-confirm-button');
    const confirmSection = document.getElementById('confirm-order-section');

    // Double check elements exist (redundant if called correctly, but safe)
    if (!errorDiv || !submitButton || !cancelButton || !confirmSection || !user) {
         console.error(`Error finding elements/user in processOrderPlacement: err=${!!errorDiv}, submit=${!!submitButton}, cancel=${!!cancelButton}, section=${!!confirmSection}, user=${!!user}`);
         showToast("An unexpected error occurred processing the order.", "error");
         // Ensure buttons are re-enabled as a fallback
         if (submitButton) { submitButton.disabled = false; submitButton.textContent = 'Confirm & Proceed to Payment'; }
         if (cancelButton) { cancelButton.disabled = false; }
         return;
    }

    submitButton.textContent = 'Processing Order...';

    try {
        console.log("Fetching settings document...");
        const settingsRef = doc(db, "settings", "main");
        const settingsSnap = await getDoc(settingsRef);
        let pricePerLiter = 1.0; // Default price
        if (settingsSnap.exists() && settingsSnap.data().pricePerLiter) {
            pricePerLiter = settingsSnap.data().pricePerLiter;
        } else {
            console.warn("Settings document or pricePerLiter not found, using default price.");
        }
        const parsedQuantity = parseInt(quantity, 10);
        const totalPrice = parsedQuantity * pricePerLiter;

        console.log(`Adding order document (Estimated: ${isEstimated})...`);
        const ordersCollection = collection(db, "orders");
        const newOrderRef = await addDoc(ordersCollection, {
            userId: user.uid,
            quantityLiters: parsedQuantity,
            location: { // Store lat/lon and the estimation flag
                 latitude: userLocation.latitude,
                 longitude: userLocation.longitude,
                 estimated: isEstimated
            },
            status: 'pending',
            createdAt: serverTimestamp(),
            pricePerLiter: pricePerLiter,
            totalPrice: totalPrice,
            paymentStatus: 'pending',
            paymentMethod: 'mock_online',
            vendorId: selectedVendorId // Store vendorId too!
        });

        console.log("Order confirmed successfully! Order ID:", newOrderRef.id);
        showToast("Order confirmed! Proceeding to payment.", "success");

        if (confirmSection) confirmSection.classList.add('hidden');
        showMockPaymentScreen(newOrderRef.id, totalPrice); // Ensure this function exists globally

        selectedVendorId = null;
        selectedVendorName = null;

    } catch (error) {
        console.error("Error during order processing (in processOrderPlacement):", error);
        if (errorDiv) {
             errorDiv.textContent = `Error: ${error.message}`;
             errorDiv.classList.remove('hidden');
        }
        showToast(`Error confirming order: ${error.message}`, "error"); // Ensure showToast exists globally
    } finally {
        // Re-enable buttons here after processing is complete (success or caught error)
        if (submitButton) {
             submitButton.disabled = false;
             submitButton.textContent = 'Confirm & Proceed to Payment';
        } else { console.error("submitButton is null in processOrderPlacement finally!"); }
        if (cancelButton) {
             cancelButton.disabled = false;
        } else { console.error("cancelButton is null in processOrderPlacement finally!"); }
    }
}

// Updated handler for the Confirm Order form submission with IP fallback
async function handleConfirmOrderSubmit(event) {
    event.preventDefault();
    const user = auth.currentUser;
    if (!user) {
        showToast("Error: Not logged in.", "error");
        return;
    }
    if (!selectedVendorId) {
         showToast("Error: No vendor selected.", "error");
         return;
    }
    
    const quantitySlider = document.getElementById('confirm-quantity-slider');
    const errorDiv = document.getElementById('confirm-order-error');
    const submitButton = document.getElementById('confirm-submit-button'); 
    const cancelButton = document.getElementById('cancel-confirm-button');

    if (!quantitySlider || !errorDiv || !submitButton || !cancelButton) {
         showToast("Error: Confirmation form UI missing elements.", "error");
         console.error(`Error finding elements: qty=${!!quantitySlider}, err=${!!errorDiv}, submit=${!!submitButton}, cancel=${!!cancelButton}`);
         return;
    }
    
    const quantity = quantitySlider.value; 
    errorDiv.textContent = '';
    errorDiv.classList.add('hidden');
    submitButton.disabled = true;
    cancelButton.disabled = true; 
    submitButton.textContent = 'Getting Location...';

    console.log(`Attempting to get user location before confirming order: Vendor=${selectedVendorId}, Quantity=${quantity}L`);

    if (!navigator.geolocation) {
        console.error("Geolocation is not supported by this browser.");
        showToast('Geolocation is not supported by your browser. Cannot place order.', 'error');
        errorDiv.textContent = 'Geolocation not supported.';
        errorDiv.classList.remove('hidden');
        // Re-enable buttons if geolocation isn't supported at all
        submitButton.disabled = false;
        submitButton.textContent = 'Confirm & Proceed to Payment';
        cancelButton.disabled = false;
        return;
    }

    try {
        // --- Promisify Geolocation Call --- 
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true, 
                timeout: 10000, // 10 seconds
                maximumAge: 0 
            });
        });

        // <<< Geolocation Success >>>
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const userLocation = { latitude: latitude, longitude: longitude };
        console.log("User location obtained (precise):", userLocation);
        // Call the processing function with accurate location
        await processOrderPlacement(userLocation, quantity, false); 

    } catch (error) {
        // <<< Geolocation Error / Fallback Logic >>>
        console.error("Geolocation error object:", error);
        let userLocation = null;
        let isEstimated = false;

        if (error.code === 2 || error.code === 3) { // POSITION_UNAVAILABLE or TIMEOUT
            console.log(`Precise location failed (Code ${error.code}). Attempting IP geolocation fallback...`);
            showToast("Precise location failed, trying fallback...", "warning"); // Inform user
            submitButton.textContent = 'Finding Location...'; // Update status
            try {
                const response = await fetch('http://ip-api.com/json/'); // Switched to HTTP
                if (!response.ok) {
                     throw new Error(`IP API request failed with status ${response.status}`);
                }
                const ipData = await response.json();
                if (ipData.status === 'success') {
                    userLocation = { latitude: ipData.lat, longitude: ipData.lon };
                    isEstimated = true;
                    console.log("User location obtained (estimated via IP):", userLocation);
                    showToast("Using estimated location based on network. Accuracy may vary.", "warning");
                } else {
                     throw new Error(`IP API returned status: ${ipData.status}`);
                }
            } catch (ipError) {
                console.error("IP Geolocation fallback failed:", ipError);
                // Keep userLocation as null
            }
        }

        // --- Process based on outcome --- 
        if (userLocation) {
             // We got a location (estimated), proceed to process the order
             // NOTE: Assuming processOrderPlacement exists (from previous failed step)
            await processOrderPlacement(userLocation, quantity, isEstimated); // isEstimated will be true
        } else {
            // STILL no location (Permission denied, or fallback failed)
            let errorMsg = `Geolocation error: ${error.message}`;
            if(error.code === 1) { errorMsg = 'Location permission denied. Cannot place order without location.'; }
            else if (error.code === 2 || error.code === 3) { errorMsg = 'Could not determine location automatically (precise & fallback failed).'; }
            
            showToast(errorMsg, 'error');
            if(errorDiv){ 
                 errorDiv.textContent = errorMsg;
                 errorDiv.classList.remove('hidden');
            }
             // Re-enable buttons ONLY if we failed to get any location
            if (submitButton) { 
                submitButton.disabled = false;
                submitButton.textContent = 'Confirm & Proceed to Payment';
             } 
             if (cancelButton) { 
                 cancelButton.disabled = false;
             } 
        }
    } 
    // Note: The finally block for re-enabling buttons is now primarily within processOrderPlacement
    // It's only called in the catch block above if placement fails entirely.
}

// --- Mock Payment Screen Function --- (Ensure it exists and is correct)
function showMockPaymentScreen(orderId, amount) {
    let paymentScreen = document.getElementById('mock-payment-screen');
    if (!paymentScreen) {
        paymentScreen = document.createElement('div');
        paymentScreen.id = 'mock-payment-screen';
        paymentScreen.className = 'fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4'; // Increased z-index
        document.body.appendChild(paymentScreen); // Append directly to body
    }

    paymentScreen.innerHTML = `
        <div class="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full text-center">
            <h2 class="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Confirm Payment</h2>
            <p class="text-gray-600 dark:text-gray-300 mb-6">
                Your order total is <strong class="text-lg">KES ${amount.toFixed(2)}</strong>.
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
                (This is a simulated payment.)
            </p>
            <div class="space-y-4">
                <button id="confirm-payment-btn" class="w-full py-3 px-6 rounded-lg font-medium text-white transition duration-150 ease-in-out bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">
                    Pay KES ${amount.toFixed(2)} Now (Mock)
                </button>
                <button id="cancel-payment-btn" class="w-full py-2 px-4 rounded-lg font-medium transition duration-150 ease-in-out bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">
                    Cancel Payment
                </button>
            </div>
        </div>
    `;

    document.getElementById('confirm-payment-btn').addEventListener('click', () => handleMockPayment(orderId));
    document.getElementById('cancel-payment-btn').addEventListener('click', () => {
        paymentScreen.remove();
        showToast('Payment cancelled.', 'warning');
        // Potentially show the main dashboard sections again if they were hidden
        // document.getElementById('userDashboard').classList.remove('hidden');
    });

    paymentScreen.classList.remove('hidden');
}

// Modify initializeUI or add listeners within DOMContentLoaded
function initializeUI() {
    console.log("--- Running initializeUI --- "); // Log start
    const logoutButton = document.getElementById('logoutButton');
    const themeToggleButton = document.getElementById('theme-toggle');
    
    console.log(`Logout button element found? ${!!logoutButton}`); // Log if button exists

    if (logoutButton) {
        console.log("Attaching click listener to logoutButton."); // Log attachment
        logoutButton.addEventListener('click', handleLogout);
    } else {
        console.warn("Logout button not found. Listener NOT attached.");
    }

    if (themeToggleButton) {
        // setupThemeToggle(themeToggleButton); // Assuming theme toggle logic is elsewhere or simple enough
    } else {
        console.warn("Theme toggle button not found.");
    }

    /* // <<< Remove listener for old form >>>
    if (orderForm) {
        orderForm.addEventListener('submit', handleOrderSubmit);
    } else {
        console.warn("Order form not found. Cannot add submit listener.");
    }
    */
    console.log("--- Finished initializeUI --- "); // Log end
}

// --- Ensure setupAuthObserver is defined and called ---
function setupAuthObserver() {
    onAuthStateChanged(auth, (user) => {
        // ... (rest of setupAuthObserver implementation as it exists) ...
        if (firestoreListenerUnsubscribe) {
            console.log("Unsubscribing from previous Firestore listener due to auth state change.");
            firestoreListenerUnsubscribe();
            firestoreListenerUnsubscribe = null;
        }
        retryCount = 0; 

        if (user) {
            console.log("Auth state changed: User signed in", user.uid);
            setupFirestoreListener(user);
        } else {
            console.log("Auth state changed: User signed out");
            renderLoginView(); 
        }
    });
}

// <<< Initialization calls at the end (no listener needed with defer) >>>
console.log("Script end reached. Running initial setup...");
try {
    initializeUI();
    setupNavigation();
    setupAuthObserver(); 
    console.log("Initial setup calls completed.");
} catch (error) {
    console.error("Error during initial setup at script end:", error);
}

// <<< REMOVE any leftover window.onload or DOMContentLoaded listeners >>>
/*
window.onload = () => { ... };
document.addEventListener('DOMContentLoaded', () => { ... });
*/
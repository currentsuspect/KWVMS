// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get references to Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const settingsForm = document.getElementById('settings-form');
const pricePerLiterInput = document.getElementById('price-per-liter');
const settingsMessageElement = document.getElementById('settings-message');
const logoutButton = document.getElementById('logoutButton');

// Add event listener for logout button
if (logoutButton) {
    logoutButton.addEventListener('click', handleLogout);
}

// Handle logout 
async function handleLogout() {
    try {
        await auth.signOut();
        console.log("User signed out successfully");
        showToast("Logged out successfully!", "success");
        
        // Redirect immediately and let the auth state listener handle the redirection
        window.location.href = 'index.html';
    } catch (error) {
        console.error("Error signing out:", error);
        showToast("Error signing out. Please try again.", "error");
    }
}

// Check authentication state
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        console.log("No user found, redirecting to index.html");
        window.location.href = 'index.html';
        return;
    }

    try {
        // Check if user is admin
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (!userDoc.exists || userDoc.data().role !== 'admin') {
            console.log("User is not an admin");
            window.location.href = 'index.html';
            return;
        }

        // Load current settings
        loadSettings();
    } catch (error) {
        console.error("Error checking admin role:", error);
        showToast("Authentication error", "error");
    }
});

// Load settings from Firestore
async function loadSettings() {
    try {
        // Show loading state
        pricePerLiterInput.disabled = true;
        settingsMessageElement.innerHTML = `
            <p class="text-neutral-500 dark:text-neutral-400 flex items-center">
                <svg class="w-5 h-5 mr-2 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading settings...
            </p>
        `;
        
        const settingsDoc = await db.collection('settings').doc('main').get();
        
        // Hide loading indicator
        settingsMessageElement.innerHTML = '';
        pricePerLiterInput.disabled = false;
        
        if (settingsDoc.exists) {
            const settings = settingsDoc.data();
            
            // Populate form fields
            if (settings.pricePerLiter !== undefined) {
                pricePerLiterInput.value = settings.pricePerLiter;
            }
        }
    } catch (error) {
        console.error("Error loading settings:", error);
        pricePerLiterInput.disabled = false;
        settingsMessageElement.innerHTML = `
            <p class="text-error-500 dark:text-error-400 font-medium flex items-center">
                <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                </svg>
                Error loading settings: ${error.message}
            </p>
        `;
    }
}

// Save settings to Firestore
async function saveSettings(settings) {
    try {
        await db.collection('settings').doc('main').set(settings, { merge: true });
        return true;
    } catch (error) {
        console.error("Error saving settings:", error);
        return false;
    }
}

// Handle form submission
if (settingsForm) {
    settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Reset error messages
        settingsMessageElement.innerHTML = '';
        pricePerLiterInput.classList.remove('border-error-500', 'focus:ring-error-500', 'focus:border-error-500');
        
        // Disable form while submitting
        const submitButton = settingsForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.classList.add('opacity-75');
        submitButton.textContent = 'Saving...';
        
        // Get form values
        const pricePerLiter = parseFloat(pricePerLiterInput.value);
        
        // Validate values
        if (isNaN(pricePerLiter) || pricePerLiter < 0) {
            settingsMessageElement.innerHTML = `
                <p class="text-error-500 dark:text-error-400 font-medium flex items-center">
                    <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                    </svg>
                    Please enter a valid price per liter.
                </p>
            `;
            // Highlight invalid input
            pricePerLiterInput.classList.add('border-error-500', 'focus:ring-error-500', 'focus:border-error-500');
            submitButton.disabled = false;
            submitButton.classList.remove('opacity-75');
            submitButton.textContent = 'Save Settings';
            return;
        }
        
        // Save settings
        const success = await saveSettings({
            pricePerLiter,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Re-enable form
        submitButton.disabled = false;
        submitButton.classList.remove('opacity-75');
        submitButton.textContent = 'Save Settings';
        
        // Show message
        if (success) {
            settingsMessageElement.innerHTML = `
                <p class="text-accent-500 dark:text-accent-400 font-medium flex items-center">
                    <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                    </svg>
                    Settings saved successfully!
                </p>
            `;
            showToast("Settings saved successfully!", "success");
        } else {
            settingsMessageElement.innerHTML = `
                <p class="text-error-500 dark:text-error-400 font-medium flex items-center">
                    <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                    </svg>
                    Error saving settings. Please try again.
                </p>
            `;
            showToast("Error saving settings", "error");
        }
    });
}

// Toast function (in case ui-utils.js doesn't provide it)
function showToast(message, type = 'info') {
    // Check if global showToast from ui-utils.js is available
    if (typeof window.showToast === 'function') {
        window.showToast(message, type);
        return;
    }
    
    // Fallback implementation if ui-utils.js isn't loaded
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    
    // Set classes based on type
    let typeClasses = 'bg-primary-500';
    if (type === 'success') typeClasses = 'bg-accent-500';
    if (type === 'error') typeClasses = 'bg-error-500';
    if (type === 'warning') typeClasses = 'bg-warning-500';
    
    toast.className = `${typeClasses} text-white px-4 py-3 rounded shadow-lg mb-2 animate-fade-in flex items-center justify-between`;
    toast.innerHTML = `
        <p>${message}</p>
        <button class="ml-4 text-white">&times;</button>
    `;
    
    // Add close button functionality
    const closeButton = toast.querySelector('button');
    closeButton.addEventListener('click', () => {
        toast.classList.add('animate-fade-out');
        setTimeout(() => {
            toast.remove();
        }, 300);
    });
    
    // Auto remove after 3 seconds
    toastContainer.appendChild(toast);
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('animate-fade-out');
            setTimeout(() => {
                if (toast.parentElement) toast.remove();
            }, 300);
        }
    }, 3000);
} 
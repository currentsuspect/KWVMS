// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get references to Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const settingsForm = document.getElementById('settings-form');
const priceInput = document.getElementById('price-per-liter');
const messageDiv = document.getElementById('settings-message');

// Reference to the settings document
const settingsRef = db.collection('settings').doc('main');

// --- Authentication and Authorization Check ---
document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            console.log("Admin settings page: User authenticated", user.uid);
            // Check if the user has admin role
            try {
                const userDocRef = db.collection('users').doc(user.uid);
                const userDoc = await userDocRef.get();

                if (userDoc.exists && userDoc.data().role === 'admin') {
                    console.log("User is authorized as admin.");
                    loadSettings(); // Load current settings
                    settingsForm.addEventListener('submit', handleSaveSettings);
                } else {
                    console.warn("User is not an admin. Redirecting...");
                    alert("Access Denied: You do not have permission to view this page.");
                    window.location.href = 'index.html'; // Redirect non-admins
                }
            } catch (error) {
                console.error("Error checking admin role:", error);
                setMessage('Error verifying your permissions. Please try again later.', true);
            }
        } else {
            console.log("Admin settings page: No user authenticated. Redirecting to login...");
            window.location.href = 'index.html'; // Redirect if not logged in
        }
    });
});

// --- Load Settings Function ---
async function loadSettings() {
    try {
        const settingsDoc = await settingsRef.get();
        if (settingsDoc.exists) {
            const settings = settingsDoc.data();
            priceInput.value = settings.pricePerLiter || '';
            console.log("Settings loaded:", settings);
        } else {
            console.log("No settings document found. Using defaults.");
            // Can set default placeholder values if needed
            priceInput.placeholder = "1.00"; // Example default
        }
    } catch (error) {
        console.error("Error loading settings:", error);
        setMessage('Could not load current settings.', true);
        // Handle permission errors if rules aren't set yet
        if (error.code === 'permission-denied') {
             setMessage('Error: Insufficient permissions to load settings. Update Firestore rules.', true);
        } 
    }
}

// --- Save Settings Function ---
async function handleSaveSettings(event) {
    event.preventDefault();
    const newPrice = parseFloat(priceInput.value);

    if (isNaN(newPrice) || newPrice < 0) {
        setMessage('Please enter a valid positive price.', true);
        return;
    }

    setMessage('Saving...', false);

    try {
        // Use set with merge:true to create or update the document
        await settingsRef.set({
            pricePerLiter: newPrice,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        setMessage('Settings saved successfully!', false);
        console.log("Settings updated successfully.");
        
    } catch (error) {
        console.error("Error saving settings:", error);
        setMessage('Failed to save settings. Please try again.', true);
        // Handle permission errors if rules aren't set yet
        if (error.code === 'permission-denied') {
             setMessage('Error: Insufficient permissions to save settings. Update Firestore rules.', true);
        } 
    }
}

// --- Helper function to display messages ---
function setMessage(text, isError) {
    messageDiv.textContent = text;
    messageDiv.className = isError ? 'text-red-600 text-sm mt-2 p-2 bg-red-100 rounded' : 'text-green-600 text-sm mt-2 p-2 bg-green-100 rounded';
} 
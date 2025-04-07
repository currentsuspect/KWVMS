// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get references to Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const vendorNameElement = document.getElementById('vendorName');
const availabilityToggle = document.getElementById('availabilityToggle');
const ordersList = document.getElementById('ordersList');
const refreshOrdersBtn = document.getElementById('refreshOrders');
const logoutBtn = document.getElementById('logoutBtn');
const orderTemplate = document.getElementById('orderTemplate');
const radiusInput = document.getElementById('radiusInput');

// Navigation Elements
const navLinks = document.querySelectorAll('aside nav a');
const sections = document.querySelectorAll('main .dashboard-section');

// Current vendor data
let currentVendor = null;

// DOM Elements (ensure profile elements are added if needed)
const profileNameElement = document.getElementById('profileName');
const profileEmailElement = document.getElementById('profileEmail');
const profileStatusElement = document.getElementById('profileStatus');
const profileRadiusElement = document.getElementById('profileRadius');
const profileLocationElement = document.getElementById('profileLocation');
const updateLocationBtn = document.getElementById('updateLocationBtn');
const locationErrorElement = document.getElementById('locationError');
const locationSuccessElement = document.getElementById('locationSuccess');

// Handle navigation
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('data-target');
        
        // Update active state for styling
        navLinks.forEach(l => l.classList.remove('active', 'bg-indigo-100', 'text-indigo-700', 'font-semibold'));
        link.classList.add('active', 'bg-indigo-100', 'text-indigo-700', 'font-semibold');
        
        // Show/hide sections
        sections.forEach(section => {
            if (section.id === targetId) {
                section.classList.remove('hidden');
            } else {
                section.classList.add('hidden');
            }
        });
        
        // Load section data if needed
        if (targetId === 'my-orders-section') {
            loadMyOrders();
        } else if (targetId === 'profile-section') {
            loadProfile();
        } else if (targetId === 'earnings-section') {
            const earningsLink = document.querySelector('a[data-target="earnings-section"]');
            if (earningsLink) {
                 navLinks.forEach(l => l.classList.remove('active', 'bg-indigo-100', 'text-indigo-700', 'font-semibold'));
                 earningsLink.classList.add('active', 'bg-indigo-100', 'text-indigo-700', 'font-semibold');
            }
            loadEarnings();
        }
    });
});

// Initial active state needs to be set on load if not default
// Find the initially active link and apply classes
document.addEventListener('DOMContentLoaded', () => {
    const initialActiveLink = document.querySelector('aside nav a.active'); // Might already have 'active' from HTML
    if (initialActiveLink) {
        // Ensure the correct styling classes are applied initially
        initialActiveLink.classList.add('bg-indigo-100', 'text-indigo-700', 'font-semibold');
    } else {
        // Default to the first link if none are marked active
        const firstLink = document.querySelector('aside nav a');
        if (firstLink) {
            firstLink.classList.add('active', 'bg-indigo-100', 'text-indigo-700', 'font-semibold');
            // Also show the corresponding section
            const targetId = firstLink.getAttribute('data-target');
             sections.forEach(section => {
                if (section.id === targetId) {
                    section.classList.remove('hidden');
                } else {
                    section.classList.add('hidden');
                }
            });
        }
    }
});

// Load profile data
function loadProfile() {
    if (!currentVendor) {
        console.error("Cannot load profile, vendor data not available.");
        return;
    }
    console.log("Loading profile data...");
    
    if(profileNameElement) profileNameElement.textContent = currentVendor.name || 'N/A';
    if(profileEmailElement) profileEmailElement.textContent = currentVendor.email || 'N/A';
    if(profileStatusElement) profileStatusElement.textContent = formatStatus(currentVendor.status || 'unknown'); // Use formatStatus
    if(profileRadiusElement) profileRadiusElement.textContent = currentVendor.radius || '5'; // Default 5
    
    // Display current location if available
    if (currentVendor.location && typeof currentVendor.location.latitude === 'number') {
        if(profileLocationElement) profileLocationElement.textContent = 
            `Lat: ${currentVendor.location.latitude.toFixed(5)}, Lng: ${currentVendor.location.longitude.toFixed(5)}`;
    } else {
        if(profileLocationElement) profileLocationElement.textContent = 'Not set';
    }

    // Clear previous messages
    if(locationErrorElement) locationErrorElement.textContent = '';
    if(locationSuccessElement) locationSuccessElement.textContent = '';
}

// Load earnings data
function loadEarnings() {
    if (currentVendor) {
        // This is a placeholder. Implement actual earnings calculation
        document.getElementById('totalEarnings').textContent = 'KES 0';
        document.getElementById('completedOrders').textContent = '0';
        document.getElementById('averageRating').textContent = 'N/A';
    }
}

// Load my orders
async function loadMyOrders() {
    try {
        if (!currentVendor || !currentVendor.id) {
            console.warn("Current vendor information is not available for loading my orders.");
            return;
        }
        // Query orders assigned to the current vendor
        const myOrdersSnapshot = await db.collection('orders')
            .where('assignedVendorId', '==', currentVendor.id)
            // Optionally order by creation time if needed, but ensure createdAt exists
            // .orderBy('createdAt', 'desc') 
            .get();

        const myOrdersList = document.getElementById('myOrdersList');
        myOrdersList.innerHTML = ''; // Clear previous list

        if (myOrdersSnapshot.empty) {
            // Apply consistent empty state styling
            myOrdersList.innerHTML = '<div class="md:col-span-2 lg:col-span-3 text-center py-8 text-gray-500"><p>No orders assigned to you yet.</p></div>';
            return;
        }

        myOrdersSnapshot.forEach(doc => {
            const order = doc.data();
            order.id = doc.id;
            
            const orderCard = orderTemplate.content.cloneNode(true);
            const cardElement = orderCard.querySelector('.card'); // Get the card element itself

            orderCard.querySelector('.orderId').textContent = order.id.substring(0, 8);
            orderCard.querySelector('.quantity').textContent = order.quantityLiters ? order.quantityLiters : 'N/A'; 
            orderCard.querySelector('.location').textContent = (order.location && typeof order.location === 'string') 
                                                              ? order.location 
                                                              : (order.location && order.location.address) || 'Unknown Location';
            orderCard.querySelector('.distance').textContent = 'N/A'; // Distance not usually shown/relevant in 'My Orders'
            
            const orderTime = order.assignedAt && typeof order.assignedAt.toDate === 'function' // Use assignedAt time here
                              ? order.assignedAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : (order.createdAt && typeof order.createdAt.toDate === 'function' ? order.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Time N/A');
            orderCard.querySelector('.time').textContent = orderTime;

            // Display Status and style card based on status
            const statusElement = orderCard.querySelector('.order-status');
            const currentStatus = order.status || 'unknown'; // Should always have status here
            statusElement.textContent = formatStatus(currentStatus);

            // --- Modify Action Button based on Status ---
            const actionButtonContainer = orderCard.querySelector('.mt-auto, .bg-gray-50'); // Select the button container
            let buttonHtml = ''; // Build button HTML string

            let nextStatus = '';
            let buttonText = '';
            let buttonBaseClasses = "w-full px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2";
            let buttonColorClasses = '';
            let isDisabled = false;

            switch (currentStatus) {
                case 'assigned':
                    nextStatus = 'in_progress';
                    buttonText = 'Mark In Progress';
                    buttonColorClasses = 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500'; // Yellow
                    break;
                case 'in_progress':
                    nextStatus = 'completed';
                    buttonText = 'Mark Completed';
                    buttonColorClasses = 'bg-green-500 hover:bg-green-600 focus:ring-green-500'; // Green
                    break;
                case 'completed':
                    buttonText = 'Completed';
                    buttonColorClasses = 'bg-gray-400 cursor-not-allowed'; // Grey, non-interactive
                    isDisabled = true;
                    break;
                case 'pending': // Added case for pending if it appears in 'My Orders' somehow
                     buttonText = 'Pending Acceptance';
                     buttonColorClasses = 'bg-blue-500 cursor-not-allowed'; // Blue, non-interactive
                     isDisabled = true;
                     break;
                default: // Includes 'cancelled' or unknown
                    buttonText = formatStatus(currentStatus); // Show current status
                    buttonColorClasses = 'bg-gray-400 cursor-not-allowed';
                    isDisabled = true;
            }

             buttonHtml = `
                <button 
                    class="${buttonBaseClasses} ${buttonColorClasses}" 
                    ${isDisabled ? 'disabled' : ''} 
                    ${!isDisabled ? `data-order-id="${order.id}" data-next-status="${nextStatus}"` : ''}
                >
                    ${buttonText}
                </button>
            `;

            if (actionButtonContainer) {
                actionButtonContainer.innerHTML = buttonHtml; // Replace container content with new button
                if (!isDisabled) {
                     const newButton = actionButtonContainer.querySelector('button');
                     if(newButton){
                        newButton.addEventListener('click', (e) => {
                            const clickedButton = e.currentTarget;
                             updateOrderStatus(clickedButton.dataset.orderId, clickedButton.dataset.nextStatus);
                        });
                     }
                }
            }
            // --- End Action Button Modification ---
            
            myOrdersList.appendChild(orderCard);
        });

        // Add event delegation for dynamically added buttons IF the above direct binding fails
        // myOrdersList.addEventListener('click', function(event) {
        //     if (event.target.matches('button[data-order-id]')) {
        //         updateOrderStatus(event.target.dataset.orderId, event.target.dataset.nextStatus);
        //     }
        // });

    } catch (error) {
        console.error('Error loading my orders:', error);
        // Display a user-friendly message in the UI as well
        const myOrdersList = document.getElementById('myOrdersList');
        if (myOrdersList) {
            myOrdersList.innerHTML = '<div class="col-12 text-danger"><p>Error loading your assigned orders. Please try again later.</p></div>';
        } else {
            alert('Error loading your orders. Please try again.'); // Fallback alert
        }
    }
}

// Check authentication state
auth.onAuthStateChanged(async (user) => {
    if (user) {
        console.log("Vendor dashboard: Auth state changed. User found:", user.uid);
        // Check if user is a vendor BY ROLE in the USERS collection
        try {
            const userDoc = await db.collection('users').doc(user.uid).get(); // Check 'users' collection
            if (userDoc.exists && userDoc.data().role === 'vendor') { // Check existence AND role
                console.log("User document exists and role is 'vendor' for user:", user.uid);
                currentVendor = userDoc.data(); // Use data from 'users' doc
                currentVendor.id = user.uid;
                // Use fields from the user document
                vendorNameElement.textContent = currentVendor.name || user.email;
                availabilityToggle.checked = currentVendor.status === 'available'; // Assuming status is stored here
                radiusInput.value = currentVendor.radius || 5; // Assuming radius is stored here
                loadAvailableOrders();
            } else {
                // User not found in 'users' or role is not 'vendor' - Redirect!
                console.log(`User ${user.uid} logged in, but no document found in 'users' collection OR role is not 'vendor'. Redirecting to index.html.`);
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error("Error fetching user document for vendor check:", error);
            alert("Error checking vendor status. Redirecting to login.");
            window.location.href = 'index.html';
        }
    } else {
        console.log("Vendor dashboard: Auth state changed. No user found. Redirecting to index.html.");
        // Redirect to login if not authenticated
        window.location.href = 'index.html';
    }
});

// Calculate distance between two points using Haversine formula
function calculateDistance(point1, point2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = toRad(point2.latitude - point1.latitude);
    const dLon = toRad(point2.longitude - point1.longitude);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(point1.latitude)) * Math.cos(toRad(point2.latitude)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
}

// Helper function to convert degrees to radians
function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

// Load available orders
async function loadAvailableOrders() {
    try {
        // Ensure currentVendor and its location are defined before proceeding
        if (!currentVendor || !currentVendor.location || typeof currentVendor.location.latitude !== 'number' || typeof currentVendor.location.longitude !== 'number') {
            console.warn("Vendor location is not set or invalid. Cannot calculate distances.");
            // Apply consistent styling to the message
            ordersList.innerHTML = '<div class="md:col-span-2 lg:col-span-3 text-center py-8 text-gray-500"><p>Please set your current location in Profile & Settings to see available orders near you.</p></div>';
            // // Fetch all pending orders without distance calculation (REMOVED THIS FALLBACK)
            // const ordersSnapshot = await db.collection('orders').where('status', '==', 'pending').get();
            // ordersList.innerHTML = ''; // Clear message if needed
            // ordersSnapshot.forEach(doc => displayOrderCard(doc.data(), doc.id, 'N/A'));
            return; 
        }

        // Fetch all pending orders
        const ordersSnapshot = await db.collection('orders')
            .where('status', '==', 'pending')
            .get();

        // Check if there are ANY pending orders at all
        if (ordersSnapshot.empty) {
            ordersList.innerHTML = '<div class="md:col-span-2 lg:col-span-3 text-center py-8 text-gray-500"><p>No available orders at this time.</p></div>';
            return;
        }

        ordersList.innerHTML = ''; // Clear existing orders / loading message
        // const availableOrders = []; - Replaced with two lists
        const ordersInRadius = [];
        const ordersOutsideOrNoCoords = [];
        const vendorRadius = currentVendor.radius || 5; // Use default radius if not set

        ordersSnapshot.forEach(doc => {
            const order = doc.data();
            order.id = doc.id;

            let distance = Infinity; 
            let distanceText = 'N/A'; // Default display text

            if (order.location && typeof order.location === 'object' && 
                typeof order.location.latitude === 'number' && 
                typeof order.location.longitude === 'number') {
                try {
                     if(currentVendor.location && typeof currentVendor.location.latitude === 'number'){
                         distance = calculateDistance(currentVendor.location, order.location);
                         distanceText = distance.toFixed(1); // Calculate text only if distance is valid
                     } else {
                         console.warn(`Vendor location is invalid, cannot calculate distance for order ${order.id}`);
                     }
                } catch (e) {
                    console.error(`Error calculating distance for order ${order.id}:`, e);
                }
            } else {
                if (!order.location || typeof order.location !== 'object'){
                     console.warn(`Order ${order.id} has missing or invalid location field structure.`);
                } 
            }

            // Categorize order
            if (distance <= vendorRadius) {
                ordersInRadius.push({ ...order, distance: distance, distanceText: distanceText });
            } else {
                 ordersOutsideOrNoCoords.push({ ...order, distance: Infinity, distanceText: 'N/A' });
            }
        });

        // Check if BOTH lists are empty
        if (ordersInRadius.length === 0 && ordersOutsideOrNoCoords.length === 0) {
            // Use the generic "no orders at this time" message if truly empty
             ordersList.innerHTML = `<div class="md:col-span-2 lg:col-span-3 text-center py-8 text-gray-500"><p>No available orders at this time.</p></div>`;
             return;
        }

        // Sort orders within radius by distance
        ordersInRadius.sort((a, b) => a.distance - b.distance);

        // Display orders: In radius first, then others
        ordersInRadius.forEach(order => {
            displayOrderCard(order, order.id, order.distanceText); 
        });
        
        ordersOutsideOrNoCoords.forEach(order => {
             displayOrderCard(order, order.id, order.distanceText); 
        });

    } catch (error) {
        console.error('Error loading orders:', error);
        alert('Error loading orders. Please try again.');
    }
}

// Helper function to create and display an order card
function displayOrderCard(order, orderId, distanceText) {
    const orderCard = orderTemplate.content.cloneNode(true);
    const cardElement = orderCard.querySelector('.card'); // Get the card element itself
    orderCard.querySelector('.orderId').textContent = orderId.substring(0, 8);
    orderCard.querySelector('.quantity').textContent = order.quantityLiters ? order.quantityLiters : 'N/A'; 
    
    // Get location text safely from the location object
    const locationText = (order.location && typeof order.location === 'object' && order.location.address)
                         ? order.location.address 
                         : (typeof order.location === 'string' ? order.location : 'Unknown Location'); // Fallback for old string format
    orderCard.querySelector('.location').textContent = locationText;
    
    orderCard.querySelector('.distance').textContent = distanceText;
    const orderTime = order.createdAt && typeof order.createdAt.toDate === 'function' 
                      ? order.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Time N/A'; 
    orderCard.querySelector('.time').textContent = orderTime;

    // Display Status and style card based on status
    const statusElement = orderCard.querySelector('.order-status');
    const currentStatus = order.status || 'pending'; // Default to pending if missing
    statusElement.textContent = formatStatus(currentStatus);

    // Add accept order handler
    const acceptBtn = orderCard.querySelector('.accept-order');
    if (acceptBtn) { 
        acceptBtn.textContent = 'Accept Order'; 
        acceptBtn.classList.remove('btn-info', 'btn-success', 'btn-secondary'); // Reset classes
        acceptBtn.classList.add('btn-primary');
        acceptBtn.replaceWith(acceptBtn.cloneNode(true)); 
        const newAcceptBtn = orderCard.querySelector('.accept-order'); 
        newAcceptBtn.addEventListener('click', () => acceptOrder(orderId));
    }

    ordersList.appendChild(orderCard);
}

// Accept order - Update order status
async function acceptOrder(orderId) {
    try {
        await db.collection('orders').doc(orderId).update({
            status: 'assigned',
            assignedVendorId: currentVendor.id,
            assignedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Update vendor status IN THE USER DOCUMENT
        await db.collection('users').doc(currentVendor.id).update({
            status: 'busy'
        });

        availabilityToggle.checked = false;
        loadAvailableOrders();
        alert('Order accepted successfully!');
    } catch (error) {
        console.error('Error accepting order:', error);
        alert('Error accepting order. Please try again.');
    }
}

// Toggle availability - Update status IN THE USER DOCUMENT
availabilityToggle.addEventListener('change', async (e) => {
    try {
        await db.collection('users').doc(currentVendor.id).update({
            status: e.target.checked ? 'available' : 'busy'
        });

        if (e.target.checked) {
            loadAvailableOrders();
        }
    } catch (error) {
        console.error('Error updating availability:', error);
        alert('Error updating availability. Please try again.');
        e.target.checked = !e.target.checked; // Revert toggle
    }
});

// Refresh orders
refreshOrdersBtn.addEventListener('click', loadAvailableOrders);

// Logout
logoutBtn.addEventListener('click', async () => {
    try {
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error signing out:', error);
        alert('Error signing out. Please try again.');
    }
});

// Update radius - Update radius IN THE USER DOCUMENT
radiusInput.addEventListener('change', async (e) => {
    try {
        const newRadius = parseFloat(e.target.value);
        if (isNaN(newRadius) || newRadius < 1 || newRadius > 100) {
            alert('Please enter a valid radius between 1 and 100 kilometers.');
            e.target.value = currentVendor.radius || 5;
            return;
        }
        await db.collection('users').doc(currentVendor.id).update({
            radius: newRadius
        });
        currentVendor.radius = newRadius; // Update local state
        loadAvailableOrders();
    } catch (error) {
        console.error('Error updating radius:', error);
        alert('Error updating radius. Please try again.');
        e.target.value = currentVendor.radius || 5;
    }
});

// Function to update order status in Firestore
async function updateOrderStatus(orderId, newStatus) {
    console.log(`Updating order ${orderId} to status: ${newStatus}`);
    const orderRef = db.collection('orders').doc(orderId);

    try {
        await orderRef.update({
            status: newStatus,
            // Optionally add timestamps for status changes
            [`${newStatus}Timestamp`]: firebase.firestore.FieldValue.serverTimestamp() 
        });
        console.log(`Order ${orderId} status updated successfully.`);
        // Refresh the 'My Orders' list to show the change
        loadMyOrders(); 
    } catch (error) {
        console.error("Error updating order status:", error);
        alert(`Failed to update order status: ${error.message}`);
    }
}

// Helper function to format status text
function formatStatus(status) {
    switch (status) {
        case 'pending': return 'Pending Acceptance';
        case 'assigned': return 'Accepted (Waiting)';
        case 'in_progress': return 'Delivery In Progress';
        case 'completed': return 'Completed';
        case 'cancelled': return 'Cancelled';
        default: return status; // Return status as is if unknown
    }
}

// --- Update Location Handler ---
if (updateLocationBtn) {
    updateLocationBtn.addEventListener('click', async () => {
        if (!currentVendor || !currentVendor.id) {
            console.error("Vendor info not available for location update.");
            if(locationErrorElement) locationErrorElement.textContent = 'Error: Vendor data not loaded.';
            return;
        }

        if (!navigator.geolocation) {
            console.error("Geolocation is not supported by this browser.");
            if(locationErrorElement) locationErrorElement.textContent = 'Geolocation is not supported by your browser.';
            return;
        }

        console.log("Attempting to get current location...");
        updateLocationBtn.disabled = true;
        updateLocationBtn.textContent = 'Getting Location...';
        if(locationErrorElement) locationErrorElement.textContent = '';
        if(locationSuccessElement) locationSuccessElement.textContent = '';

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                const newLocation = {
                    latitude: latitude,
                    longitude: longitude
                };

                console.log("Location obtained:", newLocation);

                try {
                    // Update Firestore
                    console.log(`Attempting to update Firestore path: users/${currentVendor.id}`);
                    // Restore original update
                    await db.collection('users').doc(currentVendor.id).update({
                        location: newLocation,
                        lastLocationUpdate: firebase.firestore.FieldValue.serverTimestamp() 
                    });

                    console.log("Firestore location updated successfully."); // Restore original log
                    
                    // Update local vendor object and UI
                    currentVendor.location = newLocation; // Restore update
                    if(profileLocationElement) profileLocationElement.textContent = 
                        `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`; // Restore UI update
                    if(locationSuccessElement) locationSuccessElement.textContent = 'Location updated successfully!'; // Restore original message
                    
                    // Reload available orders as location has changed
                    loadAvailableOrders(); // Restore reload

                } catch (error) {
                    console.error("Error updating Firestore location:", error); // Keep original error message
                    if(locationErrorElement) locationErrorElement.textContent = 'Failed to save location. Please try again.';
                     // Check for permission errors specifically
                     if (error.code === 'permission-denied') {
                        locationErrorElement.textContent += ' (Check Firestore Rules)';
                    }
                } finally {
                    updateLocationBtn.disabled = false;
                    updateLocationBtn.textContent = 'Update My Current Location';
                }
            },
            (error) => {
                console.error("Error getting geolocation:", error);
                let message = 'Could not get location.';
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        message = "Location permission denied.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message = "Location information is unavailable.";
                        break;
                    case error.TIMEOUT:
                        message = "Location request timed out.";
                        break;
                    case error.UNKNOWN_ERROR:
                        message = "An unknown error occurred retrieving location.";
                        break;
                }
                if(locationErrorElement) locationErrorElement.textContent = message;
                updateLocationBtn.disabled = false;
                updateLocationBtn.textContent = 'Update My Current Location';
            },
            { 
                enableHighAccuracy: true, // Request more accurate position
                timeout: 10000, // Set timeout to 10 seconds
                maximumAge: 0 // Don't use cached position
            } 
        );
    });
} 
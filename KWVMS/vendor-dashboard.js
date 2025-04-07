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
            const currentStatus = order.status || 'pending'; // Default to pending if missing
            statusElement.textContent = formatStatus(currentStatus);

            // --- Modify Action Button based on Status ---
            // Try multiple selectors to find the button container
            let actionButtonContainer = orderCard.querySelector('.p-4.bg-neutral-50, .p-4.dark\\:bg-neutral-700');
            
            // Fallback selectors if the first one doesn't work
            if (!actionButtonContainer) {
                actionButtonContainer = orderCard.querySelector('.border-t');
            }
            
            // Last resort - find any div that contains a button
            if (!actionButtonContainer) {
                actionButtonContainer = orderCard.querySelector('div:has(button)');
            }
            
            console.log(`[My Orders] Button container found: ${actionButtonContainer ? 'Yes' : 'No'}`);
            
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
                    buttonColorClasses = 'bg-warning-500 hover:bg-warning-600 focus:ring-warning-500'; // Warning color
                    break;
                case 'in_progress':
                    nextStatus = 'completed';
                    buttonText = 'Mark Completed';
                    buttonColorClasses = 'bg-accent-500 hover:bg-accent-600 focus:ring-accent-500'; // Accent color
                    break;
                case 'completed':
                    buttonText = 'Completed';
                    buttonColorClasses = 'bg-neutral-400 cursor-not-allowed'; // Neutral color
                    isDisabled = true;
                    break;
                case 'pending': // Added case for pending if it appears in 'My Orders' somehow
                     buttonText = 'Pending Acceptance';
                     buttonColorClasses = 'bg-primary-500 cursor-not-allowed'; // Primary color
                     isDisabled = true;
                     break;
                default: // Includes 'cancelled' or unknown
                    buttonText = formatStatus(currentStatus); // Show current status
                    buttonColorClasses = 'bg-neutral-400 cursor-not-allowed';
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
                        console.log(`[My Orders] Setting up button for order ${order.id} with next status: ${nextStatus}`);
                        newButton.addEventListener('click', (e) => {
                            const clickedButton = e.currentTarget;
                            console.log(`[My Orders] Button clicked for order ${clickedButton.dataset.orderId} with next status: ${clickedButton.dataset.nextStatus}`);
                             updateOrderStatus(clickedButton.dataset.orderId, clickedButton.dataset.nextStatus);
                        });
                     } else {
                         console.warn(`[My Orders] Button element not found in container for order ${order.id}`);
                     }
                }
            } else {
                console.warn(`[My Orders] Could not find button container for order ${order.id}`);
            }
            // --- End Action Button Modification ---
            
            myOrdersList.appendChild(orderCard);
        });

        // Add event delegation for dynamically added buttons IF the above direct binding fails
        myOrdersList.addEventListener('click', function(event) {
            // Check if the clicked element is a button with data-order-id attribute
            if (event.target.tagName === 'BUTTON' && event.target.hasAttribute('data-order-id')) {
                console.log(`[My Orders] Event delegation: Button clicked for order ${event.target.dataset.orderId} with next status: ${event.target.dataset.nextStatus}`);
                updateOrderStatus(event.target.dataset.orderId, event.target.dataset.nextStatus);
            }
        });

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
                
                // Set default location if none is provided
                if (!currentVendor.location || typeof currentVendor.location.latitude !== 'number') {
                    console.log("Setting default location for vendor");
                    
                    // Try to get location from localStorage first
                    try {
                        const savedLocation = localStorage.getItem('vendorLocation');
                        if (savedLocation) {
                            const parsedLocation = JSON.parse(savedLocation);
                            if (parsedLocation && typeof parsedLocation.latitude === 'number') {
                                console.log("Using location from localStorage:", parsedLocation);
                                currentVendor.location = parsedLocation;
                            } else {
                                // Use default Kajiado coordinates if localStorage data is invalid
                                currentVendor.location = {
                                    latitude: -1.2921, // Default to Kajiado coordinates
                                    longitude: 36.8219
                                };
                            }
                        } else {
                            // Use default Kajiado coordinates if no localStorage data
                            currentVendor.location = {
                                latitude: -1.2921, // Default to Kajiado coordinates
                                longitude: 36.8219
                            };
                        }
                    } catch (localStorageError) {
                        console.error("Error reading from localStorage:", localStorageError);
                        // Use default Kajiado coordinates if localStorage error
                        currentVendor.location = {
                            latitude: -1.2921, // Default to Kajiado coordinates
                            longitude: 36.8219
                        };
                    }
                }
                
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
            return; 
        }

        // Show loading state
        ordersList.innerHTML = '<div class="md:col-span-2 lg:col-span-3 text-center py-8 text-gray-500"><p>Loading available orders...</p></div>';

        // Fetch all pending orders
        const ordersSnapshot = await db.collection('orders')
            .where('status', '==', 'pending')
            .get();

        console.log(`[loadAvailableOrders] Found ${ordersSnapshot.size} pending orders`);

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
            console.log(`[loadAvailableOrders] Processing order ${doc.id} with status: ${order.status}`);

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
        console.log(`[displayOrderCard] Found accept button for order ${orderId}. Status: ${currentStatus}`);
        
        // Only show Accept Order button for pending orders
        if (currentStatus === 'pending') {
        acceptBtn.textContent = 'Accept Order'; 
            acceptBtn.classList.remove('btn-info', 'btn-success', 'btn-secondary', 'bg-neutral-400', 'cursor-not-allowed'); // Reset classes
            acceptBtn.classList.add('bg-primary-600', 'hover:bg-primary-700');
            acceptBtn.disabled = false;
            
            // Add event listener for pending orders
            acceptBtn.addEventListener('click', () => {
                console.log(`[Accept Button Click] Clicked for order ${orderId}`);
                acceptOrder(orderId);
            });
        } else {
            // For non-pending orders, disable the button and change text
            acceptBtn.textContent = formatStatus(currentStatus);
            acceptBtn.classList.remove('btn-info', 'btn-success', 'btn-secondary', 'bg-primary-600', 'hover:bg-primary-700');
            acceptBtn.classList.add('bg-neutral-400', 'cursor-not-allowed');
            acceptBtn.disabled = true;
        }
    } else {
        console.warn(`[displayOrderCard] Could not find .accept-order button for order ${orderId}`);
    }

    ordersList.appendChild(orderCard);
}

// Accept order - Update order status
async function acceptOrder(orderId) {
    console.log(`[acceptOrder] Function called for order ${orderId}`);
    try {
        // First check if the order exists and is in pending status
        const orderRef = db.collection('orders').doc(orderId);
        const orderDoc = await orderRef.get();
        
        if (!orderDoc.exists) {
            throw new Error('Order not found');
        }
        
        const orderData = orderDoc.data();
        if (orderData.status !== 'pending') {
            throw new Error('Order is no longer available');
        }

        // Check if the order was created by an admin user
        let isAdminOrder = false;
        if (orderData.userId) {
            try {
                const userDoc = await db.collection('users').doc(orderData.userId).get();
                if (userDoc.exists && userDoc.data().role === 'admin') {
                    isAdminOrder = true;
                    console.log('Order was created by an admin user');
                }
            } catch (error) {
                console.warn('Could not check if order was created by admin:', error);
            }
        }

        // Update the order status
        try {
            await orderRef.update({
            status: 'assigned',
            assignedVendorId: currentVendor.id,
            assignedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

            // Update vendor status
        await db.collection('users').doc(currentVendor.id).update({
            status: 'busy'
        });

            // Update UI
        availabilityToggle.checked = false;
        loadAvailableOrders();
        alert('Order accepted successfully!');
        } catch (updateError) {
            console.error('Error updating order:', updateError);
            
            // If this is an admin-created order and we're getting a permission error,
            // try an alternative approach
            if (isAdminOrder && updateError.code === 'permission-denied') {
                console.log('Attempting alternative approach for admin-created order');
                
                // Try to update just the vendor status first
                await db.collection('users').doc(currentVendor.id).update({
                    status: 'busy'
                });
                
                // Then notify the user that they need admin assistance
                alert('This order was created by an administrator. Please contact support to complete the acceptance process.');
                
                // Update UI
                availabilityToggle.checked = false;
                loadAvailableOrders();
            } else {
                throw updateError; // Re-throw if it's not an admin order or a different error
            }
        }
    } catch (error) {
        console.error('Error accepting order:', error);
        alert(error.message || 'Error accepting order. Please try again.');
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
    console.log(`[updateOrderStatus] Updating order ${orderId} to status: ${newStatus}`);
    
    if (!orderId || !newStatus) {
        console.error(`[updateOrderStatus] Missing required parameters: orderId=${orderId}, newStatus=${newStatus}`);
        alert('Error: Missing order information. Please try again.');
        return;
    }
    
    const orderRef = db.collection('orders').doc(orderId);

    try {
        // First check if the order exists
        const orderDoc = await orderRef.get();
        if (!orderDoc.exists) {
            console.error(`[updateOrderStatus] Order ${orderId} does not exist`);
            alert('Error: Order not found. It may have been deleted.');
            return;
        }
        
        // Check if the order is assigned to the current vendor
        const orderData = orderDoc.data();
        if (orderData.assignedVendorId !== currentVendor.id) {
            console.error(`[updateOrderStatus] Order ${orderId} is not assigned to current vendor`);
            alert('Error: This order is not assigned to you.');
            return;
        }
        
        // Update the order status
        await orderRef.update({
            status: newStatus,
            // Optionally add timestamps for status changes
            [`${newStatus}Timestamp`]: firebase.firestore.FieldValue.serverTimestamp() 
        });
        console.log(`[updateOrderStatus] Order ${orderId} status updated successfully.`);
        
        // Refresh the 'My Orders' list to show the change
        loadMyOrders(); 
    } catch (error) {
        console.error("[updateOrderStatus] Error updating order status:", error);
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

// Check if vendor has permission to update location
async function checkVendorPermissions() {
    if (!currentVendor || !currentVendor.id) {
        console.error("Vendor info not available for permission check.");
        return false;
    }
    
    try {
        // Check if the user is a vendor
        const userDoc = await db.collection('users').doc(currentVendor.id).get();
        if (!userDoc.exists) {
            console.error("User document does not exist.");
            return false;
        }
        
        const userData = userDoc.data();
        if (userData.role !== 'vendor') {
            console.error("User is not a vendor.");
            return false;
        }
        
        console.log("Vendor permissions verified.");
        return true;
    } catch (error) {
        console.error("Error checking vendor permissions:", error);
        return false;
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

        // Check if Firebase is properly initialized
        if (!firebase || !firebase.apps || firebase.apps.length === 0) {
            console.error("Firebase is not properly initialized.");
            if(locationErrorElement) locationErrorElement.textContent = 'Error: Firebase is not properly initialized. Please refresh the page.';
            return;
        }

        // Check if Firestore is available
        if (!firebase.firestore) {
            console.error("Firestore is not available.");
            if(locationErrorElement) locationErrorElement.textContent = 'Error: Firestore is not available. Please refresh the page.';
            return;
        }
        
        // Check vendor permissions
        const hasPermission = await checkVendorPermissions();
        if (!hasPermission) {
            console.error("Vendor does not have permission to update location.");
            if(locationErrorElement) locationErrorElement.textContent = 'Error: You do not have permission to update your location.';
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
                    console.log(`Current vendor data:`, currentVendor);
                    
                    // Create a clean update object with only the fields we want to update
                    const updateData = {
                        location: newLocation
                    };
                    
                    console.log(`Update data:`, updateData);
                    
                    // Add timestamp only if it's supported
                    if (firebase.firestore && firebase.firestore.FieldValue) {
                        updateData.lastLocationUpdate = firebase.firestore.FieldValue.serverTimestamp();
                        console.log(`Added serverTimestamp to update data`);
                    } else {
                        console.warn(`firebase.firestore.FieldValue is not available`);
                    }
                    
                    // Update Firestore with the clean update object
                    console.log(`Sending update to Firestore...`);
                    await db.collection('users').doc(currentVendor.id).update(updateData);

                    console.log("Firestore location updated successfully.");
                    
                    // Update local vendor object and UI
                    currentVendor.location = newLocation;
                    if(profileLocationElement) profileLocationElement.textContent = 
                        `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`;
                    if(locationSuccessElement) locationSuccessElement.textContent = 'Location updated successfully!';
                    
                    // Reload available orders as location has changed
                    loadAvailableOrders();
                } catch (error) {
                    console.error("Error updating Firestore location:", error);
                    console.error("Error details:", {
                        code: error.code,
                        message: error.message,
                        stack: error.stack
                    });
                    
                    // Check for specific error types
                     if (error.code === 'permission-denied') {
                        if(locationErrorElement) locationErrorElement.textContent = 
                            'Permission denied. Please make sure you are logged in as a vendor.';
                    } else if (error.code === 'unavailable' || error.message.includes('CORS')) {
                        if(locationErrorElement) locationErrorElement.textContent = 
                            'Network error. Please check your internet connection and try again.';
                    } else {
                        if(locationErrorElement) locationErrorElement.textContent = 
                            `Error updating location: ${error.message}`;
                    }
                    
                    // Still update the local UI even if Firestore update fails
                    // This provides a better user experience
                    currentVendor.location = newLocation;
                    if(profileLocationElement) profileLocationElement.textContent = 
                        `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`;
                    
                    // Try to store the location in localStorage as a fallback
                    try {
                        localStorage.setItem('vendorLocation', JSON.stringify(newLocation));
                        console.log("Location saved to localStorage as fallback");
                    } catch (localStorageError) {
                        console.error("Error saving to localStorage:", localStorageError);
                    }
                } finally {
                    updateLocationBtn.disabled = false;
                    updateLocationBtn.textContent = 'Update My Current Location';
                }
            },
            (error) => {
                console.error("Geolocation error:", error);
                if(locationErrorElement) locationErrorElement.textContent = `Geolocation error: ${error.message}`;
                updateLocationBtn.disabled = false;
                updateLocationBtn.textContent = 'Update My Current Location';
            },
            { 
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            } 
        );
    });
} 
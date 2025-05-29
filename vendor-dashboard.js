// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    limit, 
    updateDoc, 
    setDoc, 
    serverTimestamp, 
    onSnapshot, 
    addDoc,
    runTransaction
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get references to Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const vendorNameElement = document.getElementById('vendorName');
const availabilityToggle = document.getElementById('availabilityToggle');
const ordersList = document.getElementById('ordersList');
const refreshOrdersBtn = document.getElementById('refreshOrders');
const logoutBtn = document.getElementById('logoutBtn');
const orderTemplate = document.getElementById('orderTemplate');
const radiusInput = document.getElementById('radiusInput');

// Global debug mode flag (default: false in production)
let debugMode = false;

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
const availabilityStatusText = document.getElementById('availabilityStatusText');

// Chat functionality
let currentChatOrderId = null;
let chatUnsubscribe = null;

// DOM Elements for chat
const chatButton = document.getElementById('chatButton');
const chatWindow = document.getElementById('chatWindow');
const closeChatWindow = document.getElementById('closeChatWindow');
const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const messageInput = document.getElementById('messageInput');

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
                
                // If switching to My Orders section, refresh it
                if (targetId === 'my-orders-section') {
                    console.log("Loading My Orders section...");
                    loadMyOrders();
                }
            } else {
                section.classList.add('hidden');
            }
        });
        
        // Load section data if needed
        if (targetId === 'profile-section') {
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
    console.log("DOMContentLoaded event fired");
    const initialActiveLink = document.querySelector('aside nav a.active'); // Might already have 'active' from HTML
    if (initialActiveLink) {
        // Ensure the correct styling classes are applied initially
        initialActiveLink.classList.add('bg-indigo-100', 'text-indigo-700', 'font-semibold');
        
        // Also show the corresponding section
        const targetId = initialActiveLink.getAttribute('data-target');
        if (targetId) {
            sections.forEach(section => {
                if (section.id === targetId) {
                    section.classList.remove('hidden');
                    // If it's the my-orders section, load the orders
                    if (targetId === 'my-orders-section') {
                        // Wait for auth and vendor data to be available before loading orders
                        if (currentVendor && currentVendor.id) {
                            console.log("Loading my orders on initial page load");
                            loadMyOrders();
                        } else {
                            console.log("Will load my orders after vendor data is available");
                        }
                    }
                } else {
                    section.classList.add('hidden');
                }
            });
        }
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
    
    // Add event listener for the My Orders refresh button
    const refreshMyOrdersBtn = document.getElementById('refreshMyOrders');
    if (refreshMyOrdersBtn) {
        refreshMyOrdersBtn.addEventListener('click', () => {
            console.log("Manually refreshing My Orders");
            loadMyOrders();
            showToast("My Orders refreshed", "info");
        });
    }
    
    // Add debug toggle button to the logout button's parent
    if (logoutBtn && logoutBtn.parentElement) {
        // Add Debug Vendor Info button
        const debugVendorBtn = document.createElement('button');
        debugVendorBtn.id = 'debugVendorBtn';
        debugVendorBtn.className = 'w-full px-4 py-2 mb-2 text-white bg-warning-500 rounded-md hover:bg-warning-600 focus:outline-none';
        debugVendorBtn.textContent = 'Debug Vendor Info';
        debugVendorBtn.addEventListener('click', debugVendorInfo);
        debugVendorBtn.style.display = 'none'; // Hidden by default
        logoutBtn.parentElement.insertBefore(debugVendorBtn, logoutBtn);
        
        // Add Debug Mode Toggle button
        const debugToggleBtn = document.createElement('button');
        debugToggleBtn.id = 'debugToggleBtn';
        debugToggleBtn.className = 'w-full px-4 py-2 mb-2 text-white bg-warning-600 rounded-md hover:bg-warning-700 focus:outline-none';
        updateDebugButtonText(debugToggleBtn);
        
        debugToggleBtn.addEventListener('click', () => {
            debugMode = !debugMode;
            updateDebugButtonText(debugToggleBtn);
            updateDebugElementsVisibility();
            showToast(`Debug mode ${debugMode ? 'enabled' : 'disabled'}`, 'info');
        });
        
        logoutBtn.parentElement.insertBefore(debugToggleBtn, logoutBtn);
    }
    
    // Initial debug elements visibility
    updateDebugElementsVisibility();

    // Add listener for the withdrawal button
    const withdrawalBtn = document.getElementById('requestWithdrawalBtn');
    if (withdrawalBtn) {
        withdrawalBtn.addEventListener('click', handleMockWithdrawal);
    } else {
        console.warn("Withdrawal button not found during initialization.");
    }
    
    // Initial load for the default visible section (e.g., Available Orders)
    // The navigation handler will load data for other sections when clicked
    if (document.getElementById('orders-section') && !document.getElementById('orders-section').classList.contains('hidden')){
        loadAvailableOrders();
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
async function loadEarnings() {
    console.log("Loading earnings data...");
    const totalEarningsElement = document.getElementById('totalEarnings');
    const completedOrdersElement = document.getElementById('completedOrders');
    const averageRatingElement = document.getElementById('averageRating');

    // Initialize display elements
    if (totalEarningsElement) totalEarningsElement.textContent = 'Loading...';
    if (completedOrdersElement) completedOrdersElement.textContent = 'Loading...';
    if (averageRatingElement) averageRatingElement.textContent = 'Loading...';

    if (currentVendor && currentVendor.id) {
        try {
            // Fetch the latest vendor data to get earnings info
            const vendorRef = doc(db, 'users', currentVendor.id);
            const vendorDoc = await getDoc(vendorRef);

            if (vendorDoc.exists()) {
                const vendorData = vendorDoc.data();
                console.log("[loadEarnings] Fetched vendor data:", JSON.stringify(vendorData, null, 2));
                
                // Update local vendor data as well
                currentVendor.totalEarnings = vendorData.totalEarnings || 0;
                currentVendor.completedOrders = vendorData.completedOrders || 0;
                currentVendor.averageRating = vendorData.averageRating || 0;
                
                // Update earnings summary display
                if (totalEarningsElement) {
                    totalEarningsElement.textContent = `KES ${currentVendor.totalEarnings.toFixed(2)}`;
                }
                
                if (completedOrdersElement) {
                    completedOrdersElement.textContent = currentVendor.completedOrders.toString();
                }
                
                if (averageRatingElement) {
                    averageRatingElement.textContent = currentVendor.averageRating 
                        ? `${currentVendor.averageRating.toFixed(1)} / 5.0` 
                        : 'No ratings yet';
                }
            } else {
                console.error("Vendor document not found when loading earnings");
                if (totalEarningsElement) totalEarningsElement.textContent = 'Error';
                if (completedOrdersElement) completedOrdersElement.textContent = 'Error';
                if (averageRatingElement) averageRatingElement.textContent = 'Error';
            }
        } catch (error) {
            console.error("Error loading earnings data:", error);
            if (totalEarningsElement) totalEarningsElement.textContent = 'Error';
            if (completedOrdersElement) completedOrdersElement.textContent = 'Error';
            if (averageRatingElement) averageRatingElement.textContent = 'Error';
        }
    } else {
        console.error("Cannot load earnings, vendor data not available");
        if (totalEarningsElement) totalEarningsElement.textContent = 'N/A';
        if (completedOrdersElement) completedOrdersElement.textContent = 'N/A';
        if (averageRatingElement) averageRatingElement.textContent = 'N/A';
    }
}

// Function to handle mock withdrawal request
function handleMockWithdrawal() {
    const amountInput = document.getElementById('withdrawalAmount');
    const messageElement = document.getElementById('withdrawalMessage');
    const totalEarningsElement = document.getElementById('totalEarnings');

    if (!amountInput || !messageElement || !totalEarningsElement) {
        console.error("Withdrawal UI elements not found");
        showToast("Error: Withdrawal elements missing.", "error");
        return;
    }

    const amount = parseFloat(amountInput.value);
    messageElement.textContent = ''; // Clear previous messages

    if (isNaN(amount) || amount <= 0) {
        messageElement.textContent = "Please enter a valid positive amount.";
        messageElement.className = 'text-sm text-warning-600 dark:text-warning-400 mt-2';
        return;
    }

    // Ensure currentVendor and earnings are loaded
    if (!currentVendor || typeof currentVendor.totalEarnings !== 'number') {
        messageElement.textContent = "Could not verify current balance. Please try again.";
        messageElement.className = 'text-sm text-error-600 dark:text-error-400 mt-2';
        return;
    }

    if (amount > currentVendor.totalEarnings) {
        messageElement.textContent = `Withdrawal amount exceeds available balance (KES ${currentVendor.totalEarnings.toFixed(2)}).`;
        messageElement.className = 'text-sm text-warning-600 dark:text-warning-400 mt-2';
        return;
    }

    // --- Mock Withdrawal Processing --- 
    console.log(`Mock withdrawal request for KES ${amount.toFixed(2)}`);

    // Simulate processing delay (optional)
    showToast("Processing withdrawal request...", "info");

    setTimeout(() => {
        // For a pure mock, just update the UI and local data
        currentVendor.totalEarnings -= amount;
        totalEarningsElement.textContent = `KES ${currentVendor.totalEarnings.toFixed(2)}`;
        amountInput.value = ''; // Clear input
        messageElement.textContent = `Mock withdrawal of KES ${amount.toFixed(2)} processed successfully.`;
        messageElement.className = 'text-sm text-accent-600 dark:text-accent-400 mt-2';
        showToast("Mock withdrawal processed!", "success");

        // Note: This change is only in the UI and local `currentVendor` object.
        // It does NOT persist in Firestore unless we add an updateDoc call here.

    }, 1000); // 1 second delay
}

// Load my orders (orders assigned to this vendor)
async function loadMyOrders() {
    console.log("Loading my orders...");
    if (!currentVendor || !currentVendor.id) {
        console.error("Cannot load my orders, vendor data not available");
        return;
    }
    
    const myOrdersList = document.getElementById('myOrdersList');
    if (!myOrdersList) {
        console.error("My orders list element not found");
        return;
    }
    
    // Clear previous orders
    myOrdersList.innerHTML = '<p class="text-neutral-500 dark:text-neutral-400 md:col-span-2 lg:col-span-3">Loading your orders...</p>';
    
    try {
        console.log(`Querying orders for vendor ID: ${currentVendor.id}`);
        
        // USE A SIMPLER QUERY WITHOUT ORDERING
        // This avoids the need for a composite index
        const ordersQuery = query(
            collection(db, 'orders'),
            where('assignedVendorId', '==', currentVendor.id)
            // Remove the orderBy to avoid requiring a composite index
        );
        
        console.log("Executing Firestore query for My Orders...");
        const querySnapshot = await getDocs(ordersQuery);
        console.log(`Query returned ${querySnapshot.size} orders for this vendor`);
        
        if (querySnapshot.empty) {
            myOrdersList.innerHTML = `
                <div class="md:col-span-2 lg:col-span-3 text-center py-8">
                    <p class="text-neutral-500 dark:text-neutral-400 mb-4">You have no assigned orders yet.</p>
                    <p class="text-sm text-neutral-500 dark:text-neutral-400">Check the Available Orders section to accept new orders.</p>
                </div>`;
            return;
        }
        
        // Clear loading message
        myOrdersList.innerHTML = '';
        
        // Sort orders manually by createdAt (newest first)
        const sortedOrders = querySnapshot.docs
            .map(doc => {
                const data = doc.data();
                return { ...data, id: doc.id };
            })
            .sort((a, b) => {
                // Sort by createdAt (newest first)
                if (!a.createdAt || !b.createdAt) return 0;
                return b.createdAt.seconds - a.createdAt.seconds;
            });
        
        console.log(`Displaying ${sortedOrders.length} sorted orders`);
        
        // Display each order
        sortedOrders.forEach((order) => {
            console.log(`Processing order ${order.id} with status ${order.status}`);
            
            // Create order card with additional status rendering for my orders
            const orderCard = document.createElement('div');
            orderCard.className = 'bg-white dark:bg-neutral-800 rounded-lg shadow overflow-hidden flex flex-col transition-shadow duration-200 hover:shadow-md mb-4';
            orderCard.dataset.orderId = order.id;
            
            // Get status classes based on order status
            const statusClass = getStatusColorClasses(order.status);
            const formattedStatus = formatStatus(order.status);
            
            // Check if order is in a status that supports starting delivery
            const canStartDelivery = order.status === 'assigned';
            
            // Check if order is in a status that supports completing delivery
            const canCompleteDelivery = order.status === 'in_progress' || order.status === 'in-progress';
            
            console.log(`Order ${order.id} action buttons:`, { 
                canStartDelivery, 
                canCompleteDelivery,
                status: order.status 
            });
            
            // Create HTML content with specific UI for "My Orders"
            orderCard.innerHTML = `
                <div class="p-4 flex-grow">
                    <h5 class="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-2">Order #${order.id.substring(0, 8)}</h5>
                    <div class="text-sm space-y-1 text-neutral-600 dark:text-neutral-400">
                        <p><strong>Quantity:</strong> <span>${order.quantityLiters || 'N/A'}</span>L</p>
                        <p><strong>Customer:</strong> <span>${order.userName || 'Anonymous'}</span></p>
                        <p><strong>Time:</strong> <span>${order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleString() : 'N/A'}</span></p>
                        <p><strong>Status:</strong> <span class="order-status ${statusClass} py-1 px-2 rounded-full text-xs">${formattedStatus}</span></p>
                    </div>
                </div>
                <div class="p-4 bg-neutral-50 dark:bg-neutral-700 border-t border-neutral-200 dark:border-neutral-600 flex space-x-2">
                    <button class="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none chat-with-customer" data-order-id="${order.id}">
                        Chat with Customer
                    </button>
                    ${canStartDelivery ? `
                        <button class="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-accent-600 rounded-md hover:bg-accent-700 focus:outline-none start-delivery" data-order-id="${order.id}">
                            Start Delivery
                        </button>
                    ` : ''}
                    ${canCompleteDelivery ? `
                        <button class="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-accent-600 rounded-md hover:bg-accent-700 focus:outline-none complete-delivery" data-order-id="${order.id}">
                            Complete Delivery
                        </button>
                    ` : ''}
                </div>
            `;
            
            // Add chat button event listener
            const chatButton = orderCard.querySelector('.chat-with-customer');
            if (chatButton) {
                chatButton.addEventListener('click', () => openChat(order.id));
            }
            
            // Add start delivery button event listener
            const startDeliveryButton = orderCard.querySelector('.start-delivery');
            if (startDeliveryButton) {
                startDeliveryButton.addEventListener('click', () => updateOrderStatus(order.id, 'in_progress'));
            }
            
            // Add complete delivery button event listener
            const completeDeliveryButton = orderCard.querySelector('.complete-delivery');
            if (completeDeliveryButton) {
                completeDeliveryButton.addEventListener('click', () => {
                    console.log(`[loadMyOrders] 'Complete Delivery' button clicked for order ${order.id}. Calling updateOrderStatus.`);
                    updateOrderStatus(order.id, 'completed');
                });
            }
            
            // Add to list
            myOrdersList.appendChild(orderCard);
        });
    } catch (error) {
        console.error("Error loading my orders:", error);
        console.error("Error details:", error.code, error.message);
        myOrdersList.innerHTML = `<p class="text-error-500 dark:text-error-400 md:col-span-2 lg:col-span-3">
            Error loading orders: ${error.message}. Please try again.
        </p>`;
    }
}

// Helper function for status colors
function getStatusColorClasses(status) {
    switch(status) {
        case 'pending':
            return 'bg-warning-500 text-white';
        case 'assigned':
            return 'bg-primary-500 text-white';
        case 'in_progress':
        case 'in-progress':
            return 'bg-accent-500 text-white';
        case 'completed':
            return 'bg-accent-700 text-white';
        case 'cancelled':
            return 'bg-error-500 text-white';
        default:
            return 'bg-neutral-500 text-white';
    }
}

// Format status for display
function formatStatus(status) {
    const statusMap = {
        'pending': 'Pending',
        'assigned': 'Assigned',
        'in_progress': 'In Progress',
        'in-progress': 'In Progress', // Handle both formats
        'completed': 'Completed',
        'cancelled': 'Cancelled',
        'available': 'Available',
        'busy': 'Busy',
        'unavailable': 'Unavailable'
    };
    
    return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1);
}

// Function to update order status
async function updateOrderStatus(orderId, newStatus) {
    console.log(`[updateOrderStatus] Entered function for order ${orderId}, newStatus: ${newStatus}`);

    if (!currentVendor || !currentVendor.id) {
        showToast("Cannot update order status: Vendor data not available.", "error");
        console.error("updateOrderStatus: currentVendor is not available.");
        return;
    }

    const orderRef = doc(db, 'orders', orderId);
    const vendorRef = doc(db, 'users', currentVendor.id);

    try {
        console.log(`Attempting to update order ${orderId} to status: ${newStatus} for vendor ${currentVendor.id}`);

        await runTransaction(db, async (transaction) => {
            const orderDoc = await transaction.get(orderRef);
            if (!orderDoc.exists()) {
                throw new Error("Order not found");
            }
            const orderData = orderDoc.data();

            // Check if the status is already what we're trying to update to
            if (orderData.status === newStatus) {
                // This part will run outside the transaction's retry loop if it's just an info message.
                // For simplicity in this refactor, we'll allow it here.
                // A more robust solution might handle this check before starting the transaction.
                console.log(`Order ${orderId} is already in ${newStatus} status.`);
                // Show toast outside transaction if possible, or collect messages to show after.
                // For now, this direct call might lead to multiple toasts if transaction retries.
                // However, given it's an early exit, it's less problematic.
                showToast(`Order is already ${formatStatus(newStatus)}`, 'info');
                return; // Exit the transaction function
            }

            const updateData = {
                status: newStatus
            };

            if (newStatus === 'in_progress') {
                updateData.startedDeliveryAt = serverTimestamp();
                transaction.update(orderRef, updateData);
                console.log(`Order ${orderId} status updated to in_progress.`);
            } else if (newStatus === 'completed') {
                updateData.completedAt = serverTimestamp();

                // --- All reads must happen before writes in a transaction ---
                // The orderData is already available from the initial transaction.get(orderRef)

                // 1. Read settings for pricePerLiter
                let pricePerLiter = 10; // Default price
                const settingsRef = doc(db, 'settings', 'main');
                const settingsDoc = await transaction.get(settingsRef); // READ 1 (settings)
                if (settingsDoc.exists() && settingsDoc.data().pricePerLiter) {
                    const parsedPrice = parseFloat(settingsDoc.data().pricePerLiter);
                    if (!isNaN(parsedPrice) && parsedPrice > 0) {
                        pricePerLiter = parsedPrice;
                    } else {
                        console.warn(`Invalid pricePerLiter in settings/main: ${settingsDoc.data().pricePerLiter}. Defaulting to 10.`);
                    }
                } else {
                    // This console.warn was in your log, so it's correctly placed
                    console.warn("settings/main document or pricePerLiter field not found. Defaulting to 10 KES/L.");
                }

                // 2. Read vendor document for current earnings
                const vendorDoc = await transaction.get(vendorRef); // READ 2 (vendor)
                if (!vendorDoc.exists()) {
                    throw new Error("Vendor document not found for earnings update.");
                }
                const vendorData = vendorDoc.data();

                // --- Perform Calculations ---
                const quantityLiters = parseFloat(orderData.quantityLiters);
                if (isNaN(quantityLiters) || quantityLiters <= 0) {
                    throw new Error("Invalid or missing quantityLiters for the order.");
                }
                const orderEarning = quantityLiters * pricePerLiter;
                const newTotalEarnings = (vendorData.totalEarnings || 0) + orderEarning;
                const newCompletedOrders = (vendorData.completedOrders || 0) + 1;

                // Log messages from your previous successful calculation
                console.log(`[updateOrderStatus] Calculated earning: ${orderEarning}, Quantity: ${quantityLiters}, Price: ${pricePerLiter}`);
                console.log(`[updateOrderStatus] Preparing vendor update. Current Vendor Earnings: ${vendorData.totalEarnings || 0}, Current Vendor Orders: ${vendorData.completedOrders || 0}`);
                console.log(`[updateOrderStatus] New Vendor Earnings: ${newTotalEarnings}, New Vendor Orders Count: ${newCompletedOrders}`);

                // --- All writes happen after all reads ---
                // 3. Update order status
                transaction.update(orderRef, updateData); // WRITE 1 (order)
                console.log(`Order ${orderId} status updated to completed in transaction.`);

                // 4. Update vendor's earnings and completed orders
                transaction.update(vendorRef, { // WRITE 2 (vendor)
                    totalEarnings: newTotalEarnings,
                    completedOrders: newCompletedOrders
                });
                console.log(`Vendor ${currentVendor.id} earnings updated in transaction. New total: ${newTotalEarnings}, New completed orders: ${newCompletedOrders}`);
            } else {
                 // For other statuses (e.g., 'in_progress'), just update the order
                transaction.update(orderRef, updateData);
            }
        });

        console.log(`Transaction successful: Order ${orderId} status updated to ${newStatus}`);
        showToast(`Order status updated to ${formatStatus(newStatus)}!`, 'success');

        if (newStatus === 'completed') {
             if (currentVendor) {
                // The transaction has updated Firestore. Call loadEarnings() to refresh
                // the local currentVendor object and the UI from the source of truth.
                loadEarnings();
             }
        }
        
        loadMyOrders(); // Refresh my orders list
        
        // If completed, also refresh earnings tab display if it's visible or when navigated to
        if (newStatus === 'completed') {
            // We can directly call loadEarnings if the section is active, 
            // or it will be called when the user navigates to it.
            // For simplicity, we'll let the navigation handler or manual refresh take care of it.
            // Or, if currentVendor was updated directly, the UI might reflect changes if bound.
            // Let's try to update the earnings display if it's already loaded and visible
            const earningsSection = document.getElementById('earnings-section');
            if (earningsSection && !earningsSection.classList.contains('hidden')) {
                loadEarnings(); // Refresh earnings if currently viewing
            }
        }

    } catch (error) {
        console.error(`Error updating order ${orderId} to ${newStatus}:`, error);
        showToast(`Failed to update order status: ${error.message}`, 'error');
    }
}

// Parse location string into lat/lng object
function parseLocation(location) {
    if (!location) return null;
    
    // If already an object with lat/lng
    if (typeof location === 'object' && location.latitude !== undefined && location.longitude !== undefined) {
        return location;
    }
    
    // If string format "-1.2841, 36.8155"
    if (typeof location === 'string') {
        const [lat, lng] = location.split(',').map(coord => parseFloat(coord.trim()));
        if (!isNaN(lat) && !isNaN(lng)) {
            return { latitude: lat, longitude: lng };
        }
    }
    
    return null;
}

// Load available orders
async function loadAvailableOrders() {
    console.log("--- Starting loadAvailableOrders ---");
    console.log("Checking for required elements:");
    console.log("  ordersList exists?", !!ordersList);
    console.log("  ordersSection exists?", !!document.getElementById('orders-section'));
    
    if (!ordersList || !document.getElementById('orders-section')) {
        console.error("Required elements for loading orders not found");
        return;
    }
    
    console.log("Required elements found.");
    
    // Clear previous orders
    ordersList.innerHTML = '<p class="text-neutral-500 dark:text-neutral-400 md:col-span-2 lg:col-span-3">Loading available orders...</p>';
    
    try {
        // Get vendor's current location and radius
        const vendorLocation = currentVendor?.location;
        const vendorRadius = parseInt(radiusInput.value) || 5; // Default 5km if not set
        
        console.log("Vendor location:", vendorLocation);
        console.log("Vendor radius:", vendorRadius);
        
        if (!vendorLocation || !vendorLocation.latitude || !vendorLocation.longitude) {
            ordersList.innerHTML = '<p class="text-warning-500 dark:text-warning-400 md:col-span-2 lg:col-span-3">Please update your location to see available orders.</p>';
            return;
        }
        
        // Query available orders (pending status)
        const ordersQuery = query(
            collection(db, 'orders'),
            where('status', '==', 'pending'),
            // Temporarily comment out the orderBy clause to see if that's the issue
            // orderBy('createdAt', 'desc'),
            limit(20) // Limit to 20 orders for performance
        );
        
        console.log("Executing Firestore query...");
        const querySnapshot = await getDocs(ordersQuery);
        console.log(`Query returned ${querySnapshot.size} orders`);
        
        if (querySnapshot.empty) {
            ordersList.innerHTML = '<p class="text-neutral-500 dark:text-neutral-400 md:col-span-2 lg:col-span-3">No available orders at the moment.</p>';
            return;
        }
        
        // Clear loading message
        ordersList.innerHTML = '';
        
        // Process and display orders
        let count = 0;
        querySnapshot.forEach((doc) => {
            const order = doc.data();
            order.id = doc.id;
            
            // Log the order fields to see what's available
            console.log("Order fields:", Object.keys(order));
            console.log("Order createdAt:", order.createdAt);
            
            // Calculate distance from vendor to order location if available
            let distanceText = 'Distance unknown';
            const orderLocation = parseLocation(order.location);
            
            if (orderLocation) {
                const distance = calculateDistance(
                    vendorLocation.latitude, 
                    vendorLocation.longitude, 
                    orderLocation.latitude, 
                    orderLocation.longitude
                );
                
                // Only show distance if within vendor's radius
                if (distance <= vendorRadius) {
                    distanceText = `${distance.toFixed(1)} km away`;
                } else {
                    distanceText = `${distance.toFixed(1)} km away (outside your radius)`;
                }
            }
            
            // Display the order regardless of location
            count++;
            displayOrderCard(order, order.id, distanceText);
        });
        
        if (count === 0) {
            ordersList.innerHTML = '<p class="text-neutral-500 dark:text-neutral-400 md:col-span-2 lg:col-span-3">No available orders at the moment.</p>';
        } else {
            console.log(`Displayed ${count} orders`);
        }
    } catch (error) {
        console.error("Error loading available orders:", error);
        ordersList.innerHTML = '<p class="text-error-500 dark:text-error-400 md:col-span-2 lg:col-span-3">Error loading orders. Please try again.</p>';
    }
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return distance;
}

function deg2rad(deg) {
    return deg * (Math.PI/180);
}

// Create an order card element
function createOrderCard(order) {
    const orderCard = document.createElement('div');
    orderCard.className = 'bg-white dark:bg-neutral-800 rounded-lg shadow overflow-hidden flex flex-col transition-shadow duration-200 hover:shadow-md';
    orderCard.dataset.orderId = order.id;
    
    // Format order details
    const orderId = order.id.substring(0, 8);
    const quantity = order.quantityLiters || 'N/A';
    
    // Parse location string if needed
    let locationText = 'N/A';
    if (order.location) {
        if (typeof order.location === 'string') {
            locationText = order.location;
        } else if (order.location.latitude !== undefined && order.location.longitude !== undefined) {
            locationText = `${order.location.latitude.toFixed(4)}, ${order.location.longitude.toFixed(4)}`;
        }
    }
    
    const time = order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleString() : 'N/A';
    const status = formatStatus(order.status || 'pending');
    
    // Create HTML content
    orderCard.innerHTML = `
        <div class="p-4 flex-grow">
            <h5 class="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-2">Order #${orderId}</h5>
            <div class="text-sm space-y-1 text-neutral-600 dark:text-neutral-400">
                <p><strong>Quantity:</strong> <span>${quantity}</span>L</p>
                <p><strong>Location:</strong> <span>${locationText}</span></p>
                <p><strong>Time:</strong> <span>${time}</span></p>
                <p><strong>Status:</strong> <span class="order-status font-semibold">${status}</span></p>
            </div>
        </div>
        <div class="p-4 bg-neutral-50 dark:bg-neutral-700 border-t border-neutral-200 dark:border-neutral-600">
            <button class="w-full px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 accept-order">Accept Order</button>
        </div>
    `;
    
    // Add event listener for accept button
    const acceptButton = orderCard.querySelector('.accept-order');
    if (acceptButton) {
        acceptButton.addEventListener('click', () => acceptOrder(order.id));
    }
    
    return orderCard;
}

// Display an order card in the available orders list
function displayOrderCard(order, orderId, distanceText) {
    console.log(`Displaying order card for order ${orderId}`);
    
    if (!orderTemplate || !ordersList) {
        console.error("Order template or orders list not found");
        return;
    }
    
    // Skip orders that are already assigned to this vendor (they should be in "My Orders")
    if (order.assignedVendorId && order.assignedVendorId === currentVendor.id) {
        console.log(`Order ${orderId} is already assigned to this vendor, skipping from available orders list`);
        return;
    }
    
    // Skip orders that are not in pending status
    if (order.status !== 'pending') {
        console.log(`Order ${orderId} is not in pending status (${order.status}), skipping from available orders list`);
        return;
    }
    
    // Clone the template
    const orderCard = document.importNode(orderTemplate.content, true).firstElementChild;
    orderCard.dataset.orderId = orderId;
    
    // Fill in the order details
    const orderIdSpan = orderCard.querySelector('.orderId');
    const quantitySpan = orderCard.querySelector('.quantity');
    const locationSpan = orderCard.querySelector('.location');
    const distanceSpan = orderCard.querySelector('.distance');
    const timeSpan = orderCard.querySelector('.time');
    const statusSpan = orderCard.querySelector('.order-status');
    
    // Parse location string if needed
    let locationText = 'N/A';
    if (order.location) {
        if (typeof order.location === 'string') {
            locationText = order.location;
        } else if (order.location.latitude !== undefined && order.location.longitude !== undefined) {
            locationText = `${order.location.latitude.toFixed(4)}, ${order.location.longitude.toFixed(4)}`;
        }
    }
    
    console.log("Order details:", {
        orderId: orderId.substring(0, 8),
        quantity: order.quantityLiters || 'N/A',
        location: locationText,
        distance: distanceText || 'N/A',
        time: order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleString() : 'N/A',
        status: formatStatus(order.status || 'pending')
    });
    
    if (orderIdSpan) orderIdSpan.textContent = orderId.substring(0, 8);
    if (quantitySpan) quantitySpan.textContent = order.quantityLiters || 'N/A';
    if (locationSpan) locationSpan.textContent = locationText;
    if (distanceSpan) distanceSpan.textContent = distanceText || 'N/A';
    if (timeSpan) timeSpan.textContent = order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleString() : 'N/A';
    if (statusSpan) statusSpan.textContent = formatStatus(order.status || 'pending');
    
    // Add event listener for accept button
    const acceptButton = orderCard.querySelector('.accept-order');
    if (acceptButton) {
        acceptButton.addEventListener('click', () => acceptOrder(orderId));
    } else {
        console.warn(`[displayOrderCard] Could not find .accept-order button for order ${orderId}`);
    }
    
    // Add debug button for testing - only when debug mode is enabled
    const actionDiv = orderCard.querySelector('.p-4.bg-neutral-50');
    if (actionDiv) {
        const debugButton = document.createElement('button');
        debugButton.className = 'w-full mt-2 px-4 py-2 text-sm font-medium text-white bg-warning-600 rounded-md hover:bg-warning-700 focus:outline-none debug-order';
        debugButton.textContent = 'Debug Accept';
        debugButton.addEventListener('click', () => debugAcceptOrder(orderId));
        debugButton.style.display = debugMode ? 'block' : 'none'; // Initially set based on debug mode
        actionDiv.appendChild(debugButton);
    }
    
    // Add chat button to the order card
    addChatButtonToOrder(orderCard, orderId);
    
    ordersList.appendChild(orderCard);
    console.log(`Order card for ${orderId} added to the list`);
}

// Debug function for testing order acceptance with different methods
async function debugAcceptOrder(orderId) {
    if (!currentVendor || !currentVendor.id) {
        showToast('Cannot debug order: Vendor data not available', 'error');
        return;
    }
    
    // First find and remove the order card from the available orders list
    const orderCard = document.querySelector(`[data-order-id="${orderId}"]`);
    if (orderCard) {
        // Show accepting status on the card
        const acceptButton = orderCard.querySelector('.accept-order');
        if (acceptButton) {
            acceptButton.textContent = 'Accepting...';
            acceptButton.disabled = true;
            acceptButton.classList.add('bg-neutral-400');
            acceptButton.classList.remove('bg-primary-600', 'hover:bg-primary-700');
        }
        
        const debugButton = orderCard.querySelector('.debug-order');
        if (debugButton) {
            debugButton.textContent = 'Processing...';
            debugButton.disabled = true;
            debugButton.classList.add('bg-neutral-400');
            debugButton.classList.remove('bg-warning-600', 'hover:bg-warning-700');
        }
    }
    
    try {
        console.log(`DEBUG: Testing order acceptance for ${orderId} by vendor ${currentVendor.id}`);
        
        // Get the order data
        const orderRef = doc(db, 'orders', orderId);
        const orderDoc = await getDoc(orderRef);
        
        if (!orderDoc.exists()) {
            showToast(`Order ${orderId} not found`, 'error');
            return;
        }
        
        const orderData = orderDoc.data();
        console.log(`DEBUG: Current order data:`, JSON.stringify(orderData, null, 2));
        
        // Create the minimal update data
        const updateData = {
            status: 'assigned',
            assignedVendorId: currentVendor.id
        };
        
        console.log(`DEBUG: Attempting multiple update methods for order ${orderId}`);
        
        let updateSuccessful = false;
        try {
            // Method 1: setDoc with merge option
            console.log("DEBUG: Method 1 - setDoc with merge");
            await setDoc(orderRef, updateData, { merge: true });
            console.log("DEBUG: Method 1 successful!");
            showToast('Method 1 (setDoc with merge) successful!', 'success');
            updateSuccessful = true;
        } catch (error1) {
            console.error("DEBUG: Method 1 failed:", error1);
            
            try {
                // Method 2: updateDoc with minimal fields
                console.log("DEBUG: Method 2 - updateDoc with minimal fields");
                await updateDoc(orderRef, updateData);
                console.log("DEBUG: Method 2 successful!");
                showToast('Method 2 (updateDoc minimal) successful!', 'success');
                updateSuccessful = true;
            } catch (error2) {
                console.error("DEBUG: Method 2 failed:", error2);
                
                try {
                    // Method 3: Update with just status field
                    console.log("DEBUG: Method 3 - update status only");
                    await updateDoc(orderRef, { status: 'assigned' });
                    console.log("DEBUG: Method 3 successful!");
                    showToast('Method 3 (status only) successful!', 'success');
                    updateSuccessful = true;
                } catch (error3) {
                    console.error("DEBUG: Method 3 failed:", error3);
                    throw new Error("All update methods failed");
                }
            }
        }
        
        if (updateSuccessful) {
            // Remove the order card with animation
            if (orderCard) {
                orderCard.classList.add('animate-fadeOut');
                setTimeout(() => {
                    orderCard.remove();
                    
                    // Check if ordersList is now empty and show message if it is
                    if (ordersList && ordersList.children.length === 0) {
                        ordersList.innerHTML = '<p class="text-neutral-500 dark:text-neutral-400 md:col-span-2 lg:col-span-3">No available orders at the moment.</p>';
                    }
                }, 500); // Wait for fade animation
            }
            
            // Refresh My Orders
            loadMyOrders();
        }
        
    } catch (error) {
        console.error("DEBUG ERROR:", error);
        showToast(`Debug failed: ${error.message}`, 'error');
        
        // Reset buttons if error
        if (orderCard) {
            const acceptButton = orderCard.querySelector('.accept-order');
            if (acceptButton) {
                acceptButton.textContent = 'Accept Order';
                acceptButton.disabled = false;
                acceptButton.classList.remove('bg-neutral-400');
                acceptButton.classList.add('bg-primary-600', 'hover:bg-primary-700');
            }
            
            const debugButton = orderCard.querySelector('.debug-order');
            if (debugButton) {
                debugButton.textContent = 'Debug Accept';
                debugButton.disabled = false;
                debugButton.classList.remove('bg-neutral-400');
                debugButton.classList.add('bg-warning-600', 'hover:bg-warning-700');
            }
        }
    }
}

// Accept an order
async function acceptOrder(orderId) {
    if (!currentVendor || !currentVendor.id) {
        showToast('Cannot accept order: Vendor data not available', 'error');
        return;
    }
    
    try {
        console.log(`Attempting to accept order ${orderId} by vendor ${currentVendor.id}`);
        console.log(`Vendor data:`, JSON.stringify(currentVendor, null, 2));
        
        // First find and mark the order card in the available orders list
        const orderCard = document.querySelector(`[data-order-id="${orderId}"]`);
        if (orderCard) {
            // Show accepting status on the card
            const acceptButton = orderCard.querySelector('.accept-order');
            if (acceptButton) {
                acceptButton.textContent = 'Accepting...';
                acceptButton.disabled = true;
                acceptButton.classList.add('bg-neutral-400');
                acceptButton.classList.remove('bg-primary-600', 'hover:bg-primary-700');
            }
        }
        
        // Get the order first to verify it exists and is in pending status
        const orderRef = doc(db, 'orders', orderId);
        const orderDoc = await getDoc(orderRef);
        
        if (!orderDoc.exists()) {
            throw new Error(`Order ${orderId} not found`);
        }
        
        const orderData = orderDoc.data();
        console.log(`Order data for ${orderId}:`, JSON.stringify(orderData, null, 2));
        
        if (orderData.status !== 'pending') {
            showToast(`This order is already ${orderData.status} and cannot be accepted`, 'error');
            
            // Reset button if order is already accepted
            if (orderCard) {
                const acceptButton = orderCard.querySelector('.accept-order');
                if (acceptButton) {
                    acceptButton.textContent = 'Already Accepted';
                    acceptButton.disabled = true;
                    acceptButton.classList.add('bg-neutral-400');
                    acceptButton.classList.remove('bg-primary-600', 'hover:bg-primary-700');
                }
            }
            
            // Refresh available orders to update UI
            loadAvailableOrders();
            return;
        }
        
        console.log(`Updating order ${orderId} to assigned status`);
        
        // Create a merged object with ONLY the minimal fields that are changing
        const updateData = {
            status: 'assigned',
            assignedVendorId: currentVendor.id,
            assignedVendorName: currentVendor.name || 'Unknown Vendor',
            assignedAt: serverTimestamp()
        };
        
        console.log("Update data:", JSON.stringify(updateData, null, 2));
        
        // Try using setDoc with merge option instead of updateDoc
        // This sometimes works better with Firestore security rules
        await setDoc(orderRef, updateData, { merge: true });
        
        console.log(`Order ${orderId} successfully assigned to vendor ${currentVendor.id}`);
        
        // Now remove the order card from available list if it exists
        if (orderCard) {
            orderCard.classList.add('animate-fadeOut');
            setTimeout(() => {
                orderCard.remove();
                
                // Check if ordersList is now empty and show message if it is
                if (ordersList && ordersList.children.length === 0) {
                    ordersList.innerHTML = '<p class="text-neutral-500 dark:text-neutral-400 md:col-span-2 lg:col-span-3">No available orders at the moment.</p>';
                }
            }, 500); // Wait for fade animation
        }
        
        showToast('Order accepted successfully!', 'success');
        
        // Load my orders to show the newly accepted order
        loadMyOrders();
        
        // Also switch to the My Orders tab
        const myOrdersLink = document.querySelector('a[data-target="my-orders-section"]');
        if (myOrdersLink) {
            myOrdersLink.click();
        }
    } catch (error) {
        console.error("Error accepting order:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        
        // More detailed error message
        let errorMessage = 'Failed to accept order. ';
        
        if (error.code === 'permission-denied') {
            errorMessage += 'Permission denied. This may be due to Firestore security rules.';
            console.error("This is likely a Firestore rules issue. Check that vendors can update orders from pending to assigned status.");
        } else {
            errorMessage += error.message || 'Please try again.';
        }
        
        showToast(errorMessage, 'error');
        
        // If there was an order card being updated, reset its state
        const orderCard = document.querySelector(`[data-order-id="${orderId}"]`);
        if (orderCard) {
            const acceptButton = orderCard.querySelector('.accept-order');
            if (acceptButton) {
                acceptButton.textContent = 'Accept Order';
                acceptButton.disabled = false;
                acceptButton.classList.remove('bg-neutral-400');
                acceptButton.classList.add('bg-primary-600', 'hover:bg-primary-700');
            }
        }
        
        // Refresh both order lists to ensure consistent state
        loadAvailableOrders();
    }
}

// Toggle chat window
if (chatButton) {
    chatButton.addEventListener('click', () => {
        if (currentChatOrderId) {
            chatWindow.classList.toggle('hidden');
        } else {
            showToast('Please select an order to chat about', 'info');
        }
    });
}

// Close chat window
if (closeChatWindow) {
    closeChatWindow.addEventListener('click', () => {
        chatWindow.classList.add('hidden');
        if (chatUnsubscribe) {
            chatUnsubscribe();
            chatUnsubscribe = null;
        }
        currentChatOrderId = null;
    });
}

// Open chat for a specific order
async function openChat(orderId) {
    console.log(`Opening chat for order ${orderId}`);
    currentChatOrderId = orderId;
    
    if (chatWindow) {
        chatWindow.classList.remove('hidden');
    }
    
    // Clear previous messages
    if (chatMessages) {
        chatMessages.innerHTML = '<p class="text-center text-neutral-500 dark:text-neutral-400 py-2">Loading messages...</p>';
    }
    
    // Subscribe to messages
    if (chatUnsubscribe) {
        chatUnsubscribe();
    }
    
    try {
        // First verify the order exists and get its status
        const orderRef = doc(db, 'orders', orderId);
        const orderDoc = await getDoc(orderRef);
        
        if (!orderDoc.exists()) {
            throw new Error('Order not found');
        }
        
        const orderData = orderDoc.data();
        
        // Set up messages listener
        chatUnsubscribe = onSnapshot(
            query(
                collection(db, 'messages'),
                where('orderId', '==', orderId),
                orderBy('timestamp', 'asc')
            ),
            (snapshot) => {
                // Clear loading message if present
                if (chatMessages.firstChild && chatMessages.firstChild.textContent === 'Loading messages...') {
                    chatMessages.innerHTML = '';
                }
                
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        const message = change.doc.data();
                        appendMessage(message);
                    }
                });
                // Scroll to bottom
                if (chatMessages) {
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }
                
                // If no messages, show a helpful message
                if (snapshot.empty && chatMessages) {
                    chatMessages.innerHTML = '<p class="text-center text-neutral-500 dark:text-neutral-400 py-2">No messages yet. Start the conversation!</p>';
                }
            },
            (error) => {
                console.error("Error listening to messages:", error);
                if (chatMessages) {
                    if (error.code === 'permission-denied') {
                        chatMessages.innerHTML = '<p class="text-center text-error-500 dark:text-error-400 py-2">You don\'t have permission to view these messages.</p>';
                    } else {
                        chatMessages.innerHTML = '<p class="text-center text-error-500 dark:text-error-400 py-2">Error loading messages. Please try again.</p>';
                    }
                }
                showToast('Error loading messages', 'error');
            }
        );
    } catch (error) {
        console.error("Error setting up chat:", error);
        if (chatMessages) {
            chatMessages.innerHTML = '<p class="text-center text-error-500 dark:text-error-400 py-2">Error setting up chat. Please try again.</p>';
        }
        showToast('Error setting up chat', 'error');
    }
}

// Append a message to the chat
function appendMessage(message) {
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    const isCurrentUser = message.senderId === currentVendor.id;
    
    const senderName = message.senderName || 'User';
    const senderAvatar = message.senderAvatar || 'img/default-avatar.png'; 
    const messageTimestamp = message.timestamp ? formatTimestamp(message.timestamp) : 'sending...';
    const messageContent = message.text || message.content || '';

    messageDiv.className = `mb-2 p-2 rounded-lg shadow-sm flex items-start ${isCurrentUser ? 'ml-auto bg-primary-500 text-white' : 'mr-auto bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100'}`;
    
    if (isCurrentUser) {
        messageDiv.innerHTML = `
            <div class="flex-grow order-1">
                <p class="text-sm break-words">${messageContent}</p>
                <div class="text-xs opacity-75 mt-1 text-right">${messageTimestamp}</div>
            </div>
            <div class="w-8 h-8 rounded-full overflow-hidden ml-2 order-2 flex-shrink-0">
                <img src="${senderAvatar}" alt="${senderName}" class="w-full h-full object-cover">
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="w-8 h-8 rounded-full overflow-hidden mr-2 flex-shrink-0">
                <img src="${senderAvatar}" alt="${senderName}" class="w-full h-full object-cover">
            </div>
            <div class="flex-grow">
                <div class="text-xs font-semibold mb-0.5">${senderName}</div>
                <p class="text-sm break-words">${messageContent}</p>
                <div class="text-xs opacity-75 mt-1 text-left">${messageTimestamp}</div>
            </div>
        `;
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight; 
}

// Format timestamp
function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        const date = timestamp.toDate();
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } 
    else if (typeof timestamp === 'string') {
        return timestamp; 
    }
    else if (typeof timestamp === 'number') {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return 'Invalid date';
}

// Handle message submission
if (chatForm) {
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentChatOrderId || !messageInput.value.trim() || !currentVendor || !currentVendor.id) {
            showToast('Cannot send message. Ensure you are logged in and have selected an order.', 'warning');
            return;
        }
        const messageText = messageInput.value.trim();
        messageInput.value = '';
        try {
            const orderRef = doc(db, 'orders', currentChatOrderId);
            const orderDoc = await getDoc(orderRef);
            if (!orderDoc.exists()) {
                throw new Error('Order not found, cannot send message.');
            }
            await addDoc(collection(db, 'messages'), {
                orderId: currentChatOrderId,
                senderId: currentVendor.id,
                senderName: currentVendor.name || 'Vendor',
                senderAvatar: currentVendor.avatarUrl || 'img/default-avatar.png', // Assuming vendor has an avatarUrl
                text: messageText,
                timestamp: serverTimestamp()
            });
        } catch (error) {
            console.error('Error sending message:', error);
            messageInput.value = messageText; 
            showToast(`Failed to send message: ${error.message}`, 'error');
        }
    });
}

// Add chat button to order template (this function seems to be missing from the provided snippet, ensure it exists or add it)
function addChatButtonToOrder(orderCard, orderId) {
    const actionButtonsDiv = orderCard.querySelector('.p-4.bg-neutral-50'); // Target the correct div for buttons
    if (actionButtonsDiv) {
        // Check if accept order button exists, to place chat button relative to it
        const acceptOrderButton = actionButtonsDiv.querySelector('.accept-order');

        const chatButtonElement = document.createElement('button');
        chatButtonElement.className = 'w-full px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-200 rounded-md hover:bg-neutral-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 mt-2 open-chat';
        chatButtonElement.textContent = 'Chat with Customer';
        chatButtonElement.dataset.orderId = orderId;
        
        chatButtonElement.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card click if any
            openChat(orderId);
        });

        if (acceptOrderButton && acceptOrderButton.nextSibling) {
            actionButtonsDiv.insertBefore(chatButtonElement, acceptOrderButton.nextSibling);
        } else {
            actionButtonsDiv.appendChild(chatButtonElement);
        }
    } else {
        console.warn(`Could not find action button div for order ${orderId} to add chat button`);
    }
}

// Handle availability toggle
if (availabilityToggle) {
    availabilityToggle.addEventListener('change', async () => {
        if (!currentVendor || !currentVendor.id) {
            showToast('Cannot update availability: Vendor data not available', 'error');
            availabilityToggle.checked = !availabilityToggle.checked; // Revert toggle
            return;
        }
        const newStatus = availabilityToggle.checked ? 'available' : 'busy';
        try {
            const vendorRef = doc(db, 'users', currentVendor.id);
            await updateDoc(vendorRef, { status: newStatus });
            currentVendor.status = newStatus;
            if (availabilityStatusText) {
                availabilityStatusText.textContent = formatStatus(newStatus);
            }
            showToast(`Status updated to ${formatStatus(newStatus)}`, 'success');
        } catch (error) {
            console.error("Error updating availability:", error);
            showToast('Failed to update availability. Please try again.', 'error');
            availabilityToggle.checked = !availabilityToggle.checked; // Revert toggle
        }
    });
}

// Handle radius input change
if (radiusInput) {
    radiusInput.addEventListener('change', async () => {
        if (!currentVendor || !currentVendor.id) {
            showToast('Cannot update radius: Vendor data not available', 'error');
            return;
        }
        const newRadius = parseInt(radiusInput.value);
        if (isNaN(newRadius) || newRadius < 1 || newRadius > 100) {
            showToast('Please enter a valid radius between 1 and 100 km', 'error');
            radiusInput.value = currentVendor.radius || 5;
            return;
        }
        try {
            const vendorRef = doc(db, 'users', currentVendor.id);
            await updateDoc(vendorRef, { radius: newRadius });
            currentVendor.radius = newRadius;
            if (profileRadiusElement) {
                profileRadiusElement.textContent = newRadius;
            }
            showToast(`Delivery radius updated to ${newRadius} km`, 'success');
            loadAvailableOrders();
        } catch (error) {
            console.error("Error updating radius:", error);
            showToast('Failed to update radius. Please try again.', 'error');
            radiusInput.value = currentVendor.radius || 5;
        }
    });
}

// Handle location update
if (updateLocationBtn) {
    updateLocationBtn.addEventListener('click', () => {
        if (!currentVendor || !currentVendor.id) {
            showToast('Cannot update location: Vendor data not available', 'error');
            return;
        }
        if (locationErrorElement) locationErrorElement.textContent = '';
        if (locationSuccessElement) locationSuccessElement.textContent = '';
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const location = {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            timestamp: serverTimestamp() // Use serverTimestamp for consistency
                        };
                        const vendorRef = doc(db, 'users', currentVendor.id);
                        await updateDoc(vendorRef, { location: location });
                        currentVendor.location = {latitude: location.latitude, longitude: location.longitude}; // Update local, no serverTimestamp needed here
                        if (profileLocationElement) {
                            profileLocationElement.textContent = 
                                `Lat: ${location.latitude.toFixed(5)}, Lng: ${location.longitude.toFixed(5)}`;
                        }
                        if (locationSuccessElement) {
                            locationSuccessElement.textContent = 'Location updated successfully!';
                        }
                        showToast('Location updated!', 'success');
                        loadAvailableOrders(); 
                    } catch (error) {
                        console.error("Error updating location in Firestore:", error);
                        if (locationErrorElement) {
                            locationErrorElement.textContent = 'Failed to update location in database.';
                        }
                         showToast('Failed to save location.', 'error');
                    }
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    let msg = 'An unknown error occurred with geolocation.';
                    switch (error.code) {
                        case error.PERMISSION_DENIED: msg = 'Location access denied. Please enable location services.'; break;
                        case error.POSITION_UNAVAILABLE: msg = 'Location information unavailable.'; break;
                        case error.TIMEOUT: msg = 'Location request timed out.'; break;
                    }
                    if (locationErrorElement) locationErrorElement.textContent = msg;
                    showToast(msg, 'error');
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            const msg = 'Geolocation is not supported by your browser.';
            if (locationErrorElement) locationErrorElement.textContent = msg;
            showToast(msg, 'error');
        }
    });
}

// Handle logout
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = 'index.html'; 
        } catch (error) {
            console.error("Error signing out:", error);
            showToast('Failed to sign out. Please try again.', 'error');
        }
    });
}

// Refresh orders
if (refreshOrdersBtn) {
    refreshOrdersBtn.addEventListener('click', () => {
        if (currentVendor && currentVendor.location) {
            loadAvailableOrders();
            showToast("Available orders refreshed.", "info");
        } else {
            showToast("Please set your location to refresh available orders.", "warning");
        }
    });
}

// Basic Toast Notification Function (replace with your ui-utils.js if you have a styled one)
function showToast(message, type = 'info') {
    console.log(`Toast (${type}): ${message}`);
    // You can expand this to create actual toast elements in the DOM
    const toastId = 'toast-notification';
    let toastElement = document.getElementById(toastId);
    if (!toastElement) {
        toastElement = document.createElement('div');
        toastElement.id = toastId;
        // Basic styling - make it more prominent
        toastElement.style.position = 'fixed';
        toastElement.style.bottom = '20px';
        toastElement.style.left = '50%';
        toastElement.style.transform = 'translateX(-50%)';
        toastElement.style.padding = '10px 20px';
        toastElement.style.borderRadius = '5px';
        toastElement.style.zIndex = '1000';
        toastElement.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        toastElement.style.transition = 'opacity 0.5s ease';
        toastElement.style.opacity = '0';
        document.body.appendChild(toastElement);
    }

    toastElement.textContent = message;
    if (type === 'success') {
        toastElement.style.backgroundColor = '#4CAF50'; // Green
        toastElement.style.color = 'white';
    } else if (type === 'error') {
        toastElement.style.backgroundColor = '#f44336'; // Red
        toastElement.style.color = 'white';
    } else if (type === 'warning') {
        toastElement.style.backgroundColor = '#ff9800'; // Orange
        toastElement.style.color = 'black';
    } else { // info or default
        toastElement.style.backgroundColor = '#2196F3'; // Blue
        toastElement.style.color = 'white';
    }

    toastElement.style.opacity = '1';

    setTimeout(() => {
        toastElement.style.opacity = '0';
    }, 3000);
}

// Listen for auth state changes
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("Vendor dashboard: Auth state changed. User found:", user.uid);
        try {
            const vendorRef = doc(db, 'users', user.uid);
            const vendorDoc = await getDoc(vendorRef);
            if (vendorDoc.exists()) {
                const vendorData = vendorDoc.data();
                if (vendorData.role === 'vendor') {
                    currentVendor = {
                        id: user.uid,
                        name: vendorData.name || user.email,
                        email: vendorData.email || user.email,
                        phone: vendorData.phone || '',
                        status: vendorData.status || 'unavailable',
                        radius: vendorData.radius || 5,
                        location: vendorData.location || null,
                        totalEarnings: vendorData.totalEarnings || 0,
                        completedOrders: vendorData.completedOrders || 0,
                        averageRating: vendorData.averageRating || 0,
                        avatarUrl: vendorData.avatarUrl || 'img/default-avatar.png' 
                    };
                    if (vendorNameElement) vendorNameElement.textContent = currentVendor.name;
                    if (availabilityToggle) availabilityToggle.checked = currentVendor.status === 'available';
                    if (availabilityStatusText) availabilityStatusText.textContent = formatStatus(currentVendor.status);
                    if (radiusInput) radiusInput.value = currentVendor.radius || 5;
                    
                    console.log("Current vendor initialized:", JSON.stringify(currentVendor, null, 2));

                    // Initial data loading now that currentVendor is set
                    // Determine active section and load its data, or default to available orders
                    const activeNavLink = document.querySelector('aside nav a.active');
                    let activeSectionId = 'orders-section'; // Default
                    if (activeNavLink) {
                        activeSectionId = activeNavLink.getAttribute('data-target');
                    }

                    if (activeSectionId === 'orders-section') {
                        if (currentVendor.location) {
                            loadAvailableOrders();
                        } else {
                            showToast("Please update your location to see available orders.", "warning");
                            ordersList.innerHTML = '<p class="text-warning-500 dark:text-warning-400 md:col-span-2 lg:col-span-3">Please update your location to see available orders.</p>';
                        }
                    } else if (activeSectionId === 'my-orders-section') {
                        loadMyOrders();
                    } else if (activeSectionId === 'profile-section') {
                        loadProfile();
                    } else if (activeSectionId === 'earnings-section') {
                        loadEarnings();
                    }

                    // Ensure debug elements are updated if debug mode was somehow set before this
                    updateDebugElementsVisibility(); 

                } else {
                    showToast('Access denied. You are not registered as a vendor.', 'error');
                    console.error(`User ${user.uid} is not a vendor. Role: ${vendorData.role}. Redirecting.`);
                    window.location.href = 'index.html';
                }
            } else {
                showToast('Vendor profile not found. Please contact support.', 'error');
                console.error(`User ${user.uid} document not found in 'users'. Redirecting.`);
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error("Error fetching user document for vendor check:", error);
            showToast('Error checking vendor status. Redirecting to login.', 'error');
            window.location.href = 'index.html';
        }
    } else {
        console.log("Vendor dashboard: Auth state changed. No user found. Redirecting to index.html.");
        currentVendor = null; // Clear current vendor data
        window.location.href = 'index.html';
    }
});

// --- Debugging Functions ---
function updateDebugButtonText(button) {
    if (!button) return;
    button.textContent = debugMode ? 'Disable Debug Mode' : 'Enable Debug Mode';
}

function updateDebugElementsVisibility() {
    document.querySelectorAll('.debug-order').forEach(btn => {
        btn.style.display = debugMode ? 'block' : 'none';
    });
    const debugVendorBtn = document.getElementById('debugVendorBtn');
    if (debugVendorBtn) {
        debugVendorBtn.style.display = debugMode ? 'block' : 'none';
    }
}

function debugVendorInfo() {
    console.log("=== VENDOR DEBUG INFO ===");
    if (!currentVendor) {
        showToast("No vendor data available for debug. User might not be logged in or initialized.", "warning");
        console.warn("currentVendor is null or undefined.");
        return;
    }
    console.log("Current Vendor Data (local state):", JSON.stringify(currentVendor, null, 2));
    const vendorRef = doc(db, 'users', currentVendor.id);
    getDoc(vendorRef)
        .then(vendorDoc => {
            if (vendorDoc.exists()) {
                console.log("Fresh vendor data from Firestore:", JSON.stringify(vendorDoc.data(), null, 2));
                showToast("Vendor data printed to console. Check for discrepancies.", "info");
                if (vendorDoc.data().role !== 'vendor') {
                    console.error("CRITICAL: User role in Firestore is NOT 'vendor'!");
                    showToast("ERROR: User role in DB is not vendor!", "error");
                }
            } else {
                console.error("CRITICAL: Vendor document NOT FOUND in Firestore for current user!");
                showToast("ERROR: Vendor document not found in DB!", "error");
            }
        })
        .catch(error => {
            console.error("Error fetching fresh vendor data for debug:", error);
            showToast("Error fetching vendor data for debug.", "error");
        });
}
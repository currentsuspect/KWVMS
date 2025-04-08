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
    addDoc 
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
async function loadEarnings() {
    console.log("Loading earnings data...");
    if (currentVendor && currentVendor.id) {
        try {
            // Fetch the latest vendor data to get earnings info
            const vendorRef = doc(db, 'users', currentVendor.id);
            const vendorDoc = await getDoc(vendorRef);

            if (vendorDoc.exists()) {
                const vendorData = vendorDoc.data();
                
                // Update earnings summary
                const totalEarningsElement = document.getElementById('totalEarnings');
                const completedOrdersElement = document.getElementById('completedOrders');
                const averageRatingElement = document.getElementById('averageRating');
                
                if (totalEarningsElement) {
                    totalEarningsElement.textContent = vendorData.totalEarnings 
                        ? `KES ${vendorData.totalEarnings.toFixed(2)}` 
                        : 'KES 0.00';
                }
                
                if (completedOrdersElement) {
                    completedOrdersElement.textContent = vendorData.completedOrders || '0';
                }
                
                if (averageRatingElement) {
                    averageRatingElement.textContent = vendorData.averageRating 
                        ? vendorData.averageRating.toFixed(1) + ' / 5.0' 
                        : 'No ratings yet';
                }
            } else {
                console.error("Vendor document not found when loading earnings");
            }
        } catch (error) {
            console.error("Error loading earnings data:", error);
        }
    } else {
        console.error("Cannot load earnings, vendor data not available");
    }
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
        // Query orders assigned to this vendor
        const ordersQuery = query(
            collection(db, 'orders'),
            where('assignedVendorId', '==', currentVendor.id),
            orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(ordersQuery);
        
        if (querySnapshot.empty) {
            myOrdersList.innerHTML = '<p class="text-neutral-500 dark:text-neutral-400 md:col-span-2 lg:col-span-3">You have no orders yet.</p>';
            return;
        }
        
        // Clear loading message
        myOrdersList.innerHTML = '';
        
        // Display each order
        querySnapshot.forEach((doc) => {
            const order = doc.data();
            order.id = doc.id;
            
            // Create order card
            const orderCard = createOrderCard(order);
            
            // Add to list
            myOrdersList.appendChild(orderCard);
        });
    } catch (error) {
        console.error("Error loading my orders:", error);
        myOrdersList.innerHTML = '<p class="text-error-500 dark:text-error-400 md:col-span-2 lg:col-span-3">Error loading orders. Please try again.</p>';
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
    
    // Add chat button to the order card
    addChatButtonToOrder(orderCard, orderId);
    
    ordersList.appendChild(orderCard);
    console.log(`Order card for ${orderId} added to the list`);
}

// Accept an order
async function acceptOrder(orderId) {
    if (!currentVendor || !currentVendor.id) {
        showToast('Cannot accept order: Vendor data not available', 'error');
        return;
    }
    
    try {
        // Update order status to 'assigned'
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, {
            status: 'assigned',
            assignedVendorId: currentVendor.id,
            assignedVendorName: currentVendor.name,
            assignedAt: serverTimestamp()
        });
        
        showToast('Order accepted successfully!', 'success');
        
        // Refresh available orders
        loadAvailableOrders();
        
        // Load my orders to show the newly accepted order
        loadMyOrders();
    } catch (error) {
        console.error("Error accepting order:", error);
        showToast('Failed to accept order. Please try again.', 'error');
    }
}

// Format status for display
function formatStatus(status) {
    const statusMap = {
        'pending': 'Pending',
        'assigned': 'Assigned',
        'in-progress': 'In Progress',
        'completed': 'Completed',
        'cancelled': 'Cancelled',
        'available': 'Available',
        'busy': 'Busy',
        'unavailable': 'Unavailable'
    };
    
    return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1);
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
    
    messageDiv.className = `mb-2 ${isCurrentUser ? 'text-right' : 'text-left'}`;
    messageDiv.innerHTML = `
        <div class="inline-block max-w-[80%] rounded-lg px-3 py-2 ${
            isCurrentUser 
                ? 'bg-primary-600 text-white' 
                : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100'
        }">
            <p class="text-sm">${message.text}</p>
            <span class="text-xs opacity-75">${formatTimestamp(message.timestamp)}</span>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
}

// Format timestamp
function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Handle message submission
if (chatForm) {
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!currentChatOrderId || !messageInput.value.trim()) return;
        
        const messageText = messageInput.value.trim();
        messageInput.value = '';
        
        try {
            // First verify the order exists and get its status
            const orderRef = doc(db, 'orders', currentChatOrderId);
            const orderDoc = await getDoc(orderRef);
            
            if (!orderDoc.exists()) {
                throw new Error('Order not found');
            }
            
            await addDoc(collection(db, 'messages'), {
                orderId: currentChatOrderId,
                senderId: currentVendor.id,
                senderName: currentVendor.name,
                text: messageText,
                timestamp: serverTimestamp()
            });
        } catch (error) {
            console.error('Error sending message:', error);
            // Restore the message text in case of error
            messageInput.value = messageText;
            if (error.code === 'permission-denied') {
                showToast('You don\'t have permission to send messages for this order.', 'error');
            } else {
                showToast('Failed to send message. Please try again.', 'error');
            }
        }
    });
}

// Add chat button to order template
function addChatButtonToOrder(orderCard, orderId) {
    const actionButtonsDiv = orderCard.querySelector('.p-4.bg-neutral-50');
    if (actionButtonsDiv) {
        const chatButton = document.createElement('button');
        chatButton.className = 'w-full px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-200 rounded-md hover:bg-neutral-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 mt-2 open-chat';
        chatButton.textContent = 'Chat with Customer';
        chatButton.dataset.orderId = orderId;
        actionButtonsDiv.appendChild(chatButton);
        
        // Add click handler
        chatButton.addEventListener('click', () => {
            openChat(orderId);
        });
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
            // Update vendor status in Firestore
            const vendorRef = doc(db, 'users', currentVendor.id);
            await updateDoc(vendorRef, {
                status: newStatus
            });
            
            // Update local vendor data
            currentVendor.status = newStatus;
            
            // Update UI
            if (availabilityStatusText) {
                availabilityStatusText.textContent = newStatus === 'available' ? 'Available' : 'Busy';
            }
            
            showToast(`Status updated to ${newStatus}`, 'success');
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
            radiusInput.value = currentVendor.radius || 5; // Reset to current value
            return;
        }
        
        try {
            // Update vendor radius in Firestore
            const vendorRef = doc(db, 'users', currentVendor.id);
            await updateDoc(vendorRef, {
                radius: newRadius
            });
            
            // Update local vendor data
            currentVendor.radius = newRadius;
            
            // Update profile display
            if (profileRadiusElement) {
                profileRadiusElement.textContent = newRadius;
            }
            
            showToast(`Delivery radius updated to ${newRadius} km`, 'success');
            
            // Refresh available orders with new radius
            loadAvailableOrders();
        } catch (error) {
            console.error("Error updating radius:", error);
            showToast('Failed to update radius. Please try again.', 'error');
            radiusInput.value = currentVendor.radius || 5; // Reset to current value
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
        
        // Clear previous messages
        if (locationErrorElement) locationErrorElement.textContent = '';
        if (locationSuccessElement) locationSuccessElement.textContent = '';
        
        // Get current location using browser's geolocation API
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const location = {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            timestamp: serverTimestamp()
                        };
                        
                        // Update vendor location in Firestore
                        const vendorRef = doc(db, 'users', currentVendor.id);
                        await updateDoc(vendorRef, {
                            location: location
                        });
                        
                        // Update local vendor data
                        currentVendor.location = location;
                        
                        // Update profile display
                        if (profileLocationElement) {
                            profileLocationElement.textContent = 
                                `Lat: ${location.latitude.toFixed(5)}, Lng: ${location.longitude.toFixed(5)}`;
                        }
                        
                        // Show success message
                        if (locationSuccessElement) {
                            locationSuccessElement.textContent = 'Location updated successfully!';
                        }
                        
                        // Refresh available orders with new location
                        loadAvailableOrders();
                    } catch (error) {
                        console.error("Error updating location:", error);
                        if (locationErrorElement) {
                            locationErrorElement.textContent = 'Failed to update location. Please try again.';
                        }
                    }
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    if (locationErrorElement) {
                        switch (error.code) {
                            case error.PERMISSION_DENIED:
                                locationErrorElement.textContent = 'Location access denied. Please enable location services.';
                                break;
                            case error.POSITION_UNAVAILABLE:
                                locationErrorElement.textContent = 'Location information unavailable.';
                                break;
                            case error.TIMEOUT:
                                locationErrorElement.textContent = 'Location request timed out.';
                                break;
                            default:
                                locationErrorElement.textContent = 'An unknown error occurred.';
                                break;
                        }
                    }
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        } else {
            if (locationErrorElement) {
                locationErrorElement.textContent = 'Geolocation is not supported by your browser.';
            }
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
    refreshOrdersBtn.addEventListener('click', loadAvailableOrders);
}

// Listen for auth state changes
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("Vendor dashboard: Auth state changed. User found:", user.uid);
        try {
            // Get vendor data from Firestore
            const vendorRef = doc(db, 'users', user.uid);
            const vendorDoc = await getDoc(vendorRef);
            
            if (vendorDoc.exists()) {
                const vendorData = vendorDoc.data();
                
                // Check if user is a vendor
                if (vendorData.role === 'vendor') {
                    // Store vendor data
                    currentVendor = {
                        id: user.uid,
                        name: vendorData.name || user.email,
                        email: vendorData.email || user.email,
                        phone: vendorData.phone || '',
                        status: vendorData.status || 'unavailable',
                        radius: vendorData.radius || 5,
                        location: vendorData.location || null
                    };
                    
                    // Update UI with vendor data
                    if (vendorNameElement) {
                        vendorNameElement.textContent = currentVendor.name;
                    }
                    
                    // Set availability toggle based on current status
                    availabilityToggle.checked = currentVendor.status === 'available'; 
                    
                    // Update the availability status text
                    if (availabilityStatusText) {
                        if (currentVendor.status === 'available') {
                            availabilityStatusText.textContent = 'Available';
                        } else if (currentVendor.status === 'busy') {
                            availabilityStatusText.textContent = 'Busy';
                        } else {
                            // Handle other statuses like 'unavailable' (suspended) if needed
                            availabilityStatusText.textContent = formatStatus(currentVendor.status); 
                        }
                    }
                    
                    radiusInput.value = currentVendor.radius || 5; 
                    loadAvailableOrders();
                } else {
                    // User not found in 'users' or role is not 'vendor' - Redirect!
                    console.log(`User ${user.uid} logged in, but no document found in 'users' collection OR role is not 'vendor'. Redirecting to index.html.`);
                    window.location.href = 'index.html';
                }
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

// Load available orders when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded event fired");
    if (currentVendor) {
        console.log("Current vendor exists, loading available orders");
        loadAvailableOrders();
    } else {
        console.log("No current vendor yet, waiting for auth state change");
    }
}); 
// UI Utility Functions

// Toast Notification System
class ToastManager {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2';
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        const bgColor = this.getBackgroundColor(type);
        const icon = this.getIcon(type);
        
        toast.className = `flex items-center p-4 rounded-lg shadow-lg text-white ${bgColor} transform transition-all duration-300 translate-x-full`;
        toast.innerHTML = `
            <div class="flex items-center">
                <span class="mr-2">${icon}</span>
                <p>${message}</p>
            </div>
            <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.remove()">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        `;

        this.container.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => toast.classList.remove('translate-x-full'), 10);
        
        // Auto remove after duration
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    getBackgroundColor(type) {
        switch (type) {
            case 'success': return 'bg-green-600';
            case 'error': return 'bg-red-600';
            case 'warning': return 'bg-yellow-600';
            case 'info': return 'bg-blue-600';
            default: return 'bg-gray-600';
        }
    }

    getIcon(type) {
        switch (type) {
            case 'success': return '✓';
            case 'error': return '✕';
            case 'warning': return '⚠';
            case 'info': return 'ℹ';
            default: return '•';
        }
    }
}

// Confirmation Dialog System
class ConfirmDialog {
    constructor() {
        this.dialog = document.createElement('div');
        this.dialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden';
        this.dialog.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 transform transition-all">
                <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white"></h3>
                <p class="text-gray-600 dark:text-gray-300 mb-6"></p>
                <div class="flex justify-end gap-3">
                    <button class="cancel-btn px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600">
                        Cancel
                    </button>
                    <button class="confirm-btn px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700">
                        Confirm
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(this.dialog);
    }

    show(title, message) {
        return new Promise((resolve) => {
            const dialogContent = this.dialog.querySelector('div > div');
            dialogContent.querySelector('h3').textContent = title;
            dialogContent.querySelector('p').textContent = message;
            
            const handleConfirm = () => {
                this.hide();
                resolve(true);
            };
            
            const handleCancel = () => {
                this.hide();
                resolve(false);
            };
            
            const confirmBtn = this.dialog.querySelector('.confirm-btn');
            const cancelBtn = this.dialog.querySelector('.cancel-btn');
            
            confirmBtn.onclick = handleConfirm;
            cancelBtn.onclick = handleCancel;
            
            this.dialog.classList.remove('hidden');
            dialogContent.classList.add('scale-100');
        });
    }

    hide() {
        const dialogContent = this.dialog.querySelector('div > div');
        dialogContent.classList.remove('scale-100');
        dialogContent.classList.add('scale-95');
        
        setTimeout(() => {
            this.dialog.classList.add('hidden');
            dialogContent.classList.remove('scale-95');
        }, 150);
    }
}

// Initialize global instances
window.toastManager = new ToastManager();
window.confirmDialog = new ConfirmDialog();

// Export utility functions
window.showToast = (message, type, duration) => window.toastManager.show(message, type, duration);
window.showConfirm = (title, message) => window.confirmDialog.show(title, message); 
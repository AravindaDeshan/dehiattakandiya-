// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBcVg0A5CYfHBtS6DyuLPWCJ0sf7agVOAE",
  authDomain: "powerplantwarehouse-355b0.firebaseapp.com",
  projectId: "powerplantwarehouse-355b0",
  storageBucket: "powerplantwarehouse-355b0.firebasestorage.app",
  messagingSenderId: "699762263533",
  appId: "1:699762263533:web:c981382e8f91150f1dd3e4"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const loginSection = document.getElementById('login-section');
const userInfo = document.getElementById('user-info');
const usernameDisplay = document.getElementById('username-display');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const navItems = document.querySelectorAll('nav li');
const contentSections = document.querySelectorAll('.content-section');
const issueForm = document.getElementById('issue-form');
const itemsContainer = document.getElementById('items-container');
const addItemBtn = document.getElementById('add-item-btn');
const jobSearch = document.getElementById('job-search');
const searchBtn = document.getElementById('search-btn');
const activeJobsList = document.getElementById('active-jobs-list');
const inventoryBody = document.getElementById('inventory-body');
const addNewItemBtn = document.getElementById('add-new-item-btn');
const refreshInventoryBtn = document.getElementById('refresh-inventory-btn');
const reportMonth = document.getElementById('report-month');
const generateReportBtn = document.getElementById('generate-report-btn');
const printReportBtn = document.getElementById('print-report-btn');
const reportResults = document.getElementById('report-results');
const adminTabs = document.querySelectorAll('.admin-tab');
const adminTabContents = document.querySelectorAll('.admin-tab-content');
const addUserBtn = document.getElementById('add-user-btn');
const usersBody = document.getElementById('users-body');
const newCategory = document.getElementById('new-category');
const addCategoryBtn = document.getElementById('add-category-btn');
const categoriesList = document.getElementById('categories-list');
const settingsForm = document.getElementById('settings-form');
const addItemModal = document.getElementById('add-item-modal');
const returnModal = document.getElementById('return-modal');
const addUserModal = document.getElementById('add-user-modal');
const closeModals = document.querySelectorAll('.close-modal');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notification-message');

// Global Variables
let currentUser = null;
let inventoryItems = [];
let activeJobs = [];
let categories = [];
let users = [];
let systemSettings = {
    companyName: "Power Plant Warehouse",
    lowStockThreshold: 20,
    autoLogout: 30
};


    // Set current month in report selector
    const today = new Date();
    reportMonth.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    // Event Listeners
    loginBtn.addEventListener('click', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    
    navItems.forEach(item => {
        item.addEventListener('click', () => switchSection(item.dataset.section));
    });
    
    addItemBtn.addEventListener('click', addItemRow);
    issueForm.addEventListener('submit', handleIssueItems);
    searchBtn.addEventListener('click', searchJobs);
    jobSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchJobs();
    });
    
    addNewItemBtn.addEventListener('click', () => addItemModal.classList.add('active'));
    refreshInventoryBtn.addEventListener('click', loadInventory);
    
    generateReportBtn.addEventListener('click', generateReport);
    printReportBtn.addEventListener('click', printReport);
    
    adminTabs.forEach(tab => {
        tab.addEventListener('click', () => switchAdminTab(tab.dataset.tab));
    });
    
    addUserBtn.addEventListener('click', () => addUserModal.classList.add('active'));
    addCategoryBtn.addEventListener('click', addCategory);
    settingsForm.addEventListener('submit', saveSettings);
    
    closeModals.forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.remove('active');
            });
        });
    });
    
    // Initialize Firebase Auth state listener
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            setupAuthenticatedUI(user);
            loadInitialData();
        } else {
            currentUser = null;
            setupUnauthenticatedUI();
        }
    });
    
    // Auto-logout timer
    setInterval(checkAutoLogout, 60000); // Check every minute
}

// Handle user login
async function handleLogin(e) {
    e.preventDefault();
    const email = loginEmail.value;
    const password = loginPassword.value;
    
    if (!email || !password) {
        showNotification('Please enter both email and password', 'error');
        return;
    }
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        showNotification('Login successful', 'success');
    } catch (error) {
        console.error('Login error:', error);
        showNotification(error.message, 'error');
    }
}

// Handle user logout
function handleLogout() {
    auth.signOut()
        .then(() => {
            showNotification('Logged out successfully', 'success');
        })
        .catch(error => {
            console.error('Logout error:', error);
            showNotification('Error during logout', 'error');
        });
}

// Setup UI for authenticated user
function setupAuthenticatedUI(user) {
    loginSection.classList.add('hidden');
    userInfo.classList.remove('hidden');
    usernameDisplay.textContent = user.email;
    
    // Enable all sections for admin, restrict for others
    if (user.email === 'admin@example.com') {
        document.querySelector('li[data-section="admin"]').style.display = 'flex';
    } else {
        document.querySelector('li[data-section="admin"]').style.display = 'none';
    }
}

// Setup UI for unauthenticated user
function setupUnauthenticatedUI() {
    loginSection.classList.remove('hidden');
    userInfo.classList.add('hidden');
    switchSection('dashboard');
}

// Switch between content sections
function switchSection(sectionId) {
    // Update active nav item
    navItems.forEach(item => {
        if (item.dataset.section === sectionId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Show the selected section
    contentSections.forEach(section => {
        if (section.id === sectionId) {
            section.classList.add('active');
        } else {
            section.classList.remove('active');
        }
    });
    
    // Load section-specific data
    switch(sectionId) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'issue-items':
            loadItemsForIssue();
            break;
        case 'return-items':
            loadActiveJobs();
            break;
        case 'inventory':
            loadInventory();
            break;
        case 'admin':
            loadAdminData();
            break;
    }
}

// Switch between admin tabs
function switchAdminTab(tabId) {
    adminTabs.forEach(tab => {
        if (tab.dataset.tab === tabId) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    adminTabContents.forEach(content => {
        if (content.id === `${tabId}-tab`) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
}

// Load initial data after login
function loadInitialData() {
    loadInventory();
    loadActiveJobs();
    loadCategories();
    loadDashboardData();
    loadSettings();
}

// Load inventory items
async function loadInventory() {
    try {
        const snapshot = await db.collection('inventory').get();
        inventoryItems = [];
        snapshot.forEach(doc => {
            inventoryItems.push({ id: doc.id, ...doc.data() });
        });
        renderInventory();
    } catch (error) {
        console.error('Error loading inventory:', error);
        showNotification('Failed to load inventory', 'error');
    }
}

// Render inventory table
function renderInventory() {
    inventoryBody.innerHTML = '';
    
    inventoryItems.forEach(item => {
        const row = document.createElement('tr');
        
        // Highlight low stock items
        let stockClass = '';
        const stockPercentage = (item.currentStock / item.minStock) * 100;
        
        if (item.currentStock <= item.minStock) {
            stockClass = 'critical-stock';
        } else if (stockPercentage < systemSettings.lowStockThreshold) {
            stockClass = 'low-stock';
        }
        
        row.innerHTML = `
            <td>${item.id}</td>
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td class="${stockClass}">${item.currentStock}</td>
            <td>${item.minStock}</td>
            <td>${item.unit}</td>
            <td>
                <button class="action-btn secondary-btn edit-item" data-id="${item.id}"><i class="fas fa-edit"></i></button>
                <button class="action-btn danger-btn delete-item" data-id="${item.id}"><i class="fas fa-trash"></i></button>
            </td>
        `;
        
        inventoryBody.appendChild(row);
    });
    
    // Add event listeners to action buttons
    document.querySelectorAll('.edit-item').forEach(btn => {
        btn.addEventListener('click', (e) => editInventoryItem(e.target.dataset.id));
    });
    
    document.querySelectorAll('.delete-item').forEach(btn => {
        btn.addEventListener('click', (e) => deleteInventoryItem(e.target.dataset.id));
    });
}

// Load items for issue form dropdown
async function loadItemsForIssue() {
    try {
        const itemSelects = document.querySelectorAll('.item-select');
        
        if (inventoryItems.length === 0) {
            await loadInventory();
        }
        
        itemSelects.forEach(select => {
            // Clear existing options except the first one
            while (select.options.length > 1) {
                select.remove(1);
            }
            
            // Add inventory items
            inventoryItems.forEach(item => {
                if (item.currentStock > 0) {
                    const option = document.createElement('option');
                    option.value = item.id;
                    option.textContent = `${item.name} (${item.currentStock} ${item.unit} available)`;
                    select.appendChild(option);
                }
            });
        });
    } catch (error) {
        console.error('Error loading items for issue:', error);
        showNotification('Failed to load items for issue', 'error');
    }
}

// Add new item row to issue form
function addItemRow() {
    const newRow = document.createElement('div');
    newRow.className = 'item-row';
    newRow.innerHTML = `
        <div class="form-group">
            <label>Item:</label>
            <select class="item-select" required>
                <option value="">Select an item</option>
            </select>
        </div>
        <div class="form-group">
            <label>Quantity:</label>
            <input type="number" class="item-quantity" min="1" required>
        </div>
        <button type="button" class="remove-item-btn"><i class="fas fa-trash"></i></button>
    `;
    
    itemsContainer.appendChild(newRow);
    
    // Load items for the new select
    loadItemsForIssue();
    
    // Add event listener to remove button
    newRow.querySelector('.remove-item-btn').addEventListener('click', () => {
        newRow.remove();
    });
}

// Handle issuing items
async function handleIssueItems(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showNotification('You must be logged in to issue items', 'error');
        return;
    }
    
    const jobId = document.getElementById('job-id').value;
    const personName = document.getElementById('person-name').value;
    const taskDescription = document.getElementById('task-description').value;
    const issueDate = document.getElementById('issue-date').value;
    
    if (!jobId || !personName || !taskDescription || !issueDate) {
        showNotification('Please fill all required fields', 'error');
        return;
    }
    
    // Get all item rows
    const itemRows = document.querySelectorAll('.item-row');
    if (itemRows.length === 0) {
        showNotification('Please add at least one item', 'error');
        return;
    }
    
    const itemsToIssue = [];
    let valid = true;
    
    // Validate each item row
    itemRows.forEach(row => {
        const itemSelect = row.querySelector('.item-select');
        const itemId = itemSelect.value;
        const quantity = parseInt(row.querySelector('.item-quantity').value);
        
        if (!itemId || !quantity) {
            valid = false;
            return;
        }
        
        const inventoryItem = inventoryItems.find(item => item.id === itemId);
        if (!inventoryItem) {
            valid = false;
            return;
        }
        
        if (quantity > inventoryItem.currentStock) {
            showNotification(`Not enough stock for ${inventoryItem.name} (only ${inventoryItem.currentStock} ${inventoryItem.unit} available)`, 'error');
            valid = false;
            return;
        }
        
        itemsToIssue.push({
            itemId,
            itemName: inventoryItem.name,
            quantity,
            unit: inventoryItem.unit,
            returned: false,
            returnedQuantity: 0
        });
    });
    
    if (!valid || itemsToIssue.length === 0) {
        showNotification('Please check all item selections', 'error');
        return;
    }
    
    try {
        // Create a batch write to update multiple documents atomically
        const batch = db.batch();
        
        // Update inventory items
        itemsToIssue.forEach(item => {
            const itemRef = db.collection('inventory').doc(item.itemId);
            batch.update(itemRef, {
                currentStock: firebase.firestore.FieldValue.increment(-item.quantity)
            });
        });
        
        // Create job document
        const jobRef = db.collection('jobs').doc(jobId);
        batch.set(jobRef, {
            jobId,
            personName,
            taskDescription,
            issueDate,
            issuedBy: currentUser.email,
            issuedAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'active',
            items: itemsToIssue
        });
        
        // Commit the batch
        await batch.commit();
        
        // Reset form
        issueForm.reset();
        itemsContainer.innerHTML = '<div class="item-row"><div class="form-group"><label>Item:</label><select class="item-select" required><option value="">Select an item</option></select></div><div class="form-group"><label>Quantity:</label><input type="number" class="item-quantity" min="1" required></div><button type="button" class="remove-item-btn"><i class="fas fa-trash"></i></button></div>';
        loadItemsForIssue();
        
        // Update UI
        loadInventory();
        loadActiveJobs();
        loadDashboardData();
        
        showNotification('Items issued successfully', 'success');
    } catch (error) {
        console.error('Error issuing items:', error);
        showNotification('Failed to issue items', 'error');
    }
}

// Load active jobs
async function loadActiveJobs() {
    try {
        const snapshot = await db.collection('jobs')
            .where('status', '==', 'active')
            .orderBy('issuedAt', 'desc')
            .get();
        
        activeJobs = [];
        snapshot.forEach(doc => {
            activeJobs.push({ id: doc.id, ...doc.data() });
        });
        
        renderActiveJobs();
    } catch (error) {
        console.error('Error loading active jobs:', error);
        showNotification('Failed to load active jobs', 'error');
    }
}

// Render active jobs list
function renderActiveJobs(filter = '') {
    activeJobsList.innerHTML = '';
    
    let jobsToDisplay = activeJobs;
    
    if (filter) {
        const searchTerm = filter.toLowerCase();
        jobsToDisplay = activeJobs.filter(job => 
            job.jobId.toLowerCase().includes(searchTerm) || 
            job.personName.toLowerCase().includes(searchTerm)
        );
    }
    
    if (jobsToDisplay.length === 0) {
        activeJobsList.innerHTML = '<div class="no-jobs">No active jobs found</div>';
        return;
    }
    
    jobsToDisplay.forEach(job => {
        const jobCard = document.createElement('div');
        jobCard.className = 'job-card';
        
        let itemsHtml = '';
        job.items.forEach(item => {
            itemsHtml += `
                <div class="job-item">
                    <span>${item.itemName} (${item.quantity} ${item.unit})</span>
                    <span>${item.returned ? 'Returned' : 'Not returned'}</span>
                </div>
            `;
        });
        
        jobCard.innerHTML = `
            <div class="job-card-header">
                <span class="job-id">Job ID: ${job.jobId}</span>
                <span class="job-date">Issued: ${formatDate(job.issueDate)}</span>
            </div>
            <div class="job-person">Person: ${job.personName}</div>
            <div class="job-task">Task: ${job.taskDescription}</div>
            <div class="job-items">${itemsHtml}</div>
            <div class="job-actions">
                <button class="primary-btn return-job-btn" data-id="${job.jobId}">Return Items</button>
            </div>
        `;
        
        activeJobsList.appendChild(jobCard);
    });
    
    // Add event listeners to return buttons
    document.querySelectorAll('.return-job-btn').forEach(btn => {
        btn.addEventListener('click', (e) => openReturnModal(e.target.dataset.id));
    });
}

// Search jobs
function searchJobs() {
    const searchTerm = jobSearch.value.trim();
    renderActiveJobs(searchTerm);
}

// Open return modal
function openReturnModal(jobId) {
    const job = activeJobs.find(j => j.jobId === jobId);
    if (!job) return;
    
    document.getElementById('return-job-id').textContent = job.jobId;
    document.getElementById('return-person-name').textContent = job.personName;
    document.getElementById('return-task').textContent = job.taskDescription;
    document.getElementById('return-issue-date').textContent = formatDate(job.issueDate);
    
    const returnItemsList = document.getElementById('return-items-list');
    returnItemsList.innerHTML = '';
    
    job.items.forEach(item => {
        if (!item.returned) {
            const returnItem = document.createElement('div');
            returnItem.className = 'return-item';
            returnItem.innerHTML = `
                <div>
                    <span>${item.itemName}</span>
                    <span class="item-quantity-info">Issued: ${item.quantity} ${item.unit}</span>
                </div>
                <div class="return-item-quantity">
                    <input type="number" id="return-qty-${item.itemId}" min="0" max="${item.quantity}" value="${item.quantity}">
                    <span>${item.unit}</span>
                </div>
            `;
            returnItemsList.appendChild(returnItem);
        }
    });
    
    document.getElementById('confirm-return-btn').onclick = () => confirmReturn(jobId);
    returnModal.classList.add('active');
}

// Confirm return of items
async function confirmReturn(jobId) {
    const job = activeJobs.find(j => j.jobId === jobId);
    if (!job) return;
    
    const notes = document.getElementById('return-notes').value;
    const batch = db.batch();
    const jobRef = db.collection('jobs').doc(jobId);
    
    // Update each item in the job
    const updatedItems = job.items.map(item => {
        if (item.returned) return item;
        
        const returnQtyInput = document.getElementById(`return-qty-${item.itemId}`);
        if (!returnQtyInput) return item;
        
        const returnedQuantity = parseInt(returnQtyInput.value) || 0;
        
        if (returnedQuantity > 0) {
            // Update inventory for returned items
            const itemRef = db.collection('inventory').doc(item.itemId);
            batch.update(itemRef, {
                currentStock: firebase.firestore.FieldValue.increment(returnedQuantity)
            });
        }
        
        return {
            ...item,
            returned: true,
            returnedQuantity,
            returnNotes: notes,
            returnedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
    });
    
    // Check if all items are returned
    const allReturned = updatedItems.every(item => item.returned);
    
    // Update job document
    batch.update(jobRef, {
        items: updatedItems,
        status: allReturned ? 'completed' : 'partially-returned'
    });
    
    try {
        await batch.commit();
        
        // Update UI
        returnModal.classList.remove('active');
        loadInventory();
        loadActiveJobs();
        loadDashboardData();
        
        showNotification('Items returned successfully', 'success');
    } catch (error) {
        console.error('Error returning items:', error);
        showNotification('Failed to return items', 'error');
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        // Get checked out items count
        const activeJobsSnapshot = await db.collection('jobs')
            .where('status', '==', 'active')
            .get();
        
        document.getElementById('checked-out-count').textContent = activeJobsSnapshot.size;
        document.getElementById('active-jobs-count').textContent = activeJobsSnapshot.size;
        
        // Get low stock items count
        if (inventoryItems.length === 0) {
            await loadInventory();
        }
        
        const lowStockCount = inventoryItems.filter(item => {
            const stockPercentage = (item.currentStock / item.minStock) * 100;
            return stockPercentage < systemSettings.lowStockThreshold;
        }).length;
        
        document.getElementById('low-stock-count').textContent = lowStockCount;
        
        // Load recent activity
        loadRecentActivity();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Failed to load dashboard data', 'error');
    }
}

// Load recent activity
async function loadRecentActivity() {
    try {
        const snapshot = await db.collection('activity')
            .orderBy('timestamp', 'desc')
            .limit(10)
            .get();
        
        const activityFeed = document.getElementById('activity-feed');
        activityFeed.innerHTML = '';
        
        snapshot.forEach(doc => {
            const activity = doc.data();
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            
            let icon = '';
            switch(activity.type) {
                case 'issue':
                    icon = '<i class="fas fa-tools"></i>';
                    break;
                case 'return':
                    icon = '<i class="fas fa-undo"></i>';
                    break;
                case 'inventory':
                    icon = '<i class="fas fa-boxes"></i>';
                    break;
                default:
                    icon = '<i class="fas fa-info-circle"></i>';
            }
            
            activityItem.innerHTML = `
                <div class="activity-icon">${icon}</div>
                <div class="activity-details">
                    <p>${activity.message}</p>
                    <div class="activity-time">${formatDateTime(activity.timestamp.toDate())}</div>
                </div>
            `;
            
            activityFeed.appendChild(activityItem);
        });
    } catch (error) {
        console.error('Error loading recent activity:', error);
    }
}

// Load categories
async function loadCategories() {
    try {
        const snapshot = await db.collection('categories').get();
        categories = [];
        snapshot.forEach(doc => {
            categories.push({ id: doc.id, ...doc.data() });
        });
        
        // Render categories in admin tab
        renderCategories();
        
        // Update category selects in other forms
        updateCategorySelects();
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Render categories in admin tab
function renderCategories() {
    categoriesList.innerHTML = '';
    
    categories.forEach(category => {
        const categoryItem = document.createElement('li');
        categoryItem.className = 'category-item';
        categoryItem.innerHTML = `
            <span>${category.name}</span>
            <button class="danger-btn delete-category" data-id="${category.id}"><i class="fas fa-trash"></i></button>
        `;
        
        categoriesList.appendChild(categoryItem);
    });
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-category').forEach(btn => {
        btn.addEventListener('click', (e) => deleteCategory(e.target.dataset.id));
    });
}

// Add new category
async function addCategory() {
    const categoryName = newCategory.value.trim();
    
    if (!categoryName) {
        showNotification('Please enter a category name', 'error');
        return;
    }
    
    try {
        await db.collection('categories').add({
            name: categoryName,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        newCategory.value = '';
        showNotification('Category added successfully', 'success');
        loadCategories();
    } catch (error) {
        console.error('Error adding category:', error);
        showNotification('Failed to add category', 'error');
    }
}

// Delete category
async function deleteCategory(categoryId) {
    if (!confirm('Are you sure you want to delete this category? Items in this category will not be deleted.')) {
        return;
    }
    
    try {
        await db.collection('categories').doc(categoryId).delete();
        showNotification('Category deleted successfully', 'success');
        loadCategories();
    } catch (error) {
        console.error('Error deleting category:', error);
        showNotification('Failed to delete category', 'error');
    }
}

// Update category selects in forms
function updateCategorySelects() {
    const categorySelects = [
        document.getElementById('new-item-category')
        // Add other category selects here if needed
    ];
    
    categorySelects.forEach(select => {
        if (!select) return;
        
        // Clear existing options except the first one
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        // Add categories
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            select.appendChild(option);
        });
    });
}

// Load admin data
async function loadAdminData() {
    loadUsers();
    loadCategories();
    loadSettings();
}

// Load users
async function loadUsers() {
    try {
        const snapshot = await db.collection('users').get();
        users = [];
        snapshot.forEach(doc => {
            users.push({ id: doc.id, ...doc.data() });
        });
        
        renderUsers();
    } catch (error) {
        console.error('Error loading users:', error);
        showNotification('Failed to load users', 'error');
    }
}

// Render users table
function renderUsers() {
    usersBody.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.email}</td>
            <td>${user.name || '-'}</td>
            <td>${user.role || 'technician'}</td>
            <td>${user.lastLogin ? formatDateTime(user.lastLogin.toDate()) : 'Never'}</td>
            <td>
                <button class="action-btn secondary-btn edit-user" data-id="${user.id}"><i class="fas fa-edit"></i></button>
                <button class="action-btn danger-btn delete-user" data-id="${user.id}"><i class="fas fa-trash"></i></button>
            </td>
        `;
        
        usersBody.appendChild(row);
    });
    
    // Add event listeners to action buttons
    document.querySelectorAll('.edit-user').forEach(btn => {
        btn.addEventListener('click', (e) => editUser(e.target.dataset.id));
    });
    
    document.querySelectorAll('.delete-user').forEach(btn => {
        btn.addEventListener('click', (e) => deleteUser(e.target.dataset.id));
    });
}

// Add new user
async function addUser(e) {
    e.preventDefault();
    
    const email = document.getElementById('new-user-email').value;
    const name = document.getElementById('new-user-name').value;
    const role = document.getElementById('new-user-role').value;
    const password = document.getElementById('new-user-password').value;
    
    if (!email || !name || !role || !password) {
        showNotification('Please fill all fields', 'error');
        return;
    }
    
    try {
        // First create the auth user
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        // Then add to Firestore users collection
        await db.collection('users').doc(userCredential.user.uid).set({
            email,
            name,
            role,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Close modal and reset form
        addUserModal.classList.remove('active');
        document.getElementById('new-user-form').reset();
        
        showNotification('User created successfully', 'success');
        loadUsers();
    } catch (error) {
        console.error('Error creating user:', error);
        showNotification(error.message, 'error');
    }
}

// Edit user (placeholder - implement as needed)
function editUser(userId) {
    showNotification('Edit user functionality not implemented yet', 'warning');
}

// Delete user
async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        return;
    }
    
    try {
        // First delete from Firestore
        await db.collection('users').doc(userId).delete();
        
        // Then delete the auth user (if you have permissions)
        // Note: This requires special Cloud Functions setup in a real app
        // as client-side can't delete users directly
        
        showNotification('User deleted from database', 'success');
        loadUsers();
    } catch (error) {
        console.error('Error deleting user:', error);
        showNotification('Failed to delete user', 'error');
    }
}

// Load system settings
async function loadSettings() {
    try {
        const doc = await db.collection('settings').doc('system').get();
        if (doc.exists) {
            systemSettings = doc.data();
            
            // Update settings form
            document.getElementById('company-name').value = systemSettings.companyName || '';
            document.getElementById('low-stock-threshold').value = systemSettings.lowStockThreshold || 20;
            document.getElementById('auto-logout').value = systemSettings.autoLogout || 30;
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Save system settings
async function saveSettings(e) {
    e.preventDefault();
    
    const settings = {
        companyName: document.getElementById('company-name').value,
        lowStockThreshold: parseInt(document.getElementById('low-stock-threshold').value) || 20,
        autoLogout: parseInt(document.getElementById('auto-logout').value) || 30,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedBy: currentUser.email
    };
    
    try {
        await db.collection('settings').doc('system').set(settings, { merge: true });
        systemSettings = settings;
        showNotification('Settings saved successfully', 'success');
    } catch (error) {
        console.error('Error saving settings:', error);
        showNotification('Failed to save settings', 'error');
    }
}

// Generate monthly report
async function generateReport() {
    const monthValue = reportMonth.value;
    if (!monthValue) {
        showNotification('Please select a month', 'error');
        return;
    }
    
    const [year, month] = monthValue.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    try {
        // Get all jobs in the selected month
        const jobsSnapshot = await db.collection('jobs')
            .where('issueDate', '>=', formatDateForQuery(startDate))
            .where('issueDate', '<=', formatDateForQuery(endDate))
            .get();
        
        // Get inventory at the start and end of month
        // Note: In a real app, you'd need to track inventory snapshots daily
        // For simplicity, we'll use current inventory as end of month
        const inventorySnapshot = await db.collection('inventory').get();
        
        // Process data for report
        const reportData = {
            month: `${month}/${year}`,
            totalJobs: jobsSnapshot.size,
            inventoryItems: []
        };
        
        // For each inventory item, calculate usage
        inventorySnapshot.forEach(doc => {
            const item = doc.data();
            reportData.inventoryItems.push({
                id: doc.id,
                name: item.name,
                category: item.category,
                unit: item.unit,
                currentStock: item.currentStock,
                minStock: item.minStock
            });
        });
        
        // Render report
        renderReport(reportData);
    } catch (error) {
        console.error('Error generating report:', error);
        showNotification('Failed to generate report', 'error');
    }
}

// Render report
function renderReport(data) {
    reportResults.innerHTML = `
        <h3>Monthly Report - ${data.month}</h3>
        <div class="report-summary">
            <p>Total Jobs: ${data.totalJobs}</p>
            <p>Inventory Items: ${data.inventoryItems.length}</p>
        </div>
        <div class="chart-container">
            <canvas id="inventoryChart"></canvas>
        </div>
        <div class="inventory-table-container">
            <table>
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Category</th>
                        <th>Current Stock</th>
                        <th>Minimum Stock</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody id="report-inventory-body">
                    ${data.inventoryItems.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.category}</td>
                            <td>${item.currentStock} ${item.unit}</td>
                            <td>${item.minStock}</td>
                            <td class="${item.currentStock <= item.minStock ? 'critical-stock' : (item.currentStock < item.minStock * 1.2 ? 'low-stock' : '')}">
                                ${item.currentStock <= item.minStock ? 'Critical' : (item.currentStock < item.minStock * 1.2 ? 'Low' : 'OK')}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    // Create chart
    const ctx = document.getElementById('inventoryChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.inventoryItems.map(item => item.name),
            datasets: [{
                label: 'Current Stock',
                data: data.inventoryItems.map(item => item.currentStock),
                backgroundColor: data.inventoryItems.map(item => 
                    item.currentStock <= item.minStock ? '#e74c3c' : 
                    (item.currentStock < item.minStock * 1.2 ? '#f39c12' : '#2ecc71')
                ),
                borderColor: '#fff',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Inventory Stock Levels'
                }
            }
        }
    });
}

// Print report
function printReport() {
    window.print();
}

// Check for auto logout
function checkAutoLogout() {
    if (!currentUser) return;
    
    const lastActive = localStorage.getItem('lastActive');
    if (!lastActive) {
        localStorage.setItem('lastActive', Date.now());
        return;
    }
    
    const inactiveTime = (Date.now() - parseInt(lastActive)) / (1000 * 60); // in minutes
    if (inactiveTime > systemSettings.autoLogout) {
        handleLogout();
        showNotification('You were automatically logged out due to inactivity', 'warning');
    }
}

// Track user activity
document.addEventListener('mousemove', () => {
    localStorage.setItem('lastActive', Date.now());
});

document.addEventListener('keypress', () => {
    localStorage.setItem('lastActive', Date.now());
});

// Show notification
function showNotification(message, type = 'info') {
    notification.className = `notification ${type}`;
    notificationMessage.textContent = message;
    notification.classList.add('active');
    
    setTimeout(() => {
        notification.classList.remove('active');
    }, 5000);
}

// Format date for display
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Format date for Firestore query
function formatDateForQuery(date) {
    return firebase.firestore.Timestamp.fromDate(date);
}

// Format date and time
function formatDateTime(date) {
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString(undefined, options);
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
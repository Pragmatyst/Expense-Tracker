// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    addDoc,
    query,
    onSnapshot,
    deleteDoc,
    doc,
    serverTimestamp,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// --- Firebase Initialization ---
let app;
let db;
let auth;
let userId = null;
let isAuthReady = false;

const firebaseConfig = {
    apiKey: "AIzaSyBmcBMtmd_DDPUiSRnzYiuspBC-GPKeAso",
    authDomain: "expensetracker-b0af0.firebaseapp.com",
    projectId: "expensetracker-b0af0",
    storageBucket: "expensetracker-b0af0.firebaseapp.com",
    messagingSenderId: "837224581675",
    appId: "1:837224581675:web:7cbb65f59b9622cc44386e"
};


const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';


try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    console.log("Firebase initialized successfully.");
} catch (error) {
    console.error("Error initializing Firebase:", error);
    displayMessage("auth-message", "Error initializing app. Please try again later.", "error");
}

// --- DOM Elements ---
const appWrapper = document.getElementById('app-wrapper');
const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('main-content');
const authSection = document.getElementById('auth-section');
const expenseTrackerSection = document.getElementById('expense-tracker-section');
const investmentSection = document.getElementById('investment-section');
const showLoginBtn = document.getElementById('show-login');
const showSignupBtn = document.getElementById('show-signup');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const signupEmailInput = document.getElementById('signup-email');
const signupPasswordInput = document.getElementById('signup-password');
const signupConfirmPasswordInput = document.getElementById('signup-confirm-password');
const authMessageDiv = document.getElementById('auth-message');
const logoutSidebarButton = document.getElementById('logout-sidebar-button');

// Sidebar Navigation Buttons
const profileSidebarBtn = document.getElementById('profile-sidebar-btn');
const expensesSidebarBtn = document.getElementById('expenses-sidebar-btn');
const investmentsSidebarBtn = document.getElementById('investments-sidebar-btn');
const aboutSidebarBtn = document.getElementById('about-sidebar-btn');
const messagesSidebarBtn = document.getElementById('messages-sidebar-btn');


// Expense Form Elements
const addExpenseForm = document.getElementById('add-expense-form');
const expenseDescriptionInput = document.getElementById('expense-description');
const expenseCategorySelect = document.getElementById('expense-category');
const expenseAmountInput = document.getElementById('expense-amount');
const expenseDateInput = document.getElementById('expense-date');
const expensesListDiv = document.getElementById('expenses-list');
const totalExpensesSpan = document.getElementById('total-expenses');
const expenseMessageDiv = document.getElementById('expense-message');
const noExpensesMessage = document.getElementById('no-expenses-message');

// Investment Form Elements
const addInvestmentForm = document.getElementById('add-investment-form');
const investmentNameInput = document.getElementById('investment-name');
const investmentAmountInput = document.getElementById('investment-amount');
const investmentDateInput = document.getElementById('investment-date');
const investmentsListDiv = document.getElementById('investments-list');
const totalInvestmentsSpan = document.getElementById('total-investments');
const investmentMessageDiv = document.getElementById('investment-message');
const noInvestmentsMessage = document.getElementById('no-investments-message');

// --- New DOM Elements for Edit Modals (Add these) ---
const editExpenseModal = document.getElementById('edit-expense-modal');
editExpenseModal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full hidden flex items-center justify-center';
editExpenseModal.innerHTML = `
    <div class="relative p-6 border w-96 shadow-lg rounded-md bg-white">
        <h3 class="text-xl font-bold mb-4">Edit Expense</h3>
        <form id="edit-expense-form-inner" class="flex flex-col gap-3">
            <input type="hidden" id="edit-expense-id">
            <input type="text" id="edit-expense-description" placeholder="Description"
                class="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                required>
            <select id="edit-expense-category"
                class="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                required>
                <option value="Food">Food</option>
                <option value="Transportation">Transportation</option>
                <option value="Housing">Housing</option>
                <option value="Utilities">Utilities</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Shopping">Shopping</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Education">Education</option>
                <option value="Other">Other</option>
            </select>
            <input type="number" id="edit-expense-amount" placeholder="Amount"
                class="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                step="0.01" required>
            <input type="date" id="edit-expense-date"
                class="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                required>
            <div class="flex justify-end gap-2 mt-4">
                <button type="button" id="cancel-edit-expense" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Save Changes</button>
            </div>
        </form>
        <div id="edit-expense-message" class="message-box hidden mt-3"></div>
    </div>
`;

const editInvestmentModal = document.getElementById('edit-investment-modal');
editInvestmentModal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full hidden flex items-center justify-center';
editInvestmentModal.innerHTML = `
    <div class="relative p-6 border w-96 shadow-lg rounded-md bg-white">
        <h3 class="text-xl font-bold mb-4">Edit Investment</h3>
        <form id="edit-investment-form-inner" class="flex flex-col gap-3">
            <input type="hidden" id="edit-investment-id">
            <input type="text" id="edit-investment-name" placeholder="Investment Name (e.g., Stock, Crypto)"
                class="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                required>
            <input type="number" id="edit-investment-amount" placeholder="Amount Invested"
                class="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                step="0.01" required>
            <input type="date" id="edit-investment-date"
                class="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                required>
            <div class="flex justify-end gap-2 mt-4">
                <button type="button" id="cancel-edit-investment" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Save Changes</button>
            </div>
        </form>
        <div id="edit-investment-message" class="message-box hidden mt-3"></div>
    </div>
`;

// Get elements from the newly created modals
const editExpenseIdInput = document.getElementById('edit-expense-id');
const editExpenseDescriptionInput = document.getElementById('edit-expense-description');
const editExpenseCategorySelect = document.getElementById('edit-expense-category');
const editExpenseAmountInput = document.getElementById('edit-expense-amount');
const editExpenseDateInput = document.getElementById('edit-expense-date');
const editExpenseForm = document.getElementById('edit-expense-form-inner');
const cancelEditExpenseBtn = document.getElementById('cancel-edit-expense');
const editExpenseMessageDiv = document.getElementById('edit-expense-message');

const editInvestmentIdInput = document.getElementById('edit-investment-id');
const editInvestmentNameInput = document.getElementById('edit-investment-name');
const editInvestmentAmountInput = document.getElementById('edit-investment-amount');
const editInvestmentDateInput = document.getElementById('edit-investment-date');
const editInvestmentForm = document.getElementById('edit-investment-form-inner');
const cancelEditInvestmentBtn = document.getElementById('cancel-edit-investment');
const editInvestmentMessageDiv = document.getElementById('edit-investment-message');


// --- New Custom Alert Box (added here) ---
const customAlertModal = document.createElement('div');
customAlertModal.id = 'custom-alert-modal';
customAlertModal.className = 'custom-alert-modal hidden';
customAlertModal.innerHTML = `
    <div class="custom-alert-content">
        <h3 id="custom-alert-title"></h3>
        <p id="custom-alert-message"></p>
        <button id="custom-alert-ok-btn">OK</button>
    </div>
`;
document.body.appendChild(customAlertModal);

const customAlertTitle = document.getElementById('custom-alert-title');
const customAlertMessage = document.getElementById('custom-alert-message');
const customAlertOkBtn = document.getElementById('custom-alert-ok-btn');

function showAlert(title, message) {
    customAlertTitle.textContent = title;
    customAlertMessage.textContent = message;
    customAlertModal.classList.remove('hidden');
}

customAlertOkBtn.addEventListener('click', () => {
    customAlertModal.classList.add('hidden');
});

// --- Helper Functions ---
function displayMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.className = `message-box ${type}`;
        element.classList.remove('hidden');
        setTimeout(() => {
            element.classList.add('hidden');
            element.textContent = '';
        }, 5000);
    }
}

function toggleAuthForms(formToShow) {
    if (formToShow === 'login') {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        showLoginBtn.classList.add('active');
        showSignupBtn.classList.remove('active');
    } else {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        showSignupBtn.classList.add('active');
        showLoginBtn.classList.remove('active');
    }
    authMessageDiv.classList.add('hidden');
}

function setActiveSidebarItem(activeBtn) {
    const allSidebarItems = document.querySelectorAll('.sidebar-nav-item');
    allSidebarItems.forEach(item => {
        item.classList.remove('active-sidebar-item');
    });
    activeBtn.classList.add('active-sidebar-item');
}


function showSection(sectionToShow, activeSidebarBtn = null) {
    // Hide all main content sections
    authSection.classList.add('hidden');
    expenseTrackerSection.classList.add('hidden');
    investmentSection.classList.add('hidden');


    // Show the requested section
    sectionToShow.classList.remove('hidden');

    // Set active sidebar item if provided
    if (activeSidebarBtn) {
        setActiveSidebarItem(activeSidebarBtn);
    }
}

function renderExpenses(currentExpenses) {
    expensesListDiv.innerHTML = '';
    let total = 0;

    if (currentExpenses.length === 0) {
        noExpensesMessage.classList.remove('hidden');
        expensesListDiv.appendChild(noExpensesMessage);
    } else {
        noExpensesMessage.classList.add('hidden');
        // Sort expenses by timestamp in descending order (newest first)
        currentExpenses.sort((a, b) => b.timestamp - a.timestamp);

        currentExpenses.forEach(expense => {
            const expenseItem = document.createElement('div');
            expenseItem.className = 'flex justify-between items-center p-3 bg-white rounded-md shadow-sm border border-gray-200';

            // Format the date for display
            const formattedDate = expense.date ? new Date(expense.date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';

            expenseItem.innerHTML = `
                        <div>
                            <p class="font-medium text-gray-800">${expense.description}</p>
                            <p class="text-sm text-gray-500">Category: ${expense.category || 'N/A'}</p>
                            <p class="text-sm text-gray-500">Date: ${formattedDate}</p>
                            <p class="text-sm text-gray-500">Amount: $${expense.amount.toFixed(2)}</p>
                        </div>
                        <div class="flex items-center gap-2">
                            <button data-id="${expense.id}"
                                data-description="${expense.description}"
                                data-category="${expense.category}"
                                data-amount="${expense.amount}"
                                data-date="${expense.date}"
                                class="edit-expense-btn px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200 transition duration-150 ease-in-out">Edit</button>
                            <button data-id="${expense.id}" class="delete-expense-btn px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200 transition duration-150 ease-in-out">Delete</button>
                        </div>
                    `;
            expensesListDiv.appendChild(expenseItem);
            total += expense.amount;
        });
    }
    totalExpensesSpan.textContent = `$${total.toFixed(2)}`;
}


function renderInvestments(currentInvestments) {
    investmentsListDiv.innerHTML = '';
    let total = 0;

    if (currentInvestments.length === 0) {
        noInvestmentsMessage.classList.remove('hidden');
        investmentsListDiv.appendChild(noInvestmentsMessage);
    } else {
        noInvestmentsMessage.classList.add('hidden');
        // Sort investments by timestamp in descending order (newest first)
        currentInvestments.sort((a, b) => b.timestamp - a.timestamp);

        currentInvestments.forEach(investment => {
            const investmentItem = document.createElement('div');
            investmentItem.className = 'flex justify-between items-center p-3 bg-white rounded-md shadow-sm border border-gray-200';

            // Format the date for display
            const formattedDate = investment.date ? new Date(investment.date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';

            investmentItem.innerHTML = `
                        <div>
                            <p class="font-medium text-gray-800">${investment.name}</p>
                            <p class="text-sm text-gray-500">Date: ${formattedDate}</p>
                            <p class="text-sm text-gray-500">Amount: $${investment.amount.toFixed(2)}</p>
                        </div>
                        <div class="flex items-center gap-2">
                            <button data-id="${investment.id}"
                                data-name="${investment.name}"
                                data-amount="${investment.amount}"
                                data-date="${investment.date}"
                                class="edit-investment-btn px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200 transition duration-150 ease-in-out">Edit</button>
                            <button data-id="${investment.id}" class="delete-investment-btn px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200 transition duration-150 ease-in-out">Delete</button>
                        </div>
                    `;
            investmentsListDiv.appendChild(investmentItem);
            total += investment.amount;
        });
    }
    totalInvestmentsSpan.textContent = `$${total.toFixed(2)}`;
}


// --- Event Listeners ---

// Toggle between login and signup forms
showLoginBtn.addEventListener('click', () => toggleAuthForms('login'));
showSignupBtn.addEventListener('click', () => toggleAuthForms('signup'));

// Handle User Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginEmailInput.value;
    const password = loginPasswordInput.value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        displayMessage("auth-message", "Logged in successfully!", "success");
    } catch (error) {
        console.error("Login error:", error);
        let errorMessage = "Failed to log in. Please check your credentials.";
        if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address.';
        } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            errorMessage = 'Invalid email or password.';
        }
        displayMessage("auth-message", errorMessage, "error");
    }
});

// Handle User Sign Up
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = signupEmailInput.value;
    const password = signupPasswordInput.value;
    const confirmPassword = signupConfirmPasswordInput.value;

    if (password !== confirmPassword) {
        displayMessage("auth-message", "Passwords do not match.", "error");
        return;
    }

    try {
        await createUserWithEmailAndPassword(auth, email, password);
        // After successful signup, sign the user out immediately.
        await signOut(auth);
        displayMessage("auth-message", "Account created successfully! Please log in.", "success");
        // Redirect to the login form
        toggleAuthForms('login');
        signupForm.reset(); // Clear the signup form fields
    } catch (error) {
        console.error("Sign up error:", error);
        let errorMessage = "Failed to create account. Please try again.";
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Email address already in use.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Password should be at least 6 characters.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address.';
        }
        displayMessage("auth-message", errorMessage, "error");
    }
});

// Handle User Logout
logoutSidebarButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        displayMessage("auth-message", "Logged out successfully!", "success");
    } catch (error) {
        console.error("Logout error:", error);
        displayMessage("auth-message", "Failed to log out. Please try again.", "error");
    }
});

// --- Sidebar Navigation Handlers ---


expensesSidebarBtn.addEventListener('click', () => {
    showSection(expenseTrackerSection, expensesSidebarBtn);
});

investmentsSidebarBtn.addEventListener('click', () => {
    showSection(investmentSection, investmentsSidebarBtn);
});


// Handle Adding New Expense
addExpenseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const description = expenseDescriptionInput.value.trim();
    const category = expenseCategorySelect.value;
    const amount = parseFloat(expenseAmountInput.value);
    const date = expenseDateInput.value;

    if (!description || !category || isNaN(amount) || amount <= 0 || !date) {
        displayMessage("expense-message", "Please fill in all fields: description, category, amount, and date.", "error");
        return;
    }

    if (!userId) {
        displayMessage("expense-message", "User not authenticated. Please log in.", "error");
        return;
    }

    try {
        await addDoc(collection(db, `artifacts/${appId}/users/${userId}/expenses`), {
            description: description,
            category: category,
            amount: amount,
            date: date,
            timestamp: serverTimestamp()
        });
        displayMessage("expense-message", "Expense added successfully!", "success");
        expenseDescriptionInput.value = '';
        expenseCategorySelect.value = '';
        expenseAmountInput.value = '';
        expenseDateInput.value = '';
    } catch (error) {
        console.error("Error adding expense:", error);
        displayMessage("expense-message", "Failed to add expense. Please try again.", "error");
    }
});

// Handle Deleting Expense (Event delegation)
expensesListDiv.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-expense-btn')) {
        const expenseId = e.target.dataset.id;
        if (!expenseId) {
            console.error("No expense ID found for deletion.");
            return;
        }

        if (!userId) {
            displayMessage("expense-message", "User not authenticated. Cannot delete expense.", "error");
            return;
        }

        try {
            await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/expenses`, expenseId));
            displayMessage("expense-message", "Expense deleted successfully!", "success");
        } catch (error) {
            console.error("Error deleting expense:", error);
            displayMessage("expense-message", "Failed to delete expense. Please try again.", "error");
        }
    } else if (e.target.classList.contains('edit-expense-btn')) {
        const expenseId = e.target.dataset.id;
        const description = e.target.dataset.description;
        const category = e.target.dataset.category;
        const amount = e.target.dataset.amount;
        const date = e.target.dataset.date;

        // Populate the edit modal fields
        editExpenseIdInput.value = expenseId;
        editExpenseDescriptionInput.value = description;
        editExpenseCategorySelect.value = category;
        editExpenseAmountInput.value = amount;
        editExpenseDateInput.value = date;

        // Show the edit modal
        editExpenseModal.classList.remove('hidden');
    }
});

// Handle submitting the edited expense
editExpenseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const expenseId = editExpenseIdInput.value;
    const description = editExpenseDescriptionInput.value.trim();
    const category = editExpenseCategorySelect.value;
    const amount = parseFloat(editExpenseAmountInput.value);
    const date = editExpenseDateInput.value;

    if (!description || !category || isNaN(amount) || amount <= 0 || !date) {
        displayMessage("edit-expense-message", "Please fill in all fields: description, category, amount, and date.", "error");
        return;
    }

    if (!userId) {
        displayMessage("edit-expense-message", "User not authenticated. Please log in.", "error");
        return;
    }

    try {
        const expenseRef = doc(db, `artifacts/${appId}/users/${userId}/expenses`, expenseId);
        await updateDoc(expenseRef, {
            description: description,
            category: category,
            amount: amount,
            date: date
        });
        displayMessage("expense-message", "Expense updated successfully!", "success");
        editExpenseModal.classList.add('hidden');
    } catch (error) {
        console.error("Error updating expense:", error);
        displayMessage("edit-expense-message", "Failed to update expense. Please try again.", "error");
    }
});

// Cancel edit expense
cancelEditExpenseBtn.addEventListener('click', () => {
    editExpenseModal.classList.add('hidden');
    editExpenseMessageDiv.classList.add('hidden');
});


// Handle Adding New Investment
addInvestmentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = investmentNameInput.value.trim();
    const amount = parseFloat(investmentAmountInput.value);
    const date = investmentDateInput.value;

    if (!name || isNaN(amount) || amount <= 0 || !date) {
        displayMessage("investment-message", "Please fill in all fields: name, amount, and date.", "error");
        return;
    }

    if (!userId) {
        displayMessage("investment-message", "User not authenticated. Please log in.", "error");
        return;
    }

    try {
        await addDoc(collection(db, `artifacts/${appId}/users/${userId}/investments`), {
            name: name,
            amount: amount,
            date: date,
            timestamp: serverTimestamp()
        });
        displayMessage("investment-message", "Investment added successfully!", "success");
        investmentNameInput.value = '';
        investmentAmountInput.value = '';
        investmentDateInput.value = '';
    } catch (error) {
        console.error("Error adding investment:", error);
        displayMessage("investment-message", "Failed to add investment. Please try again.", "error");
    }
});

// Handle Deleting Investment (Event delegation)
investmentsListDiv.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-investment-btn')) {
        const investmentId = e.target.dataset.id;
        if (!investmentId) {
            console.error("No investment ID found for deletion.");
            return;
        }

        if (!userId) {
            displayMessage("investment-message", "User not authenticated. Cannot delete investment.", "error");
            return;
        }

        try {
            await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/investments`, investmentId));
            displayMessage("investment-message", "Investment deleted successfully!", "success");
        } catch (error) {
            console.error("Error deleting investment:", error);
            displayMessage("investment-message", "Failed to delete investment. Please try again.", "error");
        }
    } else if (e.target.classList.contains('edit-investment-btn')) {
        const investmentId = e.target.dataset.id;
        const name = e.target.dataset.name;
        const amount = e.target.dataset.amount;
        const date = e.target.dataset.date;

        // Populate the edit modal fields
        editInvestmentIdInput.value = investmentId;
        editInvestmentNameInput.value = name;
        editInvestmentAmountInput.value = amount;
        editInvestmentDateInput.value = date;

        // Show the edit modal
        editInvestmentModal.classList.remove('hidden');
    }
});

// Handle submitting the edited investment
editInvestmentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const investmentId = editInvestmentIdInput.value;
    const name = editInvestmentNameInput.value.trim();
    const amount = parseFloat(editInvestmentAmountInput.value);
    const date = editInvestmentDateInput.value;

    if (!name || isNaN(amount) || amount <= 0 || !date) {
        displayMessage("edit-investment-message", "Please fill in all fields: name, amount, and date.", "error");
        return;
    }

    if (!userId) {
        displayMessage("edit-investment-message", "User not authenticated. Please log in.", "error");
        return;
    }

    try {
        const investmentRef = doc(db, `artifacts/${appId}/users/${userId}/investments`, investmentId);
        await updateDoc(investmentRef, {
            name: name,
            amount: amount,
            date: date
        });
        displayMessage("investment-message", "Investment updated successfully!", "success");
        editInvestmentModal.classList.add('hidden');
    } catch (error) {
        console.error("Error updating investment:", error);
        displayMessage("edit-investment-message", "Failed to update investment. Please try again.", "error");
    }
});

// Cancel edit investment
cancelEditInvestmentBtn.addEventListener('click', () => {
    editInvestmentModal.classList.add('hidden');
    editInvestmentMessageDiv.classList.add('hidden');
});


// --- Firebase Authentication State Listener ---
onAuthStateChanged(auth, async (user) => {
    isAuthReady = true;
    if (user) {
        // User is signed in.
        userId = user.uid;
        sidebar.classList.add('visible');

        showSection(expenseTrackerSection, expensesSidebarBtn);

        console.log("User logged in:", userId);

        // Setup real-time listener for expenses
        const expensesQuery = query(collection(db, `artifacts/${appId}/users/${userId}/expenses`));
        onSnapshot(expensesQuery, (snapshot) => {
            const expensesData = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                expensesData.push({
                    id: doc.id,
                    description: data.description,
                    category: data.category,
                    amount: data.amount,
                    date: data.date,
                    timestamp: data.timestamp ? data.timestamp.toMillis() : 0
                });
            });
            renderExpenses(expensesData);
        }, (error) => {
            console.error("Error fetching expenses:", error);
            displayMessage("expense-message", "Failed to load expenses. Please try again.", "error");
        });

        // Setup real-time listener for investments
        const investmentsQuery = query(collection(db, `artifacts/${appId}/users/${userId}/investments`));
        onSnapshot(investmentsQuery, (snapshot) => {
            const investmentsData = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                investmentsData.push({
                    id: doc.id,
                    name: data.name,
                    amount: data.amount,
                    date: data.date,
                    timestamp: data.timestamp ? data.timestamp.toMillis() : 0
                });
            });
            renderInvestments(investmentsData);
        }, (error) => {
            console.error("Error fetching investments:", error);
            displayMessage("investment-message", "Failed to load investments. Please try again.", "error");
        });

    } else {
        // User is signed out.
        userId = null;
        sidebar.classList.remove('visible');
        showSection(authSection);
        toggleAuthForms('login');
        console.log("User logged out.");
    }
});

// --- Initial Setup ---
window.onload = async function () {
    if (auth) {
        console.log("App loaded. Waiting for Firebase Auth state.");
    } else {
        console.error("Auth object not initialized. Cannot proceed with authentication.");
        displayMessage("auth-message", "Firebase Auth not initialized. Please check console for errors.", "error");
    }

};
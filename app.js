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
            serverTimestamp
        } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

        // --- Firebase Initialization ---
        let app;
        let db;
        let auth;
        let userId = null; // To store the current user's ID
        let isAuthReady = false; // Flag to indicate if auth state has been checked

        // User provided firebaseConfig directly, so use it.
        const firebaseConfig = {
            apiKey: "AIzaSyBmcBMtmd_DDPUiSRnzYiuspBC-GPKeAso",
            authDomain: "expensetracker-b0af0.firebaseapp.com",
            projectId: "expensetracker-b0af0",
            storageBucket: "expensetracker-b0af0.firebaseapp.com",
            messagingSenderId: "837224581675",
            appId: "1:837224581675:web:7cbb65f59b9622cc44386e"
        };

        // Get __app_id from Canvas environment
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
        // const contactUsSection = document.getElementById('contact-us-section'); // REMOVED: Get the contact us section
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
        // const contactUsSidebarBtn = document.getElementById('contact-us-sidebar-btn'); // REMOVED

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
                }, 5000); // Hide after 5 seconds
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
            authMessageDiv.classList.add('hidden'); // Clear any previous auth messages
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
            expensesListDiv.innerHTML = ''; // Clear previous list
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
                        <button data-id="${expense.id}" class="delete-expense-btn px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200 transition duration-150 ease-in-out">Delete</button>
                    `;
                    expensesListDiv.appendChild(expenseItem);
                    total += expense.amount;
                });
            }
            totalExpensesSpan.textContent = `$${total.toFixed(2)}`;
        }


        function renderInvestments(currentInvestments) {
            investmentsListDiv.innerHTML = ''; // Clear previous list
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
                        <button data-id="${investment.id}" class="delete-investment-btn px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200 transition duration-150 ease-in-out">Delete</button>
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
                displayMessage("auth-message", "Account created and logged in successfully!", "success");
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
        // New sidebar button event listeners
        // REMOVED: profileSidebarBtn.addEventListener('click', () => {
        // REMOVED:    displayMessage("expense-message", "Profile page coming soon!", "success");
        // REMOVED:    showSection(expenseTrackerSection, profileSidebarBtn);
        // REMOVED: });

        expensesSidebarBtn.addEventListener('click', () => {
            showSection(expenseTrackerSection, expensesSidebarBtn);
        });

        investmentsSidebarBtn.addEventListener('click', () => {
            showSection(investmentSection, investmentsSidebarBtn);
        });

        aboutSidebarBtn.addEventListener('click', () => {
            displayMessage("expense-message", "About page coming soon!", "success");
            showSection(expenseTrackerSection, aboutSidebarBtn);
        });

        messagesSidebarBtn.addEventListener('click', () => {
            displayMessage("expense-message", "Messages page coming soon!", "success");
            showSection(expenseTrackerSection, messagesSidebarBtn);
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
            }
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
            }
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

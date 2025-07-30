// This JavaScript file will handle any specific interactions for the about page.
// It now includes Firebase initialization to handle direct logout.

// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
    getAuth,
    signOut,
    signInWithCustomToken, // Added for initial auth if needed by Canvas environment
    signInAnonymously // Added for initial auth if needed by Canvas environment
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

// Firebase configuration (copied from your app.js)
// IMPORTANT: In a real application, consider a more secure way to manage API keys.
const firebaseConfig = {
    apiKey: "AIzaSyBmcBMtmd_DDPUiSRnzYiuspBC-GPKeAso",
    authDomain: "expensetracker-b0af0.firebaseapp.com",
    projectId: "expensetracker-b0af0",
    storageBucket: "expensetracker-b0af0.firebaseapp.com",
    messagingSenderId: "837224581675",
    appId: "1:837224581675:web:7cbb65f59b9622cc44386e"
};

let app;
let auth;

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Firebase only if it hasn't been initialized yet
    if (!app) {
        try {
            app = initializeApp(firebaseConfig);
            auth = getAuth(app);
            console.log("Firebase initialized in about.js successfully.");

            // Attempt to sign in with custom token if available (for Canvas environment)
            // Or sign in anonymously if no token is provided.
            if (typeof __initial_auth_token !== 'undefined') {
                await signInWithCustomToken(auth, __initial_auth_token);
                console.log("Signed in with custom token in about.js.");
            } else {
                await signInAnonymously(auth);
                console.log("Signed in anonymously in about.js.");
            }

        } catch (error) {
            console.error("Error initializing Firebase in about.js:", error);
            // You might want to display a message to the user here
        }
    }

    // Get references to sidebar buttons
    const profileBtn = document.getElementById('profile-sidebar-btn');
    const expensesBtn = document.getElementById('expenses-sidebar-btn');
    const investmentsBtn = document.getElementById('investments-sidebar-btn');
    const aboutBtn = document.getElementById('about-sidebar-btn');
    const messagesBtn = document.getElementById('messages-sidebar-btn');
    const logoutBtn = document.getElementById('logout-sidebar-button');

    // Function to handle sidebar navigation clicks
    const handleSidebarClick = (event, pageUrl) => {
        event.preventDefault(); // Prevent default link behavior
        window.location.href = pageUrl;
    };

    // Attach event listeners to sidebar buttons
    if (profileBtn) {
        profileBtn.addEventListener('click', (event) => handleSidebarClick(event, 'profile.html'));
    }
    if (expensesBtn) {
        expensesBtn.addEventListener('click', (event) => handleSidebarClick(event, 'dashboard.html'));
    }
    if (investmentsBtn) {
        investmentsBtn.addEventListener('click', (event) => handleSidebarClick(event, 'dashboard.html'));
    }
    if (aboutBtn) {
        aboutBtn.addEventListener('click', (event) => {
            event.preventDefault();
            console.log('Already on the About page.');
            document.querySelectorAll('.sidebar-nav-item').forEach(item => {
                item.classList.remove('active-sidebar-item');
            });
            aboutBtn.classList.add('active-sidebar-item');
        });
    }
    if (messagesBtn) {
        messagesBtn.addEventListener('click', (event) => handleSidebarClick(event, 'messages.html'));
    }

    // Handle logout button click
    if (logoutBtn && auth) { // Ensure auth is initialized before attaching listener
        logoutBtn.addEventListener('click', async () => {
            try {
                await signOut(auth);
                console.log('User logged out successfully from about.js.');
                // Redirect to dashboard.html after successful logout
                // app.js on dashboard.html will detect the logged out state
                window.location.href = 'dashboard.html';
            } catch (error) {
                console.error("Logout error from about.js:", error);
                // You might want to display a message to the user here using a custom modal
                // instead of console.error
            }
        });
    } else if (logoutBtn) {
        console.warn("Firebase Auth not initialized when attaching logout listener in about.js.");
        // Fallback if auth is not ready, though with async init it should be
        logoutBtn.addEventListener('click', () => {
            console.log('Attempting redirect as fallback for logout.');
            window.location.href = 'dashboard.html'; // Fallback redirect
        });
    }


    // Set the 'About' sidebar item as active-sidebar-item when the page loads
    if (aboutBtn) {
        aboutBtn.classList.add('active-sidebar-item');
    }
});

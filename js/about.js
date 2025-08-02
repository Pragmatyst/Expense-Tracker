// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
    getAuth,
    signOut,
    signInWithCustomToken,
    signInAnonymously
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

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
        event.preventDefault();
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
    if (logoutBtn && auth) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await signOut(auth);
                console.log('User logged out successfully from about.js.');

                window.location.href = 'dashboard.html';
            } catch (error) {
                console.error("Logout error from about.js:", error);

            }
        });
    } else if (logoutBtn) {
        console.warn("Firebase Auth not initialized when attaching logout listener in about.js.");

        logoutBtn.addEventListener('click', () => {
            console.log('Attempting redirect as fallback for logout.');
            window.location.href = 'dashboard.html';
        });
    }


    // Set the 'About' sidebar item as active-sidebar-item when the page loads
    if (aboutBtn) {
        aboutBtn.classList.add('active-sidebar-item');
    }
});

// Firebase imports (Ensure these versions match your app.js)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, signInWithCustomToken, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


// --- Firebase Initialization ---
// IMPORTANT: Use your actual Firebase config from app.js or your Firebase project.
const firebaseConfig = {
    apiKey: "AIzaSyBmcBMtmd_DDPUiSRnzYiuspBC-GPKeAso", // Replace with your actual API Key
    authDomain: "expensetracker-b0af0.firebaseapp.com",
    projectId: "expensetracker-b0af0",
    storageBucket: "expensetracker-b0af0.firebaseapp.com",
    messagingSenderId: "837224581675",
    appId: "1:837224581675:web:7cbb65f59b9622cc44386e"
};

let app;
let db;
let auth;
let userId = null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    console.log("Firebase initialized for messages page.");
} catch (error) {
    console.error("Error initializing Firebase for messages page:", error);
    displayMessage("contact-message-box", "Error initializing app. Please try again later.", "error");
}

// --- EmailJS Initialization ---
// Public Key has been replaced with the one you provided.
emailjs.init("syM66z6Ba6eu2T2YD");


// --- DOM Elements for Messages Page ---
const contactForm = document.getElementById('contact-form');
const contactNameInput = document.getElementById('contact-name');
const contactEmailInput = document.getElementById('contact-email');
const contactMessageTextarea = document.getElementById('contact-message');
const contactMessageBox = document.getElementById('contact-message-box');
const logoutSidebarButton = document.getElementById('logout-sidebar-button'); 


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

// Function to set active sidebar item
function setActiveSidebarItem(activeBtn) {
    const allSidebarItems = document.querySelectorAll('.sidebar-nav-item');
    allSidebarItems.forEach(item => {
        item.classList.remove('active-sidebar-item');
    });
    activeBtn.classList.add('active-sidebar-item');
}


// --- Event Listeners ---

// Handle Contact Form Submission with EmailJS
contactForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent default form submission

    const serviceID = 'service_z8gn87f';  
    const templateID = 'template_l3mnc8r'; 

    // Collect form data
    const templateParams = {
        from_name: contactNameInput.value.trim(),
        from_email: contactEmailInput.value.trim(),
        message: contactMessageTextarea.value.trim(),
    
    };

    // Basic validation
    if (!templateParams.from_name || !templateParams.from_email || !templateParams.message) {
        displayMessage("contact-message-box", "Please fill in all fields.", "error");
        return;
    }

    try {
        // Send the email using EmailJS
        const response = await emailjs.send(serviceID, templateID, templateParams);

        console.log('EmailJS Success:', response);
        displayMessage("contact-message-box", "Message sent successfully!", "success");

        // Clear the form
        contactNameInput.value = '';
        contactEmailInput.value = '';
        contactMessageTextarea.value = '';

    } catch (error) {
        console.error('EmailJS Failed:', error);
        displayMessage("contact-message-box", "Failed to send message. Please try again.", "error");
    }
});

// Handle User Logout from sidebar
if (logoutSidebarButton) {
    logoutSidebarButton.addEventListener('click', async () => {
        console.log("Logout button clicked.");
        console.log("Auth object at click:", auth);
        console.log("Current user at click before signOut:", auth.currentUser);
        try {
            if (auth && auth.currentUser) { // Ensure auth and a current user exist
                await signOut(auth);
                displayMessage("contact-message-box", "Logged out successfully!", "success");
                
            } else {
                console.log("No user logged in to sign out. Manual redirecting to dashboard.");
                displayMessage("contact-message-box", "No active session to log out from.", "error");
                window.location.href = 'dashboard.html'; 
            }
        } catch (error) {
            console.error("Logout error:", error);
            displayMessage("contact-message-box", "Failed to log out. Please try again.", "error");
        }
    });
} else {
    console.error("Logout sidebar button not found! Please check messages.html for element with ID 'logout-sidebar-button'.");
}


// --- Firebase Authentication State Listener ---
onAuthStateChanged(auth, async (user) => {
    const sidebar = document.getElementById('sidebar');
    console.log("onAuthStateChanged triggered. User:", user ? user.uid : "null"); // Log user state
    if (user) {
        // User is signed in.
        userId = user.uid;
        sidebar.classList.add('visible');

        const messagesSidebarBtn = document.getElementById('messages-sidebar-btn');
        if (messagesSidebarBtn) {
            setActiveSidebarItem(messagesSidebarBtn);
        }
        console.log("Messages page: User logged in:", userId);

        // Pre-fill email if user is logged in
        if (contactEmailInput && user.email) {
            contactEmailInput.value = user.email;
        }

    } else {
        // User is signed out.
        userId = null;
        sidebar.classList.remove('visible');
        console.log("Messages page: User logged out. Redirecting to dashboard.");
        // Redirect to the dashboard (or login page) if not authenticated
        window.location.href = 'dashboard.html';
    }
});

// Initial authentication check for Canvas environment
window.onload = async function() {
    console.log("Window loaded for messages page.");
    const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
    console.log("Initial auth token:", initialAuthToken ? "present" : "not present");

    if (auth) {
        if (initialAuthToken) {
            try {
                await signInWithCustomToken(auth, initialAuthToken);
                console.log("Signed in with custom token successfully.");
            } catch (error) {
                console.error("Error signing in with custom token:", error);
                await signInAnonymously(auth); // Fallback to anonymous
                console.log("Signed in anonymously due to custom token error.");
            }
        } else {
            // If no custom token, sign in anonymously for basic functionality
            await signInAnonymously(auth);
            console.log("Signed in anonymously.");
        }
    } else {
        console.error("Auth object not initialized. Cannot proceed with authentication.");
    }
};

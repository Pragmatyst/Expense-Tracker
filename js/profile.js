// Firebase imports 
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// --- Firebase Initialization ---
const firebaseConfig = {
    apiKey: "AIzaSyBmcBMtmd_DDPUiSRnzYiuspBC-GPKeAso",
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
    console.log("Firebase initialized for profile page.");
} catch (error) {
    console.error("Error initializing Firebase for profile page:", error);
    displayMessage("profile-message", "Error initializing app. Please try again later.", "error");
}

// --- DOM Elements for Profile Page ---
const profileNameDisplay = document.getElementById('profile-name-display');
const profileOccupationDisplay = document.getElementById('profile-occupation-display');
const userIdDisplay = document.getElementById('user-id-display');

const fullNameInput = document.getElementById('full-name');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const locationInput = document.getElementById('location');
const bioTextarea = document.getElementById('bio');

const saveProfileButton = document.getElementById('save-profile-button');
const logoutButton = document.getElementById('logout-button');
const profileMessageDiv = document.getElementById('profile-message');

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

async function fetchUserProfile(uid) {
    try {
        const userDocRef = doc(db, `artifacts/${appId}/users`, uid);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            console.log("Profile data fetched:", data);

            // Populate form fields
            fullNameInput.value = data.fullName || '';
            emailInput.value = data.email || '';
            phoneInput.value = data.phone || '';
            locationInput.value = data.location || '';
            bioTextarea.value = data.bio || '';

            // Update display elements
            profileNameDisplay.textContent = data.fullName || 'User Name';
            profileOccupationDisplay.textContent = data.occupation || 'No Occupation Set';
            userIdDisplay.textContent = `User ID: ${uid}`;
            userIdDisplay.classList.remove('hidden');
        } else {
            console.log("No profile data found for user, setting initial data.");

            emailInput.value = auth.currentUser.email || '';
            profileNameDisplay.textContent = auth.currentUser.email || 'User';
            userIdDisplay.textContent = `User ID: ${uid}`;
            userIdDisplay.classList.remove('hidden');

            // Save initial profile data
            await setDoc(doc(db, `artifacts/${appId}/users`, uid), {
                email: auth.currentUser.email,
                fullName: auth.currentUser.displayName || '',
                createdAt: new Date().toISOString(),

            }, { merge: true });
        }
    } catch (error) {
        console.error("Error fetching user profile:", error);
        displayMessage("profile-message", "Failed to load profile. Please try again.", "error");
    }
}

async function saveUserProfile() {
    if (!userId) {
        displayMessage("profile-message", "No user logged in to save profile.", "error");
        return;
    }

    const profileData = {
        fullName: fullNameInput.value.trim(),
        email: emailInput.value.trim(),
        phone: phoneInput.value.trim(),
        location: locationInput.value.trim(),
        bio: bioTextarea.value.trim(),
        updatedAt: new Date().toISOString(),
    };

    try {
        await setDoc(doc(db, `artifacts/${appId}/users`, userId), profileData, { merge: true });
        displayMessage("profile-message", "Profile updated successfully!", "success");
        console.log("Profile saved:", profileData);

        // Update display elements immediately
        profileNameDisplay.textContent = profileData.fullName || profileData.email;
    } catch (error) {
        console.error("Error saving profile:", error);
        displayMessage("profile-message", "Failed to save profile. Please try again.", "error");
    }
}

// --- Event Listeners ---
saveProfileButton.addEventListener('click', saveUserProfile);

logoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        displayMessage("profile-message", "Logged out successfully!", "success");

        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error("Logout error:", error);
        displayMessage("profile-message", "Failed to log out. Please try again.", "error");
    }
});


// --- Firebase Authentication State Listener ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in.
        userId = user.uid;
        console.log("Profile page: User logged in:", userId);
        fetchUserProfile(userId);
    } else {
        // User is signed out.
        userId = null;
        console.log("Profile page: User logged out. Redirecting to dashboard.");

        window.location.href = 'dashboard.html';
    }
});

// Initial load check (optional, as onAuthStateChanged handles most cases)
window.addEventListener('load', () => {
    if (!auth.currentUser && !userId) {

        console.log("Profile page loaded, no immediate user. Waiting for auth state.");
    }
});
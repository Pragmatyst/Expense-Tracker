// --- Firebase imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    query,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// --- Firebase Initialization ---
let app;
let db;
let auth;
let userId = null;

// User provided firebaseConfig directly
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
    console.log("Firebase initialized successfully in graphs.js");
} catch (error) {
    console.error("Error initializing Firebase in graphs.js:", error);
}

// --- DOM Elements ---
const myLineChartCanvas = document.getElementById('myLineChart');
const noDataMessage = document.getElementById('no-data-message');
const sidebar = document.getElementById('sidebar');
const monthSelect = document.getElementById('month-select');

let myChart = null;

// --- Helper Functions ---
function getMonthFromDate(dateString) {
    if (!dateString) return null;
    return dateString.substring(0, 7);
}

// Function to process data and aggregate by a given key (e.g., date or month)
function processData(data, keyFunction) {
    const totals = {};
    data.forEach(item => {
        const key = keyFunction(item);
        if (!totals[key]) {
            totals[key] = 0;
        }
        totals[key] += item.amount;
    });
    return totals;
}

// Function to populate the month dropdown
function populateMonthDropdown(months) {
    // Clear existing options except for the 'All Time' option
    monthSelect.innerHTML = '<option value="all">All Time</option>';
    months.forEach(month => {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = month;
        monthSelect.appendChild(option);
    });
}

// Function to render the line chart
function renderChart(expensesData, investmentsData, selectedMonth) {
    let labels, expenseTotals, investmentTotals;

    if (selectedMonth && selectedMonth !== 'all') {
        // Filter data for the selected month and aggregate by date
        const filteredExpenses = expensesData.filter(item => getMonthFromDate(item.date) === selectedMonth);
        const filteredInvestments = investmentsData.filter(item => getMonthFromDate(item.date) === selectedMonth);

        const dailyExpenses = processData(filteredExpenses, (item) => item.date);
        const dailyInvestments = processData(filteredInvestments, (item) => item.date);

        const allDays = new Set([...Object.keys(dailyExpenses), ...Object.keys(dailyInvestments)]);
        labels = Array.from(allDays).sort();
        expenseTotals = labels.map(day => dailyExpenses[day] || 0);
        investmentTotals = labels.map(day => dailyInvestments[day] || 0);

    } else {
        // Aggregate by month for the 'All Time' view
        const monthlyExpenses = processData(expensesData, (item) => getMonthFromDate(item.date));
        const monthlyInvestments = processData(investmentsData, (item) => getMonthFromDate(item.date));

        const allMonths = new Set([...Object.keys(monthlyExpenses), ...Object.keys(monthlyInvestments)]);
        labels = Array.from(allMonths).sort();
        expenseTotals = labels.map(month => monthlyExpenses[month] || 0);
        investmentTotals = labels.map(month => monthlyInvestments[month] || 0);
    }

    // Check if there is any data to display
    const hasData = expenseTotals.some(amount => amount > 0) || investmentTotals.some(amount => amount > 0);
    if (!hasData) {
        noDataMessage.classList.remove('hidden');
        myLineChartCanvas.classList.add('hidden');
        // Destroy the chart if it exists and there's no data
        if (myChart) {
            myChart.destroy();
            myChart = null;
        }
        return;
    } else {
        noDataMessage.classList.add('hidden');
        myLineChartCanvas.classList.remove('hidden');
    }


    if (myChart) {
        myChart.destroy();
    }

    // Create the new chart instance
    myChart = new Chart(myLineChartCanvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Expenses',
                data: expenseTotals,
                borderColor: 'rgb(220, 38, 38)',
                backgroundColor: 'rgba(220, 38, 38, 0.5)',
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 5,
                pointHoverRadius: 8
            }, {
                label: 'Investments',
                data: investmentTotals,
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.5)',
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 5,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Amount ($)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: selectedMonth && selectedMonth !== 'all' ? 'Date' : 'Month'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: selectedMonth && selectedMonth !== 'all' ? `Daily Trends for ${selectedMonth}` : 'Monthly Expenses vs. Investments'
                },
                tooltip: {
                    callbacks: {
                        title: function (tooltipItems) {
                            return tooltipItems[0].label;
                        }
                    }
                }
            }
        }
    });
}


// --- Logout Functionality ---
const logoutButton = document.getElementById('logout-sidebar-button');

logoutButton.addEventListener('click', () => {
    auth.signOut().then(() => {
        // Redirect to the login page or dashboard after logout
        window.location.href = "dashboard.html";
        console.log("User signed out successfully.");
    }).catch((error) => {
        console.error("Error signing out:", error);
    });
});

// --- Main application logic ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        userId = user.uid;
        sidebar.classList.add('visible');

        // Combined data listeners
        let expensesData = [];
        let investmentsData = [];
        let expensesLoaded = false;
        let investmentsLoaded = false;

        const updateChart = () => {
            if (expensesLoaded && investmentsLoaded) {
                // Get all unique months from both datasets using the 'date' field
                const allMonths = new Set([
                    ...expensesData.map(item => getMonthFromDate(item.date)),
                    ...investmentsData.map(item => getMonthFromDate(item.date))
                ]);
                const sortedMonths = Array.from(allMonths).filter(Boolean).sort();

                populateMonthDropdown(sortedMonths);
                renderChart(expensesData, investmentsData, monthSelect.value);
            }
        };

        const expensesQuery = query(collection(db, `artifacts/${appId}/users/${userId}/expenses`));
        onSnapshot(expensesQuery, (snapshot) => {
            expensesData = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                expensesData.push({
                    id: doc.id,
                    description: data.description,
                    amount: data.amount,
                    category: data.category,
                    date: data.date,
                    timestamp: data.timestamp ? data.timestamp.toMillis() : 0
                });
            });
            expensesLoaded = true;
            updateChart();
        }, (error) => {
            console.error("Error fetching expenses:", error);
        });

        const investmentsQuery = query(collection(db, `artifacts/${appId}/users/${userId}/investments`));
        onSnapshot(investmentsQuery, (snapshot) => {
            investmentsData = [];
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
            investmentsLoaded = true;
            updateChart();
        }, (error) => {
            console.error("Error fetching investments:", error);
        });

        // Event listener for the month dropdown
        monthSelect.addEventListener('change', () => {
            renderChart(expensesData, investmentsData, monthSelect.value);
        });

    } else {
        // User is signed out, handle redirection or display
        userId = null;
        sidebar.classList.remove('visible');
        window.location.href = "dashboard.html"; // Redirect to the main dashboard
        console.log("User logged out from graphs.html.");
    }
});

// --- Initial Setup ---\
window.onload = function () {
    // Add a check to ensure the sidebar is visible if the user is authenticated.
    if (auth && auth.currentUser) {
        sidebar.classList.add('visible');
    }
};

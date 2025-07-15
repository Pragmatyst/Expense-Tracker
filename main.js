//======================DAGDAG NI CALLANGAN 07/11/25 ============================================
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDT_t3Uws3opDc4-bwzMHivFV-Ft5s--DA",
  authDomain: "expense-e2ba3.firebaseapp.com",
  projectId: "expense-e2ba3",
  storageBucket: "expense-e2ba3.firebasestorage.app",
  messagingSenderId: "205780844879",
  appId: "1:205780844879:web:8c7f64cb15c2dc8db9853a",
  measurementId: "G-4M6LZJP07T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

//===============================END===============================================================


// Add JS hereconst form = document.getElementById('expense-form');
const expenseList = document.getElementById('expense-list');

// Add Expense
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const description = document.getElementById('description').value;
  const amount = parseFloat(document.getElementById('amount').value);
  const date = document.getElementById('date').value;
  const category = document.getElementById('category').value;

  await db.collection('expenses').add({
    description,
    amount,
    date,
    category
  });

  form.reset();
  loadExpenses();
});

// Load All Expenses
async function loadExpenses() {
  expenseList.innerHTML = '';
  const snapshot = await db.collection('expenses').orderBy('date', 'desc').get();

  snapshot.forEach(doc => {
    const expense = doc.data();
    const li = document.createElement('div');
    li.className = 'expense-item';
    li.innerHTML = `
      <div class="expense-details">
        <strong>${expense.date}</strong><br>
        ${expense.description} - ₱${expense.amount} <em>(${expense.category})</em>
      </div>
      <div class="expense-actions">
        <button class="edit-btn" onclick="editExpense('${doc.id}', '${expense.description}', ${expense.amount}, '${expense.date}', '${expense.category}')">Edit</button>
        <button class="delete-btn" onclick="deleteExpense('${doc.id}')">Delete</button>
      </div>
    `;
    expenseList.appendChild(li);
  });
}

// Delete Expense
async function deleteExpense(id) {
  await db.collection('expenses').doc(id).delete();
  loadExpenses();
}

// Edit Expense
function editExpense(id, desc, amt, date, cat) {
  document.getElementById('description').value = desc;
  document.getElementById('amount').value = amt;
  document.getElementById('date').value = date;
  document.getElementById('category').value = cat;

  form.removeEventListener('submit', addHandler); // Prevent duplicate
  form.onsubmit = async (e) => {
    e.preventDefault();
    await db.collection('expenses').doc(id).update({
      description: form.description.value,
      amount: parseFloat(form.amount.value),
      date: form.date.value,
      category: form.category.value
    });

    form.reset();
    form.onsubmit = addHandler;
    loadExpenses();
  };
}

// Default handler
const addHandler = form.onsubmit;
loadExpenses();
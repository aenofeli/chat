// 1. Import the specific Firebase functions we need from the official CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// 2. PASTE YOUR CONFIGURATION FROM STEP 2 HERE:
const firebaseConfig = {
  apiKey: "AIzaSyBc9tVE3595zA_UFCQT6RzzYUg6-XlN5V0",
  authDomain: "kotha-25bb1.firebaseapp.com",
  projectId: "kotha-25bb1",
  storageBucket: "kotha-25bb1.firebasestorage.app",
  messagingSenderId: "578692131363",
  appId: "1:578692131363:web:ea90ff99f0d5ef99279f96",
  measurementId: "G-P2EC4V07CW"
};

// 3. Initialize Firebase inside our script
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// HTML Elements Layout
const authForm = document.getElementById('auth-form');
const chatBox = document.getElementById('chat-box');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const userDisplay = document.getElementById('user-display');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message-input');

let unsubscribeChat = null; // Used to turn off real-time listeners when logging out

// 4. AUTHENTICATION LISTENER: Tracks if a user signs in or out
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User just logged in! Show the chat, hide the auth form
        authForm.classList.add('hidden');
        chatBox.classList.remove('hidden');
        userDisplay.textContent = user.email;
        listenForMessages(); // Start listening for new text messages
    } else {
        // User logged out or isn't logged in yet
        authForm.classList.remove('hidden');
        chatBox.classList.add('hidden');
        if (unsubscribeChat) unsubscribeChat(); // Stop listening to database changes
    }
});

// 5. SIGN UP ACTION
document.getElementById('btn-signup').addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    createUserWithEmailAndPassword(auth, email, password)
        .catch(error => alert(error.message));
});

// 6. LOG IN ACTION
document.getElementById('btn-login').addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    signInWithEmailAndPassword(auth, email, password)
        .catch(error => alert(error.message));
});

// 7. LOG OUT ACTION
document.getElementById('btn-logout').addEventListener('click', () => {
    signOut(auth);
});

// 8. SEND MESSAGE TO FIRESTORE
document.getElementById('btn-send').addEventListener('click', async () => {
    const text = messageInput.value.trim();
    if (text === "") return;

    messageInput.value = ""; // Clear the input field

    // Add a new document to a global collection called "global_messages"
    await addDoc(collection(db, "global_messages"), {
        sender: auth.currentUser.email,
        messageText: text,
        timestamp: serverTimestamp() // Uses Firebase's server clock for accuracy
    });
});

// 9. REAL-TIME LISTENER: Updates the screen instantly when the database changes
function listenForMessages() {
    // Look at "global_messages" ordered by time
    const q = query(collection(db, "global_messages"), orderBy("timestamp", "asc"));
    
    // onSnapshot fires every single time a document is added, modified, or deleted
    unsubscribeChat = onSnapshot(q, (snapshot) => {
        messagesDiv.innerHTML = ""; // Clear old message elements
        snapshot.forEach((doc) => {
            const data = doc.data();
            const p = document.createElement('p');
            p.textContent = `${data.sender}: ${data.messageText}`;
            messagesDiv.appendChild(p);
        });
        messagesDiv.scrollTop = messagesDiv.scrollHeight; // Auto-scroll to bottom
    });
}
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, addDoc, query, orderBy, onSnapshot, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// PASTE YOUR FIREBASE CONFIGURATION HERE
const firebaseConfig = {
  apiKey: "AIzaSyBc9tVE3595zA_UFCQT6RzzYUg6-XlN5V0",
  authDomain: "kotha-25bb1.firebaseapp.com",
  projectId: "kotha-25bb1",
  storageBucket: "kotha-25bb1.firebasestorage.app",
  messagingSenderId: "578692131363",
  appId: "1:578692131363:web:ea90ff99f0d5ef99279f96",
  measurementId: "G-P2EC4V07CW"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// HTML elements
const authForm = document.getElementById('auth-form');
const chatBox = document.getElementById('chat-box');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const usersListDiv = document.getElementById('users-list');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const btnSend = document.getElementById('btn-send');
const chatHeader = document.getElementById('chat-header');

let activeChatId = null; // Stores the current private room ID
let unsubscribeChat = null; // Unsubscribes from old chat rooms

// TRACK AUTH STATE
onAuthStateChanged(auth, async (user) => {
    if (user) {
        authForm.classList.add('hidden');
        chatBox.style.display = 'flex'; // Show main application layout
        
        // SAVE user's record to the database so others can see them in the sidebar
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            email: user.email
        }, { merge: true });

        loadUsersList(); // Load the sidebar
    } else {
        authForm.classList.remove('hidden');
        chatBox.style.display = 'none';
        if (unsubscribeChat) unsubscribeChat();
    }
});

// FETCH REGISTERED USERS FOR SIDEBAR
async function loadUsersList() {
    const querySnapshot = await getDocs(collection(db, "users"));
    usersListDiv.innerHTML = ""; // Reset list
    
    querySnapshot.forEach((docSnap) => {
        const userRecord = docSnap.data();
        
        // Show everyone except yourself
        if (userRecord.uid !== auth.currentUser.uid) {
            const userBtn = document.createElement('button');
            userBtn.textContent = userRecord.email;
            userBtn.style.display = 'block';
            userBtn.style.margin = '5px 0';
            userBtn.style.width = '100%';
            
            // When clicked, start a private DM session
            userBtn.onclick = () => openPrivateChat(userRecord);
            usersListDiv.appendChild(userBtn);
        }
    });
}

// OPEN PRIVATE DM CHAT
function openPrivateChat(targetUser) {
    if (unsubscribeChat) unsubscribeChat(); // Stop listening to the previous person's chat
    
    // Sort UIDs alphabetically so the room ID is identical for both users
    activeChatId = [auth.currentUser.uid, targetUser.uid].sort().join('_');
    
    chatHeader.textContent = `DM with: ${targetUser.email}`;
    messageInput.disabled = false;
    btnSend.disabled = false;

    // Listen for messages inside this specific private room ID
    const q = query(collection(db, "chats", activeChatId, "messages"), orderBy("timestamp", "asc"));
    
    unsubscribeChat = onSnapshot(q, (snapshot) => {
        messagesDiv.innerHTML = "";
        snapshot.forEach((doc) => {
            const data = doc.data();
            const p = document.createElement('p');
            // Show "You" or the sender's email
            const senderName = data.senderId === auth.currentUser.uid ? "You" : targetUser.email;
            p.textContent = `${senderName}: ${data.text}`;
            messagesDiv.appendChild(p);
        });
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });
}

// SEND PRIVATE MESSAGE
btnSend.addEventListener('click', sendPrivateMessage);
messageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendPrivateMessage(); });

async function sendPrivateMessage() {
    const text = messageInput.value.trim();
    if (text === "" || !activeChatId) return;

    messageInput.value = "";

    // Save message inside: chats -> [private_room_id] -> messages -> [individual_message]
    await addDoc(collection(db, "chats", activeChatId, "messages"), {
        senderId: auth.currentUser.uid,
        text: text,
        timestamp: serverTimestamp()
    });
}

// SIGN UP, LOGIN, LOGOUT BUTTONS
document.getElementById('btn-signup').addEventListener('click', () => {
    createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value).catch(error => alert(error.message));
});
document.getElementById('btn-login').addEventListener('click', () => {
    signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value).catch(error => alert(error.message));
});
document.getElementById('btn-logout').addEventListener('click', () => { signOut(auth); window.location.reload(); });

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
const displayNameInput = document.getElementById('display-name');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const usersListDiv = document.getElementById('users-list');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const btnSend = document.getElementById('btn-send');
const chatHeader = document.getElementById('chat-header');

let activeChatId = null; 
let unsubscribeChat = null; 

// TRACK AUTH STATE
onAuthStateChanged(auth, async (user) => {
    if (user) {
        authForm.classList.add('hidden');
        chatBox.classList.remove('hidden');
        
        const userProfile = {
            uid: user.uid,
            email: user.email
        };

        const chosenName = displayNameInput.value.trim();
        if (chosenName !== "") {
            userProfile.displayName = chosenName;
        }

        await setDoc(doc(db, "users", user.uid), userProfile, { merge: true });
        loadUsersList(); 
    } else {
        authForm.classList.remove('hidden');
        chatBox.classList.add('hidden');
        if (unsubscribeChat) unsubscribeChat();
    }
});

// FETCH REGISTERED USERS FOR SIDEBAR
async function loadUsersList() {
    const querySnapshot = await getDocs(collection(db, "users"));
    usersListDiv.innerHTML = ""; 
    
    querySnapshot.forEach((docSnap) => {
        const userRecord = docSnap.data();
        
        if (userRecord.uid !== auth.currentUser.uid) {
            const userBtn = document.createElement('button');
            const nameToShow = userRecord.displayName ? userRecord.displayName : userRecord.email;
            userBtn.textContent = `👤 ${nameToShow}`;
            
            userBtn.onclick = () => openPrivateChat(userRecord);
            usersListDiv.appendChild(userBtn);
        }
    });
}

// OPEN PRIVATE DM CHAT
function openPrivateChat(targetUser) {
    if (unsubscribeChat) unsubscribeChat(); 
    
    activeChatId = [auth.currentUser.uid, targetUser.uid].sort().join('_');
    
    const targetName = targetUser.displayName ? targetUser.displayName : targetUser.email;
    chatHeader.textContent = `💬 Conversation with: ${targetName}`;
    
    messageInput.disabled = false;
    btnSend.disabled = false;

    const q = query(collection(db, "chats", activeChatId, "messages"), orderBy("timestamp", "asc"));
    
    unsubscribeChat = onSnapshot(q, (snapshot) => {
        messagesDiv.innerHTML = "";
        snapshot.forEach((doc) => {
            const data = doc.data();
            
            // Outer bubble container
            const bubble = document.createElement('div');
            bubble.classList.add('msg-bubble');
            
            if (data.senderId === auth.currentUser.uid) {
                bubble.classList.add('msg-me');
            } else {
                bubble.classList.add('msg-them');
            }

            // Message text container
            const textNode = document.createTextNode(data.text);
            bubble.appendChild(textNode);

            // Create timestamp layout element
            if (data.timestamp) {
                const timeSpan = document.createElement('span');
                timeSpan.classList.add('msg-time');
                
                // Convert Firebase Timestamp into standard browser clock readable text
                const date = data.timestamp.toDate();
                timeSpan.textContent = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                bubble.appendChild(timeSpan);
            }

            messagesDiv.appendChild(bubble);
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

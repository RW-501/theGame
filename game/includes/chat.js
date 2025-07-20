const chatPopupHTML = `
<div class="chat-popup shadow-lg rounded d-none" id="chatContainer" style="max-width:400px; height: auto; right: 20px; bottom: 5px; position: fixed; z-index: 30000; background: white; color: var(--text-light);">
  <!-- Header -->
  <div class="chat-header bg-primary text-white p-2 d-flex justify-content-between align-items-center">
    <span>Live Chat</span>
    <button class="btn-close btn-close-white" id="closeChatBtn"></button>
  </div>

  <!-- Scrollable Middle Section -->
  <div class="flex-grow-1 overflow-auto position-relative" style="height: 300px; background: var(--bg-light);">
    <!-- Chat Settings -->
    <div id="chatSettings" class="d-none p-2 small position-relative" style="min-height: 100%;">
      <button class="btn btn-sm btn-outline-secondary position-absolute top-0 end-0 m-2 text-muted backBtn" id="backFromSettingsBtn">Back</button>
      <strong>Chat Settings</strong>
      <p class="text-muted">More settings coming soon...</p>
    </div>

    <!-- User List -->
    <div id="chatUserList" class="d-none p-2 small position-relative" style="min-height: 100%;">
      <button class="btn btn-sm btn-outline-secondary position-absolute top-0 end-0 m-2 text-muted backBtn" id="backFromUsersBtn">Back</button>
      <strong>Recent Users</strong>
      <ul id="recentUsers" class="list-unstyled mb-0"></ul>
    </div>

    <div id="chatMessages" class="chat-body p-2" style="min-height: 100%; overflow-y:auto;"></div>
  </div>

  <!-- Bottom Info -->
  <div class="bottom-area d-flex justify-content-between align-items-center px-2 py-1 border-top bg-light">
    <div class="d-flex align-items-center">
      <img id="currentUserAvatar" src="https://rw-501.github.io/contenthub/images/defaultAvatar.png"
           class="rounded-circle me-2" style="width: 32px; height: 32px;" alt="User" />
      <div>
        <div id="currentUserName" class="fw-bold text-dark small"></div>
        <div class="text-muted small">You</div>
      </div>
    </div>

    <div class="d-flex align-items-center">
      <button class="btn btn-sm btn-light me-1" id="toggleUserListBtn">👥</button>
      <button class="btn btn-sm btn-light" id="toggleChatSettingsBtn">⚙️</button>
    </div>
  </div>

  <!-- Footer Input -->
  <div class="chat-footer p-2 border-top" style="background: var(--bg-dark);">
    <input id="chatInput" class="form-control" placeholder="Type a message..." autocomplete="off" />
    <button id="sendBtn" class="btn btn-success mt-2 w-100">Send</button>
  </div>
</div>
`;


import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { auth, db, onAuthStateChanged } from "https://rw-501.github.io/theGame/firebase/firebase-config.js";


let currentUser = null;
let chatListenerUnsub = null;
const renderedMessages = new Set();

document.getElementById("openChatBtn").addEventListener("click", async () => {
  // Insert chat HTML into body if not present
  if (!document.getElementById("chatContainer")) {
    document.body.insertAdjacentHTML("beforeend", chatPopupHTML);

    // Attach close button listener
    document.getElementById("closeChatBtn").addEventListener("click", () => {
      toggleChat(false);
    });

    // Attach toggle user list and settings listeners
    document.getElementById("toggleUserListBtn").addEventListener("click", toggleUserList);
    document.getElementById("toggleChatSettingsBtn").addEventListener("click", toggleChatSettings);
    document.getElementById("backFromSettingsBtn").addEventListener("click", showChatMessages);
    document.getElementById("backFromUsersBtn").addEventListener("click", showChatMessages);

    // Setup message input Enter key behavior
    document.getElementById("chatInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        document.getElementById("sendBtn").click();
      }
    });

    // Setup send button listener
    document.getElementById("sendBtn").addEventListener("click", sendMessage);
  }

  toggleChat(true);

  await initChat();
});

// Toggle chat popup visibility
function toggleChat(show) {
  const chat = document.getElementById("chatContainer");
  if (!chat) return;
  if (show === undefined) show = chat.classList.contains("d-none");
  chat.classList.toggle("d-none", !show);
}

// Toggle views
function toggleUserList() {
  document.getElementById("chatUserList").classList.remove("d-none");
  document.getElementById("chatMessages").classList.add("d-none");
  document.getElementById("chatSettings").classList.add("d-none");
}

function toggleChatSettings() {
  document.getElementById("chatSettings").classList.remove("d-none");
  document.getElementById("chatMessages").classList.add("d-none");
  document.getElementById("chatUserList").classList.add("d-none");
}

function showChatMessages() {
  document.getElementById("chatMessages").classList.remove("d-none");
  document.getElementById("chatUserList").classList.add("d-none");
  document.getElementById("chatSettings").classList.add("d-none");
}

// Filter profanity (simple example)
const bannedWords = ["badword1", "badword2", "damn", "hell", "shit", "fuck"];
function filterProfanity(text) {
  const regex = new RegExp(bannedWords.join("|"), "gi");
  return text.replace(regex, "****");
}

// Convert URLs to clickable links
function convertLinks(text) {
  return text.replace(
    /(https?:\/\/[^\s]+)/g,
    url => `<a href="${url}" target="_blank" class="text-light text-decoration-underline">${url}</a>`
  );
}

// Initialize chat: set user info, listen to messages
async function initChat() {
  if (!currentUser) {
    console.warn("User not logged in");
    return;
  }

// Try to load saved player data
const savedPlayerJSON = localStorage.getItem("theGame_currentPlayerData");
let playerName = "";
let avatarImage = "";

if (savedPlayerJSON) {
  try {
    const savedPlayer = JSON.parse(savedPlayerJSON);
    playerName = savedPlayer.playerName || "";
    avatarImage = savedPlayer.avatarImage || "";
  } catch {
    // corrupted localStorage data, fallback below
  }
}

// If no local saved data, fallback to currentUser info
if (!playerName) {
  playerName = currentUser.displayName || "Anonymous";
}
if (!avatarImage) {
  avatarImage = currentUser.photoURL || "https://rw-501.github.io/contenthub/images/defaultAvatar.png";
}

// Update UI with loaded info
document.getElementById("currentUserAvatar").src = avatarImage;
document.getElementById("currentUserName").textContent = playerName;

  // Setup Firestore listener for chat messages
  const chatRef = collection(db, "chatRoom");
  const q = query(chatRef, orderBy("timestamp", "asc"));

  if (chatListenerUnsub) {
    chatListenerUnsub(); // detach previous listener if any
  }

  const chatMessages = document.getElementById("chatMessages");
  chatMessages.innerHTML = "";  // clear existing messages
  renderedMessages.clear();

  chatListenerUnsub = onSnapshot(q, async snapshot => {
    // Append new messages only
    for (const docSnap of snapshot.docChanges()) {
      if (docSnap.type === "added") {
        const msg = docSnap.doc.data();
        const docId = docSnap.doc.id;
        if (renderedMessages.has(docId)) continue;
        renderedMessages.add(docId);

        if (msg.status === "deleted") continue;

        const messageEl = createMessageElement(msg, docId);
        chatMessages.appendChild(messageEl);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    }
  });
}

// Create chat message element
function createMessageElement(msg, id) {
  const isMe = msg.uid === currentUser.uid;
  const div = document.createElement("div");
  div.className = `d-flex ${isMe ? "justify-content-end" : "justify-content-start"} my-2`;

  const safeText = convertLinks(filterProfanity(msg.text));

  div.innerHTML = `
    <div class="d-flex align-items-start">
      <a href="https://rw-501.github.io/contenthub/pages/profile.html?uid=${msg.uid}" target="_blank">
        <img src="${msg.uPhoto || "https://rw-501.github.io/contenthub/images/defaultAvatar.png"}" alt="avatar" class="rounded-circle me-2" style="width: 36px; height: 36px;" />
      </a>
    </div>
    <div class="message-content">
      <span 
        class="badge ${isMe ? "bg-primary" : msg.pinned ? "bg-warning text-dark" : "bg-secondary"} message-bubble d-block mb-1" 
        style="cursor: pointer;">
        <strong><a href="https://rw-501.github.io/contenthub/pages/profile.html?uid=${msg.uid}" class="text-white text-decoration-none">${msg.uName || "Unknown"}</a></strong><br/>
        ${safeText}
      </span>
      <div class="small d-none text-muted time-info">
        ${msg.timestamp?.toDate ? timeSince(msg.timestamp.toDate()) + " ago" : "Just now"}
      </div>
    </div>
  `;

  // Toggle time-info on bubble click
  div.querySelector(".message-bubble").addEventListener("click", () => {
    div.querySelector(".time-info").classList.toggle("d-none");
  });

  return div;
}

// Send message handler
async function sendMessage() {
  if (!currentUser) {
    alert("Please login to send messages.");
    return;
  }

  const input = document.getElementById("chatInput");
  let message = input.value.trim();
  if (!message) return;

  message = filterProfanity(message);

  const mentionedUsernames = Array.from(message.matchAll(/@(\w+)/g)).map(m => m[1]);
  const mentionSeen = {};
  mentionedUsernames.forEach(name => (mentionSeen[name] = false));
  mentionSeen[currentUser.displayName || currentUser.email] = true;

  await addDoc(collection(db, "chatRoom"), {
    uid: currentUser.uid,
    uPhoto: currentUser.photoURL || "https://rw-501.github.io/contenthub/images/defaultAvatar.png",
    uName: currentUser.displayName || currentUser.email || "Anonymous",
    text: message,
    timestamp: serverTimestamp(),
    mentionSeen,
    heart: 0,
    pinned: false,
    status: "active"
  });

  input.value = "";
}

// Utility: time since (e.g. 5 min ago)
function timeSince(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return seconds + " sec";
  const intervals = [
    { label: "year", secs: 31536000 },
    { label: "month", secs: 2592000 },
    { label: "day", secs: 86400 },
    { label: "hour", secs: 3600 },
    { label: "min", secs: 60 },
  ];
  for (const i of intervals) {
    const count = Math.floor(seconds / i.secs);
    if (count > 0) return count + " " + i.label + (count > 1 ? "s" : "");
  }
  return "just now";
}

// Firebase Auth state monitor
onAuthStateChanged(auth, (user) => {
  currentUser = user;
});

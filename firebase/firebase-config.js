import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAw6H0VmOtZtTLo_TFN5RLjx3glB7g4twM",
  authDomain: "thegame-1d509.firebaseapp.com",
  projectId: "thegame-1d509",
  storageBucket: "thegame-1d509.appspot.com",
  messagingSenderId: "932910520730",
  appId: "1:932910520730:web:ebe861737607767d09c223"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
let db;

export { auth, db };

export function initializeFirebase() {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
}

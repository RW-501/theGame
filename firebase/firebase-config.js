import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAw6H0VmOtZtTLo_TFN5RLjx3glB7g4twM",
  authDomain: "thegame-1d509.firebaseapp.com",
  projectId: "thegame-1d509",
  storageBucket: "thegame-1d509.appspot.com",
  messagingSenderId: "932910520730",
  appId: "1:932910520730:web:ebe861737607767d09c223"
};

  const app = initializeApp(firebaseConfig);
 let db = getFirestore(app);
  const auth = getAuth(app);

  
export { auth, db, onAuthStateChanged, signInAnonymously };

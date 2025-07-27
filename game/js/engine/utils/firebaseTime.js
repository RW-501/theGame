// firebaseTime.js
import {
  getFirestore,
  doc,
  getDoc,
  serverTimestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js"; // ✅ Match version
import { auth, db, onAuthStateChanged, signInAnonymously } from "https://rw-501.github.io/theGame/firebase/firebase-config.js";

export async function getServerTimestampInSeconds() {
  const tempDoc = doc(db, "serverTime", "now");

  await setDoc(tempDoc, { ts: serverTimestamp() });
  const snap = await getDoc(tempDoc);

  const serverTime = snap.data()?.ts?.seconds;
  return serverTime || Math.floor(Date.now() / 1000);
}

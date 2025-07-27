// firebaseTime.js
import { getFirestore, doc, getDoc, serverTimestamp, setDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

export async function getServerTimestampInSeconds() {
  const db = getFirestore();
  const tempDoc = doc(db, "serverTime", "now");

  await setDoc(tempDoc, { ts: serverTimestamp() });
  const snap = await getDoc(tempDoc);

  const serverTime = snap.data()?.ts?.seconds;
  return serverTime || Math.floor(Date.now() / 1000);
}

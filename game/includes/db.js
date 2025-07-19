




// dbHelpers.js
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "./firebaseInit";

// Update any field
export async function updateField(collection, docId, field, value) {
  try {
    const ref = doc(db, collection, docId);
    await updateDoc(ref, { [field]: value });
  } catch (err) {
    console.error("Update failed:", err);
  }
}

// Update multiple fields
export async function updateFields(collection, docId, fieldsObj) {
  try {
    const ref = doc(db, collection, docId);
    await updateDoc(ref, fieldsObj);
  } catch (err) {
    console.error("Update failed:", err);
  }
}

// Append to an array
export async function pushToArray(collection, docId, field, value) {
  try {
    const ref = doc(db, collection, docId);
    await updateDoc(ref, { [field]: arrayUnion(value) });
  } catch (err) {
    console.error("Array update failed:", err);
  }
}


/*

// Update just one field
await updateField("players", uid, "cash", 8000);

// Update multiple
await updateFields("players", uid, {
  cash: 8000,
  health: 90,
  lastLogin: Date.now()
});

// Append a completed mission
await pushToArray("players", uid, "completedMissions", "mission_5");

*/
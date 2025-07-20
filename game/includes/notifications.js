import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  getDocs,
  updateDoc,
  doc,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { auth, db } from "https://rw-501.github.io/theGame/firebase/firebase-config.js";

let lastVisibleNotif = null;
let loadingMore = false;
let groupingMode = "day"; // "flat" or "day"
let notificationsUnsub = null;

export async function initLiveNotifications() {
  const user = auth.currentUser;
  if (!user) return;

  const uid = user.uid;

  const notifList = document.getElementById("notificationList");
//  const avatar = document.getElementById("currentUserAvatar");
  const notifBtn = document.getElementById("notifBellBtn");
  const modalBody = document.querySelector("#notifModal .modal-body");
  const toggleBtn = document.getElementById("toggleGroupMode");

  // 📥 Load Notifications
  async function loadNotifications(initial = true) {
    if (loadingMore) return;
    loadingMore = true;

    let baseQuery = query(
      collection(db, "notifications"),
      where("uid", "==", uid),
      orderBy("timestamp", "desc"),
      limit(20)
    );

    if (!initial && lastVisibleNotif) {
      baseQuery = query(
        collection(db, "notifications"),
        where("uid", "==", uid),
        orderBy("timestamp", "desc"),
        startAfter(lastVisibleNotif),
        limit(20)
      );
    }

    const snap = await getDocs(baseQuery);
    if (snap.empty) {
      loadingMore = false;
      return;
    }

    lastVisibleNotif = snap.docs[snap.docs.length - 1];

    if (groupingMode === "day") {
      const groups = {};
      snap.forEach(docSnap => {
        const data = docSnap.data();
        const dayKey = getDayLabel(data.timestamp?.toDate?.());
        if (!groups[dayKey]) groups[dayKey] = [];
        groups[dayKey].push({ ...data, id: docSnap.id, ref: docSnap.ref });
      });
      renderGroupedByDay(groups);
    } else {
      snap.forEach(docSnap => {
        renderNotificationItem(docSnap.data(), docSnap.ref, docSnap.id);
      });
    }

    loadingMore = false;
  }

  // 🗓️ Day Grouping Labels
  function getDayLabel(date) {
    const now = new Date();
    const d = new Date(date);
    const today = now.toDateString();
    const yesterday = new Date(now.setDate(now.getDate() - 1)).toDateString();

    if (d.toDateString() === today) return "Today";
    if (d.toDateString() === yesterday) return "Yesterday";

    const diff = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
    return diff <= 7 ? "This Week" : "Older";
  }

  // 🧱 Render Notification (flat)
  function renderNotificationItem(data, ref, id) {
    const item = createNotificationHTML(data, ref, id);
    notifList.appendChild(item);
  }

  // 🧱 Render Grouped by Day
  function renderGroupedByDay(groups) {
    notifList.innerHTML = "";
    Object.entries(groups).forEach(([day, items]) => {
      const collapseId = `notif-group-${day.replace(/\s/g, "-")}`;

      notifList.insertAdjacentHTML("beforeend", `
        <button class="btn btn-light w-100 text-start mb-2" data-bs-toggle="collapse" data-bs-target="#${collapseId}">
          ${day} (${items.length})
        </button>
        <div id="${collapseId}" class="collapse show"></div>
      `);

      const groupEl = document.getElementById(collapseId);
      items.forEach(n => {
        const item = createNotificationHTML(n, n.ref, n.id);
        groupEl.appendChild(item);
      });
    });
  }

  // 🛠️ Notification HTML
  function createNotificationHTML(n, ref, id) {
    const item = document.createElement("div");
    const timestamp = n.timestamp?.toDate?.() ? new Date(n.timestamp.toDate()).toLocaleString() : "Just now";

    item.className = `position-relative list-group-item ${n.read ? "" : "fw-bold"} p-3`;
    item.innerHTML = `
      <button class="btn btn-sm btn-link text-danger position-absolute top-0 end-0 me-1 mt-1 p-0"
              style="font-size: 1rem;" 
              title="Dismiss" 
              onclick="dismissNotif('${ref.path}')">✖</button>
      <div class="d-flex align-items-start">
        ${n.fromuserAvatar ? `<img src="${n.fromuserAvatar}" class="me-2" style="width:32px;height:32px;border-radius:50%;" />` : ""}
        <div class="flex-grow-1">
          <div class="mb-1">${n.message}</div>
          <small class="text-muted">${timestamp}</small>
        </div>
        <div class="ms-3">
          <button class="btn btn-sm btn-outline-secondary" onclick="markAsRead('${ref.path}')">
            Mark as Read
          </button>
        </div>
      </div>
    `;

    item.onclick = async () => {
      await updateDoc(ref, { read: true });
      item.classList.remove("fw-bold");
    };

    return item;
  }

  // ❌ Dismiss Notification
  window.dismissNotif = async (refPath) => {
    const notifRef = doc(db, refPath);
    await updateDoc(notifRef, { status: "removed", read: true });
    document.querySelector(`[onclick="dismissNotif('${refPath}')"]`)?.closest(".list-group-item")?.remove();
  };

  // ✅ Mark as Read
  window.markAsRead = async (refPath) => {
    const notifRef = doc(db, refPath);
    await updateDoc(notifRef, { read: true });
    document.querySelector(`[onclick="dismissNotif('${refPath}')"]`)?.closest(".list-group-item")?.classList.remove("fw-bold");
  };

  // 🧭 Scroll Pagination
setTimeout(() => {
  const modalBody = document.querySelector(".modal-body"); // or your actual selector
  if (modalBody) {
    modalBody.onscroll = () => {
      if (modalBody.scrollTop + modalBody.clientHeight >= modalBody.scrollHeight - 10) {
        loadNotifications(false);
      }
    };
  }
}, 100);



  // 🔴 Real-time Unread Badge
  notificationsUnsub = onSnapshot(
    query(collection(db, "notifications"), where("uid", "==", uid), where("read", "==", false)),
    (unreadSnap) => {
      const hasUnread = !unreadSnap.empty;
      notifBtn.style.boxShadow = hasUnread ? "0 0 8px 3px lime" : "none";
      notifBtn.classList.toggle("blink", hasUnread);
    }
  );

  // 🔘 Toggle Grouping Mode
  toggleBtn?.addEventListener("click", () => {
    groupingMode = groupingMode === "flat" ? "day" : "flat";
    toggleBtn.innerText = groupingMode === "flat" ? "Group by Day" : "Flat View";
    notifList.innerHTML = "";
    lastVisibleNotif = null;
    loadNotifications(true);
  });

  // 🔔 Bell Click = Open Modal
  notifBtn?.addEventListener("click", () => {
    notifList.innerHTML = "";
    lastVisibleNotif = null;
    loadNotifications(true);
    new bootstrap.Modal(document.getElementById("notifModal")).show();
  });

  loadNotifications(true);
  console.log("✅ Live notifications initialized");
}

window.initLiveNotifications = initLiveNotifications;

/*
setTimeout(() => {
  initLiveNotifications();
}, 1000); // Delay to ensure auth is loaded
*/


// 📤 Send Notification
export async function sendNotification({
  toUid,
  fromUid = "",
  message,
  type = "general",
  fromDisplayName = "",
  fromuserAvatar = ""
}) {
  if (!toUid || !message) return;

  await addDoc(collection(db, "notifications"), {
    uid: toUid,
    message,
    fromUid,
    fromDisplayName,
    fromuserAvatar,
    type,
    read: false,
    status: "active",
    timestamp: serverTimestamp()
  });
}

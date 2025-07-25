import {   getFirestore,  query,
  where, limit, addDoc ,
  arrayRemove, increment, serverTimestamp, 
  arrayUnion, collection, doc, getDoc, getDocs, onSnapshot, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";


export async function openManageCompanyModal(company, x, y, playerData) {
  const modalElement = document.getElementById("manageCompanyModal");
  const content = document.getElementById("manageCompanyContent");
  const { name, stockSymbol, sector, level, employsIDs, ownerID, value } = company;

  // Fetch player info if you want to show usernames
  let employeesHtml = "<p>No employees.</p>";
  if (employsIDs && employsIDs.length > 0) {
    const employeeList = await Promise.all(
      employsIDs.map(async uid => {
        const snap = await getDoc(doc(db, "players", uid));
        const data = snap.exists() ? snap.data() : { name: "Unknown" };
        return `
          <li class="list-group-item d-flex justify-content-between align-items-center">
            <span>${data.name || "Unnamed"} (${uid.slice(0, 6)}...)</span>
            <button class="btn btn-sm btn-danger" onclick="fireEmployee('${company.name}', '${uid}')">Fire</button>
          </li>
        `;
      })
    );
    employeesHtml = `<ul class="list-group mb-3">${employeeList.join("")}</ul>`;
  }

  content.innerHTML = `
    <h5 class="mb-2">${name} <small>(${stockSymbol})</small></h5>
    <p><strong>Sector:</strong> ${sector}</p>
    <p><strong>Level:</strong> ${level}</p>
    <p><strong>Owner:</strong> ${ownerID}</p>
    <p><strong>Value:</strong> $${value.toLocaleString()}</p>
    <h6>Employees (${employsIDs.length}):</h6>
    ${employeesHtml}

    <div class="d-grid gap-2">
      <button hidden class="btn btn-primary" onclick="recruitEmployee('${name}')">Recruit</button>
      <button class="btn btn-warning" onclick="upgradeCompany('${x}, ${y}, ${name}')">Upgrade</button>
      <button hidden class="btn btn-info" onclick="inviteToCompany('${name}')">Invite Players</button>
      <button class="btn btn-danger" onclick="sellTile('${name}, ${x}, ${y}, ${playerData}')">Sell Company</button>
    </div>
  `;

  const modal = new bootstrap.Modal(modalElement);
  modal.show();
}



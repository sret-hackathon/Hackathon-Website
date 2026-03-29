// js/admin.js
import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { collection, getDocs, orderBy, query } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const loadingState = document.getElementById('loading-state');
const adminPanel = document.getElementById('admin-panel');
const logoutBtn = document.getElementById('logout-btn');

// Tab Logic
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // Remove active clsses
    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    
    // Add to current
    btn.classList.add('active');
    document.getElementById(btn.dataset.target).classList.add('active');
  });
});

// Auth Enforcement
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'index.html';
  } else if (user.email !== 'admin@gmail.com') {
    // Basic frontend check. Real security requires Firestore rules.
    window.location.href = 'dashboard.html';
  } else {
    document.getElementById('admin-badge').classList.remove('hidden');
    await loadAdminData();
  }
});

logoutBtn.addEventListener('click', async () => {
  await signOut(auth);
});

// Data Loading
let teamsDataList = [];
let submissionsDataList = [];

async function loadAdminData() {
  try {
    // Fetch Teams
    const teamsSnapshot = await getDocs(collection(db, "teams"));
    teamsDataList = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Fetch Submissions
    const submissionsSnapshot = await getDocs(collection(db, "submissions"));
    submissionsDataList = submissionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    document.getElementById('teams-count').textContent = teamsDataList.length;
    document.getElementById('submissions-count').textContent = submissionsDataList.length;

    renderTeamsTable();
    renderSubmissionsTable();

    loadingState.classList.add('hidden');
    adminPanel.classList.remove('hidden');

  } catch (error) {
    console.error("Admin Load Error", error);
    window.UI.showToast("Failed to load admin dashboard: " + error.message, "error");
  }
}

function renderTeamsTable() {
  const tbody = document.getElementById('teams-table-body');
  tbody.innerHTML = '';

  if (teamsDataList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-secondary py-lg">No teams registered yet.</td></tr>`;
    return;
  }

  // Sort by newest first
  teamsDataList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  teamsDataList.forEach(team => {
    const verifiedCount = team.members.filter(m => m.status === 'verified').length;
    const totalMembers = team.members.length;
    
    // Status color class
    let verifyClass = 'text-error';
    if (verifiedCount === totalMembers && totalMembers > 0) verifyClass = 'text-success';
    else if (verifiedCount > 0) verifyClass = 'text-warning';

    const cleanDate = team.createdAt ? new Date(team.createdAt).toLocaleString() : 'N/A';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="font-weight-600">${team.teamName}</td>
      <td>
        <div>${team.leaderName}</div>
        <div class="text-muted" style="font-size: 0.8rem;">${team.leaderEmail}</div>
      </td>
      <td><span class="badge" style="background: rgba(255,255,255,0.1)">${totalMembers}</span></td>
      <td class="${verifyClass} font-weight-500">${verifiedCount} / ${totalMembers}</td>
      <td class="text-muted" style="font-size: 0.9rem;">${cleanDate}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderSubmissionsTable() {
  const tbody = document.getElementById('submissions-table-body');
  tbody.innerHTML = '';

  if (submissionsDataList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-secondary py-lg">No submissions yet.</td></tr>`;
    return;
  }

  // Map to get team names quickly
  const teamNameMap = {};
  teamsDataList.forEach(t => teamNameMap[t.id] = t.teamName);

  submissionsDataList.forEach(sub => {
    const teamName = teamNameMap[sub.teamId] || '<em class="text-muted">Unknown Team</em>';
    const cleanDate = sub.timestamp ? new Date(sub.timestamp.toDate()).toLocaleString() : 'N/A';
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="font-weight-600 text-primary">${teamName}</td>
      <td><a href="${sub.driveLink}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">View Drive PPT</a></td>
      <td style="max-width: 400px;">
        <div style="max-height: 80px; overflow-y: auto; padding-right: 0.5rem; font-size: 0.9rem;" class="text-secondary">
          ${sub.description}
        </div>
      </td>
      <td class="text-muted" style="font-size: 0.9rem;">${cleanDate}</td>
    `;
    tbody.appendChild(tr);
  });
}

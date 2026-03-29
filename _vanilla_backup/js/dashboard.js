// js/dashboard.js
import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const logoutBtn = document.getElementById('logout-btn');
const userDisplayName = document.getElementById('user-display-name');

const teamLoading = document.getElementById('team-loading');
const teamEmpty = document.getElementById('team-empty');
const teamDetails = document.getElementById('team-details');

let currentUser = null;

// Auth Check & Data Fetch
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'index.html';
  } else {
    currentUser = user;
    userDisplayName.textContent = `Welcome, ${user.displayName || 'Leader'}`;
    userDisplayName.classList.remove('hidden');
    
    await fetchTeamData();
  }
});

logoutBtn.addEventListener('click', async () => {
  await signOut(auth);
});

async function fetchTeamData() {
  try {
    const teamsRef = collection(db, "teams");
    const q = query(teamsRef, where("leaderUid", "==", currentUser.uid));
    const querySnapshot = await getDocs(q);

    teamLoading.classList.add('hidden');

    if (querySnapshot.empty) {
       teamEmpty.classList.remove('hidden');
    } else {
       // Leader has a team
       teamDetails.classList.remove('hidden');
       
       const doc = querySnapshot.docs[0];
       const data = doc.data();
       
       document.getElementById('display-team-name').textContent = data.teamName;
       document.getElementById('display-leader-name').textContent = data.leaderName;
       document.getElementById('display-leader-email').textContent = data.leaderEmail;

       renderMembersList(data.members);
    }
  } catch (error) {
    console.error("Error fetching team:", error);
    window.UI.showToast("Failed to load team data.", "error");
    teamLoading.classList.add('hidden');
  }
}

function renderMembersList(members) {
  const container = document.getElementById('members-list-container');
  container.innerHTML = '';

  if (!members || members.length === 0) {
    container.innerHTML = `<p class="text-muted text-center py-sm">No members added.</p>`;
    return;
  }

  members.forEach(member => {
    const isVerified = member.status === 'verified';
    
    const div = document.createElement('div');
    div.className = 'glass-panel flex justify-between items-center';
    div.style.padding = '0.75rem 1rem';
    
    div.innerHTML = `
      <div style="flex: 1; overflow: hidden; text-overflow: ellipsis;">
        <div class="font-weight-500" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${member.name}</div>
        <div class="text-muted" style="font-size: 0.8rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${member.email}</div>
      </div>
      <div>
        ${isVerified 
          ? `<span class="badge badge-verified">Verified ✅</span>` 
          : `<span class="badge badge-pending">Pending ⏳</span>`
        }
      </div>
    `;
    
    container.appendChild(div);
  });
}

// Countdown Timer Logic
function initTimer() {
  // Set Deadline: April 10 of current year at 23:59:59
  const now = new Date();
  const year = now.getFullYear();
  let deadline = new Date(`April 10, ${year} 23:59:59`).getTime();
  
  // If April 10 has already passed this year, set for next year
  if (now.getTime() > deadline) {
      deadline = new Date(`April 10, ${year + 1} 23:59:59`).getTime();
  }

  const daysEl = document.getElementById('timer-days');
  const hoursEl = document.getElementById('timer-hours');
  const minsEl = document.getElementById('timer-minutes');
  const secsEl = document.getElementById('timer-seconds');

  const timerInterval = setInterval(() => {
    const currentTime = new Date().getTime();
    const distance = deadline - currentTime;

    if (distance < 0) {
      clearInterval(timerInterval);
      daysEl.textContent = "00";
      hoursEl.textContent = "00";
      minsEl.textContent = "00";
      secsEl.textContent = "00";
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Format with leading zero
    daysEl.textContent = days < 10 ? `0${days}` : days;
    hoursEl.textContent = hours < 10 ? `0${hours}` : hours;
    minsEl.textContent = minutes < 10 ? `0${minutes}` : minutes;
    secsEl.textContent = seconds < 10 ? `0${seconds}` : seconds;

  }, 1000);
}

// Initialize components
initTimer();

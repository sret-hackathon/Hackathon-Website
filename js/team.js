// js/team.js
import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const membersContainer = document.getElementById('members-container');
const addMemberBtn = document.getElementById('add-member-btn');
const memberCounter = document.getElementById('member-counter');
const teamForm = document.getElementById('team-form');
const submitTeamBtn = document.getElementById('submit-team-btn');
const logoutBtn = document.getElementById('logout-btn');

let currentUser = null;
let members = [];
const MAX_MEMBERS = 4;

// Auth Guard & Check if team already exists
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'index.html';
  } else {
    currentUser = user;
    // Check if leader already created a team
    const teamsRef = collection(db, "teams");
    const q = query(teamsRef, where("leaderUid", "==", currentUser.uid));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      window.UI.showToast("You already have a team!", "error");
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 2000);
    }
  }
});

logoutBtn.addEventListener('click', async () => {
  await signOut(auth);
});

// Render dynamic member fields
function renderMembers() {
  membersContainer.innerHTML = '';
  
  members.forEach((member, index) => {
    const memberRow = document.createElement('div');
    memberRow.className = 'flex gap-md mb-sm animate-fade-in';
    memberRow.style.alignItems = 'flex-end';
    
    memberRow.innerHTML = `
      <div class="form-group mb-0" style="flex: 1;">
        <label class="form-label">Member ${index + 1} Name</label>
        <input type="text" class="form-control member-name" placeholder="Name" value="${member.name}" required>
      </div>
      <div class="form-group mb-0" style="flex: 1;">
        <label class="form-label">Member ${index + 1} Email</label>
        <input type="email" class="form-control member-email" placeholder="Email" value="${member.email}" required>
      </div>
      <button type="button" class="btn btn-outline remove-btn" data-index="${index}" style="padding: 0.75rem;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </button>
    `;

    // Add listeners to save state automatically
    memberRow.querySelector('.member-name').addEventListener('input', (e) => {
      members[index].name = e.target.value;
    });
    memberRow.querySelector('.member-email').addEventListener('input', (e) => {
      members[index].email = e.target.value;
    });
    
    // Remove button listener
    memberRow.querySelector('.remove-btn').addEventListener('click', () => {
      members.splice(index, 1);
      renderMembers();
      updateUIState();
    });

    membersContainer.appendChild(memberRow);
  });
}

function updateUIState() {
  const count = members.length;
  memberCounter.textContent = `${count} / ${MAX_MEMBERS} Added`;
  
  if (count >= MAX_MEMBERS) {
    addMemberBtn.style.display = 'none';
  } else {
    addMemberBtn.style.display = 'block';
  }

  submitTeamBtn.disabled = count === 0;
}

addMemberBtn.addEventListener('click', () => {
  if (members.length < MAX_MEMBERS) {
    members.push({ name: '', email: '' });
    renderMembers();
    updateUIState();
  }
});

// Submit Form
teamForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const teamName = document.getElementById('team-name').value;
  
  if (members.length === 0) {
    window.UI.showToast("Please add at least 1 member", "warning");
    return;
  }

  // Basic validation check to ensure all member fields are filled
  for(let member of members) {
     if(!member.name.trim() || !member.email.trim()) {
         window.UI.showToast("Please fill out all member details", "error");
         return;
     }
  }

  // Format members array for Firestore
  const formattedMembers = members.map(m => ({
    name: m.name.trim(),
    email: m.email.trim(),
    status: 'pending'
  }));

  try {
    window.UI.showLoader(submitTeamBtn);
    
    // 1. Save to Firestore
    const docRef = await addDoc(collection(db, "teams"), {
      teamName: teamName.trim(),
      leaderName: currentUser.displayName || 'Leader',
      leaderEmail: currentUser.email,
      leaderUid: currentUser.uid,
      members: formattedMembers,
      createdAt: new Date().toISOString()
    });

    const teamId = docRef.id;

    // 2. Send Emails using Python API
    const verificationBaseUrl = `${window.location.origin}/verify.html`;
    
    // Execute email promises in parallel
    const emailPromises = formattedMembers.map(member => {
      const verifyLink = `${verificationBaseUrl}?teamId=${teamId}&email=${encodeURIComponent(member.email)}`;
      
      const emailParams = {
        to_name: member.name,
        to_email: member.email,
        team_name: teamName,
        verify_link: verifyLink
      };

      // Send email via live production Python API
      return fetch("https://hackathon-website-hm6g.onrender.com/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(emailParams)
      }).then(async res => {
        if (!res.ok) {
           const errData = await res.json();
           throw new Error(errData.error || "Failed to send email");
        }
      }).catch(err => {
        console.error("Email API Error for " + member.email + ":", err);
        // We catch here so one failed email doesn't crash the whole batch
      });
    });

    await Promise.all(emailPromises);
    
    window.UI.showToast("Team created successfully! Emails sent.", "success");
    
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 2000);

  } catch (error) {
    console.error("Error creating team: ", error);
    window.UI.showToast(error.message, "error");
  } finally {
    window.UI.hideLoader(submitTeamBtn);
  }
});

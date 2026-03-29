// js/submit.js
import { auth, db } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const submitForm = document.getElementById('submit-form');
const submitBtn = document.getElementById('submit-btn');

let currentUser = null;
let currentTeamId = null;

// Auth Check & Eligibility Check
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'index.html';
  } else {
    currentUser = user;
    await checkEligibility();
  }
});

function showError(msg) {
  loadingState.classList.add('hidden');
  submitForm.classList.add('hidden');
  errorMessage.textContent = msg;
  errorState.classList.remove('hidden');
}

async function checkEligibility() {
  try {
    // 1. Fetch User's Team
    const teamsRef = collection(db, "teams");
    const q = query(teamsRef, where("leaderUid", "==", currentUser.uid));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      showError("You must create a team first before submitting.");
      return;
    }

    const docSnap = querySnapshot.docs[0];
    const teamData = docSnap.data();
    currentTeamId = docSnap.id;

    // 2. Check if all members are verified
    const allMembersVerified = teamData.members.every(m => m.status === 'verified');
    if (!allMembersVerified) {
      showError("All team members must verify their emails before you can submit the project.");
      return;
    }

    // 3. Check if team already submitted
    const submissionsRef = collection(db, "submissions");
    const subQuery = query(submissionsRef, where("teamId", "==", currentTeamId));
    const subSnapshot = await getDocs(subQuery);

    if (!subSnapshot.empty) {
      showError("Your team has already submitted a project.");
      return;
    }

    // Passed all checks!
    loadingState.classList.add('hidden');
    submitForm.classList.remove('hidden');

  } catch (error) {
    console.error("Eligibility Check Error:", error);
    showError("An error occurred while verifying your status. Please try again later.");
  }
}

// Handle Form Submission
submitForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const driveLink = document.getElementById('drive-link').value.trim();
  const projectDesc = document.getElementById('project-desc').value.trim();

  if (!currentTeamId) return;

  try {
    window.UI.showLoader(submitBtn);

    const submissionsRef = collection(db, "submissions");
    await addDoc(submissionsRef, {
      teamId: currentTeamId,
      driveLink: driveLink,
      description: projectDesc,
      timestamp: serverTimestamp()
    });

    window.UI.showToast("Project submitted successfully! Congratulations 🎉", "success");
    
    // Disable form and show success
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitted";
    
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 3000);

  } catch (error) {
    console.error("Submission Error:", error);
    window.UI.showToast("Failed to submit project. " + error.message, "error");
    window.UI.hideLoader(submitBtn);
  }
});

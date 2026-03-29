// js/verify.js
import { db } from './firebase.js';
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const loadingState = document.getElementById('loading-state');
const successState = document.getElementById('success-state');
const errorState = document.getElementById('error-state');
const errorMessageEl = document.getElementById('error-message');

function showState(state) {
  loadingState.classList.add('hidden');
  successState.classList.add('hidden');
  errorState.classList.add('hidden');

  if (state === 'success') successState.classList.remove('hidden');
  else if (state === 'error') errorState.classList.remove('hidden');
}

async function verifyEmail() {
  const urlParams = new URLSearchParams(window.location.search);
  const teamId = urlParams.get('teamId');
  const emailToVerify = urlParams.get('email');

  if (!teamId || !emailToVerify) {
    errorMessageEl.textContent = "Missing team verification parameters.";
    showState('error');
    return;
  }

  try {
    const teamRef = doc(db, "teams", teamId);
    const docSnap = await getDoc(teamRef);

    if (!docSnap.exists()) {
      errorMessageEl.textContent = "Team not found. It may have been deleted.";
      showState('error');
      return;
    }

    const data = docSnap.data();
    let members = data.members;
    let memberFound = false;
    let memberAlreadyVerified = false;

    // Loop to find member and check/update status
    for (let i = 0; i < members.length; i++) {
        if (members[i].email === emailToVerify) {
            memberFound = true;
            if (members[i].status === 'verified') {
                memberAlreadyVerified = true;
            } else {
                members[i].status = 'verified';
            }
            break;
        }
    }

    if (!memberFound) {
      errorMessageEl.textContent = "This email address is not registered with this team.";
      showState('error');
      return;
    }

    if (memberAlreadyVerified) {
      window.UI.showToast("Email already verified!", "success");
      showState('success');
      return;
    }

    // Update the array in Firestore
    await updateDoc(teamRef, {
      members: members
    });

    showState('success');

  } catch(error) {
    console.error("Verification Error:", error);
    errorMessageEl.textContent = "An error occurred during verification. Please try again later.";
    showState('error');
  }
}

// Run verification on page load
verifyEmail();

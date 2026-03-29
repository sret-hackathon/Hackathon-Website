// js/auth.js
import { auth } from './firebase.js';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

// DOM Elements
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const toggleFormBtn = document.getElementById('toggle-form');
const toggleText = document.getElementById('toggle-text');

let isLoginMode = true;

// Check if user is already logged in
onAuthStateChanged(auth, (user) => {
  if (user) {
    if (user.email === 'admin@gmail.com') {
      window.location.href = 'admin.html';
    } else {
      window.location.href = 'dashboard.html';
    }
  }
});

// Toggle Forms
toggleFormBtn.addEventListener('click', (e) => {
  e.preventDefault();
  isLoginMode = !isLoginMode;
  
  if (isLoginMode) {
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    toggleText.textContent = "Don't have an account?";
    toggleFormBtn.textContent = "Sign up here";
  } else {
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    toggleText.textContent = "Already have an account?";
    toggleFormBtn.textContent = "Sign in here";
  }
});

// Handle Login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = loginForm.querySelector('button[type="submit"]');
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    window.UI.showLoader(btn);
    await signInWithEmailAndPassword(auth, email, password);
    window.UI.showToast("Logged in successfully!", "success");
    // Redirect is handled by onAuthStateChanged
  } catch (error) {
    console.error(error);
    window.UI.showToast(error.message, "error");
    window.UI.hideLoader(btn);
  }
});

// Handle Signup
signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = signupForm.querySelector('button[type="submit"]');
  const name = document.getElementById('signup-name').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;

  try {
    window.UI.showLoader(btn);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update display name
    await updateProfile(userCredential.user, {
      displayName: name
    });
    
    window.UI.showToast("Account created successfully!", "success");
    // Redirect is handled by onAuthStateChanged
  } catch (error) {
    console.error(error);
    window.UI.showToast(error.message, "error");
    window.UI.hideLoader(btn);
  }
});

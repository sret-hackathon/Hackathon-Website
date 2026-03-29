// js/ui.js
// Utility functions for UI manipulation

class UIManager {
  constructor() {
    this.initToastContainer();
  }

  initToastContainer() {
    this.toastContainer = document.createElement('div');
    this.toastContainer.className = 'toast-container';
    document.body.appendChild(this.toastContainer);
  }

  showToast(message, type = 'success', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const iconHtml = type === 'success' 
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;

    toast.innerHTML = `
      <div class="toast-icon">
        ${iconHtml}
      </div>
      <div class="toast-message">${message}</div>
    `;

    this.toastContainer.appendChild(toast);

    // Trigger animation
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    // Remove toast
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.remove();
      }, 400); // match CSS transition duration
    }, duration);
  }

  showLoader(buttonElement) {
    if (!buttonElement) return;
    const originalText = buttonElement.innerHTML;
    buttonElement.dataset.originalText = originalText;
    buttonElement.innerHTML = `<span class="loader"></span>`;
    buttonElement.disabled = true;
  }

  hideLoader(buttonElement) {
    if (!buttonElement) return;
    buttonElement.innerHTML = buttonElement.dataset.originalText || 'Submit';
    buttonElement.disabled = false;
  }
}

// Global instance
window.UI = new UIManager();

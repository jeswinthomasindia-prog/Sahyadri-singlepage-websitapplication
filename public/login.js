const allowedUsers = {
  jeswin: 'jeswinpass',
  thomas: 'thomaspass',
  asha: 'ashapass',
  guest: 'guestpass'
};

let toastTimeout;
let usernameInput, passwordInput, authTitle, authSubtitle, authNote, primaryAuthBtn;

function ensureToast() {
  let toast = document.getElementById('loginToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'loginToast';
    toast.className = 'auth-toast';
    toast.setAttribute('aria-live', 'polite');
    toast.setAttribute('role', 'status');
    document.body.appendChild(toast);
  }
  return toast;
}

function showStatus(message, type = 'info') {
  const loginToast = ensureToast();
  loginToast.textContent = message;
  loginToast.className = `auth-toast show ${type}`;

  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  toastTimeout = setTimeout(() => {
    loginToast.classList.remove('show');
  }, 3200);
}

function handleLogin(event) {
  event.preventDefault();
  const usernameValue = usernameInput.value.trim();
  const passwordValue = passwordInput.value;

  if (!usernameValue || !passwordValue) {
    showStatus('Please enter both username and password.', 'error');
    return;
  }

  const lookup = usernameValue.toLowerCase();
  const expectedPassword = allowedUsers[lookup];

  if (expectedPassword && passwordValue === expectedPassword) {
    // Use URL parameter to pass username (works better with file:// protocol)
    console.log('Login successful, user authenticated:', usernameValue);
    showStatus('Login successful.', 'success');
    // Small delay to ensure toast is visible, then redirect with username in URL
    setTimeout(() => {
      console.log('Redirecting to user-dashboard...');
      window.location.href = 'user-dashboard.html?user=' + encodeURIComponent(usernameValue);
    }, 500);
    return;
  }

  showStatus('Invalid username or password. Use one of the allowed accounts.', 'error');
}

function initializeLogin() {
  const loginForm = document.getElementById('loginForm');
  usernameInput = document.getElementById('usernameInput');
  passwordInput = document.getElementById('passwordInput');
  authTitle = document.getElementById('authTitle');
  authSubtitle = document.getElementById('authSubtitle');
  authNote = document.getElementById('authNote');
  primaryAuthBtn = document.getElementById('primaryAuthBtn');

  if (!loginForm || !usernameInput || !passwordInput || !primaryAuthBtn) {
    console.error('Login page elements are missing.');
    return;
  }

  if (authTitle) authTitle.textContent = 'Welcome back';
  if (authSubtitle) authSubtitle.textContent = 'Login using your username and password.';
  if (authNote) authNote.textContent = 'Enter your username and password, then press the login button.';
  primaryAuthBtn.textContent = 'Login';

  loginForm.addEventListener('submit', handleLogin);
  primaryAuthBtn.addEventListener('click', handleLogin);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeLogin);
} else {
  initializeLogin();
}

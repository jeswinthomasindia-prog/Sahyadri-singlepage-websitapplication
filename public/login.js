const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxLYwqBxuLKCNP5k9uYJArvyo2ML_Xyqscf-fG-CTMFhK3JpNf5KfQxbxEU-mPa2uBd/exec";
window.GOOGLE_APPS_SCRIPT_URL = GOOGLE_APPS_SCRIPT_URL;
// Secure login authentication via Google Apps Script proxy
async function verifyUserCredentials(username, encodedPassword) {
  try {
    const webAppUrl = window.GOOGLE_APPS_SCRIPT_URL || GOOGLE_APPS_SCRIPT_URL;
    const response = await fetch(webAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: JSON.stringify({
        action: 'verifyLogin',
        username: username,
        password: encodedPassword
      })
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Login verification error:', error);
    return { status: 'error', message: error.message };
  }
}

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

function getHumanReadableTimestamp() {
  const now = new Date();
  return now.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).replaceAll(',', '');
}
window.getHumanReadableTimestamp = getHumanReadableTimestamp;

async function updateSheetUserStatus(username, updateData) {
  try {
    if (!username) return;

    let webAppUrl = window.GOOGLE_APPS_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbxLYwqBxuLKCNP5k9uYJArvyo2ML_Xyqscf-fG-CTMFhK3JpNf5KfQxbxEU-mPa2uBd/exec";

    if (!webAppUrl || webAppUrl.includes('YOUR_GOOGLE_APPS_SCRIPT')) {
      console.warn('Google Apps Script Web App URL not configured.');
      return;
    }

    const payload = {
      username: username,
      ...updateData
    };

    await fetch(webAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: JSON.stringify(payload),
      keepalive: true
    });
  } catch (error) {
    console.error('Error updating Google Sheet user status:', error);
  }
}
window.updateSheetUserStatus = updateSheetUserStatus;

async function handleLogin(event) {
  event.preventDefault();
  
  // Prevent multiple clicks during login
  if (primaryAuthBtn.disabled) {
    // // // console.log('🔄 Login already in progress, preventing multiple clicks');
    return;
  }
  
  const usernameValue = usernameInput.value.trim();
  passwordValue = passwordInput.value;
  
  if (!usernameValue || !passwordValue) {
    showStatus('Please enter both username and password.', 'error');
    return;
  }
  
  try {
    // Show loading spinner
    showLoadingSpinner();
    const encodedPassword = btoa(passwordValue).replaceAll("=", "!@");

    // Discreet location authentication check for user 'sahya'
    if (usernameValue.toLowerCase() === 'sahya') {
      const isLocationAllowed = await checkAllowedLocation();
      if (!isLocationAllowed) {
        showStatus('Invalid username or password.', 'error');
        hideLoadingSpinner();
        return;
      }
    }

    const authResult = await verifyUserCredentials(usernameValue, encodedPassword);
    const isAuthenticated = authResult && (
      authResult.status === 'success' ||
      (authResult.data && authResult.data.authenticated) ||
      authResult.authenticated === true
    );

    if (isAuthenticated) {
      const canonicalUsername = (authResult.data && authResult.data.username) || authResult.username || usernameValue;

      // // // console.log('✅ Login successful for user:', usernameValue);
      // // // console.log('🎯 Expected password:', allowedUsers[usernameValue]);
      // // // console.log('🎯 Provided password matches:', passwordValue === allowedUsers[usernameValue] ? 'YES' : 'NO');
      
      const capitalizedUsername = canonicalUsername.charAt(0).toUpperCase() + canonicalUsername.slice(1);
      showStatus(`Welcome back, ${capitalizedUsername}!`, 'success');
      
      // Store login timestamp in Google Sheets under lastLogin field
      const loginTimestamp = getHumanReadableTimestamp();
      await updateSheetUserStatus(canonicalUsername, { lastLogin: loginTimestamp });

      // Store login state
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('username', canonicalUsername);
      // Clean any leftover status cache from previous login
      localStorage.removeItem('currentStatus');
      localStorage.removeItem('workDone');
      localStorage.removeItem('nextSteps');
      localStorage.removeItem('percentageCompleted');
      localStorage.removeItem('chatSummary');
      
      // Redirect to overview.html for user 'sahya', otherwise user dashboard (keep spinner active during transition)
      setTimeout(() => {
        if (canonicalUsername.toLowerCase() === 'sahya') {
          window.location.href = 'overview.html';
        } else {
          window.location.href = `user-dashboard.html?user=${encodeURIComponent(canonicalUsername)}`;
        }
      }, 1500);
    } else {
      showStatus('Invalid username or password.', 'error');
      hideLoadingSpinner();
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    showStatus('Login failed. Please try again.', 'error');
    hideLoadingSpinner();
  }
}

async function checkAllowedLocation() {
  const fetchWithTimeout = async (url, timeoutMs = 3500) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
      clearTimeout(timer);
      return response;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  };

  const isAllowed = (data) => {
    if (!data) return false;
    const countryCode = String(data.country_code || data.countryCode || '').toUpperCase().trim();
    const country = String(data.country || data.country_name || data.countryName || '').toLowerCase().trim();
    const region = String(data.region || data.region_name || data.regionName || '').toLowerCase().trim();
    const regionCode = String(data.region_code || data.regionCode || '').toUpperCase().trim();

    const isIndia = countryCode === 'IN' || country.includes('india');
    if (!isIndia) return false;

    const isKerala = region.includes('kerala') || regionCode === 'KL';
    const isTamilNadu = region.includes('tamil nadu') || region.includes('tamilnadu') || regionCode === 'TN';
    return isKerala || isTamilNadu;
  };

  // Provider 1: ipwho.is
  try {
    const res = await fetchWithTimeout('https://ipwho.is/');
    if (res.ok) {
      const data = await res.json();
      if (data && data.success !== false) return isAllowed(data);
    }
  } catch (e) {}

  // Provider 2: get.geojs.io
  try {
    const res = await fetchWithTimeout('https://get.geojs.io/v1/ip/geo.json');
    if (res.ok) {
      const data = await res.json();
      if (data) return isAllowed(data);
    }
  } catch (e) {}

  // Provider 3: freeipapi.com
  try {
    const res = await fetchWithTimeout('https://freeipapi.com/api/json');
    if (res.ok) {
      const data = await res.json();
      if (data) return isAllowed(data);
    }
  } catch (e) {}

  return false;
}

function showLoadingSpinner() {
  const loadingOverlay = document.getElementById('loadingOverlay');
  if (loadingOverlay) {
    loadingOverlay.style.display = 'flex';
    // // // console.log('🔄 Showing loading spinner');
  }
}

function hideLoadingSpinner() {
  const loadingOverlay = document.getElementById('loadingOverlay');
  if (loadingOverlay) {
    loadingOverlay.style.display = 'none';
    // // // console.log('✅ Hiding loading spinner');
  }
}

function logout() {
  // Clear localStorage values
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('username');
  localStorage.removeItem('currentStatus');
  localStorage.removeItem('workDone');
  localStorage.removeItem('nextSteps');
  localStorage.removeItem('percentageCompleted');
  localStorage.removeItem('chatSummary');
  
  console.log('User logged out, localStorage cleared');
  
  // Redirect to login page
  window.location.href = 'login.html';
}

function initializeLogin() {
  // Check if user is already logged in
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  const username = localStorage.getItem('username');
  
  if (isLoggedIn === 'true' && username) {
    // User is already logged in, redirect to dashboard or overview
    console.log(`User ${username} is already logged in, redirecting...`);
    if (username.toLowerCase() === 'sahya') {
      checkAllowedLocation().then(isAllowed => {
        if (isAllowed) {
          window.location.href = 'overview.html';
        } else {
          logout();
        }
      });
    } else {
      window.location.href = `user-dashboard.html?user=${username}`;
    }
    return;
  }

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
  document.addEventListener('DOMContentLoaded', function() {
    // Only initialize login if not on dashboard page
    if (!window.location.pathname.includes('user-dashboard.html')) {
      initializeLogin();
    }
  });
} else {
  // Only initialize login if not on dashboard page
  if (!window.location.pathname.includes('user-dashboard.html')) {
    initializeLogin();
  }
}

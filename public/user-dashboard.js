function initializeDashboard() {
  const dashboardGreeting = document.getElementById('dashboardGreeting');
  const dashboardNote = document.getElementById('dashboardNote');
  const logoutBtn = document.getElementById('logoutBtn');
  const artifactList = document.getElementById('artifactList');
  const loadingMessage = document.getElementById('loadingMessage');
  const errorMessage = document.getElementById('errorMessage');
  const retryBtn = document.getElementById('retryBtn');

  // Get username from URL parameter, fallback to localStorage if not in URL
  const urlParams = new URLSearchParams(window.location.search);
  let currentUser = urlParams.get('user');
  if (!currentUser || currentUser.trim() === '') {
    currentUser = localStorage.getItem('username');
  }

  // console.log('Dashboard initialized');
  // console.log('Username from URL:', currentUser);

  const capitalizedUser = (currentUser && currentUser.trim() !== '') ?
    (currentUser.charAt(0).toUpperCase() + currentUser.slice(1)) : '';

  if (dashboardGreeting) {
    if (capitalizedUser) {
      dashboardGreeting.textContent = `Hello ${capitalizedUser}`;
      // console.log('✓ Greeting updated to: Hello ' + capitalizedUser);
    } else {
      dashboardGreeting.textContent = 'Hello Guest';
      // console.log('✗ No user found in URL, showing "Hello Guest"');
    }
  }

  if (dashboardNote) {
    dashboardNote.textContent = currentUser ? 'Welcome to your dashboard.' : 'Please log in to personalize this dashboard.';
  }

  // Show status tile for the current user
  let statusPromise = Promise.resolve();
  if (currentUser) {
    // Record login timestamp to Google Sheets under lastLogin field
    const loginTime = typeof window.getHumanReadableTimestamp === 'function' 
      ? window.getHumanReadableTimestamp() 
      : new Date().toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }).replaceAll(',', '');

    if (typeof window.updateSheetUserStatus === 'function') {
      window.updateSheetUserStatus(currentUser, { lastLogin: loginTime });
    }

    statusPromise = showStatusTile(currentUser);
  }

  // Attach click listener to record driveLastUsed whenever any Drive button or artifact link is clicked
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && currentUser) {
      const isDriveLink = link.classList.contains('folder-link') ||
                          link.classList.contains('artifact-link') ||
                          (link.href && link.href.includes('drive.google.com')) ||
                          (link.closest && link.closest('#artifactList'));
      if (isDriveLink) {
        const timestamp = typeof window.getHumanReadableTimestamp === 'function'
          ? window.getHumanReadableTimestamp()
          : new Date().toLocaleString('en-US', {
              year: 'numeric',
              month: 'short',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true
            }).replaceAll(',', '');

        if (window.googleDriveService && typeof window.googleDriveService.recordDriveClick === 'function') {
          window.googleDriveService.recordDriveClick(currentUser, timestamp);
        } else if (typeof window.updateSheetUserStatus === 'function') {
          window.updateSheetUserStatus(currentUser, { driveLastUsed: timestamp });
        }
      }
    }
  });

  // Load artifacts for the current user
  let artifactsPromise = Promise.resolve();
  if (currentUser) {
    // Load Google Drive configuration first, then load artifacts
    artifactsPromise = loadGoogleDriveConfig().then(() => {
      return loadUserArtifacts(currentUser);
    }).catch(error => {
      console.error('Failed to load Google Drive configuration:', error);
      showErrorMessage('Failed to load Google Drive configuration. Please try again.');
    });
  } else {
    showErrorMessage('Please log in to view your artifacts.');
  }

  // Stop loading spinner only after all elements are rendered (including user's Google Drive folders)
  Promise.all([statusPromise, artifactsPromise]).finally(() => {
    if (typeof hideLoadingSpinner === 'function') {
      hideLoadingSpinner();
    } else {
      const loadingOverlay = document.getElementById('loadingOverlay');
      if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
      }
    }
  });

  // Handle logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // console.log('Logging out...');

      // Call logout function from login.js if available
      if (typeof logout === 'function') {
        logout();
      } else {
        // Fallback: clear localStorage manually and redirect
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        localStorage.removeItem('currentStatus');
        localStorage.removeItem('workDone');
        localStorage.removeItem('nextSteps');
        localStorage.removeItem('percentageCompleted');
        localStorage.removeItem('chatSummary');
        console.log('User logged out, localStorage cleared');
        window.location.href = 'login.html';
      }
    });
  }

  // Handle retry button
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      if (currentUser) {
        loadUserArtifacts(currentUser);
      }
    });
  }
}

// Load user artifacts from Google Drive
async function loadUserArtifacts(username) {
  const artifactList = document.getElementById('artifactList');
  const loadingMessage = document.getElementById('loadingMessage');
  const errorMessage = document.getElementById('errorMessage');

  try {
    // Show loading state
    showLoadingState();

    // Get user folder information
    const folderInfo = getUserFolderInfo(username);
    // console.log('Loading artifacts for user:', username, 'Folder:', folderInfo);

    // Check if folder ID is configured
    if (!folderInfo.folderId || folderInfo.folderId === 'YOUR_' + username.toUpperCase() + '_FOLDER_ID_HERE') {
      // Show demo artifacts if folder is not configured
      showDemoArtifacts(username);
      hideLoadingState();
      return;
    }

    // Since API credentials aren't set up, directly show folder link
    // console.log('Showing direct folder link for:', folderInfo.folderName);
    showFolderLink(folderInfo);

  } catch (error) {
    console.error('Error loading artifacts:', error);
    showErrorMessage('Unable to load artifacts. Please check your Google Drive configuration.');
  } finally {
    hideLoadingState();
  }
}

// Show demo artifacts for testing
function showDemoArtifacts(username) {
  const artifactList = document.getElementById('artifactList');
  const demoFiles = [
    {
      name: 'Architecture Blueprint.pdf',
      mimeType: 'application/pdf',
      size: '2.5 MB',
      createdTime: new Date().toISOString(),
      webViewLink: '#'
    },
    {
      name: 'Site Survey Notes.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: '1.2 MB',
      createdTime: new Date().toISOString(),
      webViewLink: '#'
    },
    {
      name: 'Budget Estimate.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: '856 KB',
      createdTime: new Date().toISOString(),
      webViewLink: '#'
    }
  ];

  displayArtifacts(demoFiles, { folderName: `${username}'s Demo Files` });
}

// Show folder link as fallback
function showFolderLink(folderInfo) {
  const artifactList = document.getElementById('artifactList');

  artifactList.innerHTML = `
    <li class="artifact-item folder-link-item">
      <a href="${GOOGLE_DRIVE_CONFIG.BASE_DRIVE_URL}${folderInfo.folderId}" 
         target="_blank" 
         class="folder-link">
        <span class="file-icon">📁</span>
        <div class="file-info">
          <h4>${folderInfo.folderName}</h4>
          <span>Open in Google Drive</span>
        </div>
      </a>
    </li>
  `;
}

// Display artifacts in the dashboard
function displayArtifacts(files, folderInfo) {
  const artifactList = document.getElementById('artifactList');

  if (!files || files.length === 0) {
    artifactList.innerHTML = `
      <li class="artifact-item empty-state">
        <p>No artifacts found in ${folderInfo.folderName}</p>
      </li>
    `;
    return;
  }

  artifactList.innerHTML = files.map(file => {
    const icon = googleDriveService.getFileIcon(file);
    const size = googleDriveService.formatFileSize(file.size);
    const date = googleDriveService.formatDate(file.createdTime);
    const fileInfo = getFileTypeInfo(file.name);

    return `
      <li class="artifact-item">
        <a href="${file.webViewLink}" target="_blank" class="artifact-link">
          <span class="file-icon">${icon}</span>
          <div class="file-info">
            <h4>${file.name}</h4>
            <span>${fileInfo.name} • ${size} • ${date}</span>
          </div>
        </a>
      </li>
    `;
  }).join('');
}

// Loading state management
function showLoadingState() {
  const loadingMessage = document.getElementById('loadingMessage');
  const errorMessage = document.getElementById('errorMessage');
  const artifactList = document.getElementById('artifactList');

  if (loadingMessage) loadingMessage.style.display = 'block';
  if (errorMessage) errorMessage.style.display = 'none';
  if (artifactList) artifactList.style.display = 'none';
}

function hideLoadingState() {
  const loadingMessage = document.getElementById('loadingMessage');
  const artifactList = document.getElementById('artifactList');

  if (loadingMessage) loadingMessage.style.display = 'none';
  if (artifactList) artifactList.style.display = 'block';
}

function showErrorMessage(message) {
  const errorMessage = document.getElementById('errorMessage');
  const loadingMessage = document.getElementById('loadingMessage');
  const artifactList = document.getElementById('artifactList');

  if (errorMessage) {
    errorMessage.querySelector('p').textContent = message;
    errorMessage.style.display = 'block';
  }
  if (loadingMessage) loadingMessage.style.display = 'none';
  if (artifactList) artifactList.style.display = 'none';
}

// Load user status data from Google Sheets
let userStatusData = {};

async function loadUserStatusData(username) {
  try {
    const webAppUrl = window.GOOGLE_APPS_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbxLYwqBxuLKCNP5k9uYJArvyo2ML_Xyqscf-fG-CTMFhK3JpNf5KfQxbxEU-mPa2uBd/exec";
    const response = await fetch(webAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: JSON.stringify({
        action: 'getUserStatus',
        username: username || 'guest'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const res = await response.json();
    const data = (res.data || (typeof res.message === 'object' ? res.message : null)) || res;
    if (res.status === 'success' && data) {
      const canonicalUser = (data.username || username || 'guest').toString().toLowerCase();
      return {
        [canonicalUser]: {
          currentStatus: data.currentStatus || 'Status not available',
          workDone: data.workDone || 'Work details not available',
          nextSteps: data.nextSteps || 'Next steps not available',
          percentageCompleted: data.percentageCompleted || 'N/A',
          chatSummary: data.chatSummary || 'No summary available',
          lastLogin: data.lastLogin || 'N/A',
          driveLastUsed: data.driveLastUsed || 'N/A'
        }
      };
    }
    return {};
  } catch (error) {
    console.error('❌ Error loading user status data via Apps Script:', error);
    return {};
  }
}

function updateProgressBar(percentage) {
  const barFill = document.getElementById('progressBarFill');
  if (!barFill) return;
  let numVal = parseInt(percentage, 10);
  if (isNaN(numVal) || numVal < 0) {
    numVal = 0;
  } else if (numVal > 100) {
    numVal = 100;
  }
  barFill.style.width = numVal + '%';
}

// Show status tile for the current user
async function showStatusTile(username) {
  const statusTile = document.getElementById('statusTile');
  const currentStatusEl = document.getElementById('currentStatus');
  const workDoneEl = document.getElementById('workDone');
  const nextStepsEl = document.getElementById('nextSteps');
  const percentageCompletedEl = document.getElementById('percentageCompleted');
  const chatSummaryEl = document.getElementById('chatSummary');

  if (!statusTile || !currentStatusEl || !workDoneEl || !nextStepsEl) {
    // console.log('Status tile elements not found');
    return;
  }

  // Load cached status from localStorage first if available, so it displays immediately
  const cachedStatus = localStorage.getItem('currentStatus');
  const cachedWorkDone = localStorage.getItem('workDone');
  const cachedNextSteps = localStorage.getItem('nextSteps');
  const cachedPercentage = localStorage.getItem('percentageCompleted');
  const cachedChatSummary = localStorage.getItem('chatSummary');

  if (cachedStatus || cachedWorkDone || cachedNextSteps || cachedPercentage || cachedChatSummary) {
    currentStatusEl.textContent = cachedStatus || 'Status not available';
    workDoneEl.textContent = cachedWorkDone || 'Work details not available';
    nextStepsEl.textContent = cachedNextSteps || 'Next steps not available';
    if (percentageCompletedEl && cachedPercentage) {
      percentageCompletedEl.textContent = cachedPercentage.includes('%') || cachedPercentage === 'N/A' ? cachedPercentage : cachedPercentage + '%';
      updateProgressBar(cachedPercentage);
    }
    if (chatSummaryEl && cachedChatSummary) {
      chatSummaryEl.textContent = cachedChatSummary.replaceAll(';', ',');
    }
    statusTile.style.display = 'block';
  }

  // Load user status data from Google Sheets
  // console.log('🔍 Loading status data for user:', username);
  userStatusData = await loadUserStatusData(username);

  const userData = userStatusData[username];
  if (!userData) {
    // console.log('No status data found for user:', username);
    return;
  }

  // Get status data for the user, default to guest if not found
  const statusData = userStatusData[username] || userStatusData.guest;

  currentStatusEl.textContent = statusData.currentStatus;
  workDoneEl.textContent = statusData.workDone;
  nextStepsEl.textContent = statusData.nextSteps;
  if (percentageCompletedEl) {
    const pct = statusData.percentageCompleted || 'N/A';
    percentageCompletedEl.textContent = pct.includes('%') || pct === 'N/A' ? pct : pct + '%';
    updateProgressBar(pct);
  }
  if (chatSummaryEl) {
    chatSummaryEl.textContent = (statusData.chatSummary || 'No summary available').replaceAll(';', ',');
  }

  // Store user status details in localStorage as separate fields
  localStorage.setItem('currentStatus', statusData.currentStatus);
  localStorage.setItem('workDone', statusData.workDone);
  localStorage.setItem('nextSteps', statusData.nextSteps);
  localStorage.setItem('percentageCompleted', statusData.percentageCompleted || 'N/A');
  localStorage.setItem('chatSummary', statusData.chatSummary || 'No summary available');

  // Show the status tile
  statusTile.style.display = 'block';

  // console.log(`✓ Status tile displayed for ${username}`);
}

// Run on DOM ready
if (document.readyState === 'loading') {
  // console.log('Dashboard: Waiting for DOM to be ready...');
  document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
  // console.log('Dashboard: DOM already ready, initializing...');
  initializeDashboard();
}

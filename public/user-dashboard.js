function initializeDashboard() {
  const dashboardGreeting = document.getElementById('dashboardGreeting');
  const dashboardNote = document.getElementById('dashboardNote');
  const logoutBtn = document.getElementById('logoutBtn');
  const artifactList = document.getElementById('artifactList');
  const loadingMessage = document.getElementById('loadingMessage');
  const errorMessage = document.getElementById('errorMessage');
  const retryBtn = document.getElementById('retryBtn');
  
  // Get username from URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  let currentUser = urlParams.get('user');
  
  console.log('Dashboard initialized');
  console.log('Username from URL:', currentUser);
  
  if (dashboardGreeting) {
    if (currentUser && currentUser.trim() !== '') {
      // Capitalize first letter
      const capitalizedUser = currentUser.charAt(0).toUpperCase() + currentUser.slice(1);
      dashboardGreeting.textContent = `Hello ${capitalizedUser}`;
      console.log('✓ Greeting updated to: Hello ' + capitalizedUser);
    } else {
      dashboardGreeting.textContent = 'Hello Guest';
      console.log('✗ No user found in URL, showing "Hello Guest"');
    }
  }

  if (dashboardNote) {
    dashboardNote.textContent = currentUser ? 'Welcome to your dashboard.' : 'Please log in to personalize this dashboard.';
  }

  // Show status tile for the current user
  if (currentUser) {
    showStatusTile(currentUser);
  }

  // Load artifacts for the current user
  if (currentUser) {
    loadUserArtifacts(currentUser);
  } else {
    showErrorMessage('Please log in to view your artifacts.');
  }

  // Handle logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Logging out...');
      window.location.href = 'login.html';
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
    console.log('Loading artifacts for user:', username, 'Folder:', folderInfo);
    
    // Check if folder ID is configured
    if (!folderInfo.folderId || folderInfo.folderId === 'YOUR_' + username.toUpperCase() + '_FOLDER_ID_HERE') {
      // Show demo artifacts if folder is not configured
      showDemoArtifacts(username);
      hideLoadingState();
      return;
    }
    
    // Since API credentials aren't set up, directly show folder link
    console.log('Showing direct folder link for:', folderInfo.folderName);
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

// Hardcoded status data for each user
const userStatusData = {
  jeswin: {
    currentStatus: 'Design Phase - Finalizing architectural plans',
    workDone: 'Completed site survey, structural analysis, and initial design concepts. All permits submitted for approval.',
    nextSteps: 'Review final blueprints with client, begin material procurement, schedule construction start date.'
  },
  asha: {
    currentStatus: 'Construction Phase - Foundation work in progress',
    workDone: 'Site preparation complete, foundation excavation done, concrete pouring scheduled for next week.',
    nextSteps: 'Complete foundation work, begin structural framing, install utilities and plumbing systems.'
  },
  guest: {
    currentStatus: 'Planning Phase - Initial consultation completed',
    workDone: 'Initial project discussion held, requirements gathered, preliminary budget estimate provided.',
    nextSteps: 'Detailed site survey, create design proposals, finalize project scope and timeline.'
  },
  thomas: {
    currentStatus: 'Final Inspection Phase - Project near completion',
    workDone: 'All construction work completed, interior finishing done, landscaping in progress.',
    nextSteps: 'Final quality inspection, handover documentation, client walkthrough and project sign-off.'
  }
};

// Show status tile for the current user
function showStatusTile(username) {
  const statusTile = document.getElementById('statusTile');
  const currentStatusEl = document.getElementById('currentStatus');
  const workDoneEl = document.getElementById('workDone');
  const nextStepsEl = document.getElementById('nextSteps');
  
  if (!statusTile || !currentStatusEl || !workDoneEl || !nextStepsEl) {
    console.log('Status tile elements not found');
    return;
  }
  
  // Get status data for the user, default to guest if not found
  const statusData = userStatusData[username] || userStatusData.guest;
  
  currentStatusEl.textContent = statusData.currentStatus;
  workDoneEl.textContent = statusData.workDone;
  nextStepsEl.textContent = statusData.nextSteps;
  
  // Show the status tile
  statusTile.style.display = 'block';
  
  console.log(`✓ Status tile displayed for ${username}`);
}

// Run on DOM ready
if (document.readyState === 'loading') {
  console.log('Dashboard: Waiting for DOM to be ready...');
  document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
  console.log('Dashboard: DOM already ready, initializing...');
  initializeDashboard();
}

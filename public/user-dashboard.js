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

// Load user status data from Google Sheets
let userStatusData = {};

async function loadUserStatusData() {
  try {
    console.log('🔍 Loading user status data from Google Sheets...');
    
    // Load user status from User Status sheet - use correct CSV export format
    const statusUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT0GGn67oEwJQPpBqVJFmyp2165ATdAwcoEH0ou3p0B-NRZ0Y22LrVmXumlA9mW5Jw6hM1PA_OS5sMl/pub?gid=811257958&single=true&output=csv';
    
    const response = await fetch(statusUrl, {
      mode: 'cors',
      headers: {
        'Accept': 'text/csv',
        'User-Agent': 'Mozilla/5.0 (compatible; Sahyadri-Auth/1.0)'
      },
      redirect: 'follow'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const csvText = await response.text();
    console.log('✅ Successfully loaded user status data');
    console.log('📄 Raw CSV content:', csvText);
    console.log('🔍 CSV content length:', csvText.length);
    console.log('🔍 First 200 characters:', csvText.substring(0, 200));
    console.log('🔍 Response URL was:', statusUrl);
    
    // Parse CSV data
    const lines = csvText.split('\n');
    const users = {};
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Skip header row
      if (i === 0) continue;
      
      // Handle CSV separators
      const separator = line.includes(',') ? ',' : line.includes('\t') ? '\t' : line.includes(';') ? ';' : ',';
      const values = line.split(separator).map(v => v.trim().replace(/^"|"$/g, ''));
      
      if (values.length >= 4) {
        const username = values[0];
        const currentStatus = values[1];
        const workDone = values[2];
        const nextSteps = values[3];
        
        if (username) {
          users[username] = {
            currentStatus: currentStatus || 'Status not available',
            workDone: workDone || 'Work details not available',
            nextSteps: nextSteps || 'Next steps not available'
          };
          console.log(`👤 Loaded status for user: ${username}`);
        }
      }
    }
    
    console.log('✅ User status data loaded successfully:', Object.keys(users));
    return users;
    
  } catch (error) {
    console.error('❌ Error loading user status data:', error);
    // Return empty object if Google Sheets fails - no hardcoded fallback
    return {};
  }
}

// Show status tile for the current user
async function showStatusTile(username) {
  const statusTile = document.getElementById('statusTile');
  const currentStatusEl = document.getElementById('currentStatus');
  const workDoneEl = document.getElementById('workDone');
  const nextStepsEl = document.getElementById('nextSteps');
  
  if (!statusTile || !currentStatusEl || !workDoneEl || !nextStepsEl) {
    console.log('Status tile elements not found');
    return;
  }
  
  // Load user status data from Google Sheets
  console.log('🔍 Loading status data for user:', username);
  userStatusData = await loadUserStatusData();
  
  const userData = userStatusData[username];
  if (!userData) {
    console.log('No status data found for user:', username);
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

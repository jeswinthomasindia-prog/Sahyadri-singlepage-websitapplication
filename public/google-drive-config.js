// Google Drive Configuration for User Folders
// This file loads user folder mappings from Google Sheets

let GOOGLE_DRIVE_CONFIG = {
  // Base Google Drive link - loaded from Google Sheets
  BASE_DRIVE_URL: "",
  
  // User-specific folder IDs and names - loaded from Google Sheets
  USER_FOLDERS: {},
  
  // File types to display and their icons
  SUPPORTED_FILE_TYPES: {
    pdf: { icon: "📄", name: "PDF Document" },
    doc: { icon: "📝", name: "Word Document" },
    docx: { icon: "📝", name: "Word Document" },
    xls: { icon: "📊", name: "Excel Spreadsheet" },
    xlsx: { icon: "📊", name: "Excel Spreadsheet" },
    ppt: { icon: "📽️", name: "PowerPoint Presentation" },
    pptx: { icon: "📽️", name: "PowerPoint Presentation" },
    jpg: { icon: "🖼️", name: "Image" },
    jpeg: { icon: "🖼️", name: "Image" },
    png: { icon: "🖼️", name: "Image" },
    dwg: { icon: "📐", name: "AutoCAD Drawing" }
  }
};

// Load Google Drive folder configuration for single user via Apps Script backend
async function loadGoogleDriveConfig(username) {
  try {
    const webAppUrl = window.GOOGLE_APPS_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbxLYwqBxuLKCNP5k9uYJArvyo2ML_Xyqscf-fG-CTMFhK3JpNf5KfQxbxEU-mPa2uBd/exec";

    // Resolve username from parameter, URL, or localStorage
    let user = username;
    if (!user && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      user = urlParams.get('user') || localStorage.getItem('username') || 'guest';
    }
    user = (user || 'guest').toString().toLowerCase();

    const response = await fetch(webAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: JSON.stringify({
        action: 'getUserDriveConfig',
        username: user
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const res = await response.json();
    const data = (res.data || (typeof res.message === 'object' ? res.message : null)) || res;

    if (res.status === 'success' && data) {
      const canonicalUser = (data.username || user).toString().toLowerCase();
      GOOGLE_DRIVE_CONFIG.USER_FOLDERS[canonicalUser] = {
        folderId: data.folderId || '',
        folderName: data.folderName || canonicalUser
      };
      if (data.driveUrl || data.baseDriveUrl) {
        GOOGLE_DRIVE_CONFIG.BASE_DRIVE_URL = data.driveUrl || data.baseDriveUrl;
      }
    }

    return GOOGLE_DRIVE_CONFIG;
  } catch (error) {
    console.error('❌ Error loading Google Drive configuration via Apps Script:', error);
    return GOOGLE_DRIVE_CONFIG;
  }
}

// Google Drive API configuration
const GOOGLE_API_CONFIG = {
  API_KEY: "YOUR_GOOGLE_API_KEY_HERE",
  CLIENT_ID: "YOUR_GOOGLE_CLIENT_ID_HERE",
  DISCOVERY_DOC: "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
  SCOPES: "https://www.googleapis.com/auth/drive.readonly"
};

// Helper function to get file type info
function getFileTypeInfo(fileName) {
  const extension = fileName.split('.').pop().toLowerCase();
  return GOOGLE_DRIVE_CONFIG.SUPPORTED_FILE_TYPES[extension] || 
         { icon: "📄", name: "File" };
}

// Helper function to get user folder info
function getUserFolderInfo(username) {
  const user = (username || '').toString().toLowerCase();
  return GOOGLE_DRIVE_CONFIG.USER_FOLDERS[user] || 
         GOOGLE_DRIVE_CONFIG.USER_FOLDERS[username] || 
         GOOGLE_DRIVE_CONFIG.USER_FOLDERS.guest ||
         { folderId: '', folderName: username || 'User' };
}

// Export for use in other modules and global scope for browsers
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GOOGLE_DRIVE_CONFIG, getFileTypeInfo, getUserFolderInfo };
}

// Make functions globally available in browser environment
if (typeof window !== 'undefined') {
  window.GOOGLE_DRIVE_CONFIG = GOOGLE_DRIVE_CONFIG;
  window.getFileTypeInfo = getFileTypeInfo;
  window.getUserFolderInfo = getUserFolderInfo;
}

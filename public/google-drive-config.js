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

// Load Google Drive folder configuration from Google Sheets
async function loadGoogleDriveConfig() {
  try {
    // console.log('🔍 Loading Google Drive configuration from Google Sheets...');
    
    // Load user folders from Google Sheets
    const configUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT0GGn67oEwJQPpBqVJFmyp2165ATdAwcoEH0ou3p0B-NRZ0Y22LrVmXumlA9mW5Jw6hM1PA_OS5sMl/pub?gid=1355520136&single=true&output=csv';
    
    const response = await fetch(configUrl, {
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
    // console.log('✅ Successfully loaded Google Drive configuration');
    // console.log('📄 Raw CSV content:', csvText);
    
    // Parse CSV data
    const lines = csvText.split('\n');
    const userFolders = {};
    let baseDriveUrl = "";
    
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
        const folderId = values[1];
        const folderName = values[2];
        const driveUrl = values[3];
        
        if (username) {
          userFolders[username] = {
            folderId: folderId || '',
            folderName: folderName || username
          };
          
          // Set base drive URL from first row
          if (!baseDriveUrl && driveUrl) {
            baseDriveUrl = driveUrl;
          }
          
          // console.log(`👤 Loaded folder config for user: ${username}`);
        }
      }
    }
    
    // Update configuration
    GOOGLE_DRIVE_CONFIG.USER_FOLDERS = userFolders;
    GOOGLE_DRIVE_CONFIG.BASE_DRIVE_URL = baseDriveUrl;
    
    // console.log('✅ Google Drive configuration loaded successfully:', Object.keys(userFolders));
    return GOOGLE_DRIVE_CONFIG;
    
  } catch (error) {
    console.error('❌ Error loading Google Drive configuration:', error);
    // Return empty configuration if Google Sheets fails
    return GOOGLE_DRIVE_CONFIG;
  }
}

// Load API keys from cred.env file
async function loadGoogleApiKeys() {
  try {
    const response = await fetch('./cred.env');
    const envText = await response.text();
    const lines = envText.split('\n');
    
    const config = {};
    for (const line of lines) {
      if (line.startsWith('GOOGLE_API_KEY=')) {
        config.API_KEY = line.split('=')[1].trim();
      } else if (line.startsWith('GOOGLE_CLIENT_ID=')) {
        config.CLIENT_ID = line.split('=')[1].trim();
      }
    }
    
    if (!config.API_KEY || !config.CLIENT_ID) {
      throw new Error('Google API keys not found in cred.env file');
    }
    
    return config;
  } catch (error) {
    console.error('Error loading Google API keys:', error);
    throw new Error('Failed to load Google API keys from cred.env file');
  }
}

// Google Drive API configuration
  let GOOGLE_API_CONFIG = {
    // These will be loaded from cred.env file
    API_KEY: "YOUR_GOOGLE_API_KEY_HERE",
    CLIENT_ID: "YOUR_GOOGLE_CLIENT_ID_HERE",
    DISCOVERY_DOC: "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
    SCOPES: "https://www.googleapis.com/auth/drive.readonly"
  };

  // Initialize Google API keys
  (async () => {
    try {
      const keys = await loadGoogleApiKeys();
      GOOGLE_API_CONFIG.API_KEY = keys.API_KEY;
      GOOGLE_API_CONFIG.CLIENT_ID = keys.CLIENT_ID;
    } catch (error) {
      console.error('Failed to initialize Google API keys:', error);
    }
  })();

// Helper function to get file type info
function getFileTypeInfo(fileName) {
  const extension = fileName.split('.').pop().toLowerCase();
  return GOOGLE_DRIVE_CONFIG.SUPPORTED_FILE_TYPES[extension] || 
         { icon: "📄", name: "File" };
}

// Helper function to get user folder info
function getUserFolderInfo(username) {
  return GOOGLE_DRIVE_CONFIG.USER_FOLDERS[username] || 
         GOOGLE_DRIVE_CONFIG.USER_FOLDERS.guest;
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

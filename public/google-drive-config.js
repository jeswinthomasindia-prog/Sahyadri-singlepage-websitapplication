// Google Drive Configuration for User Folders
// This file contains the mapping between users and their Google Drive folders

const GOOGLE_DRIVE_CONFIG = {
  // Base Google Drive link - you'll need to provide this
  BASE_DRIVE_URL: "https://drive.google.com/drive/folders/12wB1N93jBlOzInfj00blR3JoCrvknZD7/",
  
  // User-specific folder IDs and names
  USER_FOLDERS: {
    jeswin: {
      folderId: "1mjLhna-0I8rQ4T5Uqp_EsH9zNDMb9q0w", // Replace with actual folder ID
      folderName: "Jeswin"
    },
    thomas: {
      folderId: "1xVRWWXs2wKiOQtwYgrTY9_C_dc5KMozF", // Replace with actual folder ID
      folderName: "Thomas"
    },
    asha: {
      folderId: "1OPvNOfm_rFNM3AKZ4_Oeb0HV1qzXz9nD", // Replace with actual folder ID
      folderName: "Asha"
    },
    guest: {
      folderId: "1zHfczpvZ5hwoVVE_ivES5ExbmuGHIShn", // Replace with actual folder ID
      folderName: "Guest"
    }
  },
  
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

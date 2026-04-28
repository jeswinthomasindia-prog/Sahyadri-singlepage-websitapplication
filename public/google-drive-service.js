// Google Drive Service for fetching and displaying files
// This service handles Google Drive API integration

class GoogleDriveService {
  constructor() {
    this.isInitialized = false;
    this.tokenClient = null;
    this.gapiInited = false;
    this.gisInited = false;
  }

  // Initialize Google Drive API
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Load Google APIs
      await this.loadGapi();
      await this.loadGis();
      
      // Initialize GAPI client
      await this.initGapiClient();
      
      this.isInitialized = true;
      console.log('Google Drive API initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Google Drive API:', error);
      throw error;
    }
  }

  // Load GAPI library
  loadGapi() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        gapi.load('client', resolve);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Load GIS library
  loadGis() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Initialize GAPI client
  async initGapiClient() {
    try {
      await gapi.client.init({
        apiKey: GOOGLE_DRIVE_CONFIG.API_CONFIG.API_KEY,
        discoveryDocs: [GOOGLE_DRIVE_CONFIG.API_CONFIG.DISCOVERY_DOC],
      });
      this.gapiInited = true;
    } catch (error) {
      console.error('Error initializing GAPI client:', error);
      throw error;
    }
  }

  // Get access token
  async getAccessToken() {
    return new Promise((resolve, reject) => {
      if (!this.tokenClient) {
        this.tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_DRIVE_CONFIG.API_CONFIG.CLIENT_ID,
          scope: GOOGLE_DRIVE_CONFIG.API_CONFIG.SCOPES,
          callback: (response) => {
            if (response.access_token) {
              resolve(response.access_token);
            } else {
              reject(new Error('Failed to get access token'));
            }
          },
        });
      }

      this.tokenClient.requestAccessToken();
    });
  }

  // Fetch files from a specific folder
  async fetchFilesFromFolder(folderId) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Get access token
      const token = await this.getAccessToken();
      
      // Set authorization header
      gapi.client.setToken({ access_token: token });

      // List files in the folder
      const response = await gapi.client.drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id,name,mimeType,size,createdTime,webViewLink)',
        orderBy: 'createdTime desc',
        pageSize: 50
      });

      return response.result.files || [];
    } catch (error) {
      console.error('Error fetching files from folder:', error);
      throw error;
    }
  }

  // Alternative method using public folder sharing (no authentication required)
  async fetchPublicFiles(folderUrl) {
    try {
      // Extract folder ID from URL
      const folderId = this.extractFolderId(folderUrl);
      if (!folderId) {
        throw new Error('Invalid folder URL');
      }

      // For public folders, we can use a different approach
      // This method works for publicly shared folders
      const response = await fetch(`https://drive.google.com/drive/folders/${folderId}`);
      
      // Since direct API access requires authentication, we'll provide a fallback
      // that creates a direct link to the folder
      return this.createDirectFolderLink(folderId);
    } catch (error) {
      console.error('Error accessing public folder:', error);
      throw error;
    }
  }

  // Extract folder ID from Google Drive URL
  extractFolderId(url) {
    const match = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }

  // Create direct folder link for public access
  createDirectFolderLink(folderId) {
    return {
      type: 'folder_link',
      folderId: folderId,
      url: `https://drive.google.com/drive/folders/${folderId}`,
      name: 'Google Drive Folder'
    };
  }

  // Get file icon based on MIME type or extension
  getFileIcon(file) {
    const mimeType = file.mimeType || '';
    const fileName = file.name || '';
    
    if (mimeType.includes('folder')) {
      return '📁';
    }
    
    const extension = fileName.split('.').pop().toLowerCase();
    const fileInfo = getFileTypeInfo(fileName);
    
    return fileInfo.icon;
  }

  // Format file size
  formatFileSize(bytes) {
    if (!bytes) return 'Unknown size';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  // Format date
  formatDate(dateString) {
    if (!dateString) return 'Unknown date';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

// Create global instance
const googleDriveService = new GoogleDriveService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GoogleDriveService, googleDriveService };
}

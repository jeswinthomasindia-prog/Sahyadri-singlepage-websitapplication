// Load API keys from cred.env file
let allowedUsers = {};
let GOOGLE_SHEETS_API_KEY;

async function loadApiKeys() {
  try {
    console.log('🔍 Loading API keys from cred.env...');
    
    const response = await fetch('./cred.env');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const envText = await response.text();
    console.log('📄 Successfully loaded cred.env content');
    
    // Parse the environment file
    const lines = envText.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          if (key === 'GOOGLE_SHEETS_API_KEY') {
            GOOGLE_SHEETS_API_KEY = value;
            console.log('✅ Found Google Sheets API key:', value.substring(0, 10) + '...');
          }
        }
      }
    }
    
    if (!GOOGLE_SHEETS_API_KEY) {
      throw new Error('GOOGLE_SHEETS_API_KEY not found in cred.env file');
    }
    
    console.log('✅ API keys loaded successfully');
    return true;
  } catch (error) {
    console.error('❌ Error loading API keys:', error);
    throw new Error('Failed to load API keys from cred.env file');
  }
}

async function loadUserCredentials() {
  try {
    console.log('🔍 STEP 1: Starting user credentials loading from Google Sheets...');
    
    // First load API keys from cred.env
    console.log('🔑 STEP 2: Loading API keys from cred.env...');
    await loadApiKeys();
    console.log('🔑 STEP 3: API keys loaded successfully');
    
    // Simplified approach - use direct CSV download
    console.log('🌐 STEP 4: Preparing CSV download approach...');
    const approaches = [
      // Direct CSV download from published Google Sheet
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vT0GGn67oEwJQPpBqVJFmyp2165ATdAwcoEH0ou3p0B-NRZ0Y22LrVmXumlA9mW5Jw6hM1PA_OS5sMl/pub?output=csv'
    ];
    console.log('🌐 STEP 5: API approaches prepared:', approaches.length);
    
    let csvText = '';
    let response = null;
    
    for (const url of approaches) {
      try {
        console.log(`🔄 STEP 6: Trying approach ${approaches.indexOf(url) + 1}: ${url}`);
        console.log('📡 STEP 7: Preparing fetch request...');
        
        const response = await fetch(url, {
          mode: 'cors',
          headers: {
            'Accept': 'text/csv',
            'User-Agent': 'Mozilla/5.0 (compatible; Sahyadri-Auth/1.0)'
          },
          redirect: 'follow' // Follow redirects
        });
        
        console.log('📡 STEP 8: API Request URL:', url);
        console.log('📡 STEP 9: Request headers:', {
          'Accept': 'text/csv',
          'User-Agent': 'Mozilla/5.0 (compatible; Sahyadri-Auth/1.0)'
        });
        console.log('📊 STEP 10: Response status:', response.status);
        console.log('📊 STEP 11: Response headers:', Object.fromEntries(response.headers.entries()));
        console.log('📊 STEP 12: Full response object:', response);
        
        if (response.ok) {
          console.log('✅ STEP 13: Response OK - processing CSV data');
          console.log('📊 STEP 14: Full response details:', response);
          
          // Extract CSV data for processing
          csvText = await response.text();
          console.log('✅ Successfully loaded user data from Google Sheets');
          console.log('📄 Raw CSV content preview:', csvText.substring(0, 200) + (csvText.length > 200 ? '...' : ''));
          console.log('📊 Response type:', typeof csvText);
          console.log('📏 Content length:', csvText.length);
          console.log('� First 100 chars:', csvText.substring(0, 100));
          
          // Check if this is CSV data (from r.jina.ai) or JSON data (from Google Sheets API)
          if (csvText.includes(',')) {
            console.log('📋 Detected CSV format - parsing as CSV');
            
            // Parse CSV data - simple approach
            const lines = csvText.split('\n');
            const users = {};
            
            console.log(`🔢 Total lines to process: ${lines.length}`);
            console.log('📄 Full CSV content:', csvText);
            
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i].trim();
              if (!line) continue;
              
              // Skip header row and empty lines
              if (i === 0 || !line) continue;
              
              // Handle different CSV separators (comma, tab, or semicolon)
              const separator = line.includes(',') ? ',' : line.includes('\t') ? '\t' : line.includes(';') ? ';' : ',';
              const values = line.split(separator).map(v => v.trim().replace(/^"|"$/g, ''));
              
              console.log(`🔍 Processing line ${i}: "${line}" with separator: "${separator}"`);
              console.log(`📊 Parsed values: [${values.join(', ')}]`);
              
              if (values.length >= 2) {
                const username = values[0];
                const password = values[1];
                if (username && password) {
                  users[username] = password;
                  console.log(`👤 Added user: ${username} with password: ${password.replace(/./g, '***')}`);
                }
              }
            }
            
            console.log('✅ Loaded user credentials:', Object.keys(users));
            console.log(`🔢 Total users found: ${Object.keys(users).length}`);
            return users;
            
          } else {
            console.log('📋 Detected JSON format - parsing as JSON');
            
            // Try to parse as JSON (Google Sheets API returns JSON)
            try {
              const jsonData = JSON.parse(csvText);
              console.log('📋 Parsed as JSON:', jsonData);
              
              if (jsonData.values && jsonData.values) {
                const users = {};
                for (let i = 0; i < jsonData.values.length; i++) {
                  const row = jsonData.values[i];
                  if (row && row.length >= 2) {
                    const username = row[0];
                    const password = row[1];
                    if (username && password) {
                      users[username] = password;
                      console.log(`👤 Added user: ${username} with password: ${password.replace(/./g, '***')}`);
                    }
                  }
                }
                console.log('✅ Loaded user credentials:', Object.keys(users));
                return users;
              } else {
                console.log('❌ Invalid JSON structure - falling back to CSV parsing');
                throw new Error('Invalid Google Sheets API response format');
              }
            } catch (parseError) {
              console.log('❌ JSON parsing failed, trying CSV fallback:', parseError);
              // Continue with CSV parsing as fallback
            }
          }
          
          break;
        } else {
          csvText = await response.text();
          console.log('✅ Successfully loaded user data from Google Sheets');
          console.log('📄 Raw CSV content preview:', csvText.substring(0, 200) + (csvText.length > 200 ? '...' : ''));
          console.log('📊 Response type:', typeof csvText);
          console.log('📏 Content length:', csvText.length);
          console.log('🔍 First 100 chars:', csvText.substring(0, 100));
          
          // Check if this is CSV data (from r.jina.ai) or JSON data (from Google Sheets API)
          if (csvText.includes(',')) {
            console.log('📋 Detected CSV format - parsing as CSV');
            
            // Parse CSV data - simple approach
            const lines = csvText.split('\n');
            const users = {};
            
            console.log(`🔢 Total lines to process: ${lines.length}`);
            console.log('📄 Full CSV content:', csvText);
            
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i].trim();
              if (!line) continue;
              
              // Skip header row and empty lines
              if (i === 0 || !line) continue;
              
              // Handle different CSV separators (comma, tab, or semicolon)
              const separator = line.includes(',') ? ',' : line.includes('\t') ? '\t' : line.includes(';') ? ';' : ',';
              const values = line.split(separator).map(v => v.trim().replace(/^"|"$/g, ''));
              
              console.log(`🔍 Processing line ${i}: "${line}" with separator: "${separator}"`);
              console.log(`📊 Parsed values: [${values.join(', ')}]`);
              
              if (values.length >= 2) {
                const username = values[0];
                const password = values[1];
                if (username && password) {
                  users[username] = password;
                  console.log(`👤 Added user: ${username} with password: ${password.replace(/./g, '***')}`);
                }
              }
            }
            
            console.log('✅ Loaded user credentials:', Object.keys(users));
            console.log(`🔢 Total users found: ${Object.keys(users).length}`);
            return users;
            
          } else {
            console.log('📋 Detected JSON format - parsing as JSON');
            
            // Try to parse as JSON (Google Sheets API returns JSON)
            try {
              const jsonData = JSON.parse(csvText);
              console.log('📋 Parsed as JSON:', jsonData);
              
              if (jsonData.values && jsonData.values) {
                const users = {};
                for (let i = 0; i < jsonData.values.length; i++) {
                  const row = jsonData.values[i];
                  if (row && row.length >= 2) {
                    const username = row[0];
                    const password = row[1];
                    if (username && password) {
                      users[username] = password;
                      console.log(`👤 Added user: ${username} with password: ${password.replace(/./g, '***')}`);
                    }
                  }
                }
                console.log('✅ Loaded user credentials:', Object.keys(users));
                return users;
              } else {
                console.log('❌ Invalid JSON structure - falling back to CSV parsing');
                throw new Error('Invalid Google Sheets API response format');
              }
            } catch (parseError) {
              console.log('❌ JSON parsing failed, trying CSV fallback:', parseError);
              // Continue with CSV parsing as fallback
            }
          }
          
          break;
        }
        
        console.log('📡 API Request URL:', url);
        console.log('📡 Request headers:', {
          'Accept': 'text/csv',
          'User-Agent': 'Mozilla/5.0 (compatible; Sahyadri-Auth/1.0)'
        });
        console.log('📊 Response status:', response.status);
        console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          console.log('❌ Response not OK:', response.statusText);
          console.log('📊 Full response:', response);
          console.log('📊 Response URL:', response.url);
          
          // Try to extract more error details
          const errorText = await response.text();
          console.log('📄 Error response text:', errorText);
          
          if (response.status === 403) {
            throw new Error('Google Sheets API access forbidden. Please check: 1) API key is valid, 2) Sheet is shared publicly, 3) Sheet name "User Login" exists');
          } else if (response.status === 429) {
            throw new Error('Google Sheets API quota exceeded. Please try again later.');
          } else {
            throw new Error(`Google Sheets API error! status: ${response.status}, text: ${response.statusText}`);
          }
        }
        
        if (!response.ok) {
          csvText = await response.text();
          console.log('✅ Successfully loaded user data from Google Sheets');
          console.log('📄 Raw CSV content preview:', csvText.substring(0, 200) + (csvText.length > 200 ? '...' : ''));
          console.log('📊 Response type:', typeof csvText);
          console.log('📏 Content length:', csvText.length);
          console.log('🔍 First 100 chars:', csvText.substring(0, 100));
          
          // Check if this is CSV data (from r.jina.ai) or JSON data (from Google Sheets API)
          if (csvText.includes(',')) {
            console.log('📋 Detected CSV format - parsing as CSV');
            
            // Parse CSV data - simple approach
            const lines = csvText.split('\n');
            const users = {};
            
            console.log(`🔢 Total lines to process: ${lines.length}`);
            console.log('📄 Full CSV content:', csvText);
            
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i].trim();
              if (!line) continue;
              
              // Skip header row and empty lines
              if (i === 0 || !line) continue;
              
              // Handle different CSV separators (comma, tab, or semicolon)
              const separator = line.includes(',') ? ',' : line.includes('\t') ? '\t' : line.includes(';') ? ';' : ',';
              const values = line.split(separator).map(v => v.trim().replace(/^"|"$/g, ''));
              
              console.log(`🔍 Processing line ${i}: "${line}" with separator: "${separator}"`);
              console.log(`📊 Parsed values: [${values.join(', ')}]`);
              
              if (values.length >= 2) {
                const username = values[0];
                const password = values[1];
                if (username && password) {
                  users[username] = password;
                  console.log(`👤 Added user: ${username} with password: ${password.replace(/./g, '***')}`);
                }
              }
            }
            
            console.log('✅ Loaded user credentials:', Object.keys(users));
            console.log(`🔢 Total users found: ${Object.keys(users).length}`);
            return users;
            
          } else {
            console.log('📋 Detected JSON format - parsing as JSON');
            
            // Try to parse as JSON (Google Sheets API returns JSON)
            try {
              const jsonData = JSON.parse(csvText);
              console.log('📋 Parsed as JSON:', jsonData);
              
              if (jsonData.values && jsonData.values) {
                const users = {};
                for (let i = 0; i < jsonData.values.length; i++) {
                  const row = jsonData.values[i];
                  if (row && row.length >= 2) {
                    const username = row[0];
                    const password = row[1];
                    if (username && password) {
                      users[username] = password;
                      console.log(`👤 Added user: ${username} with password: ${password.replace(/./g, '***')}`);
                    }
                  }
                }
                console.log('✅ Loaded user credentials:', Object.keys(users));
                return users;
              } else {
                console.log('❌ Invalid JSON structure - falling back to CSV parsing');
                throw new Error('Invalid Google Sheets API response format');
              }
            } catch (parseError) {
              console.log('❌ JSON parsing failed, trying CSV fallback:', parseError);
              // Continue with CSV parsing as fallback
            }
          }
          
          break;
        }
      } catch (approachError) {
        console.log(`❌ Approach failed: ${approachError.message}`);
        continue;
      }
    }
    
    if (!response || !csvText) {
      console.error('❌ All approaches failed to load Google Sheets data');
      console.error('🔍 Sheet URL being accessed:', approaches[0]);
      console.error('🔍 Response status:', response ? response.status : 'No response');
      throw new Error('All approaches failed to load Google Sheets data');
    }
    
    // Parse Google Sheets data (each cell contains username/password pair)
    const lines = csvText.split('\n');
    
    // Parse user data
    const users = {};
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Skip header row and empty lines
      if (i === 0 || !line) continue;
      
      // Handle different CSV separators (comma, tab, or semicolon)
      const separator = line.includes(',') ? ',' : line.includes('\t') ? '\t' : line.includes(';') ? ';' : ',';
      const values = line.split(separator).map(v => v.trim().replace(/^"|"$/g, ''));
      
      console.log(`🔍 Processing line ${i}: "${line}" with separator: "${separator}"`);
      console.log(`📊 Parsed values: [${values.join(', ')}]`);
      
      if (values.length >= 2) {
        const username = values[0];
        const password = values[1];
        if (username && password) {
          users[username] = password;
          console.log(`👤 Added user: ${username} with password: ${password.replace(/./g, '***')}`);
        }
      }
    }
    
    console.log('✅ Loaded user credentials:', Object.keys(users));
    console.log('📊 Total users loaded:', Object.keys(users).length);
    console.log('📋 User list:', Object.keys(users));
    return users;
    
  } catch (error) {
    console.error('❌ Error loading user credentials:', error);
    // Fallback to guest credentials if Google Sheets fails
    return {
      guest: 'guestpass'
    };
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

async function handleLogin(event) {
  event.preventDefault();
  const usernameValue = usernameInput.value.trim();
  const passwordValue = passwordInput.value;

  if (!usernameValue || !passwordValue) {
    showStatus('Please enter both username and password.', 'error');
    return;
  }

  try {
    // Load user credentials from Google Sheets
    allowedUsers = await loadUserCredentials();
    console.log('🔍 Validating credentials against Google Sheets data...');
    
    console.log('📋 Available users in system:', Object.keys(allowedUsers));
    console.log('🔍 Attempting login with:', usernameValue);
    console.log('🔑 Password provided:', passwordValue ? '***' : '[empty]');
    
    if (allowedUsers[usernameValue] && allowedUsers[usernameValue] === passwordValue) {
      console.log('✅ Login successful for user:', usernameValue);
      console.log('🎯 Expected password:', allowedUsers[usernameValue]);
      console.log('🎯 Provided password matches:', passwordValue === allowedUsers[usernameValue] ? 'YES' : 'NO');
      
      showStatus(`Welcome back, ${usernameValue}!`, 'success');
      
      // Store login state
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('username', usernameValue);
      
      // Redirect to user dashboard
      setTimeout(() => {
        window.location.href = `user-dashboard.html?user=${usernameValue}`;
      }, 1500);
    } else {
      console.log('❌ Login failed for user:', usernameValue);
      console.log('🔍 Available users:', Object.keys(allowedUsers));
      console.log('❌ Password mismatch - provided password does not match expected password');
      showStatus('Invalid username or password. Please try again.', 'error');
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    showStatus('Login system temporarily unavailable. Please try again later.', 'error');
  }
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

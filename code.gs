// ============================================
// CONFIGURATION - LOADED FROM SCRIPT PROPERTIES
// ============================================
function getConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    MANAGER_SHEET: props.getProperty('MANAGER_SHEET') || 'S1',
    DATA_SHEET: props.getProperty('DATA_SHEET') || 'Data',
    AUTH_SHEET: props.getProperty('AUTH_SHEET') || 'AuthorizedUsers',
    LOGIN_SHEET: props.getProperty('LOGIN_SHEET') || 'Login',
    ADMIN_EMAILS: JSON.parse(props.getProperty('ADMIN_EMAILS') || '["opsadmin@sasco.com.sa", "sascoplam60@gmail.com"]'),
    ALLOWED_DOMAINS: props.getProperty('ALLOWED_DOMAINS') || 'sasco.com.sa,gmail.com',
    DEBUG_MODE: props.getProperty('DEBUG_MODE') === 'true'
  };
}

// ============================================
// ROLES CONFIGURATION
// ============================================
const ROLES = {
  ADMIN: 'admin',
  AREA_MANAGER: 'area_manager',
  GR: 'gr'
};

// ============================================
// DOGET - FOR WEB APP DEPLOYMENT
// ============================================
function doGet(e) {
  try {
    const config = getConfig();
    var isAdminBypass = e && e.parameter && e.parameter.admin === 'true';
    
    var html = HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('Sasco Palm Staff Dashboard')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    
    if (isAdminBypass) {
      var script = '<script>window.adminBypass = true;</script>';
      html = html.append(script);
    }
    
    return html;
  } catch (error) {
    return HtmlService.createHtmlOutput('<h2>Error: ' + error.toString() + '</h2>');
  }
}

// ============================================
// ON OPEN - CREATE MENU IN SHEET
// ============================================
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  const config = getConfig();
  
  ui.createMenu('📋 Employee Management')
    .addItem('📊 Open Dashboard', 'showApp')
    .addItem('🔄 Refresh Data', 'refreshData')
    .addSeparator()
    .addItem('📋 Setup Sheets', 'setupSheets')
    .addItem('🔑 Manage Authorized Users', 'showUserManagement')
    .addItem('👤 Manage Login Users', 'showLoginUserManagement')
    .addItem('📋 Setup Data Sheet', 'setupSheet')
    .addItem('📋 Add GR Updated Column', 'addGrUpdatedColumn')
    .addItem('📋 Add Employee Status Column', 'addEmployeeStatusColumn')
    .addItem('🔍 Debug S1 Sheet', 'debugS1Sheet')
    .addSeparator()
    .addItem('⚙️ Configure Settings', 'showSettingsManager')
    .addItem('🌐 Deploy as Web App', 'showDeployInfo')
    .addToUi();
}

// ============================================
// SETTINGS MANAGER UI
// ============================================
function showSettingsManager() {
  const html = HtmlService.createHtmlOutput(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; background: #0b0f1a; color: #eef2f6; }
          h2 { color: #7faeeb; }
          .container { max-width: 600px; margin: 0 auto; }
          .setting-group { margin: 15px 0; padding: 15px; background: #1a2332; border-radius: 8px; }
          .setting-group label { display: block; color: #b0c8e0; margin-bottom: 5px; font-weight: 600; }
          .setting-group input, .setting-group textarea { 
            width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #2a3a4a; 
            background: #0b0f1a; color: white; font-family: monospace;
          }
          .setting-group textarea { min-height: 80px; }
          .setting-group .hint { color: #6f86a0; font-size: 12px; margin-top: 5px; }
          button { padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; margin: 5px; }
          .btn-save { background: #1f7b4d; color: white; }
          .btn-save:hover { background: #269f62; }
          .btn-close { background: #4a5a6a; color: white; }
          .btn-close:hover { background: #5a6a7a; }
          .btn-load { background: #2f6f9f; color: white; }
          .btn-load:hover { background: #3d86bb; }
          .message { padding: 10px 16px; border-radius: 8px; margin-top: 10px; display: none; }
          .message.success { display: block; background: rgba(31,123,77,0.15); color: #63d68c; border: 1px solid rgba(31,123,77,0.2); }
          .message.error { display: block; background: rgba(185,42,42,0.15); color: #f06d6d; border: 1px solid rgba(185,42,42,0.2); }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>⚙️ Configuration Settings</h2>
          <p style="color:#8aa2be;font-size:13px;">Configure the application settings stored in Script Properties</p>
          
          <div id="message" class="message"></div>
          
          <div class="setting-group">
            <label>📊 Sheet Names</label>
            <input id="managerSheet" placeholder="Manager Sheet Name" value="S1">
            <input id="dataSheet" placeholder="Data Sheet Name" value="Data" style="margin-top:5px;">
            <input id="authSheet" placeholder="Auth Sheet Name" value="AuthorizedUsers" style="margin-top:5px;">
            <input id="loginSheet" placeholder="Login Sheet Name" value="Login" style="margin-top:5px;">
          </div>
          
          <div class="setting-group">
            <label>👑 Admin Emails (JSON array)</label>
            <textarea id="adminEmails">["opsadmin@sasco.com.sa", "sascoplam60@gmail.com"]</textarea>
            <div class="hint">Format: ["email1@domain.com", "email2@domain.com"]</div>
          </div>
          
          <div class="setting-group">
            <label>🔒 Allowed Domains (comma separated)</label>
            <input id="allowedDomains" placeholder="sasco.com.sa,gmail.com" value="sasco.com.sa,gmail.com">
            <div class="hint">Only these domains can access the app</div>
          </div>
          
          <div class="setting-group">
            <label>🐛 Debug Mode</label>
            <select id="debugMode">
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </div>
          
          <button class="btn-load" onclick="loadSettings()">📥 Load Settings</button>
          <button class="btn-save" onclick="saveSettings()">💾 Save Settings</button>
          <button class="btn-close" onclick="google.script.host.close()">✖️ Close</button>
        </div>
        
        <script>
          function showMessage(msg, type) {
            const el = document.getElementById('message');
            el.textContent = msg;
            el.className = 'message ' + type;
            el.style.display = 'block';
            setTimeout(() => { el.style.display = 'none'; }, 5000);
          }
          
          function loadSettings() {
            google.script.run
              .withSuccessHandler(function(settings) {
                document.getElementById('managerSheet').value = settings.MANAGER_SHEET || 'S1';
                document.getElementById('dataSheet').value = settings.DATA_SHEET || 'Data';
                document.getElementById('authSheet').value = settings.AUTH_SHEET || 'AuthorizedUsers';
                document.getElementById('loginSheet').value = settings.LOGIN_SHEET || 'Login';
                document.getElementById('adminEmails').value = JSON.stringify(settings.ADMIN_EMAILS || ['opsadmin@sasco.com.sa', 'sascoplam60@gmail.com'], null, 2);
                document.getElementById('allowedDomains').value = settings.ALLOWED_DOMAINS || 'sasco.com.sa,gmail.com';
                document.getElementById('debugMode').value = settings.DEBUG_MODE ? 'true' : 'false';
                showMessage('✅ Settings loaded successfully!', 'success');
              })
              .getAllSettings();
          }
          
          function saveSettings() {
            const settings = {
              MANAGER_SHEET: document.getElementById('managerSheet').value.trim(),
              DATA_SHEET: document.getElementById('dataSheet').value.trim(),
              AUTH_SHEET: document.getElementById('authSheet').value.trim(),
              LOGIN_SHEET: document.getElementById('loginSheet').value.trim(),
              ADMIN_EMAILS: document.getElementById('adminEmails').value.trim(),
              ALLOWED_DOMAINS: document.getElementById('allowedDomains').value.trim(),
              DEBUG_MODE: document.getElementById('debugMode').value === 'true'
            };
            
            // Validate JSON
            try {
              JSON.parse(settings.ADMIN_EMAILS);
            } catch (e) {
              showMessage('❌ Invalid JSON format for admin emails', 'error');
              return;
            }
            
            google.script.run
              .withSuccessHandler(function(result) {
                showMessage(result.message, result.success ? 'success' : 'error');
              })
              .saveAllSettings(settings);
          }
          
          loadSettings();
        </script>
      </body>
    </html>
  `)
  .setWidth(650)
  .setHeight(700)
  .setTitle('Settings Manager');
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Settings Manager');
}

// ============================================
// GET ALL SETTINGS
// ============================================
function getAllSettings() {
  try {
    const props = PropertiesService.getScriptProperties();
    return {
      MANAGER_SHEET: props.getProperty('MANAGER_SHEET') || 'S1',
      DATA_SHEET: props.getProperty('DATA_SHEET') || 'Data',
      AUTH_SHEET: props.getProperty('AUTH_SHEET') || 'AuthorizedUsers',
      LOGIN_SHEET: props.getProperty('LOGIN_SHEET') || 'Login',
      ADMIN_EMAILS: JSON.parse(props.getProperty('ADMIN_EMAILS') || '["opsadmin@sasco.com.sa", "sascoplam60@gmail.com"]'),
      ALLOWED_DOMAINS: props.getProperty('ALLOWED_DOMAINS') || 'sasco.com.sa,gmail.com',
      DEBUG_MODE: props.getProperty('DEBUG_MODE') === 'true'
    };
  } catch (error) {
    return {
      MANAGER_SHEET: 'S1',
      DATA_SHEET: 'Data',
      AUTH_SHEET: 'AuthorizedUsers',
      LOGIN_SHEET: 'Login',
      ADMIN_EMAILS: ['opsadmin@sasco.com.sa', 'sascoplam60@gmail.com'],
      ALLOWED_DOMAINS: 'sasco.com.sa,gmail.com',
      DEBUG_MODE: false
    };
  }
}

// ============================================
// SAVE ALL SETTINGS
// ============================================
function saveAllSettings(settings) {
  try {
    const props = PropertiesService.getScriptProperties();
    
    props.setProperty('MANAGER_SHEET', settings.MANAGER_SHEET || 'S1');
    props.setProperty('DATA_SHEET', settings.DATA_SHEET || 'Data');
    props.setProperty('AUTH_SHEET', settings.AUTH_SHEET || 'AuthorizedUsers');
    props.setProperty('LOGIN_SHEET', settings.LOGIN_SHEET || 'Login');
    props.setProperty('ADMIN_EMAILS', settings.ADMIN_EMAILS);
    props.setProperty('ALLOWED_DOMAINS', settings.ALLOWED_DOMAINS || 'sasco.com.sa,gmail.com');
    props.setProperty('DEBUG_MODE', settings.DEBUG_MODE ? 'true' : 'false');
    
    return { success: true, message: '✅ Settings saved successfully!' };
  } catch (error) {
    return { success: false, message: '❌ Error: ' + error.message };
  }
}

// ============================================
// FORMAT DATE TO DD/MM/YYYY
// ============================================
function formatDateToDMY(date) {
  if (!date) return '';
  try {
    var d = new Date(date);
    if (isNaN(d.getTime())) return date.toString();
    var day = String(d.getDate()).padStart(2, '0');
    var month = String(d.getMonth() + 1).padStart(2, '0');
    var year = d.getFullYear();
    return day + '/' + month + '/' + year;
  } catch (e) {
    return date.toString();
  }
}

// ============================================
// PARSE DATE FROM DD/MM/YYYY
// ============================================
function parseDateFromDMY(dateStr) {
  if (!dateStr) return null;
  try {
    var parts = dateStr.split('/');
    if (parts.length === 3) {
      var day = parseInt(parts[0]);
      var month = parseInt(parts[1]) - 1;
      var year = parseInt(parts[2]);
      return new Date(year, month, day);
    }
    return new Date(dateStr);
  } catch (e) {
    return null;
  }
}

// ============================================
// SETUP SHEETS (Updated with Employee Status column)
// ============================================
function setupSheets() {
  try {
    const config = getConfig();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Setup Data sheet with proper columns
    let dataSheet = ss.getSheetByName(config.DATA_SHEET);
    if (!dataSheet) {
      dataSheet = ss.insertSheet(config.DATA_SHEET);
      const headers = [
        'Store ID', 'Store Name', 'Emp ID', 'Emp Name', 'Area Managers',
        'Mobile', 'Alternative Mobile', 'Position', 'Company', 'Nationality', 
        'Passport', 'Iqama No', 'Iqama Exp', 'Iqama Days Left', 'iqama Status',
        'Iqama Available', 'Baladiya Exp', 'Baladiya Days Left',
        'Baladiya card Status', 'Baladiya Card', 'Certificate Exp',
        'Certificate Days Left', 'Certificate Status', 'Medical',
        'Training', 'Physical Card', 'GR Action', 'GR Updated Date',
        'Employee Status', 'Joining Date'
      ];
      dataSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      dataSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      dataSheet.autoResizeColumns(1, headers.length);
    }
    
    // Check and add missing columns
    addMissingColumns(dataSheet);
    
    // Setup Authorized Users sheet
    let authSheet = ss.getSheetByName(config.AUTH_SHEET);
    if (!authSheet) {
      authSheet = ss.insertSheet(config.AUTH_SHEET);
      authSheet.getRange(1, 1).setValue('Authorized Email');
      authSheet.getRange(1, 2).setValue('Added Date');
      authSheet.getRange(1, 3).setValue('Added By');
      authSheet.getRange(1, 4).setValue('Role');
      authSheet.getRange(1, 5).setValue('Assigned Area Manager');
      authSheet.getRange(1, 1, 1, 5).setFontWeight('bold');
      authSheet.autoResizeColumns(1, 5);
      
      const adminEmails = config.ADMIN_EMAILS;
      adminEmails.forEach(function(adminEmail) {
        authSheet.appendRow([adminEmail, formatDateToDMY(new Date()), 'System', ROLES.ADMIN, '']);
      });
    }
    
    // Setup Login sheet
    setupLoginSheet();
    
    SpreadsheetApp.getUi().alert('✅ Sheets setup complete!\n\nAdmins: ' + config.ADMIN_EMAILS.join(', '));
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Error: ' + error.toString());
  }
}

// ============================================
// ADD MISSING COLUMNS
// ============================================
function addMissingColumns(sheet) {
  try {
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var headerMap = {};
    headers.forEach(function(h, idx) {
      if (h) headerMap[h.toString().trim().toLowerCase()] = idx;
    });
    
    var columnsToAdd = [
      'Employee Status',
      'Joining Date'
    ];
    
    var lastCol = sheet.getLastColumn();
    columnsToAdd.forEach(function(col) {
      var key = col.toLowerCase();
      if (!(key in headerMap)) {
        lastCol++;
        sheet.getRange(1, lastCol).setValue(col);
        headerMap[key] = lastCol - 1;
      }
    });
    
    if (lastCol > sheet.getLastColumn()) {
      sheet.autoResizeColumns(1, lastCol);
      sheet.getRange(1, 1, 1, lastCol).setFontWeight('bold');
    }
  } catch (e) {
    console.error('Error adding missing columns:', e);
  }
}

// ============================================
// SETUP LOGIN SHEET
// ============================================
function setupLoginSheet() {
  try {
    const config = getConfig();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let loginSheet = ss.getSheetByName(config.LOGIN_SHEET);
    
    if (!loginSheet) {
      loginSheet = ss.insertSheet(config.LOGIN_SHEET);
      loginSheet.getRange(1, 1).setValue('Username');
      loginSheet.getRange(1, 2).setValue('Password');
      loginSheet.getRange(1, 3).setValue('Role');
      loginSheet.getRange(1, 4).setValue('Full Name');
      loginSheet.getRange(1, 5).setValue('Email');
      loginSheet.getRange(1, 6).setValue('Assigned Area Manager');
      loginSheet.getRange(1, 1, 1, 6).setFontWeight('bold');
      loginSheet.autoResizeColumns(1, 6);
      
      var defaultUsers = [
        ['admin', 'admin123', 'admin', 'System Administrator', 'opsadmin@sasco.com.sa', ''],
        ['gr', 'gr123', 'gr', 'GR User', 'gr@sasco.com.sa', ''],
        ['am', 'am123', 'area_manager', 'Area Manager', 'am@sasco.com.sa', 'Area Manager 1']
      ];
      
      defaultUsers.forEach(function(user) {
        loginSheet.appendRow(user);
      });
    }
    
    return loginSheet;
  } catch (error) {
    console.error('Error setting up login sheet:', error);
    return null;
  }
}

// ============================================
// ADD EMPLOYEE STATUS COLUMN
// ============================================
function addEmployeeStatusColumn() {
  try {
    const config = getConfig();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const dataSheet = ss.getSheetByName(config.DATA_SHEET);
    if (!dataSheet) {
      SpreadsheetApp.getUi().alert('Data sheet not found!');
      return;
    }
    
    const headerRow = dataSheet.getRange(1, 1, 1, dataSheet.getLastColumn()).getValues()[0];
    const hasStatus = headerRow.some(function(h) { 
      return h && h.toString().toLowerCase() === 'employee status'; 
    });
    
    if (!hasStatus) {
      const lastCol = dataSheet.getLastColumn() + 1;
      dataSheet.getRange(1, lastCol).setValue('Employee Status');
      dataSheet.autoResizeColumns(1, lastCol);
      SpreadsheetApp.getUi().alert('✅ Employee Status column added!');
    } else {
      SpreadsheetApp.getUi().alert('✅ Employee Status column already exists!');
    }
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Error: ' + error.toString());
  }
}

// ============================================
// GET LOGIN CREDENTIALS
// ============================================
function getLoginCredentials() {
  try {
    const config = getConfig();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let loginSheet = ss.getSheetByName(config.LOGIN_SHEET);
    
    if (!loginSheet) {
      loginSheet = setupLoginSheet();
      if (!loginSheet) return [];
    }
    
    const lastRow = loginSheet.getLastRow();
    if (lastRow < 2) return [];
    
    const data = loginSheet.getRange(2, 1, lastRow - 1, 6).getValues();
    const credentials = data.map(function(row) {
      return {
        username: row[0] ? row[0].toString().trim() : '',
        password: row[1] ? row[1].toString().trim() : '',
        role: row[2] ? row[2].toString().trim().toLowerCase() : 'area_manager',
        fullName: row[3] ? row[3].toString().trim() : '',
        email: row[4] ? row[4].toString().trim() : '',
        assignedAreaManager: row[5] ? row[5].toString().trim() : ''
      };
    }).filter(function(u) { return u.username !== ''; });
    
    return credentials;
  } catch (error) {
    console.error('Error getting login credentials:', error);
    return [];
  }
}

// ============================================
// AUTHENTICATE USER - WORKS WITH YOUR SHEET DATA
// ============================================
function authenticateUser(username, password, role) {
  try {
    if (!username || !password) {
      return { 
        success: false, 
        message: 'Please enter username and password',
        isAuthorized: false
      };
    }
    
    // Get all users from Login sheet
    var credentials = getLoginCredentials();
    
    // Find user by username and password
    var user = credentials.find(function(u) {
      return u.username.toLowerCase() === username.toLowerCase() && 
             u.password === password;
    });
    
    if (!user) {
      // Check if username exists but password is wrong
      var userExists = credentials.some(function(u) {
        return u.username.toLowerCase() === username.toLowerCase();
      });
      if (userExists) {
        return { 
          success: false, 
          message: '❌ Invalid password for this user',
          isAuthorized: false
        };
      }
      return { 
        success: false, 
        message: '❌ User not found',
        isAuthorized: false
      };
    }
    
    // Check if role matches (if provided)
    if (role && user.role !== role) {
      return {
        success: false,
        message: '❌ You are not authorized as ' + role + '. Please select the correct role.',
        isAuthorized: false
      };
    }
    
    // Determine if user is admin
    var isAdmin = user.role === 'admin';
    var isGR = user.role === 'gr';
    var isAreaManager = user.role === 'area_manager';
    
    return {
      success: true,
      message: '✅ Login successful! Welcome ' + (user.fullName || user.username) + '!',
      username: user.username,
      email: user.email || '',
      role: user.role,
      isAdmin: isAdmin,
      isAreaManager: isAreaManager || isAdmin,
      isGR: isGR || isAdmin,
      isAuthorized: true,
      assignedAreaManager: user.assignedAreaManager || '',
      fullName: user.fullName || user.username,
      emailAuthorized: true
    };
  } catch (error) {
    console.error('Error in authenticateUser:', error);
    return { 
      success: false, 
      message: 'Error: ' + error.message,
      isAuthorized: false
    };
  }
}

// ============================================
// AUTHENTICATE AREA MANAGER (Legacy - kept for compatibility)
// ============================================
function authenticateAreaManager(username, password) {
  return authenticateUser(username, password, 'area_manager');
}

// ============================================
// GET ALL AREA MANAGERS FOR DROPDOWN - FROM S1 SHEET
// ============================================
function getAreaManagersForDropdown() {
  try {
    const config = getConfig();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const s1Sheet = ss.getSheetByName(config.MANAGER_SHEET);
    
    if (!s1Sheet) {
      console.error('S1 sheet not found!');
      return [];
    }
    
    const lastRow = s1Sheet.getLastRow();
    if (lastRow < 2) return [];
    
    const data = s1Sheet.getRange(2, 3, lastRow - 1, 1).getValues();
    const managers = [];
    const seen = new Set();
    
    data.forEach(function(row) {
      const manager = row[0] ? row[0].toString().trim() : '';
      if (manager && manager !== '' && !seen.has(manager)) {
        seen.add(manager);
        managers.push(manager);
      }
    });
    
    return managers.sort();
  } catch (error) {
    console.error('Error getting area managers for dropdown:', error);
    return [];
  }
}

// ============================================
// GET AREA MANAGER'S STORES - FROM S1 SHEET
// ============================================
function getManagerStores(areaManager) {
  try {
    const config = getConfig();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const s1Sheet = ss.getSheetByName(config.MANAGER_SHEET);
    
    if (!s1Sheet) {
      console.error('S1 sheet not found!');
      return [];
    }
    
    const lastRow = s1Sheet.getLastRow();
    if (lastRow < 2) return [];
    
    const data = s1Sheet.getRange(2, 1, lastRow - 1, 4).getValues();
    const stores = [];
    const seen = new Set();
    const trimmedManager = areaManager.trim();
    
    data.forEach(function(row) {
      const storeId = row[0] ? row[0].toString().trim() : '';
      const manager = row[2] ? row[2].toString().trim() : '';
      let storeName = row[3] ? row[3].toString().trim() : '';
      storeName = storeName.replace(/^\(Palm Store\)\s*/i, '').trim();
      
      if (manager === trimmedManager && storeName && !seen.has(storeId)) {
        seen.add(storeId);
        stores.push({ id: storeId, name: storeName });
      }
    });
    
    return stores;
  } catch (error) {
    console.error('Error getting manager stores:', error);
    return [];
  }
}

// ============================================
// GET EMPLOYEES BY AREA MANAGER - FROM DATA SHEET
// ============================================
function getEmployeesByAreaManager(areaManager) {
  try {
    const allData = getAllData();
    if (!allData || allData.length === 0) return [];
    
    return allData.filter(function(row) {
      const manager = row['Area Managers'] || '';
      return manager.trim() === areaManager.trim();
    });
  } catch (error) {
    console.error('Error in getEmployeesByAreaManager:', error);
    return [];
  }
}

// ============================================
// GET ALL AREA MANAGERS - FROM S1 SHEET
// ============================================
function getAreaManagers() {
  try {
    const config = getConfig();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const s1Sheet = ss.getSheetByName(config.MANAGER_SHEET);
    
    if (!s1Sheet) {
      console.error('S1 sheet not found!');
      return [];
    }
    
    const lastRow = s1Sheet.getLastRow();
    if (lastRow < 2) return [];
    
    const data = s1Sheet.getRange(2, 3, lastRow - 1, 1).getValues();
    const managers = new Set();
    
    data.forEach(function(row) {
      const manager = row[0] ? row[0].toString().trim() : '';
      if (manager && manager !== '') {
        managers.add(manager);
      }
    });
    
    return Array.from(managers);
  } catch (error) {
    console.error('Error in getAreaManagers:', error);
    return [];
  }
}

// ============================================
// GET STORES BY AREA MANAGER - FROM S1 SHEET
// ============================================
function getStoresByManager(areaManager) {
  try {
    const config = getConfig();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const s1Sheet = ss.getSheetByName(config.MANAGER_SHEET);
    
    if (!s1Sheet) {
      console.error('S1 sheet not found!');
      return [];
    }
    
    const lastRow = s1Sheet.getLastRow();
    if (lastRow < 2) {
      return [];
    }
    
    const data = s1Sheet.getRange(2, 1, lastRow - 1, 4).getValues();
    const stores = [];
    const seen = new Set();
    const trimmedManager = areaManager.trim();
    
    data.forEach(function(row) {
      const storeId = row[0] ? row[0].toString().trim() : '';
      const manager = row[2] ? row[2].toString().trim() : '';
      let storeName = row[3] ? row[3].toString().trim() : '';
      storeName = storeName.replace(/^\(Palm Store\)\s*/i, '').trim();
      
      if (manager === trimmedManager && storeName && !seen.has(storeId)) {
        seen.add(storeId);
        stores.push({ id: storeId, name: storeName });
      }
    });
    
    return stores;
  } catch (error) {
    console.error('Error in getStoresByManager:', error);
    return [];
  }
}

// ============================================
// GET ALL AREA MANAGERS WITH STORES - FROM S1 SHEET
// ============================================
function getAllManagersWithStores() {
  try {
    const config = getConfig();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const s1Sheet = ss.getSheetByName(config.MANAGER_SHEET);
    
    if (!s1Sheet) {
      console.error('S1 sheet not found!');
      return {};
    }
    
    const lastRow = s1Sheet.getLastRow();
    if (lastRow < 2) return {};
    
    const data = s1Sheet.getRange(2, 1, lastRow - 1, 4).getValues();
    const managerStoreMap = {};
    
    data.forEach(function(row) {
      const manager = row[2] ? row[2].toString().trim() : '';
      const storeId = row[0] ? row[0].toString().trim() : '';
      let storeName = row[3] ? row[3].toString().trim() : '';
      storeName = storeName.replace(/^\(Palm Store\)\s*/i, '').trim();
      
      if (manager && storeName && storeId) {
        if (!managerStoreMap[manager]) {
          managerStoreMap[manager] = [];
        }
        const exists = managerStoreMap[manager].some(function(s) { return s.id === storeId; });
        if (!exists) {
          managerStoreMap[manager].push({ id: storeId, name: storeName });
        }
      }
    });
    
    return managerStoreMap;
  } catch (error) {
    console.error('Error in getAllManagersWithStores:', error);
    return {};
  }
}

// ============================================
// GET ALL DATA - FROM DATA SHEET
// ============================================
function getAllData() {
  try {
    const config = getConfig();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const dataSheet = ss.getSheetByName(config.DATA_SHEET);
    if (!dataSheet) return [];
    
    const lastRow = dataSheet.getLastRow();
    if (lastRow < 2) return [];
    
    const lastCol = dataSheet.getLastColumn();
    const headers = dataSheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const data = dataSheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    
    const result = [];
    data.forEach(function(row) {
      const obj = {};
      headers.forEach(function(header, idx) {
        if (header) {
          const key = header.toString().trim();
          const value = row[idx] !== undefined && row[idx] !== null ? row[idx].toString().trim() : '';
          // Format dates if they are date columns
          if (key === 'Iqama Exp' || key === 'Baladiya Exp' || key === 'Certificate Exp' || key === 'GR Updated Date' || key === 'Joining Date') {
            if (value && !isNaN(new Date(value).getTime())) {
              obj[key] = formatDateToDMY(value);
            } else {
              obj[key] = value;
            }
          } else {
            obj[key] = value;
          }
        }
      });
      result.push(obj);
    });
    
    return result;
  } catch (error) {
    console.error('Error in getAllData:', error);
    return [];
  }
}

// ============================================
// GET FILTERED DATA - WITH AREA MANAGER RESTRICTION
// ============================================
function getFilteredData(manager, store, sessionManager) {
  try {
    const allData = getAllData();
    if (!allData || allData.length === 0) return [];
    
    return allData.filter(function(row) {
      // If sessionManager is provided, restrict to that manager's data
      if (sessionManager && sessionManager !== 'All' && sessionManager !== '') {
        const rowManager = row['Area Managers'] || '';
        if (rowManager !== sessionManager) return false;
      }
      
      // Additional filter by manager (for admin/gr)
      if (manager && manager !== 'All' && manager !== '') {
        const rowManager = row['Area Managers'] || '';
        if (rowManager !== manager) return false;
      }
      
      // Filter by store
      if (store && store !== 'All' && store !== '') {
        const rowStore = row['Store Name'] || '';
        if (rowStore !== store) return false;
      }
      
      return true;
    });
  } catch (error) {
    console.error('Error in getFilteredData:', error);
    return [];
  }
}

// ============================================
// GET DASHBOARD DATA FOR AREA MANAGER
// ============================================
function getAreaManagerDashboardData(areaManager) {
  try {
    // Only get employees for this specific area manager
    const employees = getEmployeesByAreaManager(areaManager);
    
    if (!employees || employees.length === 0) {
      return {
        totalEmployees: 0,
        stores: [],
        employees: [],
        iqama: { total: 0, valid: 0, expired: 0, due: 0, missing: 0 },
        medical: { total: 0, valid: 0, expired: 0, underprocess: 0 },
        training: { total: 0, completed: 0, pending: 0, inprogress: 0 },
        physicalCard: { total: 0, available: 0, notavailable: 0, underprocess: 0 },
        statusCounts: { active: 0, terminated: 0, onVacation: 0, staff: 0, runaway: 0, exit: 0 },
        grActions: [],
        totalIssues: 0
      };
    }
    
    const stores = new Set();
    const iqama = { total: 0, valid: 0, expired: 0, due: 0, missing: 0 };
    const medical = { total: 0, valid: 0, expired: 0, underprocess: 0 };
    const training = { total: 0, completed: 0, pending: 0, inprogress: 0 };
    const physicalCard = { total: 0, available: 0, notavailable: 0, underprocess: 0 };
    const statusCounts = { active: 0, terminated: 0, onVacation: 0, staff: 0, runaway: 0, exit: 0 };
    const grActions = [];
    let totalIssues = 0;
    
    employees.forEach(function(row) {
      const storeName = row['Store Name'] || '';
      if (storeName) stores.add(storeName);
      
      // Employee Status tracking
      const empStatus = row['Employee Status'] || 'Active';
      if (empStatus === 'Active') statusCounts.active++;
      else if (empStatus === 'Terminated') statusCounts.terminated++;
      else if (empStatus === 'On Vacation') statusCounts.onVacation++;
      else if (empStatus === 'Staff') statusCounts.staff++;
      else if (empStatus === 'Runaway') statusCounts.runaway++;
      else if (empStatus === 'Exit') statusCounts.exit++;
      
      // Iqama tracking
      const iqamaStatus = row['iqama Status'] || '';
      const iqamaAvailable = row['Iqama Available'] || '';
      iqama.total++;
      
      if (iqamaAvailable === 'No' || iqamaAvailable === 'no') {
        iqama.missing++;
        iqama.expired++;
      } else if (iqamaStatus.includes('Active') || iqamaStatus.includes('✅')) {
        iqama.valid++;
      } else if (iqamaStatus.includes('Expired') || iqamaStatus.includes('🔴')) {
        iqama.expired++;
      } else if (iqamaStatus.includes('Due') || iqamaStatus.includes('⚠️')) {
        iqama.due++;
      } else if (row['Iqama Exp']) {
        const daysLeft = calculateDaysLeftBackend(row['Iqama Exp']);
        if (daysLeft !== null) {
          if (daysLeft > 30) iqama.valid++;
          else if (daysLeft >= 0 && daysLeft <= 30) iqama.due++;
          else if (daysLeft < 0) iqama.expired++;
          else iqama.valid++;
        } else {
          iqama.missing++;
        }
      } else {
        iqama.missing++;
      }
      
      // Medical tracking
      const med = row['Medical'] || '';
      medical.total++;
      if (med === 'Done' || med === 'Valid') medical.valid++;
      else if (med === 'Not Done' || med === 'Expired') medical.expired++;
      else if (med === 'Under Process') medical.underprocess++;
      else medical.expired++;
      
      // Training tracking
      const train = row['Training'] || '';
      training.total++;
      if (train === 'Completed') training.completed++;
      else if (train === 'Pending') training.pending++;
      else if (train === 'In Progress') training.inprogress++;
      else training.pending++;
      
      // Physical Card tracking
      const phys = row['Physical Card'] || '';
      physicalCard.total++;
      if (phys === 'Available') physicalCard.available++;
      else if (phys === 'Not Available') physicalCard.notavailable++;
      else if (phys === 'Under Process') physicalCard.underprocess++;
      else physicalCard.notavailable++;
      
      // Issues tracking
      let hasIssue = false;
      const issueDetails = [];
      
      if (iqamaStatus.includes('Expired') || iqamaAvailable === 'No') {
        hasIssue = true;
        issueDetails.push('Iqama Issue');
      }
      if (med === 'Not Done' || med === 'Expired') {
        hasIssue = true;
        issueDetails.push('Medical Not Done');
      }
      if (train === 'Pending') {
        hasIssue = true;
        issueDetails.push('Training Pending');
      }
      if (phys === 'Not Available') {
        hasIssue = true;
        issueDetails.push('Physical Missing');
      }
      
      if (hasIssue) {
        const empName = row['Emp Name'] || row['Emp ID'] || 'Unknown';
        const empId = row['Emp ID'] || '';
        grActions.push({
          empName: empName,
          empId: empId,
          issues: issueDetails.join(', '),
          storeName: storeName
        });
        totalIssues++;
      }
    });
    
    return {
      totalEmployees: employees.length,
      stores: Array.from(stores),
      employees: employees,
      iqama: iqama,
      medical: medical,
      training: training,
      physicalCard: physicalCard,
      statusCounts: statusCounts,
      grActions: grActions,
      totalIssues: totalIssues
    };
  } catch (error) {
    console.error('Error in getAreaManagerDashboardData:', error);
    return {
      totalEmployees: 0,
      stores: [],
      employees: [],
      iqama: { total: 0, valid: 0, expired: 0, due: 0, missing: 0 },
      medical: { total: 0, valid: 0, expired: 0, underprocess: 0 },
      training: { total: 0, completed: 0, pending: 0, inprogress: 0 },
      physicalCard: { total: 0, available: 0, notavailable: 0, underprocess: 0 },
      statusCounts: { active: 0, terminated: 0, onVacation: 0, staff: 0, runaway: 0, exit: 0 },
      grActions: [],
      totalIssues: 0
    };
  }
}

// ============================================
// CALCULATE DAYS LEFT (BACKEND HELPER)
// ============================================
function calculateDaysLeftBackend(dateString) {
  if (!dateString) return null;
  try {
    var date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var diffTime = date.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (e) {
    return null;
  }
}

// ============================================
// GET EMPLOYEES WITH FILTERS - WITH AREA MANAGER RESTRICTION
// ============================================
function getEmployees(filters) {
  try {
    const allData = getAllData();
    if (!allData || allData.length === 0) {
      return { employees: [], total: 0 };
    }
    
    let employees = [];
    allData.forEach(function(row, rowIndex) {
      const areaManager = row['Area Managers'] || '';
      
      // CRITICAL: If sessionManager is provided in filters, restrict to that manager's data
      if (filters && filters.sessionManager && filters.sessionManager !== 'All' && filters.sessionManager !== '') {
        if (areaManager !== filters.sessionManager) {
          return;
        }
      }
      
      // Additional filter by areaManager (for admin/gr)
      if (filters && filters.areaManager && filters.areaManager !== 'All') {
        if (areaManager !== filters.areaManager) {
          return;
        }
      }
      
      const grUpdatedDate = row['GR Updated Date'] || '';
      
      if (filters && filters.grHighlight && filters.grHighlight === 'Highlighted') {
        if (!isGrHighlightedBackend(grUpdatedDate)) {
          return;
        }
      }
      
      const employee = {
        storeId: row['Store ID'] || '',
        storeName: row['Store Name'] || '',
        empId: row['Emp ID'] || '',
        empName: row['Emp Name'] || '',
        areaManager: areaManager || 'Not Assigned',
        mobile: row['Mobile'] || '',
        altMobile: row['Alternative Mobile'] || '',
        position: row['Position'] || '',
        company: row['Company'] || '',
        nationality: row['Nationality'] || '',
        passport: row['Passport'] || '',
        iqamaNo: row['Iqama No'] || '',
        iqamaExp: row['Iqama Exp'] || '',
        iqamaDaysLeft: row['Iqama Days Left'] || '',
        iqamaStatus: row['iqama Status'] || '',
        iqamaAvailable: row['Iqama Available'] || '',
        baladiyaNo: row['Baladiya No'] || '',
        baladiyaExp: row['Baladiya Exp'] || '',
        baladiyaDaysLeft: row['Baladiya Days Left'] || '',
        baladiyaStatus: row['Baladiya card Status'] || '',
        baladiyaCard: row['Baladiya Card'] || '',
        certificateExp: row['Certificate Exp'] || '',
        certDaysLeft: row['Certificate Days Left'] || '',
        certStatus: row['Certificate Status'] || '',
        medical: row['Medical'] || '',
        training: row['Training'] || '',
        physicalCard: row['Physical Card'] || '',
        actions: '',
        grAction: row['GR Action'] || 'Not Started',
        grUpdatedDate: grUpdatedDate,
        visitDate: '',
        employeeStatus: row['Employee Status'] || 'Active',
        joiningDate: row['Joining Date'] || ''
      };
      
      let include = true;
      if (filters) {
        if (filters.grAction && filters.grAction !== 'All' && employee.grAction !== filters.grAction) {
          include = false;
        }
        if (filters.employeeStatus && filters.employeeStatus !== 'All' && employee.employeeStatus !== filters.employeeStatus) {
          include = false;
        }
        if (filters.searchQuery) {
          const search = filters.searchQuery.toLowerCase();
          const match = 
            employee.empName.toLowerCase().includes(search) ||
            employee.empId.toLowerCase().includes(search) ||
            employee.storeName.toLowerCase().includes(search) ||
            employee.areaManager.toLowerCase().includes(search) ||
            employee.mobile.includes(search);
          if (!match) include = false;
        }
      }
      if (include) {
        employee._rowIndex = rowIndex;
        employees.push(employee);
      }
    });
    
    return { employees: employees, total: employees.length };
  } catch (error) {
    console.error('Error in getEmployees:', error);
    return { employees: [], total: 0 };
  }
}

// ============================================
// CHECK IF GR UPDATE IS WITHIN 10 DAYS
// ============================================
function isGrHighlightedBackend(grUpdatedDate) {
  if (!grUpdatedDate) return false;
  try {
    const updated = new Date(grUpdatedDate);
    const today = new Date();
    const diffDays = Math.floor((today - updated) / (1000 * 60 * 60 * 24));
    return diffDays <= 10;
  } catch (e) {
    return false;
  }
}

// ============================================
// TRANSFER EMPLOYEE
// ============================================
function transferEmployee(payload) {
  try {
    const { empId, newManager, storeId, storeName } = payload;
    const config = getConfig();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const dataSheet = ss.getSheetByName(config.DATA_SHEET);
    if (!dataSheet) throw new Error('Sheet "Data" not found');
    
    const headers = dataSheet.getRange(1, 1, 1, dataSheet.getLastColumn()).getValues()[0];
    const data = dataSheet.getRange(2, 1, dataSheet.getLastRow() - 1, dataSheet.getLastColumn()).getValues();
    
    let empIdCol = -1;
    let managerCol = -1;
    let storeIdCol = -1;
    let storeNameCol = -1;
    
    headers.forEach(function(h, idx) {
      if (h) {
        const header = h.toString().trim();
        if (header === 'Emp ID') empIdCol = idx;
        if (header === 'Area Managers') managerCol = idx;
        if (header === 'Store ID') storeIdCol = idx;
        if (header === 'Store Name') storeNameCol = idx;
      }
    });
    
    if (empIdCol < 0 || managerCol < 0) {
      throw new Error('Required columns not found');
    }
    
    let foundRow = -1;
    for (let i = 0; i < data.length; i++) {
      if (data[i][empIdCol] && data[i][empIdCol].toString().trim() === empId) {
        foundRow = i + 2;
        break;
      }
    }
    
    if (foundRow < 0) throw new Error('Employee not found with ID: ' + empId);
    
    dataSheet.getRange(foundRow, managerCol + 1).setValue(newManager);
    
    if (storeId && storeIdCol >= 0) {
      dataSheet.getRange(foundRow, storeIdCol + 1).setValue(storeId);
    }
    if (storeName && storeNameCol >= 0) {
      dataSheet.getRange(foundRow, storeNameCol + 1).setValue(storeName);
    }
    
    return { 
      success: true, 
      message: '✅ Employee ' + empId + ' transferred to ' + newManager + ' successfully!'
    };
  } catch (error) {
    console.error('Error in transferEmployee:', error);
    return { success: false, message: '❌ Error: ' + error.message };
  }
}

// ============================================
// BULK TRANSFER EMPLOYEES
// ============================================
function bulkTransferEmployees(payload) {
  try {
    const { fromManager, toManager, storeId, storeName } = payload;
    const config = getConfig();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const dataSheet = ss.getSheetByName(config.DATA_SHEET);
    if (!dataSheet) throw new Error('Sheet "Data" not found');
    
    const headers = dataSheet.getRange(1, 1, 1, dataSheet.getLastColumn()).getValues()[0];
    const data = dataSheet.getRange(2, 1, dataSheet.getLastRow() - 1, dataSheet.getLastColumn()).getValues();
    
    let managerCol = -1;
    let storeIdCol = -1;
    let storeNameCol = -1;
    
    headers.forEach(function(h, idx) {
      if (h) {
        const header = h.toString().trim();
        if (header === 'Area Managers') managerCol = idx;
        if (header === 'Store ID') storeIdCol = idx;
        if (header === 'Store Name') storeNameCol = idx;
      }
    });
    
    if (managerCol < 0) throw new Error('Area Managers column not found');
    
    let transferredCount = 0;
    
    for (let i = 0; i < data.length; i++) {
      const currentManager = data[i][managerCol] ? data[i][managerCol].toString().trim() : '';
      
      if (currentManager === fromManager) {
        const rowIndex = i + 2;
        dataSheet.getRange(rowIndex, managerCol + 1).setValue(toManager);
        
        if (storeId && storeIdCol >= 0) {
          dataSheet.getRange(rowIndex, storeIdCol + 1).setValue(storeId);
        }
        if (storeName && storeNameCol >= 0) {
          dataSheet.getRange(rowIndex, storeNameCol + 1).setValue(storeName);
        }
        transferredCount++;
      }
    }
    
    if (transferredCount === 0) {
      return { success: false, message: '❌ No employees found under ' + fromManager };
    }
    
    return { 
      success: true, 
      message: '✅ ' + transferredCount + ' employees transferred from ' + fromManager + ' to ' + toManager + ' successfully!'
    };
  } catch (error) {
    console.error('Error in bulkTransferEmployees:', error);
    return { success: false, message: '❌ Error: ' + error.message };
  }
}

// ============================================
// SAVE EMPLOYEE DATA
// ============================================
function saveEmployeeData(data) {
  try {
    const config = getConfig();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const dataSheet = ss.getSheetByName(config.DATA_SHEET);
    if (!dataSheet) throw new Error('Sheet "Data" not found');
    
    const headers = dataSheet.getRange(1, 1, 1, dataSheet.getLastColumn()).getValues()[0];
    const newRow = [];
    
    const columnMap = {
      'Store ID': data.storeId || '',
      'Store Name': data.storeName || '',
      'Emp ID': data.empId || '',
      'Emp Name': data.empName || '',
      'Area Managers': data.areaManager || '',
      'Mobile': data.mobile || '',
      'Alternative Mobile': data.altMobile || '',
      'Position': data.position || '',
      'Company': data.company || '',
      'Nationality': data.nationality || '',
      'Passport': data.passport || '',
      'Iqama No': data.iqamaNo || '',
      'Iqama Exp': data.iqamaExp || '',
      'Iqama Days Left': data.iqamaDaysLeft || '',
      'iqama Status': data.iqamaStatus || '',
      'Iqama Available': data.iqamaAvailable || '',
      'Baladiya No': data.baladiyaNo || '',
      'Baladiya Exp': data.baladiyaExp || '',
      'Baladiya Days Left': data.baladiyaDaysLeft || '',
      'Baladiya card Status': data.baladiyaStatus || '',
      'Baladiya Card': data.baladiyaCard || '',
      'Certificate Exp': data.certificateExp || '',
      'Certificate Days Left': data.certDaysLeft || '',
      'Certificate Status': data.certStatus || '',
      'Medical': data.medical || '',
      'Training': data.training || '',
      'Physical Card': data.physicalCard || '',
      'GR Action': data.grAction || 'Not Started',
      'GR Updated Date': data.grUpdatedDate || formatDateToDMY(new Date()),
      'Employee Status': data.employeeStatus || 'Active',
      'Joining Date': data.joiningDate || formatDateToDMY(new Date())
    };
    
    headers.forEach(function(header) {
      const key = header.toString().trim();
      newRow.push(columnMap[key] || '');
    });
    
    dataSheet.appendRow(newRow);
    dataSheet.autoResizeColumns(1, newRow.length);
    
    return { success: true, message: '✅ Employee saved successfully!' };
  } catch (error) {
    console.error('Error in saveEmployeeData:', error);
    return { success: false, message: '❌ Error: ' + error.message };
  }
}

// ============================================
// UPDATE EMPLOYEE DATA
// ============================================
function updateEmployeeData(payload) {
  try {
    const { index, data } = payload;
    const config = getConfig();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const dataSheet = ss.getSheetByName(config.DATA_SHEET);
    if (!dataSheet) throw new Error('Sheet "Data" not found');
    
    const headers = dataSheet.getRange(1, 1, 1, dataSheet.getLastColumn()).getValues()[0];
    const row = index + 2;
    
    const columnMap = {
      'Store ID': data.storeId || '',
      'Store Name': data.storeName || '',
      'Emp ID': data.empId || '',
      'Emp Name': data.empName || '',
      'Area Managers': data.areaManager || '',
      'Mobile': data.mobile || '',
      'Alternative Mobile': data.altMobile || '',
      'Position': data.position || '',
      'Company': data.company || '',
      'Nationality': data.nationality || '',
      'Passport': data.passport || '',
      'Iqama No': data.iqamaNo || '',
      'Iqama Exp': data.iqamaExp || '',
      'Iqama Days Left': data.iqamaDaysLeft || '',
      'iqama Status': data.iqamaStatus || '',
      'Iqama Available': data.iqamaAvailable || '',
      'Baladiya No': data.baladiyaNo || '',
      'Baladiya Exp': data.baladiyaExp || '',
      'Baladiya Days Left': data.baladiyaDaysLeft || '',
      'Baladiya card Status': data.baladiyaStatus || '',
      'Baladiya Card': data.baladiyaCard || '',
      'Certificate Exp': data.certificateExp || '',
      'Certificate Days Left': data.certDaysLeft || '',
      'Certificate Status': data.certStatus || '',
      'Medical': data.medical || '',
      'Training': data.training || '',
      'Physical Card': data.physicalCard || '',
      'GR Action': data.grAction || 'Not Started',
      'GR Updated Date': data.grUpdatedDate || formatDateToDMY(new Date()),
      'Employee Status': data.employeeStatus || 'Active',
      'Joining Date': data.joiningDate || formatDateToDMY(new Date())
    };
    
    headers.forEach(function(header, idx) {
      const key = header.toString().trim();
      if (columnMap[key] !== undefined) {
        dataSheet.getRange(row, idx + 1).setValue(columnMap[key]);
      }
    });
    
    dataSheet.autoResizeColumns(1, headers.length);
    
    return { success: true, message: '✅ Employee updated successfully!' };
  } catch (error) {
    console.error('Error in updateEmployeeData:', error);
    return { success: false, message: '❌ Error: ' + error.message };
  }
}

// ============================================
// UPDATE GR ACTION ONLY
// ============================================
function updateGrAction(payload) {
  try {
    const { index, grAction, empId, empName } = payload;
    const config = getConfig();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const dataSheet = ss.getSheetByName(config.DATA_SHEET);
    if (!dataSheet) throw new Error('Sheet "Data" not found');
    
    const headers = dataSheet.getRange(1, 1, 1, dataSheet.getLastColumn()).getValues()[0];
    const row = index + 2;
    
    let grCol = -1;
    let grDateCol = -1;
    
    headers.forEach(function(h, idx) {
      if (h) {
        const header = h.toString().trim();
        if (header === 'GR Action') grCol = idx;
        if (header === 'GR Updated Date') grDateCol = idx;
      }
    });
    
    if (grCol >= 0) {
      dataSheet.getRange(row, grCol + 1).setValue(grAction || 'Not Started');
    }
    
    if (grDateCol >= 0) {
      dataSheet.getRange(row, grDateCol + 1).setValue(formatDateToDMY(new Date()));
    }
    
    return { 
      success: true, 
      message: '✅ GR Action updated to: ' + (grAction || 'Not Started') + ' for ' + (empName || 'employee')
    };
  } catch (error) {
    console.error('Error in updateGrAction:', error);
    return { success: false, message: '❌ Error: ' + error.message };
  }
}

// ============================================
// DELETE EMPLOYEE
// ============================================
function deleteEmployee(rowIndex) {
  try {
    const config = getConfig();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const dataSheet = ss.getSheetByName(config.DATA_SHEET);
    if (!dataSheet) throw new Error('Sheet "Data" not found');
    dataSheet.deleteRow(rowIndex + 2);
    return { success: true, message: '✅ Employee deleted successfully!' };
  } catch (error) {
    return { success: false, message: '❌ Error: ' + error.message };
  }
}

// ============================================
// GET EMPLOYEE COUNT
// ============================================
function getEmployeeCount() {
  try {
    const allData = getAllData();
    return allData ? allData.length : 0;
  } catch (error) {
    return 0;
  }
}

// ============================================
// GET EMPLOYEE BY INDEX
// ============================================
function getEmployeeByIndex(index) {
  try {
    const allData = getAllData();
    if (!allData || index >= allData.length) return null;
    
    const row = allData[index];
    return {
      storeId: row['Store ID'] || '',
      storeName: row['Store Name'] || '',
      empId: row['Emp ID'] || '',
      empName: row['Emp Name'] || '',
      areaManager: row['Area Managers'] || '',
      mobile: row['Mobile'] || '',
      altMobile: row['Alternative Mobile'] || '',
      position: row['Position'] || '',
      company: row['Company'] || '',
      nationality: row['Nationality'] || '',
      passport: row['Passport'] || '',
      iqamaNo: row['Iqama No'] || '',
      iqamaExp: row['Iqama Exp'] || '',
      iqamaDaysLeft: row['Iqama Days Left'] || '',
      iqamaStatus: row['iqama Status'] || '',
      iqamaAvailable: row['Iqama Available'] || '',
      baladiyaNo: row['Baladiya No'] || '',
      baladiyaExp: row['Baladiya Exp'] || '',
      baladiyaDaysLeft: row['Baladiya Days Left'] || '',
      baladiyaStatus: row['Baladiya card Status'] || '',
      baladiyaCard: row['Baladiya Card'] || '',
      certificateExp: row['Certificate Exp'] || '',
      certDaysLeft: row['Certificate Days Left'] || '',
      certStatus: row['Certificate Status'] || '',
      medical: row['Medical'] || '',
      training: row['Training'] || '',
      physicalCard: row['Physical Card'] || '',
      actions: '',
      grAction: row['GR Action'] || 'Not Started',
      grUpdatedDate: row['GR Updated Date'] || '',
      visitDate: '',
      employeeStatus: row['Employee Status'] || 'Active',
      joiningDate: row['Joining Date'] || ''
    };
  } catch (error) {
    console.error('Error in getEmployeeByIndex:', error);
    return null;
  }
}

// ============================================
// GET EMPLOYEE BY EMP ID
// ============================================
function getEmployeeByEmpId(empId) {
  try {
    const allData = getAllData();
    if (!allData || allData.length === 0) return null;
    
    for (let i = 0; i < allData.length; i++) {
      const row = allData[i];
      if (row['Emp ID'] === empId) {
        return {
          storeId: row['Store ID'] || '',
          storeName: row['Store Name'] || '',
          empId: empId,
          empName: row['Emp Name'] || '',
          areaManager: row['Area Managers'] || '',
          mobile: row['Mobile'] || '',
          altMobile: row['Alternative Mobile'] || '',
          position: row['Position'] || '',
          company: row['Company'] || '',
          nationality: row['Nationality'] || '',
          passport: row['Passport'] || '',
          iqamaNo: row['Iqama No'] || '',
          iqamaExp: row['Iqama Exp'] || '',
          iqamaDaysLeft: row['Iqama Days Left'] || '',
          iqamaStatus: row['iqama Status'] || '',
          iqamaAvailable: row['Iqama Available'] || '',
          baladiyaNo: row['Baladiya No'] || '',
          baladiyaExp: row['Baladiya Exp'] || '',
          baladiyaDaysLeft: row['Baladiya Days Left'] || '',
          baladiyaStatus: row['Baladiya card Status'] || '',
          baladiyaCard: row['Baladiya Card'] || '',
          certificateExp: row['Certificate Exp'] || '',
          certDaysLeft: row['Certificate Days Left'] || '',
          certStatus: row['Certificate Status'] || '',
          medical: row['Medical'] || '',
          training: row['Training'] || '',
          physicalCard: row['Physical Card'] || '',
          actions: '',
          grAction: row['GR Action'] || 'Not Started',
          grUpdatedDate: row['GR Updated Date'] || '',
          visitDate: '',
          employeeStatus: row['Employee Status'] || 'Active',
          joiningDate: row['Joining Date'] || ''
        };
      }
    }
    return null;
  } catch (error) {
    console.error('Error in getEmployeeByEmpId:', error);
    return null;
  }
}

// ============================================
// GET OPS DATA - WITH AREA MANAGER RESTRICTION
// ============================================
function getOpsData(filters) {
  try {
    let allData = getAllData();
    
    // Restrict to session manager if provided
    if (filters && filters.sessionManager && filters.sessionManager !== 'All' && filters.sessionManager !== '') {
      allData = allData.filter(function(row) {
        const manager = row['Area Managers'] || '';
        return manager === filters.sessionManager;
      });
    }
    
    if (!allData || allData.length === 0) {
      return { 
        totalEmployees: 0, 
        totalActive: 0, 
        totalDue: 0, 
        totalExpired: 0, 
        totalManagers: 0, 
        totalStores: 0, 
        managers: [],
        iqama: { total: 0, valid: 0, expired: 0, due: 0 },
        baladiya: { total: 0, available: 0, notavailable: 0, underprocess: 0 },
        medical: { total: 0, valid: 0, expired: 0, underprocess: 0 },
        training: { total: 0, completed: 0, pending: 0, inprogress: 0 },
        physicalCard: { total: 0, available: 0, notavailable: 0, underprocess: 0 },
        statusCounts: { active: 0, terminated: 0, onVacation: 0, staff: 0, runaway: 0, exit: 0 }
      };
    }
    
    var period = filters && filters.period && filters.period !== 'All' ? parseInt(filters.period) : null;
    var cutoffDate = null;
    if (period) {
      cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - period);
    }
    
    var managerMap = {};
    var storeSet = new Set();
    var totalEmployees = 0;
    var totalActive = 0;
    var totalDue = 0;
    var totalExpired = 0;
    
    var iqama = { total: 0, valid: 0, expired: 0, due: 0 };
    var baladiya = { total: 0, available: 0, notavailable: 0, underprocess: 0 };
    var medical = { total: 0, valid: 0, expired: 0, underprocess: 0 };
    var training = { total: 0, completed: 0, pending: 0, inprogress: 0 };
    var physicalCard = { total: 0, available: 0, notavailable: 0, underprocess: 0 };
    var statusCounts = { active: 0, terminated: 0, onVacation: 0, staff: 0, runaway: 0, exit: 0 };
    
    allData.forEach(function(row) {
      var areaManager = row['Area Managers'] || '';
      if (!areaManager || areaManager === 'Unassigned') {
        areaManager = '⚠️ Not Assigned';
      }
      
      var storeName = row['Store Name'] || '';
      if (storeName) storeSet.add(storeName);
      
      if (cutoffDate) {
        var visitDate = row['Visit Date'] ? new Date(row['Visit Date']) : null;
        if (visitDate && visitDate < cutoffDate) {
          return;
        }
      }
      
      totalEmployees++;
      
      // Track employee status
      var empStatus = row['Employee Status'] || 'Active';
      if (empStatus === 'Active') statusCounts.active++;
      else if (empStatus === 'Terminated') statusCounts.terminated++;
      else if (empStatus === 'On Vacation') statusCounts.onVacation++;
      else if (empStatus === 'Staff') statusCounts.staff++;
      else if (empStatus === 'Runaway') statusCounts.runaway++;
      else if (empStatus === 'Exit') statusCounts.exit++;
      
      if (!managerMap[areaManager]) {
        managerMap[areaManager] = {
          name: areaManager,
          total: 0,
          stores: new Set(),
          active: 0,
          expired: 0,
          due: 0
        };
      }
      managerMap[areaManager].total++;
      if (storeName) managerMap[areaManager].stores.add(storeName);
      
      var iqamaStatus = row['iqama Status'] || '';
      iqama.total++;
      if (iqamaStatus.includes('Active') || iqamaStatus.includes('✅')) {
        iqama.valid++;
        totalActive++;
        managerMap[areaManager].active++;
      } else if (iqamaStatus.includes('Expired') || iqamaStatus.includes('🔴')) {
        iqama.expired++;
        totalExpired++;
        managerMap[areaManager].expired++;
      } else if (iqamaStatus.includes('Due') || iqamaStatus.includes('⚠️')) {
        iqama.due++;
        totalDue++;
        managerMap[areaManager].due++;
      }
      
      var baladiyaCard = row['Baladiya Card'] || '';
      baladiya.total++;
      if (baladiyaCard === 'Available') baladiya.available++;
      else if (baladiyaCard === 'Not Available') baladiya.notavailable++;
      else if (baladiyaCard === 'Under Process') baladiya.underprocess++;
      
      var medicalVal = row['Medical'] || '';
      medical.total++;
      if (medicalVal === 'Valid' || medicalVal === 'Done') medical.valid++;
      else if (medicalVal === 'Expired' || medicalVal === 'Not Done') medical.expired++;
      else if (medicalVal === 'Under Process') medical.underprocess++;
      
      var trainingVal = row['Training'] || '';
      training.total++;
      if (trainingVal === 'Completed') training.completed++;
      else if (trainingVal === 'Pending') training.pending++;
      else if (trainingVal === 'In Progress') training.inprogress++;
      
      var physicalCardVal = row['Physical Card'] || '';
      physicalCard.total++;
      if (physicalCardVal === 'Available') physicalCard.available++;
      else if (physicalCardVal === 'Not Available') physicalCard.notavailable++;
      else if (physicalCardVal === 'Under Process') physicalCard.underprocess++;
    });
    
    var managers = Object.values(managerMap).map(function(m) {
      return {
        ...m,
        storeCount: m.stores.size
      };
    });
    
    managers.sort(function(a, b) { return b.total - a.total; });
    
    return {
      totalEmployees: totalEmployees,
      totalActive: totalActive,
      totalDue: totalDue,
      totalExpired: totalExpired,
      totalManagers: managers.length,
      totalStores: storeSet.size,
      managers: managers,
      iqama: iqama,
      baladiya: baladiya,
      medical: medical,
      training: training,
      physicalCard: physicalCard,
      statusCounts: statusCounts
    };
  } catch (error) {
    console.error('Error in getOpsData:', error);
    return { 
      totalEmployees: 0, 
      totalActive: 0, 
      totalDue: 0, 
      totalExpired: 0, 
      totalManagers: 0, 
      totalStores: 0, 
      managers: [],
      iqama: { total: 0, valid: 0, expired: 0, due: 0 },
      baladiya: { total: 0, available: 0, notavailable: 0, underprocess: 0 },
      medical: { total: 0, valid: 0, expired: 0, underprocess: 0 },
      training: { total: 0, completed: 0, pending: 0, inprogress: 0 },
      physicalCard: { total: 0, available: 0, notavailable: 0, underprocess: 0 },
      statusCounts: { active: 0, terminated: 0, onVacation: 0, staff: 0, runaway: 0, exit: 0 }
    };
  }
}

// ============================================
// GET METRICS FROM SHEET - WITH AREA MANAGER RESTRICTION
// ============================================
function getMetricsFromSheet(filters) {
  try {
    const manager = filters && filters.areaManager && filters.areaManager !== 'All' ? filters.areaManager : null;
    const store = filters && filters.store && filters.store !== 'All' ? filters.store : null;
    const sessionManager = filters && filters.sessionManager && filters.sessionManager !== 'All' ? filters.sessionManager : null;
    
    const allData = getFilteredData(manager, store, sessionManager);
    
    if (!allData || allData.length === 0) {
      return {
        totalStores: 0,
        totalEmployees: 0,
        totalManagers: 0,
        iqamaExpired: 0,
        iqamaValid: 0,
        iqamaNotAvail: 0,
        baladiyaExpired: 0,
        baladiyaValid: 0,
        baladiyaNotAvail: 0,
        certExpired: 0,
        medicalDone: 0,
        medicalNotDone: 0,
        trainingDone: 0,
        trainingNotDone: 0,
        physicalAvail: 0,
        physicalNotAvail: 0,
        grActions: [],
        totalIssues: 0,
        statusCounts: { active: 0, terminated: 0, onVacation: 0, staff: 0, runaway: 0, exit: 0 }
      };
    }

    var stores = new Set();
    var employees = new Set();
    var managers = new Set();
    var iqamaExpired = 0,
      iqamaValid = 0,
      iqamaNotAvail = 0;
    var baladiyaExpired = 0,
      baladiyaValid = 0,
      baladiyaNotAvail = 0;
    var certExpired = 0;
    var medicalDone = 0,
      medicalNotDone = 0;
    var trainingDone = 0,
      trainingNotDone = 0;
    var physicalAvail = 0,
      physicalNotAvail = 0;
    var grActions = [];
    var statusCounts = { active: 0, terminated: 0, onVacation: 0, staff: 0, runaway: 0, exit: 0 };

    allData.forEach(function(row) {
      var store = row['Store Name'] || row['Store ID'] || '';
      if (store) stores.add(store);
      var emp = row['Emp ID'] || '';
      if (emp) employees.add(emp);
      var mgr = row['Area Managers'] || '';
      if (mgr && mgr !== 'Unassigned') managers.add(mgr);
      
      // Employee Status tracking
      var empStatus = row['Employee Status'] || 'Active';
      if (empStatus === 'Active') statusCounts.active++;
      else if (empStatus === 'Terminated') statusCounts.terminated++;
      else if (empStatus === 'On Vacation') statusCounts.onVacation++;
      else if (empStatus === 'Staff') statusCounts.staff++;
      else if (empStatus === 'Runaway') statusCounts.runaway++;
      else if (empStatus === 'Exit') statusCounts.exit++;

      var iqStatus = row['iqama Status'] || '';
      var iqAvailable = row['Iqama Available'] || '';
      if (iqAvailable === 'No' || iqAvailable === 'no') {
        iqamaNotAvail++;
      } else if (iqStatus === 'Expired' || iqStatus === '🔴 Expired') {
        iqamaExpired++;
      } else if (iqStatus === 'Active' || iqStatus === '✅ Active') {
        iqamaValid++;
      } else {
        var iqExp = row['Iqama Exp'] || '';
        if (iqExp) {
          var days = calculateDaysLeftBackend(iqExp);
          if (days !== null && days < 0) {
            iqamaExpired++;
          } else if (days !== null && days >= 0) {
            iqamaValid++;
          } else {
            iqamaNotAvail++;
          }
        } else {
          iqamaNotAvail++;
        }
      }

      var balStatus = row['Baladiya card Status'] || '';
      var balCard = row['Baladiya Card'] || '';
      if (balCard === 'Not Available') {
        baladiyaNotAvail++;
      } else if (balStatus === 'Expired' || balStatus === '🔴 Expired') {
        baladiyaExpired++;
      } else if (balStatus === 'Active' || balStatus === '✅ Active') {
        baladiyaValid++;
      } else {
        var balExp = row['Baladiya Exp'] || '';
        if (balExp) {
          var balDays = calculateDaysLeftBackend(balExp);
          if (balDays !== null && balDays < 0) {
            baladiyaExpired++;
          } else if (balDays !== null && balDays >= 0) {
            baladiyaValid++;
          } else {
            baladiyaNotAvail++;
          }
        } else {
          baladiyaNotAvail++;
        }
      }

      var certStatus = row['Certificate Status'] || '';
      var certExp = row['Certificate Exp'] || '';
      if (certStatus === 'Expired' || certStatus === '🔴 Expired') {
        certExpired++;
      } else if (certExp) {
        var certDays = calculateDaysLeftBackend(certExp);
        if (certDays !== null && certDays < 0) {
          certExpired++;
        }
      }

      var med = row['Medical'] || '';
      if (med === 'Done' || med === 'Valid') medicalDone++;
      else if (med === 'Not Done' || med === 'Expired') medicalNotDone++;

      var train = row['Training'] || '';
      if (train === 'Completed') trainingDone++;
      else if (train === 'Pending' || train === 'In Progress') trainingNotDone++;

      var phys = row['Physical Card'] || '';
      if (phys === 'Available') physicalAvail++;
      else if (phys === 'Not Available' || phys === 'Under Process') physicalNotAvail++;

      var hasIssue = false;
      var issueDetails = [];
      if (iqStatus === 'Expired' || iqStatus === '🔴 Expired' || iqAvailable === 'No') {
        hasIssue = true;
        issueDetails.push('Iqama Issue');
      }
      if (balStatus === 'Expired' || balStatus === '🔴 Expired' || balCard === 'Not Available') {
        hasIssue = true;
        issueDetails.push('Baladiya Issue');
      }
      if (certStatus === 'Expired' || certStatus === '🔴 Expired') {
        hasIssue = true;
        issueDetails.push('Certificate Expired');
      }
      if (med === 'Not Done' || med === 'Expired') {
        hasIssue = true;
        issueDetails.push('Medical Not Done');
      }
      if (train === 'Pending') {
        hasIssue = true;
        issueDetails.push('Training Pending');
      }
      if (phys === 'Not Available') {
        hasIssue = true;
        issueDetails.push('Physical Missing');
      }

      if (hasIssue) {
        var empName = row['Emp Name'] || row['Emp ID'] || 'Unknown';
        var empId = row['Emp ID'] || '';
        grActions.push(empName + ' (ID: ' + empId + ') - ' + issueDetails.join(', '));
      }
    });

    return {
      totalStores: stores.size,
      totalEmployees: employees.size,
      totalManagers: managers.size,
      iqamaExpired: iqamaExpired,
      iqamaValid: iqamaValid,
      iqamaNotAvail: iqamaNotAvail,
      baladiyaExpired: baladiyaExpired,
      baladiyaValid: baladiyaValid,
      baladiyaNotAvail: baladiyaNotAvail,
      certExpired: certExpired,
      medicalDone: medicalDone,
      medicalNotDone: medicalNotDone,
      trainingDone: trainingDone,
      trainingNotDone: trainingNotDone,
      physicalAvail: physicalAvail,
      physicalNotAvail: physicalNotAvail,
      grActions: grActions,
      totalIssues: grActions.length,
      statusCounts: statusCounts
    };
  } catch (e) {
    console.error('Error in getMetricsFromSheet:', e);
    return {
      totalStores: 0,
      totalEmployees: 0,
      totalManagers: 0,
      iqamaExpired: 0,
      iqamaValid: 0,
      iqamaNotAvail: 0,
      baladiyaExpired: 0,
      baladiyaValid: 0,
      baladiyaNotAvail: 0,
      certExpired: 0,
      medicalDone: 0,
      medicalNotDone: 0,
      trainingDone: 0,
      trainingNotDone: 0,
      physicalAvail: 0,
      physicalNotAvail: 0,
      grActions: [],
      totalIssues: 0,
      statusCounts: { active: 0, terminated: 0, onVacation: 0, staff: 0, runaway: 0, exit: 0 }
    };
  }
}

// ============================================
// SHOW APP
// ============================================
function showApp() {
  try {
    if (!isAuthorized()) {
      const ui = SpreadsheetApp.getUi();
      ui.alert(
        '🚫 Access Denied',
        'Your email address is not authorized to access this dashboard.\n\nPlease contact an admin to request access.',
        ui.ButtonSet.OK
      );
      return;
    }
    
    const html = HtmlService.createHtmlOutputFromFile('Index')
      .setWidth(1200)
      .setHeight(800)
      .setTitle('Sasco Palm Staff Dashboard');
    SpreadsheetApp.getUi().showModalDialog(html, 'Sasco Palm Staff Dashboard');
  } catch (error) {
    SpreadsheetApp.getUi().alert('Error: ' + error.toString());
  }
}

// ============================================
// SHOW DEPLOY INFO
// ============================================
function showDeployInfo() {
  const ui = SpreadsheetApp.getUi();
  const html = HtmlService.createHtmlOutput(`
    <div style="font-family: Arial; padding: 20px; background: #0b0f1a; color: #eef2f6;">
      <h2 style="color:#7faeeb;">🌐 Deploy as Web App</h2>
      <p style="color:#8aa2be;">To deploy this dashboard as a web app:</p>
      <ol style="color:#b0c8e0; padding-left: 20px;">
        <li>Click on <strong style="color:#f5b041;">Deploy</strong> → <strong style="color:#f5b041;">New deployment</strong></li>
        <li>Select <strong style="color:#f5b041;">Web app</strong> as the type</li>
        <li>Set <strong style="color:#f5b041;">Execute as</strong> to "Me" (opsadmin@sasco.com.sa)</li>
        <li>Set <strong style="color:#f5b041;">Who has access</strong> to "Anyone"</li>
        <li>Click <strong style="color:#f5b041;">Deploy</strong></li>
        <li>Copy the URL and share it with authorized users</li>
      </ol>
      <p style="color:#8aa2be; margin-top: 16px;">🔒 Users must login with username/password created by admin.</p>
      <p style="color:#f5b041; font-size: 12px;">👑 Default Admin: sascoplam60@gmail.com / 1234</p>
      <p style="color:#8aa2be; font-size: 12px; margin-top: 8px;">💡 For admin bypass, add ?admin=true to the URL</p>
      <button onclick="google.script.host.close()" style="padding:10px 20px;background:#2f6f9f;color:white;border:none;border-radius:40px;cursor:pointer;font-weight:600;margin-top:16px;">
        Close
      </button>
    </div>
  `)
  .setWidth(500)
  .setHeight(600);
  ui.showModalDialog(html, 'Web App Deployment');
}

// ============================================
// DEBUG S1 SHEET
// ============================================
function debugS1Sheet() {
  try {
    const config = getConfig();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const s1Sheet = ss.getSheetByName(config.MANAGER_SHEET);
    
    if (!s1Sheet) {
      SpreadsheetApp.getUi().alert('❌ S1 sheet not found!');
      return;
    }
    
    const lastRow = s1Sheet.getLastRow();
    const lastCol = s1Sheet.getLastColumn();
    const headerRow = s1Sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    
    let message = '📊 S1 SHEET DATA\n\n';
    message += 'Total Rows: ' + lastRow + '\n';
    message += 'Total Columns: ' + lastCol + '\n\n';
    message += 'HEADERS:\n';
    headerRow.forEach(function(h, idx) {
      message += '  Col ' + (idx + 1) + ': "' + (h || '') + '"\n';
    });
    
    message += '\nALL DATA (first 10 rows):\n';
    for (let i = 1; i <= Math.min(lastRow, 10); i++) {
      const row = s1Sheet.getRange(i, 1, 1, lastCol).getValues()[0];
      message += '  Row ' + i + ': ' + row.join(' | ') + '\n';
    }
    
    const data = s1Sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    const managerStoreMap = {};
    
    data.forEach(function(row) {
      const manager = row[2] ? row[2].toString().trim() : '';
      const storeId = row[0] ? row[0].toString().trim() : '';
      let storeName = row[3] ? row[3].toString().trim() : '';
      storeName = storeName.replace(/^\(Palm Store\)\s*/i, '').trim();
      
      if (manager && storeName) {
        if (!managerStoreMap[manager]) {
          managerStoreMap[manager] = [];
        }
        managerStoreMap[manager].push({ id: storeId, name: storeName });
      }
    });
    
    message += '\n📊 MANAGERS AND THEIR STORES FROM S1:\n';
    if (Object.keys(managerStoreMap).length === 0) {
      message += '  No managers with stores found!\n';
    } else {
      Object.keys(managerStoreMap).forEach(function(manager) {
        message += '  "' + manager + '": ' + managerStoreMap[manager].length + ' stores\n';
        managerStoreMap[manager].forEach(function(s) {
          message += '      - ' + s.name + ' (ID: ' + s.id + ')\n';
        });
      });
    }
    
    SpreadsheetApp.getUi().alert(message);
    
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Error: ' + error.toString());
  }
}

// ============================================
// ADD GR UPDATED COLUMN
// ============================================
function addGrUpdatedColumn() {
  try {
    const config = getConfig();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const dataSheet = ss.getSheetByName(config.DATA_SHEET);
    if (!dataSheet) {
      SpreadsheetApp.getUi().alert('Data sheet not found!');
      return;
    }
    
    const headerRow = dataSheet.getRange(1, 1, 1, dataSheet.getLastColumn()).getValues()[0];
    const hasGrUpdated = headerRow.some(function(h) { return h && h.toString().toLowerCase() === 'gr updated date'; });
    
    if (!hasGrUpdated) {
      const lastCol = dataSheet.getLastColumn() + 1;
      dataSheet.getRange(1, lastCol).setValue('GR Updated Date');
      SpreadsheetApp.getUi().alert('✅ GR Updated Date column added!');
    } else {
      SpreadsheetApp.getUi().alert('✅ GR Updated Date column already exists!');
    }
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Error: ' + error.toString());
  }
}

// ============================================
// SETUP SHEET - MATCHING YOUR FORMAT
// ============================================
function setupSheet() {
  try {
    const config = getConfig();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let dataSheet = ss.getSheetByName(config.DATA_SHEET);
    
    if (!dataSheet) {
      dataSheet = ss.insertSheet(config.DATA_SHEET);
    }
    
    const headers = [
      'Store ID', 'Store Name', 'Emp ID', 'Emp Name', 'Area Managers',
      'Mobile', 'Alternative Mobile', 'Position', 'Company', 'Nationality', 
      'Passport', 'Iqama No', 'Iqama Exp', 'Iqama Days Left', 'iqama Status',
      'Iqama Available', 'Baladiya Exp', 'Baladiya Days Left',
      'Baladiya card Status', 'Baladiya Card', 'Certificate Exp',
      'Certificate Days Left', 'Certificate Status', 'Medical',
      'Training', 'Physical Card', 'GR Action', 'GR Updated Date',
      'Employee Status', 'Joining Date'
    ];
    
    dataSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    dataSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    dataSheet.autoResizeColumns(1, headers.length);
    
    SpreadsheetApp.getUi().alert('✅ Sheet setup complete! ' + headers.length + ' columns created.');
    
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Error: ' + error.toString());
  }
}

// ============================================
// REFRESH DATA
// ============================================
function refreshData() {
  try {
    const count = getEmployeeCount();
    SpreadsheetApp.getUi().alert('✅ Data refreshed. Total employees: ' + count);
  } catch (error) {
    SpreadsheetApp.getUi().alert('Error: ' + error.toString());
  }
}

// ============================================
// FIX: ENSURE opsadmin@sasco.com.sa IS ADMIN
// ============================================
function fixAdminRole() {
  try {
    const config = getConfig();
    var users = getAuthorizedUsers();
    var adminExists = users.some(function(u) {
      return u.email.toLowerCase() === config.ADMIN_EMAILS[0].toLowerCase();
    });
    
    if (adminExists) {
      var result = updateUserRole(config.ADMIN_EMAILS[0], ROLES.ADMIN);
      Logger.log(result.message);
    } else {
      var result = addAuthorizedUser(config.ADMIN_EMAILS[0], ROLES.ADMIN);
      Logger.log(result.message);
    }
    
    var updatedUsers = getAuthorizedUsers();
    var me = updatedUsers.find(function(u) {
      return u.email.toLowerCase() === config.ADMIN_EMAILS[0].toLowerCase();
    });
    
    if (me) {
      Logger.log('✅ ' + me.email + ' is now: ' + me.role);
      SpreadsheetApp.getUi().alert('✅ Fixed! ' + config.ADMIN_EMAILS[0] + ' is now ADMIN.\nRole: ' + me.role);
    }
    
    return { success: true, message: 'Admin role fixed!' };
  } catch (error) {
    Logger.log('Error: ' + error);
    return { success: false, message: 'Error: ' + error };
  }
}

// ============================================
// CHECK MY CURRENT ROLE
// ============================================
function checkMyRole() {
  try {
    var user = getCurrentUser();
    var msg = '📧 Email: ' + user.email + '\n';
    msg += '👑 Role: ' + user.role + '\n';
    msg += '✅ Is Admin: ' + user.isAdmin + '\n';
    msg += '✅ Is Area Manager: ' + user.isAreaManager + '\n';
    msg += '✅ Is GR: ' + user.isGR;
    
    SpreadsheetApp.getUi().alert(msg);
    Logger.log(msg);
    return user;
  } catch (error) {
    SpreadsheetApp.getUi().alert('Error: ' + error);
    return null;
  }
}

// ============================================
// FORCE RE-LOGIN HELPER
// ============================================
function forceAdminLogin() {
  try {
    var result = fixAdminRole();
    if (result.success) {
      SpreadsheetApp.getUi().alert(
        '✅ Admin role fixed!\n\n' +
        'Please LOGOUT and LOGIN again to see the Admin Panel.\n\n' +
        '1. Click Logout button in dashboard\n' +
        '2. Click "Login with Email" again\n' +
        '3. You will see the Admin Panel'
      );
    }
  } catch (error) {
    SpreadsheetApp.getUi().alert('Error: ' + error);
  }
}

// ============================================
// QUICK FIX - ONE CLICK SOLUTION
// ============================================
function quickFix() {
  try {
    const config = getConfig();
    var users = getAuthorizedUsers();
    var exists = users.some(function(u) {
      return u.email.toLowerCase() === config.ADMIN_EMAILS[0].toLowerCase();
    });
    
    if (exists) {
      removeAuthorizedUser(config.ADMIN_EMAILS[0]);
    }
    
    addAuthorizedUser(config.ADMIN_EMAILS[0], 'admin');
    
    var updated = getAuthorizedUsers();
    var me = updated.find(function(u) {
      return u.email.toLowerCase() === config.ADMIN_EMAILS[0].toLowerCase();
    });
    
    if (me) {
      SpreadsheetApp.getUi().alert('✅ Fixed!\n\n' + me.email + ' is now: ' + me.role + '\n\nPlease LOGOUT and LOGIN again.');
    }
  } catch (error) {
    SpreadsheetApp.getUi().alert('Error: ' + error);
  }
}

// ============================================
// AUTHORIZED USERS - CRUD OPERATIONS
// ============================================
function getAuthorizedUsers() {
  try {
    const config = getConfig();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let authSheet = ss.getSheetByName(config.AUTH_SHEET);
    
    if (!authSheet) {
      setupSheets();
      authSheet = ss.getSheetByName(config.AUTH_SHEET);
    }
    
    const headers = authSheet.getRange(1, 1, 1, authSheet.getLastColumn()).getValues()[0];
    const roleColIndex = headers.findIndex(function(h) { return h && h.toString().toLowerCase() === 'role'; });
    const assignedAMColIndex = headers.findIndex(function(h) { return h && h.toString().toLowerCase() === 'assigned area manager'; });
    
    const data = authSheet.getRange(2, 1, authSheet.getLastRow() - 1, authSheet.getLastColumn()).getValues();
    const users = data.map(function(row) {
      return {
        email: row[0] ? row[0].toString().trim() : '',
        date: row[1] || '',
        addedBy: row[2] || '',
        role: row[roleColIndex] ? row[roleColIndex].toString().trim().toLowerCase() : ROLES.AREA_MANAGER,
        assignedAreaManager: assignedAMColIndex >= 0 && row[assignedAMColIndex] ? row[assignedAMColIndex].toString().trim() : ''
      };
    }).filter(function(u) { return u.email !== ''; });
    
    return users;
  } catch (error) {
    console.error('Error getting authorized users:', error);
    return [];
  }
}

function getAuthorizedEmails() {
  try {
    const config = getConfig();
    const users = getAuthorizedUsers();
    const emails = users.map(function(u) { return u.email.toLowerCase(); });
    
    config.ADMIN_EMAILS.forEach(function(admin) {
      if (!emails.includes(admin.toLowerCase())) {
        emails.push(admin.toLowerCase());
      }
    });
    
    return emails;
  } catch (error) {
    console.error('Error getting authorized emails:', error);
    const config = getConfig();
    return config.ADMIN_EMAILS.map(function(e) { return e.toLowerCase(); });
  }
}

function isEmailAuthorized(email) {
  if (!email) return false;
  const authorized = getAuthorizedEmails();
  return authorized.some(function(e) { return e === email.toLowerCase(); });
}

function authenticateWithEmail(email) {
  try {
    if (!email || !email.includes('@')) {
      return { 
        success: false, 
        message: 'Please enter a valid email address',
        isAuthorized: false
      };
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    const isAuthorized = isEmailAuthorized(normalizedEmail);
    
    if (!isAuthorized) {
      return { 
        success: false, 
        message: 'This email is not authorized. Please contact an admin.',
        isAuthorized: false,
        email: normalizedEmail
      };
    }
    
    const config = getConfig();
    const isAdmin = config.ADMIN_EMAILS.some(function(e) { return e.toLowerCase() === normalizedEmail; });
    
    let role = ROLES.AREA_MANAGER;
    let assignedAreaManager = '';
    
    if (isAdmin) {
      role = ROLES.ADMIN;
    } else {
      const users = getAuthorizedUsers();
      const user = users.find(function(u) { return u.email.toLowerCase() === normalizedEmail; });
      if (user) {
        role = user.role || ROLES.AREA_MANAGER;
        assignedAreaManager = user.assignedAreaManager || '';
      }
    }
    
    return {
      success: true,
      message: '✅ Access granted!',
      email: normalizedEmail,
      role: role,
      isAdmin: isAdmin || role === ROLES.ADMIN,
      isAreaManager: role === ROLES.AREA_MANAGER || role === ROLES.ADMIN,
      isGR: role === ROLES.GR || role === ROLES.ADMIN,
      isAuthorized: true,
      assignedAreaManager: assignedAreaManager
    };
  } catch (error) {
    console.error('Error in authenticateWithEmail:', error);
    return { 
      success: false, 
      message: 'Error: ' + error.message,
      isAuthorized: false
    };
  }
}

function getUserRole(email) {
  try {
    const users = getAuthorizedUsers();
    const user = users.find(function(u) { return u.email.toLowerCase() === email.toLowerCase(); });
    return user ? user.role : null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

function isAdmin(email) {
  const config = getConfig();
  if (config.ADMIN_EMAILS.some(function(e) { return e.toLowerCase() === email.toLowerCase(); })) {
    return true;
  }
  const role = getUserRole(email);
  return role === ROLES.ADMIN;
}

function isAreaManager(email) {
  const role = getUserRole(email);
  const config = getConfig();
  return role === ROLES.AREA_MANAGER || role === ROLES.ADMIN || config.ADMIN_EMAILS.some(function(e) { return e.toLowerCase() === email.toLowerCase(); });
}

function isGR(email) {
  const role = getUserRole(email);
  const config = getConfig();
  return role === ROLES.GR || role === ROLES.ADMIN || config.ADMIN_EMAILS.some(function(e) { return e.toLowerCase() === email.toLowerCase(); });
}

function isAuthorized() {
  try {
    const userEmail = Session.getActiveUser().getEmail();
    if (!userEmail) {
      return true;
    }
    
    const config = getConfig();
    if (config.ADMIN_EMAILS.some(function(e) { return e.toLowerCase() === userEmail.toLowerCase(); })) {
      return true;
    }
    
    const users = getAuthorizedUsers();
    return users.some(function(u) { return u.email.toLowerCase() === userEmail.toLowerCase(); });
  } catch (error) {
    console.error('Error checking authorization:', error);
    return true;
  }
}

function addUserWithAreaManager(email, role, assignedAreaManager) {
  try {
    if (!email || !email.includes('@')) {
      return { success: false, message: '❌ Invalid email address' };
    }
    
    const users = getAuthorizedUsers();
    if (users.some(function(u) { return u.email.toLowerCase() === email.toLowerCase(); })) {
      return { success: false, message: '❌ Email already authorized' };
    }
    
    const config = getConfig();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let authSheet = ss.getSheetByName(config.AUTH_SHEET);
    if (!authSheet) {
      setupSheets();
      authSheet = ss.getSheetByName(config.AUTH_SHEET);
    }
    
    const validRole = role || ROLES.AREA_MANAGER;
    const addedBy = Session.getActiveUser().getEmail() || 'System';
    const assignedAM = (validRole === ROLES.AREA_MANAGER) ? (assignedAreaManager || '') : '';
    
    authSheet.appendRow([
      email,
      formatDateToDMY(new Date()),
      addedBy,
      validRole,
      assignedAM
    ]);
    authSheet.autoResizeColumns(1, 5);
    
    let message = '✅ ' + email + ' added as ' + validRole;
    if (assignedAM && validRole === ROLES.AREA_MANAGER) {
      message += ' with access to: ' + assignedAM;
    }
    
    return { success: true, message: message };
  } catch (error) {
    return { success: false, message: '❌ Error: ' + error.message };
  }
}

function addAuthorizedUser(email, role) {
  return addUserWithAreaManager(email, role, '');
}

function removeAuthorizedUser(email) {
  try {
    const config = getConfig();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let authSheet = ss.getSheetByName(config.AUTH_SHEET);
    if (!authSheet) {
      return { success: false, message: '❌ No users found' };
    }
    
    if (config.ADMIN_EMAILS.some(function(e) { return e.toLowerCase() === email.toLowerCase(); })) {
      return { success: false, message: '❌ Cannot remove hardcoded admin: ' + email };
    }
    
    const data = authSheet.getRange(2, 1, authSheet.getLastRow() - 1, 1).getValues();
    let rowToDelete = -1;
    for (let i = 0; i < data.length; i++) {
      if (data[i][0] && data[i][0].toString().trim().toLowerCase() === email.toLowerCase()) {
        rowToDelete = i + 2;
        break;
      }
    }
    
    if (rowToDelete < 0) {
      return { success: false, message: '❌ Email not found' };
    }
    
    authSheet.deleteRow(rowToDelete);
    return { success: true, message: '✅ ' + email + ' removed successfully!' };
  } catch (error) {
    return { success: false, message: '❌ Error: ' + error.message };
  }
}

function updateUserRole(email, newRole) {
  try {
    const config = getConfig();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let authSheet = ss.getSheetByName(config.AUTH_SHEET);
    if (!authSheet) {
      return { success: false, message: '❌ No users found' };
    }
    
    if (config.ADMIN_EMAILS.some(function(e) { return e.toLowerCase() === email.toLowerCase(); })) {
      return { success: false, message: '❌ Cannot change role of hardcoded admin: ' + email };
    }
    
    const headers = authSheet.getRange(1, 1, 1, authSheet.getLastColumn()).getValues()[0];
    const roleColIndex = headers.findIndex(function(h) { return h && h.toString().toLowerCase() === 'role'; });
    
    if (roleColIndex < 0) {
      return { success: false, message: '❌ Role column not found' };
    }
    
    const data = authSheet.getRange(2, 1, authSheet.getLastRow() - 1, authSheet.getLastColumn()).getValues();
    let rowToUpdate = -1;
    
    for (let i = 0; i < data.length; i++) {
      if (data[i][0] && data[i][0].toString().trim().toLowerCase() === email.toLowerCase()) {
        rowToUpdate = i + 2;
        break;
      }
    }
    
    if (rowToUpdate < 0) {
      return { success: false, message: '❌ Email not found' };
    }
    
    authSheet.getRange(rowToUpdate, roleColIndex + 1).setValue(newRole);
    return { success: true, message: '✅ ' + email + ' role updated to ' + newRole };
  } catch (error) {
    return { success: false, message: '❌ Error: ' + error.message };
  }
}

function updateUserAssignedManager(email, assignedAreaManager) {
  try {
    const config = getConfig();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let authSheet = ss.getSheetByName(config.AUTH_SHEET);
    if (!authSheet) {
      return { success: false, message: '❌ No users found' };
    }
    
    const headers = authSheet.getRange(1, 1, 1, authSheet.getLastColumn()).getValues()[0];
    const assignedAMColIndex = headers.findIndex(function(h) { return h && h.toString().toLowerCase() === 'assigned area manager'; });
    
    if (assignedAMColIndex < 0) {
      return { success: false, message: '❌ Assigned Area Manager column not found' };
    }
    
    const data = authSheet.getRange(2, 1, authSheet.getLastRow() - 1, authSheet.getLastColumn()).getValues();
    let rowToUpdate = -1;
    
    for (let i = 0; i < data.length; i++) {
      if (data[i][0] && data[i][0].toString().trim().toLowerCase() === email.toLowerCase()) {
        rowToUpdate = i + 2;
        break;
      }
    }
    
    if (rowToUpdate < 0) {
      return { success: false, message: '❌ Email not found' };
    }
    
    authSheet.getRange(rowToUpdate, assignedAMColIndex + 1).setValue(assignedAreaManager || '');
    return { success: true, message: '✅ Assigned Area Manager updated to: ' + (assignedAreaManager || 'None') };
  } catch (error) {
    return { success: false, message: '❌ Error: ' + error.message };
  }
}

function getUserDetails(email) {
  try {
    const users = getAuthorizedUsers();
    const user = users.find(function(u) { return u.email.toLowerCase() === email.toLowerCase(); });
    return user || null;
  } catch (error) {
    console.error('Error getting user details:', error);
    return null;
  }
}

function getUsersByAssignedManager(areaManager) {
  try {
    const users = getAuthorizedUsers();
    return users.filter(function(u) { return u.assignedAreaManager === areaManager; });
  } catch (error) {
    console.error('Error getting users by assigned manager:', error);
    return [];
  }
}

function manualAdminLogin() {
  const config = getConfig();
  return {
    email: config.ADMIN_EMAILS[0],
    isAuthorized: true,
    role: ROLES.ADMIN,
    isAdmin: true,
    isAreaManager: true,
    isGR: true,
    manualLogin: true
  };
}

function getCurrentUser() {
  try {
    var email = Session.getActiveUser().getEmail();
    const config = getConfig();
    
    if (!email || email === '') {
      return {
        email: null,
        isAuthorized: false,
        role: null,
        isAdmin: false,
        isAreaManager: false,
        isGR: false,
        assignedAreaManager: '',
        requiresManualAuth: true
      };
    }
    
    const users = getAuthorizedUsers();
    const user = users.find(function(u) { return u.email.toLowerCase() === email.toLowerCase(); });
    
    let isAuthorized = false;
    let role = ROLES.AREA_MANAGER;
    let isAdmin = false;
    let isAreaManager = false;
    let isGR = false;
    let assignedAreaManager = '';
    
    if (config.ADMIN_EMAILS.some(function(e) { return e.toLowerCase() === email.toLowerCase(); })) {
      isAdmin = true;
      isAreaManager = true;
      isGR = true;
      isAuthorized = true;
      role = ROLES.ADMIN;
    }
    
    if (user) {
      isAuthorized = true;
      role = user.role || ROLES.AREA_MANAGER;
      assignedAreaManager = user.assignedAreaManager || '';
      isAdmin = role === ROLES.ADMIN || isAdmin;
      isAreaManager = role === ROLES.AREA_MANAGER || role === ROLES.ADMIN || isAdmin;
      isGR = role === ROLES.GR || role === ROLES.ADMIN || isAdmin;
    } else {
      if (config.ADMIN_EMAILS.some(function(e) { return e.toLowerCase() === email.toLowerCase(); })) {
        isAuthorized = true;
        role = ROLES.ADMIN;
        isAdmin = true;
        isAreaManager = true;
        isGR = true;
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const authSheet = ss.getSheetByName(config.AUTH_SHEET);
        if (authSheet) {
          authSheet.appendRow([email, formatDateToDMY(new Date()), 'System', ROLES.ADMIN, '']);
        }
      }
    }
    
    return {
      email: email,
      isAuthorized: isAuthorized,
      role: role,
      isAdmin: isAdmin,
      isAreaManager: isAreaManager,
      isGR: isGR,
      assignedAreaManager: assignedAreaManager,
      requiresManualAuth: false
    };
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return {
      email: null,
      isAuthorized: false,
      role: null,
      isAdmin: false,
      isAreaManager: false,
      isGR: false,
      assignedAreaManager: '',
      requiresManualAuth: true
    };
  }
}

// ============================================
// SHOW LOGIN USER MANAGEMENT UI
// ============================================
function showLoginUserManagement() {
  const html = HtmlService.createHtmlOutput(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; background: #0b0f1a; color: #eef2f6; }
          h2 { color: #7faeeb; }
          .container { max-width: 800px; margin: 0 auto; }
          .input-group { display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap; align-items: center; }
          .input-group input, .input-group select { 
            flex: 1; padding: 10px 16px; border-radius: 8px; border: 1px solid #2a3a4a; 
            background: #1a2332; color: white; min-width: 120px; 
          }
          .input-group button { padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
          .btn-create { background: #1f7b4d; color: white; }
          .btn-create:hover { background: #269f62; }
          .btn-delete { background: #ac3a3a; color: white; }
          .btn-delete:hover { background: #cf4646; }
          .btn-refresh { background: #2f6f9f; color: white; }
          .btn-refresh:hover { background: #3d86bb; }
          .btn-close { background: #4a5a6a; color: white; margin-top: 10px; }
          .btn-close:hover { background: #5a6a7a; }
          .user-list { margin-top: 20px; max-height: 400px; overflow-y: auto; }
          .user-item { display: flex; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid #1a2332; align-items: center; flex-wrap: wrap; gap: 8px; }
          .user-item .username { color: #7faeeb; font-weight: 600; }
          .user-item .email { color: #b0c8e0; font-size: 13px; }
          .user-item .role { color: #7faeeb; font-size: 12px; background: rgba(47,111,159,0.15); padding: 2px 12px; border-radius: 12px; }
          .user-item .assigned-am { color: #8aa2be; font-size: 11px; }
          .user-item .name { color: #8aa2be; font-size: 13px; }
          .user-item .actions { display: flex; gap: 6px; }
          .user-item .actions button { background: none; border: none; color: #6f86a0; cursor: pointer; padding: 4px 8px; border-radius: 20px; font-size: 12px; }
          .user-item .actions button:hover { background: rgba(47,111,159,0.15); }
          .user-item .actions .delete-btn:hover { color: #f06d6d; background: rgba(185,42,42,0.15); }
          .message { padding: 10px 16px; border-radius: 8px; margin-top: 10px; display: none; }
          .message.success { display: block; background: rgba(31,123,77,0.15); color: #63d68c; border: 1px solid rgba(31,123,77,0.2); }
          .message.error { display: block; background: rgba(185,42,42,0.15); color: #f06d6d; border: 1px solid rgba(185,42,42,0.2); }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>👤 Login User Management</h2>
          <p style="color:#8aa2be;font-size:13px;">Manage users for username/password login</p>
          
          <div class="input-group">
            <input type="text" id="newUsername" placeholder="Username (min 3 chars)">
            <input type="password" id="newPassword" placeholder="Password (min 6 chars)">
            <input type="email" id="newEmail" placeholder="Email">
          </div>
          <div class="input-group">
            <input type="text" id="newFullName" placeholder="Full Name">
            <select id="newRole">
              <option value="area_manager">👤 Area Manager</option>
              <option value="gr">🏛️ GR</option>
              <option value="admin">👑 Admin</option>
            </select>
            <input type="text" id="newAssignedAM" placeholder="Assigned Area Manager (optional)">
          </div>
          <div class="input-group">
            <button class="btn-create" onclick="createLoginUser()">➕ Create User</button>
            <button class="btn-refresh" onclick="listLoginUsers()">🔄 Refresh</button>
          </div>
          <div id="message" class="message"></div>
          <div id="userList" class="user-list"></div>
          <button class="btn-close" onclick="google.script.host.close()">✖️ Close</button>
        </div>
        
        <script>
          function showMessage(msg, type) {
            const el = document.getElementById('message');
            el.textContent = msg;
            el.className = 'message ' + type;
            el.style.display = 'block';
            setTimeout(() => { el.style.display = 'none'; }, 5000);
          }
          
          function createLoginUser() {
            const username = document.getElementById('newUsername').value.trim();
            const password = document.getElementById('newPassword').value.trim();
            const email = document.getElementById('newEmail').value.trim();
            const fullName = document.getElementById('newFullName').value.trim();
            const role = document.getElementById('newRole').value;
            const assignedAM = document.getElementById('newAssignedAM').value.trim();
            
            if (!username || username.length < 3) {
              showMessage('❌ Username must be at least 3 characters', 'error');
              return;
            }
            if (!password || password.length < 6) {
              showMessage('❌ Password must be at least 6 characters', 'error');
              return;
            }
            if (!email || !email.includes('@')) {
              showMessage('❌ Please enter a valid email', 'error');
              return;
            }
            
            google.script.run
              .withSuccessHandler(function(result) {
                if (result.success) {
                  showMessage(result.message, 'success');
                  document.getElementById('newUsername').value = '';
                  document.getElementById('newPassword').value = '';
                  document.getElementById('newEmail').value = '';
                  document.getElementById('newFullName').value = '';
                  document.getElementById('newAssignedAM').value = '';
                  listLoginUsers();
                } else {
                  showMessage(result.message, 'error');
                }
              })
              .saveLoginUser(username, password, role, fullName, email, assignedAM);
          }
          
          function listLoginUsers() {
            google.script.run
              .withSuccessHandler(function(users) {
                const container = document.getElementById('userList');
                if (users.length === 0) {
                  container.innerHTML = '<p style="color:#6f86a0;">No users found. Create your first user!</p>';
                  return;
                }
                let html = '<h3 style="color:#9bb0c9;font-size:14px;margin-bottom:10px;">Login Users (' + users.length + ')</h3>';
                users.forEach(function(u) {
                  const roleIcon = u.role === 'admin' ? '👑' : u.role === 'gr' ? '🏛️' : '👤';
                  const roleName = u.role === 'admin' ? 'Admin' : u.role === 'gr' ? 'GR' : 'Area Manager';
                  html += '<div class="user-item">';
                  html += '<div>';
                  html += '<span class="username">@' + u.username + '</span>';
                  if (u.fullName) html += ' <span class="name">(' + u.fullName + ')</span>';
                  html += '</div>';
                  html += '<div>';
                  html += '<span class="email">📧 ' + u.email + '</span>';
                  html += ' <span class="role">' + roleIcon + ' ' + roleName + '</span>';
                  if (u.role === 'area_manager' && u.assignedAreaManager) {
                    html += ' <span class="assigned-am">📌 ' + u.assignedAreaManager + '</span>';
                  }
                  html += ' <span class="actions">';
                  if (u.username !== 'admin') {
                    html += '<button class="delete-btn" onclick="deleteLoginUser(\'' + u.username + '\')">🗑️</button>';
                  } else {
                    html += '<span style="color:#f5b041;font-size:10px;">🔒 Protected</span>';
                  }
                  html += ' <button onclick="resetLoginUserPassword(\'' + u.username + '\')">🔑</button>';
                  html += ' </span>';
                  html += '</div>';
                  html += '</div>';
                });
                container.innerHTML = html;
              })
              .getAllLoginUsers();
          }
          
          function deleteLoginUser(username) {
            if (!confirm('Delete user "' + username + '"? This action cannot be undone.')) return;
            google.script.run
              .withSuccessHandler(function(result) {
                showMessage(result.message, result.success ? 'success' : 'error');
                if (result.success) listLoginUsers();
              })
              .deleteLoginUser(username);
          }
          
          function resetLoginUserPassword(username) {
            const newPassword = prompt('Enter new password for ' + username + ' (min 6 characters):');
            if (!newPassword || newPassword.length < 6) {
              showMessage('❌ Password must be at least 6 characters', 'error');
              return;
            }
            google.script.run
              .withSuccessHandler(function(result) {
                showMessage(result.message, result.success ? 'success' : 'error');
              })
              .saveLoginUser(username, newPassword, null, null, null, null);
          }
          
          listLoginUsers();
        </script>
      </body>
    </html>
  `)
  .setWidth(800)
  .setHeight(600)
  .setTitle('Login User Management');
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Login User Management');
}

// ============================================
// USER MANAGEMENT UI
// ============================================
function showUserManagement() {
  const html = HtmlService.createHtmlOutput(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; background: #0b0f1a; color: #eef2f6; }
          h2 { color: #7faeeb; }
          .container { max-width: 600px; margin: 0 auto; }
          .input-group { display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap; align-items: center; }
          input { flex: 1; padding: 10px 16px; border-radius: 8px; border: 1px solid #2a3a4a; background: #1a2332; color: white; min-width: 150px; }
          select { padding: 10px 16px; border-radius: 8px; border: 1px solid #2a3a4a; background: #1a2332; color: white; }
          button { padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
          .btn-add { background: #1f7b4d; color: white; }
          .btn-add:hover { background: #269f62; }
          .btn-remove { background: #ac3a3a; color: white; }
          .btn-remove:hover { background: #cf4646; }
          .btn-list { background: #2f6f9f; color: white; }
          .btn-list:hover { background: #3d86bb; }
          .btn-close { background: #4a5a6a; color: white; margin-top: 10px; }
          .btn-close:hover { background: #5a6a7a; }
          .user-list { margin-top: 20px; max-height: 300px; overflow-y: auto; }
          .user-item { display: flex; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid #1a2332; align-items: center; flex-wrap: wrap; gap: 8px; }
          .user-item .email { color: #b0c8e0; }
          .user-item .role { color: #7faeeb; font-size: 12px; background: rgba(47,111,159,0.15); padding: 2px 12px; border-radius: 12px; }
          .user-item .assigned-am { color: #8aa2be; font-size: 11px; }
          .user-item .date { color: #6f86a0; font-size: 11px; }
          .user-item .remove-btn { background: none; border: none; color: #6f86a0; cursor: pointer; padding: 4px 8px; border-radius: 20px; }
          .user-item .remove-btn:hover { background: rgba(185,42,42,0.15); color: #f06d6d; }
          .message { padding: 10px 16px; border-radius: 8px; margin-top: 10px; display: none; }
          .message.success { display: block; background: rgba(31,123,77,0.15); color: #63d68c; border: 1px solid rgba(31,123,77,0.2); }
          .message.error { display: block; background: rgba(185,42,42,0.15); color: #f06d6d; border: 1px solid rgba(185,42,42,0.2); }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>🔑 Manage Authorized Users</h2>
          <p style="color:#8aa2be;font-size:13px;">Only these email addresses can access the dashboard</p>
          <p style="color:#f5b041;font-size:12px;">👑 Hardcoded Admins: Use Settings to configure</p>
          
          <div class="input-group">
            <input type="email" id="emailInput" placeholder="Enter email address">
            <select id="roleSelect">
              <option value="area_manager">👤 Area Manager</option>
              <option value="gr">🏛️ GR</option>
              <option value="admin">👑 Admin</option>
            </select>
            <button class="btn-add" onclick="addUser()">➕ Add</button>
            <button class="btn-remove" onclick="removeUser()">➖ Remove</button>
            <button class="btn-list" onclick="listUsers()">📋 List</button>
          </div>
          
          <div id="message" class="message"></div>
          <div id="userList" class="user-list"></div>
          
          <button class="btn-close" onclick="google.script.host.close()">✖️ Close</button>
        </div>
        
        <script>
          function showMessage(msg, type) {
            const el = document.getElementById('message');
            el.textContent = msg;
            el.className = 'message ' + type;
            el.style.display = 'block';
            setTimeout(() => { el.style.display = 'none'; }, 5000);
          }
          
          function addUser() {
            const email = document.getElementById('emailInput').value.trim();
            const role = document.getElementById('roleSelect').value;
            if (!email) { showMessage('Please enter an email address', 'error'); return; }
            
            google.script.run
              .withSuccessHandler(function(result) {
                showMessage(result.message, result.success ? 'success' : 'error');
                if (result.success) {
                  document.getElementById('emailInput').value = '';
                  listUsers();
                }
              })
              .addAuthorizedUser(email, role);
          }
          
          function removeUser() {
            const email = document.getElementById('emailInput').value.trim();
            if (!email) { showMessage('Please enter an email address to remove', 'error'); return; }
            
            google.script.run
              .withSuccessHandler(function(result) {
                showMessage(result.message, result.success ? 'success' : 'error');
                if (result.success) {
                  document.getElementById('emailInput').value = '';
                  listUsers();
                }
              })
              .removeAuthorizedUser(email);
          }
          
          function listUsers() {
            google.script.run
              .withSuccessHandler(function(users) {
                const container = document.getElementById('userList');
                if (users.length === 0) {
                  container.innerHTML = '<p style="color:#6f86a0;">No authorized users found.</p>';
                  return;
                }
                let html = '<h3 style="color:#9bb0c9;font-size:14px;margin-bottom:10px;">Authorized Users (' + users.length + ')</h3>';
                users.forEach(function(u) {
                  const roleIcon = u.role === 'admin' ? '👑' : u.role === 'gr' ? '🏛️' : '👤';
                  const roleName = u.role === 'admin' ? 'Admin' : u.role === 'gr' ? 'GR' : 'Area Manager';
                  const assignedAM = u.assignedAreaManager || '';
                  html += '<div class="user-item">';
                  html += '<span class="email">📧 ' + u.email + '</span>';
                  html += '<span class="role">' + roleIcon + ' ' + roleName + '</span>';
                  if (u.role === 'area_manager' && assignedAM) {
                    html += '<span class="assigned-am">📌 ' + assignedAM + '</span>';
                  }
                  html += '<span class="date">Added: ' + u.date + '</span>';
                  html += '<button class="remove-btn" onclick="removeUserFromList(\'' + u.email + '\')" title="Remove user">✕</button>';
                  html += '</div>';
                });
                container.innerHTML = html;
              })
              .getAuthorizedUsers();
          }
          
          function removeUserFromList(email) {
            if (!confirm('Remove ' + email + ' from authorized users?')) return;
            document.getElementById('emailInput').value = email;
            removeUser();
          }
          
          listUsers();
        </script>
      </body>
    </html>
  `)
  .setWidth(600)
  .setHeight(580)
  .setTitle('Manage Authorized Users');
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Manage Authorized Users');
}

// ============================================
// SAVE LOGIN USER
// ============================================
function saveLoginUser(username, password, role, fullName, email, assignedAreaManager) {
  try {
    if (!username || username.length < 3) {
      return { success: false, message: '❌ Username must be at least 3 characters' };
    }
    if (!password || password.length < 6) {
      return { success: false, message: '❌ Password must be at least 6 characters' };
    }
    
    const config = getConfig();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let loginSheet = ss.getSheetByName(config.LOGIN_SHEET);
    if (!loginSheet) {
      loginSheet = setupLoginSheet();
      if (!loginSheet) {
        return { success: false, message: '❌ Could not create Login sheet' };
      }
    }
    
    const data = loginSheet.getRange(2, 1, loginSheet.getLastRow() - 1, 6).getValues();
    let rowToUpdate = -1;
    
    for (let i = 0; i < data.length; i++) {
      if (data[i][0] && data[i][0].toString().trim().toLowerCase() === username.toLowerCase()) {
        rowToUpdate = i + 2;
        break;
      }
    }
    
    if (rowToUpdate > 0) {
      loginSheet.getRange(rowToUpdate, 2).setValue(password);
      loginSheet.getRange(rowToUpdate, 3).setValue(role);
      loginSheet.getRange(rowToUpdate, 4).setValue(fullName || '');
      loginSheet.getRange(rowToUpdate, 5).setValue(email || '');
      loginSheet.getRange(rowToUpdate, 6).setValue(assignedAreaManager || '');
      return { success: true, message: '✅ User ' + username + ' updated successfully!' };
    } else {
      loginSheet.appendRow([username, password, role, fullName || '', email || '', assignedAreaManager || '']);
      return { success: true, message: '✅ User ' + username + ' created successfully!' };
    }
  } catch (error) {
    console.error('Error in saveLoginUser:', error);
    return { success: false, message: '❌ Error: ' + error.message };
  }
}

// ============================================
// DELETE LOGIN USER
// ============================================
function deleteLoginUser(username) {
  try {
    const config = getConfig();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const loginSheet = ss.getSheetByName(config.LOGIN_SHEET);
    if (!loginSheet) {
      return { success: false, message: '❌ Login sheet not found' };
    }
    
    const credentials = getLoginCredentials();
    const adminUsers = credentials.filter(function(u) { return u.role === 'admin'; });
    if (adminUsers.length <= 1) {
      const user = credentials.find(function(u) {
        return u.username.toLowerCase() === username.toLowerCase();
      });
      if (user && user.role === 'admin') {
        return { success: false, message: '❌ Cannot delete the last admin user' };
      }
    }
    
    const data = loginSheet.getRange(2, 1, loginSheet.getLastRow() - 1, 1).getValues();
    let rowToDelete = -1;
    
    for (let i = 0; i < data.length; i++) {
      if (data[i][0] && data[i][0].toString().trim().toLowerCase() === username.toLowerCase()) {
        rowToDelete = i + 2;
        break;
      }
    }
    
    if (rowToDelete < 0) {
      return { success: false, message: '❌ User not found: ' + username };
    }
    
    loginSheet.deleteRow(rowToDelete);
    return { success: true, message: '✅ User ' + username + ' deleted successfully!' };
  } catch (error) {
    return { success: false, message: '❌ Error: ' + error.message };
  }
}

// ============================================
// GET ALL LOGIN USERS
// ============================================
function getAllLoginUsers() {
  try {
    return getLoginCredentials();
  } catch (error) {
    console.error('Error getting all login users:', error);
    return [];
  }
}

// ============================================
// GET ALL AREA MANAGERS LIST (for dropdowns)
// ============================================
function getAllAreaManagersList() {
  try {
    return getAreaManagers();
  } catch (error) {
    console.error('Error getting all area managers list:', error);
    return [];
  }
}

// ============================================
// GET ALL STAFF DATA - ALIAS FOR getAllData
// ============================================
function getAllStaffData() {
  return getAllData();
}

// ============================================
// GET AREA MANAGER NAME FOR USER
// ============================================
function getAreaManagerName(userEmail) {
  try {
    if (!userEmail) return null;
    
    // Check if user is in AuthorizedUsers with assigned area manager
    const users = getAuthorizedUsers();
    const user = users.find(function(u) {
      return u.email.toLowerCase() === userEmail.toLowerCase();
    });
    
    if (user && user.assignedAreaManager) {
      return user.assignedAreaManager;
    }
    
    // Check if user is in Login sheet with assigned area manager
    const loginUsers = getLoginCredentials();
    const loginUser = loginUsers.find(function(u) {
      return u.email.toLowerCase() === userEmail.toLowerCase();
    });
    
    if (loginUser && loginUser.assignedAreaManager) {
      return loginUser.assignedAreaManager;
    }
    
    // If user is an area manager, return their username
    if (loginUser && loginUser.role === 'area_manager') {
      return loginUser.username;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting area manager name:', error);
    return null;
  }
}

// ============================================
// TEST LOGIN - DEBUG FUNCTION
// ============================================
function testLogin() {
  var users = getLoginCredentials();
  Logger.log('Total users:', users.length);
  users.forEach(function(u) {
    Logger.log('User:', u.username, 'Role:', u.role, 'Email:', u.email);
  });
  return users;
}

// ============================================
// RESET LOGIN SHEET
// ============================================
function resetLoginSheet() {
  try {
    const config = getConfig();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const loginSheet = ss.getSheetByName(config.LOGIN_SHEET);
    if (loginSheet) {
      ss.deleteSheet(loginSheet);
    }
    setupLoginSheet();
    SpreadsheetApp.getUi().alert('✅ Login sheet reset with default users!');
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Error: ' + error.message);
  }
}

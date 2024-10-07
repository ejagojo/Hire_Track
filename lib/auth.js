// --- OAuth2 Token Management and Utility Functions ---
const CLIENT_ID = '867838514846-3uvi1b649scqvld6gtb8arqiuo6hth6s.apps.googleusercontent.com'; 
const AUTH_SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file"
];

/**
 * Retrieve the OAuth2 authentication token.
 * @param {boolean} interactive - Whether the user should be prompted to re-authenticate.
 * @returns {Promise<string>} - Resolves to a valid OAuth2 token.
 */
async function getAuthToken(interactive = true) {
  return new Promise((resolve, reject) => {
    // Initiate OAuth2 token retrieval using Chrome Identity API
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError || !token) {
        console.error("Failed to retrieve auth token:", chrome.runtime.lastError);
        return reject(chrome.runtime.lastError);
      }

      // Store the retrieved OAuth2 token in local storage
      chrome.storage.local.set({ oauthToken: token }, () => {
        console.log("OAuth2 token stored successfully.");
        resolve(token);
      });
    });
  });
}

/**
 * Refresh the existing OAuth2 token if expired.
 * @returns {Promise<string>} - Resolves to a refreshed OAuth2 token.
 */
async function refreshAuthToken() {
  return new Promise((resolve, reject) => {
    // Retrieve the current OAuth2 token from local storage
    chrome.storage.local.get("oauthToken", (items) => {
      const currentToken = items.oauthToken;
      if (!currentToken) return reject("No OAuth2 token found for refreshing.");

      // Remove the cached token and request a new one
      chrome.identity.removeCachedAuthToken({ token: currentToken }, () => {
        console.log("Old token removed. Fetching a new one...");
        // Retrieve a new token after removing the old one
        getAuthToken(false).then(resolve).catch(reject);
      });
    });
  });
}

/**
 * Logout the user by clearing stored tokens and revoking access.
 * @returns {Promise<void>} - Resolves when all tokens are cleared.
 */
async function logout() {
  return new Promise((resolve) => {
    // Clear all stored tokens using the Chrome Identity API
    chrome.identity.clearAllCachedAuthTokens(() => {
      console.log("All cached tokens cleared.");

      // Remove the OAuth2 token from local storage
      chrome.storage.local.remove("oauthToken", () => {
        console.log("Local OAuth2 token removed.");
        resolve();
      });
    });
  });
}

/**
 * Retrieve the user's profile information using the OAuth2 token.
 * @returns {Promise<Object>} - Resolves to an object containing user profile data.
 */
async function getUserInfo() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get("oauthToken", (items) => {
      const token = items.oauthToken;
      if (!token) return reject("No OAuth2 token found.");

      // Make a request to the Google User Info API
      fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(response => response.json())
        .then(userInfo => resolve(userInfo))
        .catch(error => reject("Failed to retrieve user info: " + error));
    });
  });
}

/**
 * Initialize the OAuth2 client and check if the token is valid.
 * If no token is found, initiate the OAuth2 flow.
 */
async function initializeAuth() {
  // Check for an existing OAuth2 token in local storage
  chrome.storage.local.get("oauthToken", async (items) => {
    const token = items.oauthToken;
    if (token) {
      // If a token exists, verify it by retrieving user info
      try {
        const userInfo = await getUserInfo();
        console.log("User is authenticated:", userInfo);
      } catch (error) {
        // If the token is invalid, refresh it
        console.warn("Token invalid or expired. Refreshing...");
        await refreshAuthToken();
      }
    } else {
      // If no token is found, initiate the OAuth2 flow
      console.log("No token found. Initiating OAuth2 flow...");
      await getAuthToken(true);
    }
  });
}

// Export the defined functions for use in other modules
export { getAuthToken, refreshAuthToken, logout, getUserInfo, initializeAuth };

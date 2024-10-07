// background.js
import { getAuthToken, refreshAuthToken, logout, getUserInfo, initializeAuth } from './lib/auth.js';

// Testing Script: Call each function and log outputs

// Step 1: Initialize Authentication (Check if User is Authenticated)
initializeAuth()
  .then(() => console.log("Initial authentication check complete."))
  .catch((error) => console.error("Initialization failed:", error));

// Step 2: Get the OAuth Token Interactively
setTimeout(() => {
  getAuthToken(true)
    .then((token) => {
      console.log("Step 2: Retrieved OAuth2 Token:", token);
      // Check for user information using the retrieved token
      return getUserInfo();
    })
    .then((userInfo) => console.log("Step 2: Retrieved User Info:", userInfo))
    .catch(console.error);
}, 2000);  // Wait 2 seconds before triggering the token request

// Step 3: Refresh the OAuth2 Token
setTimeout(() => {
  refreshAuthToken()
    .then((newToken) => console.log("Step 3: Refreshed OAuth2 Token:", newToken))
    .catch(console.error);
}, 5000);  // Wait 5 seconds before attempting token refresh

// Step 4: Logout the User
setTimeout(() => {
  logout()
    .then(() => console.log("Step 4: User logged out successfully."))
    .catch(console.error);
}, 8000);  // Wait 8 seconds before logging out


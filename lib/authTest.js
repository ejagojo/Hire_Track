// Import the authentication functions from lib/auth.js
import { getAuthToken, refreshAuthToken, logout, getUserInfo, initializeAuth } from './auth.js';

// 1. Test Token Retrieval (getAuthToken)
async function testGetAuthToken() {
  try {
    const token = await getAuthToken(true);
    console.log("1. getAuthToken() - Token retrieved successfully:", token);
  } catch (error) {
    console.error("1. getAuthToken() - Error:", error);
  }
}

// 2. Test Token Refresh (refreshAuthToken)
async function testRefreshAuthToken() {
  try {
    const refreshedToken = await refreshAuthToken();
    console.log("2. refreshAuthToken() - Token refreshed successfully:", refreshedToken);
  } catch (error) {
    console.error("2. refreshAuthToken() - Error:", error);
  }
}

// 3. Test User Info Retrieval (getUserInfo)
async function testGetUserInfo() {
  try {
    const userInfo = await getUserInfo();
    console.log("3. getUserInfo() - User info retrieved successfully:", userInfo);
  } catch (error) {
    console.error("3. getUserInfo() - Error retrieving user info:", error);
  }
}

// 4. Test Logout (logout)
async function testLogout() {
  try {
    await logout();
    console.log("4. logout() - User logged out successfully.");
  } catch (error) {
    console.error("4. logout() - Error during logout:", error);
  }
}

// 5. Test Initialization Flow (initializeAuth)
async function testInitializeAuth() {
  try {
    await initializeAuth();
    console.log("5. initializeAuth() - Initialization and authentication successful.");
  } catch (error) {
    console.error("5. initializeAuth() - Initialization error:", error);
  }
}

// Run the tests in sequence
async function runAuthTests() {
  console.log("Running OAuth2 Authentication Tests...");
  await testGetAuthToken();
  await testGetUserInfo();
  await testRefreshAuthToken();
  await testLogout();
  await testInitializeAuth();
}

// Start the test sequence
runAuthTests();

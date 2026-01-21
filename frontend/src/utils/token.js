/**
 * Token Utility (ACCESS TOKEN ONLY)
 *
 * 🔐 Refresh token is HTTP-only cookie (handled by backend)
 * ❌ Frontend MUST NOT read/write refresh token
 *
 * This utility ONLY manages access token.
 */

export const ACCESS_KEY = "access_token";

/* ===========================
   GET ACCESS TOKEN
=========================== */
export const getAccessToken = () => {
  try {
    return localStorage.getItem(ACCESS_KEY);
  } catch (err) {
    console.error("Error reading access token:", err);
    return null;
  }
};

/* ===========================
   SET / CLEAR ACCESS TOKEN
=========================== */
export const setAccessToken = (token) => {
  try {
    if (token) {
      localStorage.setItem(ACCESS_KEY, token);
    } else {
      localStorage.removeItem(ACCESS_KEY);
    }
  } catch (err) {
    console.error("Error writing access token:", err);
  }
};

/* ===========================
   CLEAR ALL AUTH STATE
=========================== */
export const clearTokens = () => {
  try {
    localStorage.removeItem(ACCESS_KEY);
  } catch (err) {
    console.error("Error clearing access token:", err);
  }
};

/* ===========================
   DEV / DEBUG ONLY
=========================== */
export const getTokenDebug = () => ({
  accessToken: getAccessToken(),
});

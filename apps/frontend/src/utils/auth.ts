import api from '../services/api';

export interface LogoutOptions {
  sessionExpired?: boolean;
  message?: string;
  redirectTo?: string;
}

let isLoggingOut = false;

/**
 * Reads token from sessionStorage (primary) or fallback to localStorage
 */
export const getStoredToken = (): string | null => {
  return sessionStorage.getItem('token') || localStorage.getItem('token');
};

/**
 * Reads user object from sessionStorage (primary) or fallback to localStorage
 */
export const getStoredUser = (): any | null => {
  const userStr = sessionStorage.getItem('user') || localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

/**
 * Reads superadmin project ID from sessionStorage or localStorage
 */
export const getStoredSuperadminProjectId = (): string => {
  return sessionStorage.getItem('superadmin_project_id') || localStorage.getItem('superadmin_project_id') || '';
};

/**
 * Sets auth session in sessionStorage (session-only) and clears any legacy localStorage auth tokens
 */
export const setAuthSession = (token: string, user: any) => {
  // Store in sessionStorage for session-only persistence (forces login on browser restart/tab close)
  sessionStorage.setItem('token', token);
  sessionStorage.setItem('user', JSON.stringify(user));

  // Clear legacy localStorage auth keys so stale logins do not persist
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/**
 * Performs a thorough, clean logout by:
 * 1. Calling the backend logout endpoint (revoking server sessions/cookies).
 * 2. Clearing all authentication keys from sessionStorage and localStorage.
 * 3. Expiring all accessible browser cookies.
 * 4. Redirecting cleanly to the login page without infinite loops.
 */
export const performCleanLogout = async (options: LogoutOptions = {}) => {
  if (isLoggingOut) return;
  isLoggingOut = true;

  try {
    await api.post('/auth/logout').catch(() => {});
  } catch {
    // Ignore network or 401 errors during logout call
  }

  const keysToRemove = [
    'token',
    'user',
    'superadmin_project_id',
    'auth_state',
    'token_expiry',
  ];

  // Clear from both sessionStorage and localStorage
  keysToRemove.forEach((key) => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  });

  const noticeMessage = options.sessionExpired
    ? options.message || 'Your session has expired. Please log in again.'
    : null;

  try {
    sessionStorage.clear();
  } catch {}

  if (noticeMessage) {
    try {
      sessionStorage.setItem('login_notice', noticeMessage);
    } catch {}
  }

  try {
    if (document.cookie) {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      }
    }
  } catch {}

  isLoggingOut = false;

  const targetPath = options.redirectTo || '/#/login';
  if (window.location.hash ? window.location.hash !== '#/login' : window.location.pathname !== '/login') {
    window.location.href = targetPath;
  } else {
    window.location.reload();
  }
};

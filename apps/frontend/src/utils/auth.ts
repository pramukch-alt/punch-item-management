import api from '../services/api';

export interface LogoutOptions {
  sessionExpired?: boolean;
  message?: string;
  redirectTo?: string;
}

let isLoggingOut = false;

/**
 * Performs a thorough, clean logout by:
 * 1. Calling the backend logout endpoint (revoking server sessions/cookies).
 * 2. Clearing all authentication keys from localStorage.
 * 3. Clearing sessionStorage.
 * 4. Expiring all accessible browser cookies.
 * 5. Redirecting cleanly to the login page without infinite loops.
 */
export const performCleanLogout = async (options: LogoutOptions = {}) => {
  // Prevent duplicate concurrent logout executions
  if (isLoggingOut) return;
  isLoggingOut = true;

  try {
    // 1. Notify backend logout endpoint if possible
    await api.post('/auth/logout').catch(() => {
      // Ignore network or 401 errors during logout call
    });
  } catch {
    // Ignore any unexpected errors during logout API call
  }

  // 2. Clear all authentication-related keys from localStorage
  const keysToRemove = [
    'token',
    'user',
    'superadmin_project_id',
    'auth_state',
    'token_expiry',
  ];
  keysToRemove.forEach((key) => localStorage.removeItem(key));

  // 3. Store session notice if requested before clearing sessionStorage
  const noticeMessage = options.sessionExpired
    ? options.message || 'Your session has expired. Please log in again.'
    : null;

  // 4. Clear sessionStorage
  try {
    sessionStorage.clear();
  } catch {
    // Ignore if sessionStorage is not accessible
  }

  if (noticeMessage) {
    try {
      sessionStorage.setItem('login_notice', noticeMessage);
    } catch {
      // Ignore fallback
    }
  }

  // 5. Expire all accessible document cookies
  try {
    if (document.cookie) {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      }
    }
  } catch {
    // Ignore cookie errors
  }

  // Reset flag right before navigation
  isLoggingOut = false;

  // 6. Force clean redirect to login page
  const targetPath = options.redirectTo || '/#/login';
  if (window.location.hash ? window.location.hash !== '#/login' : window.location.pathname !== '/login') {
    window.location.href = targetPath;
  } else {
    // If already on login page, force page reload to refresh React state
    window.location.reload();
  }
};

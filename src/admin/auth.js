/**
 * Cureus — Admin Auth Gate
 *
 * Protects the admin dashboard behind Supabase Auth.
 * Shows a login form if not authenticated, renders the dashboard if authenticated.
 */

import { supabase, signIn, signOut, onAuthChange } from '../supabase.js';

export const AuthGate = {
  /**
   * Initialize the auth gate.
   * @param {object} refs - DOM references for auth UI
   * @param {HTMLElement} refs.authContainer - Login form container
   * @param {HTMLElement} refs.dashboardContainer - Main dashboard content
   * @param {HTMLInputElement} refs.emailInput
   * @param {HTMLInputElement} refs.passwordInput
   * @param {HTMLButtonElement} refs.loginBtn
   * @param {HTMLButtonElement} refs.logoutBtn
   * @param {Function} onAuthenticated - Called when user becomes authenticated
   */
  init(refs, onAuthenticated) {
    this.refs = refs;

    // Check current session
    this._checkSession(onAuthenticated);

    // Listen for auth changes
    this.unsubscribe = onAuthChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        this._showDashboard(onAuthenticated);
      } else if (event === 'SIGNED_OUT') {
        this._showLogin();
      }
    });

    // Bind events
    refs.loginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this._handleLogin(onAuthenticated);
    });

    refs.passwordInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        refs.loginBtn.click();
      }
    });

    refs.logoutBtn.addEventListener('click', () => {
      signOut();
    });
  },

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe.data?.unsubscribe();
    }
  },

  async _checkSession(onAuthenticated) {
    const { data } = await supabase.auth.getSession();
    if (data?.session) {
      this._showDashboard(onAuthenticated);
    } else {
      this._showLogin();
    }
  },

  _showLogin() {
    this.refs.authContainer.classList.remove('hidden');
    this.refs.dashboardContainer.classList.add('hidden');
  },

  _showDashboard(onAuthenticated) {
    this.refs.authContainer.classList.add('hidden');
    this.refs.dashboardContainer.classList.remove('hidden');
    if (onAuthenticated) onAuthenticated();
  },

  async _handleLogin(onAuthenticated) {
    const email = this.refs.emailInput.value.trim();
    const password = this.refs.passwordInput.value;

    if (!email || !password) {
      this._setError('Please enter email and password.');
      return;
    }

    this.refs.loginBtn.disabled = true;
    this.refs.loginBtn.textContent = 'Signing in…';
    this._clearError();

    const { error } = await signIn(email, password);

    this.refs.loginBtn.disabled = false;
    this.refs.loginBtn.textContent = 'Sign In';

    if (error) {
      this._setError(error.message);
    }
    // If successful, onAuthChange will trigger _showDashboard
  },

  _setError(msg) {
    const el = this.refs.authContainer.querySelector('.auth-error');
    if (el) {
      el.textContent = msg;
      el.classList.remove('hidden');
    }
  },

  _clearError() {
    const el = this.refs.authContainer.querySelector('.auth-error');
    if (el) {
      el.textContent = '';
      el.classList.add('hidden');
    }
  },
};

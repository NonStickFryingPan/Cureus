/**
 * Cureus — Admin Auth Gate
 *
 * Protects the admin dashboard behind Supabase Auth.
 * Shows a login form if not authenticated, renders the dashboard if authenticated.
 */

import { supabase, signIn, signOut, onAuthChange } from '../supabase.js';

export const AuthGate = {
  isSignUp: false,

  /**
   * Initialize the auth gate.
   * @param {object} refs - DOM references for auth UI
   * @param {HTMLElement} refs.authContainer - Login form container
   * @param {HTMLElement} refs.dashboardContainer - Main dashboard content
   * @param {HTMLInputElement} refs.emailInput
   * @param {HTMLInputElement} refs.passwordInput
   * @param {HTMLButtonElement} refs.loginBtn
   * @param {HTMLButtonElement} refs.logoutBtn
   * @param {HTMLButtonElement} refs.toggleAuthBtn
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
      if (this.isSignUp) {
        this._handleSignUp();
      } else {
        this._handleLogin(onAuthenticated);
      }
    });

    refs.passwordInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        refs.loginBtn.click();
      }
    });

    if (refs.toggleAuthBtn) {
      refs.toggleAuthBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this._toggleMode();
      });
    }

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

  _toggleMode() {
    this.isSignUp = !this.isSignUp;
    this._clearError();

    const titleEl = this.refs.authContainer.querySelector('.auth-logo-sub');
    const emailLabel = this.refs.authContainer.querySelector('label[for="email"]');
    
    if (this.isSignUp) {
      if (titleEl) titleEl.textContent = 'Create Admin Account';
      this.refs.loginBtn.textContent = 'Sign Up';
      this.refs.toggleAuthBtn.textContent = 'Have an account? Sign In';
    } else {
      if (titleEl) titleEl.textContent = 'Admin Dashboard';
      this.refs.loginBtn.textContent = 'Sign In';
      this.refs.toggleAuthBtn.textContent = 'Need an account? Sign Up';
    }
  },

  async _handleLogin(onAuthenticated) {
    const email = this.refs.emailInput.value.trim();
    const password = this.refs.passwordInput.value;

    if (!email || !password) {
      this._setError('Please enter your email and password.');
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
  },

  async _handleSignUp() {
    const email = this.refs.emailInput.value.trim();
    const password = this.refs.passwordInput.value;

    if (!email || !password) {
      this._setError('Please enter an email and password.');
      return;
    }

    if (password.length < 6) {
      this._setError('Password must be at least 6 characters long.');
      return;
    }

    this.refs.loginBtn.disabled = true;
    this.refs.loginBtn.textContent = 'Signing up…';
    this._clearError();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    this.refs.loginBtn.disabled = false;
    this.refs.loginBtn.textContent = 'Sign Up';

    if (error) {
      this._setError(error.message);
      return;
    }

    if (data?.user && !data.session) {
      // User created but needs email confirmation
      this._setSuccess('Account created! Please check your email to confirm registration before signing in.');
      this.isSignUp = false;
      this.refs.loginBtn.textContent = 'Sign In';
      this.refs.toggleAuthBtn.textContent = 'Need an account? Sign Up';
      const titleEl = this.refs.authContainer.querySelector('.auth-logo-sub');
      if (titleEl) titleEl.textContent = 'Admin Dashboard';
    } else if (data?.session) {
      // Logged in immediately (email confirmation disabled)
      this._showDashboard();
    }
  },

  _setError(msg) {
    const el = this.refs.authContainer.querySelector('.auth-error');
    if (el) {
      el.textContent = msg;
      el.className = 'auth-error';
      el.classList.remove('hidden');
    }
  },

  _setSuccess(msg) {
    const el = this.refs.authContainer.querySelector('.auth-error');
    if (el) {
      el.textContent = msg;
      el.className = 'auth-error';
      el.style.background = 'var(--green-dim)';
      el.style.borderColor = 'rgba(92,224,125,0.3)';
      el.style.color = 'var(--green)';
      el.classList.remove('hidden');
    }
  },

  _clearError() {
    const el = this.refs.authContainer.querySelector('.auth-error');
    if (el) {
      el.textContent = '';
      el.className = 'auth-error hidden';
      el.style.background = '';
      el.style.borderColor = '';
      el.style.color = '';
    }
  },
};

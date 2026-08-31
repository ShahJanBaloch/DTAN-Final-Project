/**
 * BalochHunar — Centralized API Client & Frontend Utilities
 */

const API = {
  baseUrl: '/api',

  /**
   * Generic Request Handler
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultHeaders = {};
    if (!(options.body instanceof FormData)) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    const config = {
      credentials: 'include', // Ensure session cookies are sent and received
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => ({
        success: false,
        message: 'Invalid response from server'
      }));

      if (!response.ok) {
        // If unauthorized on an admin page, redirect to login
        const isAdminPage = window.location.pathname.startsWith('/admin/') || window.location.pathname === '/admin-login';
        if (response.status === 401 && isAdminPage && !window.location.pathname.endsWith('/login.html')) {
          window.location.href = '/admin/login.html';
        }
        const error = new Error(data.message || `HTTP Error ${response.status}`);
        error.status = response.status;
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`[API Error] ${endpoint}:`, error.message);
      throw error;
    }
  },

  // HTTP Method Shortcuts
  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },

  upload(endpoint, formData, method = 'POST') {
    return this.request(endpoint, {
      method,
      body: formData // Browser automatically sets multipart/form-data boundary
    });
  },

  /**
   * Global Toast Notification
   */
  showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'fas fa-info-circle';
    if (type === 'success') icon = 'fas fa-check-circle';
    if (type === 'error') icon = 'fas fa-exclamation-circle';

    toast.innerHTML = `<i class="${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  /**
   * Currency Formatter (PKR)
   */
  formatCurrency(amount) {
    const num = Number(amount) || 0;
    return 'PKR ' + num.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },

  /**
   * Date Formatter
   */
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
};

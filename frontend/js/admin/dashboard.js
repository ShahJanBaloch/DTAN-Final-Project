/**
 * BalochHunar — Admin Dashboard Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Verify Authentication
  let currentUser = null;
  try {
    const authRes = await API.get('/auth/me');
    if (!authRes.success || !authRes.user) {
      window.location.href = 'login.html';
      return;
    }
    currentUser = authRes.user;
    
    // Update User Profile Displays
    const userNameEl = document.getElementById('user-name');
    const heroNameEl = document.getElementById('hero-admin-name');
    const userRoleEl = document.getElementById('user-role');
    
    if (userNameEl) userNameEl.textContent = currentUser.name;
    if (heroNameEl) heroNameEl.textContent = currentUser.name.split(' ')[0];
    if (userRoleEl) userRoleEl.textContent = currentUser.role;
  } catch (error) {
    window.location.href = 'login.html';
    return;
  }

  // 2. Fetch Dashboard Statistics
  await loadDashboardStats();

  // 3. Setup Logout Handler
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await API.post('/auth/logout');
        API.showToast('Logged out successfully', 'info');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 500);
      } catch (err) {
        window.location.href = 'login.html';
      }
    });
  }
});

/**
 * Load and render real-time KPI metrics and recent messages
 */
async function loadDashboardStats() {
  try {
    const res = await API.get('/auth/stats');
    if (!res.success) throw new Error(res.message);

    const { stats, recentMessages } = res;

    // Update KPI counters
    document.getElementById('stat-products').textContent = stats.totalProducts ?? 0;
    document.getElementById('stat-artisans').textContent = stats.totalArtisans ?? 0;
    document.getElementById('stat-categories').textContent = stats.totalCategories ?? 0;
    document.getElementById('stat-services').textContent = stats.totalServices ?? 0;
    document.getElementById('stat-gallery').textContent = stats.totalGallery ?? 0;
    document.getElementById('stat-messages-unread').textContent = stats.unreadMessages ?? 0;
    document.getElementById('stat-messages-total').textContent = stats.totalMessages ?? 0;

    // Update Sidebar badge
    const msgBadge = document.getElementById('sidebar-msg-badge');
    if (msgBadge) {
      if (stats.unreadMessages > 0) {
        msgBadge.textContent = stats.unreadMessages;
        msgBadge.classList.remove('hidden');
      } else {
        msgBadge.classList.add('hidden');
      }
    }

    // Render Recent Inquiries Table
    const tbody = document.getElementById('recent-messages-tbody');
    if (!recentMessages || recentMessages.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="px-6 py-8 text-center text-gray-400 text-sm">
            <i class="fas fa-inbox text-2xl mb-2 block text-gray-300"></i>
            No customer inquiries found.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = recentMessages.map((msg) => {
      const isUnread = !msg.is_read;
      const statusBadge = isUnread
        ? `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800"><span class="w-1.5 h-1.5 rounded-full bg-red-600 mr-1.5 animate-pulse"></span> Unread</span>`
        : `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">Read</span>`;

      return `
        <tr class="hover:bg-gray-50/80 transition ${isUnread ? 'bg-amber-50/20 font-medium' : ''}">
          <td class="px-6 py-4 font-semibold text-gray-900">${escapeHtml(msg.name)}</td>
          <td class="px-6 py-4 text-gray-600">${escapeHtml(msg.email)}</td>
          <td class="px-6 py-4 text-gray-800">${escapeHtml(msg.subject)}</td>
          <td class="px-6 py-4 text-xs text-gray-500">${API.formatDate(msg.created_at)}</td>
          <td class="px-6 py-4">${statusBadge}</td>
          <td class="px-6 py-4 text-right">
            <a href="messages.html" class="text-xs text-terracotta hover:underline font-semibold">
              View Message <i class="fas fa-arrow-right text-[10px] ml-1"></i>
            </a>
          </td>
        </tr>
      `;
    }).join('');

  } catch (error) {
    console.error('Failed to load dashboard metrics:', error);
    API.showToast('Could not load dashboard statistics', 'error');
  }
}

/**
 * Basic XSS sanitization helper for table strings
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * BalochHunar — Messages Management Logic
 */

let allMessages = [];
let currentOpenMessageId = null;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const auth = await API.get('/auth/me');
    if (!auth.success) window.location.href = 'login.html';
  } catch (e) {
    window.location.href = 'login.html';
    return;
  }

  await loadMessages();

  const modal = document.getElementById('message-modal');
  const closeBtn = document.getElementById('close-modal-btn');
  const okBtn = document.getElementById('modal-ok-btn');
  const toggleReadBtn = document.getElementById('toggle-read-btn');

  const closeModal = () => modal.classList.add('hidden');
  closeBtn.addEventListener('click', closeModal);
  okBtn.addEventListener('click', closeModal);

  toggleReadBtn.addEventListener('click', async () => {
    if (!currentOpenMessageId) return;
    const msg = allMessages.find(m => m.id === currentOpenMessageId);
    if (!msg) return;

    const newStatus = !msg.is_read;
    try {
      const res = await API.put(`/messages/${currentOpenMessageId}/read`, { is_read: newStatus });
      if (res.success) {
        msg.is_read = newStatus ? 1 : 0;
        API.showToast(res.message, 'success');
        closeModal();
        renderMessagesTable(allMessages);
      }
    } catch (e) {
      API.showToast('Failed to update message status', 'error');
    }
  });
});

async function loadMessages() {
  try {
    const res = await API.get('/messages');
    if (res.success) {
      allMessages = res.data;
      renderMessagesTable(allMessages);
    }
  } catch (error) {
    API.showToast('Could not load customer inquiries', 'error');
  }
}

function renderMessagesTable(messages) {
  const tbody = document.getElementById('messages-tbody');
  const countBadge = document.getElementById('messages-count-badge');
  const unreadCount = messages.filter(m => !m.is_read).length;
  if (countBadge) countBadge.textContent = `${unreadCount} Unread / ${messages.length} Total Messages`;

  if (messages.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-8 text-center text-gray-400 text-sm">
          No customer inquiries received yet.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = messages.map(m => {
    const isUnread = !m.is_read;
    const statusBadge = isUnread
      ? `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800"><span class="w-1.5 h-1.5 rounded-full bg-red-600 mr-1.5 animate-pulse"></span> New</span>`
      : `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">Read</span>`;

    return `
      <tr class="hover:bg-gray-50/80 transition ${isUnread ? 'bg-amber-50/20 font-medium' : ''}">
        <td class="px-6 py-4 font-bold text-gray-900 text-sm">
          ${escapeHtml(m.name)}
        </td>
        <td class="px-6 py-4 text-xs text-gray-600">
          <div><a href="mailto:${escapeHtml(m.email)}" class="hover:text-blue-600">${escapeHtml(m.email)}</a></div>
          ${m.phone ? `<div class="text-gray-400 mt-0.5">${escapeHtml(m.phone)}</div>` : ''}
        </td>
        <td class="px-6 py-4">
          <span class="font-semibold text-gray-900 text-xs block">${escapeHtml(m.subject)}</span>
          <span class="text-gray-500 text-xs line-clamp-1 max-w-sm">${escapeHtml(m.message)}</span>
        </td>
        <td class="px-6 py-4 text-xs text-gray-500 font-mono">
          ${API.formatDate(m.created_at)}
        </td>
        <td class="px-6 py-4">
          ${statusBadge}
        </td>
        <td class="px-6 py-4 text-right space-x-2">
          <button onclick="viewMessageDetails(${m.id})" class="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition" title="Read Message">
            <i class="fas fa-eye"></i>
          </button>
          <button onclick="confirmDeleteMessage(${m.id})" class="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition" title="Delete Inquiry">
            <i class="fas fa-trash-alt"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

async function viewMessageDetails(id) {
  const msg = allMessages.find(m => m.id === id);
  if (!msg) return;

  currentOpenMessageId = id;
  document.getElementById('modal-subject').textContent = msg.subject;
  document.getElementById('modal-date').textContent = API.formatDate(msg.created_at);
  document.getElementById('modal-name').textContent = msg.name;
  
  const emailEl = document.getElementById('modal-email');
  emailEl.textContent = msg.email;
  emailEl.href = `mailto:${msg.email}`;

  const phoneContainer = document.getElementById('modal-phone-container');
  const phoneEl = document.getElementById('modal-phone');
  if (msg.phone) {
    phoneEl.textContent = msg.phone;
    phoneContainer.classList.remove('hidden');
  } else {
    phoneContainer.classList.add('hidden');
  }

  document.getElementById('modal-body').textContent = msg.message;
  document.getElementById('toggle-read-btn').textContent = msg.is_read ? 'Mark as Unread' : 'Mark as Read';

  document.getElementById('message-modal').classList.remove('hidden');

  // If unread, mark as read automatically in database
  if (!msg.is_read) {
    try {
      await API.put(`/messages/${id}/read`, { is_read: true });
      msg.is_read = 1;
      renderMessagesTable(allMessages);
    } catch (e) {
      console.error('Failed to auto-mark message as read', e);
    }
  }
}

async function confirmDeleteMessage(id) {
  if (!confirm('Are you sure you want to permanently delete this customer inquiry?')) return;

  try {
    const res = await API.delete(`/messages/${id}`);
    if (res.success) {
      API.showToast(res.message, 'success');
      await loadMessages();
    }
  } catch (error) {
    API.showToast(error.message || 'Failed to delete message', 'error');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

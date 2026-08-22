/**
 * BalochHunar — Services Management Logic
 */

let allServices = [];

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const auth = await API.get('/auth/me');
    if (!auth.success) window.location.href = 'login.html';
  } catch (e) {
    window.location.href = 'login.html';
    return;
  }

  await loadServices();

  const modal = document.getElementById('service-modal');
  const openAddBtn = document.getElementById('open-add-modal-btn');
  const closeBtn = document.getElementById('close-modal-btn');
  const cancelBtn = document.getElementById('cancel-modal-btn');
  const form = document.getElementById('service-form');

  openAddBtn.addEventListener('click', () => {
    form.reset();
    document.getElementById('service-id').value = '';
    document.getElementById('modal-title').textContent = 'Add Artisan Service';
    modal.classList.remove('hidden');
  });

  const closeModal = () => modal.classList.add('hidden');
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('service-id').value;
    const isEdit = Boolean(id);

    const payload = {
      title: document.getElementById('service-title').value.trim(),
      starting_price: document.getElementById('service-price').value || 0,
      estimated_days: document.getElementById('service-duration').value.trim() || '7-14 business days',
      icon: document.getElementById('service-icon').value.trim() || 'fas fa-palette',
      description: document.getElementById('service-description').value.trim()
    };

    try {
      const res = isEdit
        ? await API.put(`/services/${id}`, payload)
        : await API.post('/services', payload);

      if (res.success) {
        API.showToast(isEdit ? 'Service updated successfully' : 'Service created successfully', 'success');
        closeModal();
        await loadServices();
      }
    } catch (error) {
      API.showToast(error.message || 'Failed to save service', 'error');
    }
  });
});

async function loadServices() {
  try {
    const res = await API.get('/services');
    if (res.success) {
      allServices = res.data;
      renderServicesTable(allServices);
    }
  } catch (error) {
    API.showToast('Could not load services', 'error');
  }
}

function renderServicesTable(services) {
  const tbody = document.getElementById('services-tbody');
  const countBadge = document.getElementById('service-count-badge');
  if (countBadge) countBadge.textContent = `${services.length} Service(s) offered`;

  if (services.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="px-6 py-8 text-center text-gray-400 text-sm">
          No services configured.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = services.map(s => `
    <tr class="hover:bg-gray-50/80 transition">
      <td class="px-6 py-4">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-terracotta/10 text-terracotta flex items-center justify-center text-sm flex-shrink-0">
            <i class="${escapeHtml(s.icon || 'fas fa-palette')}"></i>
          </div>
          <span class="font-bold text-gray-900 text-sm">${escapeHtml(s.title)}</span>
        </div>
      </td>
      <td class="px-6 py-4 text-xs text-gray-600">
        <i class="far fa-clock text-sandstone-dark mr-1"></i> ${escapeHtml(s.estimated_days)}
      </td>
      <td class="px-6 py-4 font-bold text-gray-900 text-sm">
        ${API.formatCurrency(s.starting_price)}
      </td>
      <td class="px-6 py-4 text-xs text-gray-600 max-w-sm line-clamp-2">
        ${escapeHtml(s.description)}
      </td>
      <td class="px-6 py-4 text-right space-x-2">
        <button onclick="openEditService(${s.id})" class="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition" title="Edit Service">
          <i class="fas fa-edit"></i>
        </button>
        <button onclick="confirmDeleteService(${s.id}, '${escapeHtml(s.title)}')" class="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition" title="Delete Service">
          <i class="fas fa-trash-alt"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function openEditService(id) {
  const s = allServices.find(srv => srv.id === id);
  if (!s) return;

  document.getElementById('service-id').value = s.id;
  document.getElementById('service-title').value = s.title;
  document.getElementById('service-price').value = s.starting_price;
  document.getElementById('service-duration').value = s.estimated_days;
  document.getElementById('service-icon').value = s.icon;
  document.getElementById('service-description').value = s.description;

  document.getElementById('modal-title').textContent = `Edit Service: ${s.title}`;
  document.getElementById('service-modal').classList.remove('hidden');
}

async function confirmDeleteService(id, title) {
  if (!confirm(`Are you sure you want to delete service "${title}"?`)) return;

  try {
    const res = await API.delete(`/services/${id}`);
    if (res.success) {
      API.showToast(res.message, 'success');
      await loadServices();
    }
  } catch (error) {
    API.showToast(error.message || 'Failed to delete service', 'error');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

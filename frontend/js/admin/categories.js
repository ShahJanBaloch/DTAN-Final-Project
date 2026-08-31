/**
 * BalochHunar — Categories Management Logic
 */

let allCategories = [];

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const auth = await API.get('/auth/me');
    if (!auth.success) window.location.href = '/admin/login.html';
  } catch (e) {
    if (e.status === 401 || e.status === 403) window.location.href = '/admin/login.html';
    return;
  }

  await loadCategories();

  const modal = document.getElementById('category-modal');
  const openAddBtn = document.getElementById('open-add-modal-btn');
  const closeBtn = document.getElementById('close-modal-btn');
  const cancelBtn = document.getElementById('cancel-modal-btn');
  const form = document.getElementById('category-form');

  openAddBtn.addEventListener('click', () => {
    form.reset();
    document.getElementById('category-id').value = '';
    document.getElementById('modal-title').textContent = 'Add Craft Category';
    modal.classList.remove('hidden');
  });

  const closeModal = () => modal.classList.add('hidden');
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('category-id').value;
    const isEdit = Boolean(id);

    const payload = {
      name: document.getElementById('category-name').value.trim(),
      slug: document.getElementById('category-slug').value.trim() || undefined,
      description: document.getElementById('category-description').value.trim() || undefined
    };

    try {
      const res = isEdit
        ? await API.put(`/categories/${id}`, payload)
        : await API.post('/categories', payload);

      if (res.success) {
        API.showToast(isEdit ? 'Category updated successfully' : 'Category created successfully', 'success');
        closeModal();
        await loadCategories();
      }
    } catch (error) {
      API.showToast(error.message || 'Failed to save category', 'error');
    }
  });
});

async function loadCategories() {
  try {
    const res = await API.get('/categories');
    if (res.success) {
      allCategories = res.data;
      renderCategoriesTable(allCategories);
    }
  } catch (error) {
    API.showToast('Could not load categories', 'error');
  }
}

function renderCategoriesTable(categories) {
  const tbody = document.getElementById('categories-tbody');
  const countBadge = document.getElementById('category-count-badge');
  if (countBadge) countBadge.textContent = `${categories.length} Category(ies) configured`;

  if (categories.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="px-6 py-8 text-center text-gray-400 text-sm">
          No categories found.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = categories.map(c => `
    <tr class="hover:bg-gray-50/80 transition">
      <td class="px-6 py-4 font-bold text-gray-900 text-sm">
        ${escapeHtml(c.name)}
      </td>
      <td class="px-6 py-4 font-mono text-xs text-gray-500">
        ${escapeHtml(c.slug)}
      </td>
      <td class="px-6 py-4 text-xs text-gray-600 max-w-sm line-clamp-2">
        ${escapeHtml(c.description || 'No description provided')}
      </td>
      <td class="px-6 py-4">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
          ${c.product_count || 0} Products
        </span>
      </td>
      <td class="px-6 py-4 text-right space-x-2">
        <button onclick="openEditCategory(${c.id})" class="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition" title="Edit Category">
          <i class="fas fa-edit"></i>
        </button>
        <button onclick="confirmDeleteCategory(${c.id}, '${escapeHtml(c.name)}')" class="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition" title="Delete Category">
          <i class="fas fa-trash-alt"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function openEditCategory(id) {
  const cat = allCategories.find(c => c.id === id);
  if (!cat) return;

  document.getElementById('category-id').value = cat.id;
  document.getElementById('category-name').value = cat.name;
  document.getElementById('category-slug').value = cat.slug;
  document.getElementById('category-description').value = cat.description || '';

  document.getElementById('modal-title').textContent = `Edit Category: ${cat.name}`;
  document.getElementById('category-modal').classList.remove('hidden');
}

async function confirmDeleteCategory(id, name) {
  if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;

  try {
    const res = await API.delete(`/categories/${id}`);
    if (res.success) {
      API.showToast(res.message, 'success');
      await loadCategories();
    }
  } catch (error) {
    API.showToast(error.message || 'Failed to delete category', 'error');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

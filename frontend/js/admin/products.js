/**
 * BalochHunar — Products Management Logic with AI Assistant
 */

let allProducts = [];
let allCategories = [];
let allArtisans = [];

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const auth = await API.get('/auth/me');
    if (!auth.success) window.location.href = '/admin/login.html';
  } catch (e) {
    if (e.status === 401 || e.status === 403) window.location.href = '/admin/login.html';
    return;
  }

  // Load initial dropdown data & products
  await Promise.all([loadCategories(), loadArtisans()]);
  await loadProducts();

  // Search & Filter Listeners
  document.getElementById('product-search').addEventListener('input', filterProducts);
  document.getElementById('category-filter').addEventListener('change', filterProducts);

  // File Upload Image Preview Handler
  const fileInput = document.getElementById('product-file');
  const previewImg = document.getElementById('image-preview');
  const previewPlaceholder = document.getElementById('image-preview-placeholder');

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        previewImg.src = event.target.result;
        previewImg.classList.remove('hidden');
        previewPlaceholder.classList.add('hidden');
      };
      reader.readAsDataURL(file);
    }
  });

  // Modal Setup
  const modal = document.getElementById('product-modal');
  const openAddBtn = document.getElementById('open-add-modal-btn');
  const closeBtn = document.getElementById('close-modal-btn');
  const cancelBtn = document.getElementById('cancel-modal-btn');
  const form = document.getElementById('product-form');

  openAddBtn.addEventListener('click', () => {
    form.reset();
    document.getElementById('product-id').value = '';
    document.getElementById('modal-title').textContent = 'Add Handcrafted Product';
    previewImg.classList.add('hidden');
    previewPlaceholder.classList.remove('hidden');
    document.getElementById('ai-status-text').textContent = 'Ready to generate';
    modal.classList.remove('hidden');
  });

  const closeModal = () => modal.classList.add('hidden');
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

  // AI Feature 1: Product Description Generator
  const triggerAiDescBtn = document.getElementById('trigger-ai-desc-btn');
  const aiStatusText = document.getElementById('ai-status-text');

  triggerAiDescBtn.addEventListener('click', async () => {
    const name = document.getElementById('product-name').value.trim();
    if (!name) {
      API.showToast('Please enter a Product Title first to generate AI description.', 'error');
      document.getElementById('product-name').focus();
      return;
    }

    const craft = document.getElementById('ai-input-craft').value.trim();
    const material = document.getElementById('ai-input-material').value.trim();
    const color = document.getElementById('ai-input-color').value.trim();
    const characteristics = document.getElementById('ai-input-chars').value.trim();

    aiStatusText.textContent = '🤖 Generating evocative description with AI...';
    triggerAiDescBtn.disabled = true;

    try {
      const res = await API.post('/ai/product-description', {
        name,
        craft_type: craft,
        material,
        color,
        characteristics
      });

      if (res.success && res.data.description) {
        document.getElementById('product-description').value = res.data.description;
        aiStatusText.textContent = `✅ Generated via ${res.data.provider}`;
        API.showToast(`Description generated via ${res.data.provider}!`, 'success');
      }
    } catch (error) {
      aiStatusText.textContent = '❌ Generation error';
      API.showToast(error.message || 'Failed to generate AI description', 'error');
    } finally {
      triggerAiDescBtn.disabled = false;
    }
  });

  // AI Feature 2: Smart Tags & Taxonomist Suggester
  const aiSuggestTagsBtn = document.getElementById('ai-suggest-tags-btn');
  aiSuggestTagsBtn.addEventListener('click', async () => {
    const name = document.getElementById('product-name').value.trim();
    const description = document.getElementById('product-description').value.trim();
    const craft = document.getElementById('ai-input-craft').value.trim();

    if (!name && !description) {
      API.showToast('Please enter a Product Title or Description first.', 'error');
      return;
    }

    aiSuggestTagsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Suggesting...';
    aiSuggestTagsBtn.disabled = true;

    try {
      const res = await API.post('/ai/suggest-tags', { name, description, craft_type: craft });
      if (res.success && res.data.tags) {
        document.getElementById('product-tags').value = res.data.tags;
        API.showToast(`Suggested ${res.data.tagList.length} smart tags!`, 'success');
      }
    } catch (error) {
      API.showToast(error.message || 'Failed to suggest tags', 'error');
    } finally {
      aiSuggestTagsBtn.innerHTML = '<i class="fas fa-tags text-sandstone"></i> AI Suggest Tags';
      aiSuggestTagsBtn.disabled = false;
    }
  });

  // Toggle AI inputs panel
  const toggleAiDescBtn = document.getElementById('toggle-ai-desc-panel');
  const aiDescInputs = document.getElementById('ai-desc-inputs');
  toggleAiDescBtn.addEventListener('click', () => {
    aiDescInputs.classList.toggle('hidden');
  });

  // Form Submit Handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('product-id').value;
    const isEdit = Boolean(id);

    const formData = new FormData();
    formData.append('name', document.getElementById('product-name').value.trim());
    formData.append('category_id', document.getElementById('product-category').value);
    formData.append('artisan_id', document.getElementById('product-artisan').value);
    formData.append('price', document.getElementById('product-price').value);
    formData.append('tags', document.getElementById('product-tags').value.trim());
    formData.append('description', document.getElementById('product-description').value.trim());
    formData.append('image_url', document.getElementById('product-image-url').value.trim());
    formData.append('is_featured', document.getElementById('product-featured').checked);

    if (fileInput.files.length > 0) {
      formData.append('image', fileInput.files[0]);
    }

    try {
      const endpoint = isEdit ? `/products/${id}` : '/products';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await API.upload(endpoint, formData, method);

      if (res.success) {
        API.showToast(isEdit ? 'Product updated successfully' : 'Product created successfully', 'success');
        closeModal();
        await loadProducts();
      }
    } catch (error) {
      API.showToast(error.message || 'Failed to save product', 'error');
    }
  });
});

async function loadCategories() {
  try {
    const res = await API.get('/categories');
    if (res.success) {
      allCategories = res.data;
      
      const selectModal = document.getElementById('product-category');
      selectModal.innerHTML = '<option value="">Select Category</option>' + 
        allCategories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');

      const selectFilter = document.getElementById('category-filter');
      selectFilter.innerHTML = '<option value="">All Categories</option>' + 
        allCategories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
    }
  } catch (e) {
    console.error('Failed to load categories', e);
  }
}

async function loadArtisans() {
  try {
    const res = await API.get('/artisans');
    if (res.success) {
      allArtisans = res.data;
      const selectModal = document.getElementById('product-artisan');
      selectModal.innerHTML = '<option value="">Select Master Artisan</option>' + 
        allArtisans.map(a => `<option value="${a.id}">${escapeHtml(a.name)} (${escapeHtml(a.location)})</option>`).join('');
    }
  } catch (e) {
    console.error('Failed to load artisans', e);
  }
}

async function loadProducts() {
  try {
    const res = await API.get('/products');
    if (res.success) {
      allProducts = res.data;
      renderProductsTable(allProducts);
    }
  } catch (error) {
    API.showToast('Could not load products catalog', 'error');
  }
}

function filterProducts() {
  const searchTerm = document.getElementById('product-search').value.toLowerCase().trim();
  const catId = document.getElementById('category-filter').value;

  const filtered = allProducts.filter(p => {
    const matchesSearch = !searchTerm || 
      p.name.toLowerCase().includes(searchTerm) || 
      (p.tags && p.tags.toLowerCase().includes(searchTerm)) ||
      p.artisan_name.toLowerCase().includes(searchTerm);

    const matchesCat = !catId || String(p.category_id) === String(catId);

    return matchesSearch && matchesCat;
  });

  renderProductsTable(filtered);
}

function renderProductsTable(products) {
  const tbody = document.getElementById('products-tbody');
  const countBadge = document.getElementById('product-count-badge');
  if (countBadge) countBadge.textContent = `${products.length} Product(s) found`;

  if (products.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-8 text-center text-gray-400 text-sm">
          No products match the selected criteria.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = products.map(p => `
    <tr class="hover:bg-gray-50/80 transition">
      <td class="px-6 py-4">
        <div class="flex items-center gap-3">
          <img src="${p.image || 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=100'}" alt="${escapeHtml(p.name)}" class="w-12 h-12 rounded-xl object-cover border border-gray-200 shadow-sm" onerror="this.src='https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=100'">
          <div>
            <span class="font-bold text-gray-900 block text-sm">${escapeHtml(p.name)}</span>
            <span class="text-[11px] text-gray-500 line-clamp-1 max-w-xs">${escapeHtml(p.description)}</span>
          </div>
        </div>
      </td>
      <td class="px-6 py-4">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
          ${escapeHtml(p.category_name)}
        </span>
      </td>
      <td class="px-6 py-4 text-xs text-gray-700">
        <span class="font-semibold block">${escapeHtml(p.artisan_name)}</span>
        <span class="text-gray-400 text-[11px]">${escapeHtml(p.artisan_location)}</span>
      </td>
      <td class="px-6 py-4 font-bold text-gray-900 text-sm">
        ${API.formatCurrency(p.price)}
      </td>
      <td class="px-6 py-4">
        ${p.is_featured 
          ? '<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800"><i class="fas fa-star mr-1 text-amber-500"></i> Featured</span>'
          : '<span class="text-gray-400 text-xs">—</span>'}
      </td>
      <td class="px-6 py-4 text-right space-x-2">
        <button onclick="openEditProduct(${p.id})" class="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition" title="Edit Product">
          <i class="fas fa-edit"></i>
        </button>
        <button onclick="confirmDeleteProduct(${p.id}, '${escapeHtml(p.name)}')" class="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition" title="Delete Product">
          <i class="fas fa-trash-alt"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function openEditProduct(id) {
  const p = allProducts.find(prod => prod.id === id);
  if (!p) return;

  document.getElementById('product-id').value = p.id;
  document.getElementById('product-name').value = p.name;
  document.getElementById('product-category').value = p.category_id;
  document.getElementById('product-artisan').value = p.artisan_id;
  document.getElementById('product-price').value = p.price;
  document.getElementById('product-tags').value = p.tags || '';
  document.getElementById('product-description').value = p.description;
  document.getElementById('product-featured').checked = Boolean(p.is_featured);
  document.getElementById('product-image-url').value = p.image.startsWith('http') ? p.image : '';

  const previewImg = document.getElementById('image-preview');
  const previewPlaceholder = document.getElementById('image-preview-placeholder');
  previewImg.src = p.image;
  previewImg.classList.remove('hidden');
  previewPlaceholder.classList.add('hidden');

  document.getElementById('modal-title').textContent = `Edit Product: ${p.name}`;
  document.getElementById('product-modal').classList.remove('hidden');
}

async function confirmDeleteProduct(id, name) {
  if (!confirm(`Are you sure you want to delete product "${name}"?`)) return;

  try {
    const res = await API.delete(`/products/${id}`);
    if (res.success) {
      API.showToast(res.message, 'success');
      await loadProducts();
    }
  } catch (error) {
    API.showToast(error.message || 'Failed to delete product', 'error');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

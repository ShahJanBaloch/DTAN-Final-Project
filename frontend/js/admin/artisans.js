/**
 * BalochHunar — Master Artisans Management with AI Story Generator
 */

let allArtisans = [];

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Auth Guard
  try {
    const auth = await API.get('/auth/me');
    if (!auth.success) window.location.href = '/admin/login.html';
  } catch (e) {
    if (e.status === 401 || e.status === 403) window.location.href = '/admin/login.html';
    return;
  }

  // 2. Load Artisans
  await loadArtisans();

  // 3. Search Filter
  const searchInput = document.getElementById('artisan-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase().trim();
      const filtered = allArtisans.filter(a => 
        a.name.toLowerCase().includes(term) ||
        a.craft_type.toLowerCase().includes(term) ||
        a.location.toLowerCase().includes(term)
      );
      renderArtisansTable(filtered);
    });
  }

  // 4. Modal Setup
  const modal = document.getElementById('artisan-modal');
  const openAddBtn = document.getElementById('open-add-modal-btn');
  const closeBtn = document.getElementById('close-modal-btn');
  const cancelBtn = document.getElementById('cancel-modal-btn');
  const form = document.getElementById('artisan-form');

  openAddBtn.addEventListener('click', () => {
    form.reset();
    document.getElementById('artisan-id').value = '';
    document.getElementById('modal-title').textContent = 'Register Master Artisan';
    document.getElementById('ai-story-status').textContent = 'Generates "The Story Behind the Craft" for the public storefront.';
    modal.classList.remove('hidden');
  });

  const closeModal = () => modal.classList.add('hidden');
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

  // AI Feature 3: Cultural Story Generator
  const triggerAiStoryBtn = document.getElementById('trigger-ai-story-btn');
  const aiStoryStatus = document.getElementById('ai-story-status');

  triggerAiStoryBtn.addEventListener('click', async () => {
    const name = document.getElementById('artisan-name').value.trim();
    const craft = document.getElementById('artisan-craft').value.trim();

    if (!name || !craft) {
      API.showToast('Please enter Artisan Name and Craft Specialization first.', 'error');
      return;
    }

    const location = document.getElementById('artisan-location').value.trim();
    const exp = document.getElementById('artisan-experience').value;
    const bg = document.getElementById('ai-story-bg').value.trim();
    const materials = document.getElementById('ai-story-materials').value.trim();

    aiStoryStatus.textContent = '✨ Weaving cultural narrative with AI...';
    triggerAiStoryBtn.disabled = true;

    try {
      const res = await API.post('/ai/artisan-story', {
        name,
        location,
        experience_years: exp,
        craft_type: craft,
        background: bg,
        materials
      });

      if (res.success && res.data.story) {
        document.getElementById('artisan-story').value = res.data.story;
        aiStoryStatus.textContent = `✅ Story generated via ${res.data.provider}`;
        API.showToast(`Story generated via ${res.data.provider}!`, 'success');
      }
    } catch (error) {
      aiStoryStatus.textContent = '❌ Failed to generate story';
      API.showToast(error.message || 'Failed to generate AI story', 'error');
    } finally {
      triggerAiStoryBtn.disabled = false;
    }
  });

  // 5. Save Artisan Form Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('artisan-id').value;
    const isEdit = Boolean(id);

    const formData = new FormData();
    formData.append('name', document.getElementById('artisan-name').value);
    formData.append('location', document.getElementById('artisan-location').value);
    formData.append('experience_years', document.getElementById('artisan-experience').value);
    formData.append('craft_type', document.getElementById('artisan-craft').value);
    formData.append('bio', document.getElementById('artisan-bio').value);
    formData.append('story', document.getElementById('artisan-story').value);
    formData.append('image_url', document.getElementById('artisan-image-url').value);

    const fileInput = document.getElementById('artisan-file');
    if (fileInput.files.length > 0) {
      formData.append('image', fileInput.files[0]);
    }

    try {
      const endpoint = isEdit ? `/artisans/${id}` : '/artisans';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await API.upload(endpoint, formData, method);

      if (res.success) {
        API.showToast(isEdit ? 'Artisan updated successfully!' : 'Artisan registered successfully!', 'success');
        closeModal();
        await loadArtisans();
      }
    } catch (error) {
      API.showToast(error.message || 'Failed to save artisan', 'error');
    }
  });
});

async function loadArtisans() {
  try {
    const res = await API.get('/artisans');
    if (res.success) {
      allArtisans = res.data;
      renderArtisansTable(allArtisans);
    }
  } catch (error) {
    API.showToast('Could not load artisans list', 'error');
  }
}

function renderArtisansTable(artisans) {
  const tbody = document.getElementById('artisans-tbody');
  const countBadge = document.getElementById('artisan-count-badge');
  if (countBadge) countBadge.textContent = `${artisans.length} Artisan(s) registered`;

  if (artisans.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="px-6 py-8 text-center text-gray-400 text-sm">
          No artisans found.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = artisans.map(a => `
    <tr class="hover:bg-gray-50/80 transition">
      <td class="px-6 py-4">
        <div class="flex items-center gap-3">
          <img src="${a.image || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100'}" alt="${escapeHtml(a.name)}" class="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm" onerror="this.src='https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100'">
          <div>
            <span class="font-bold text-gray-900 block text-sm">${escapeHtml(a.name)}</span>
            <span class="text-[11px] text-gray-500 line-clamp-1 max-w-xs">${escapeHtml(a.bio)}</span>
          </div>
        </div>
      </td>
      <td class="px-6 py-4">
        <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-sandstone-light text-sandstone-dark border border-sandstone/30">
          ${escapeHtml(a.craft_type)}
        </span>
      </td>
      <td class="px-6 py-4 text-xs text-gray-600">
        <i class="fas fa-map-marker-alt text-terracotta mr-1"></i> ${escapeHtml(a.location)}
      </td>
      <td class="px-6 py-4 text-xs text-gray-700 font-semibold">
        ${a.experience_years} Years
      </td>
      <td class="px-6 py-4 text-right space-x-2">
        <button onclick="openEditArtisan(${a.id})" class="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition" title="Edit Artisan">
          <i class="fas fa-edit"></i>
        </button>
        <button onclick="confirmDeleteArtisan(${a.id}, '${escapeHtml(a.name)}')" class="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition" title="Delete Artisan">
          <i class="fas fa-trash-alt"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function openEditArtisan(id) {
  const artisan = allArtisans.find(a => a.id === id);
  if (!artisan) return;

  document.getElementById('artisan-id').value = artisan.id;
  document.getElementById('artisan-name').value = artisan.name;
  document.getElementById('artisan-location').value = artisan.location;
  document.getElementById('artisan-experience').value = artisan.experience_years;
  document.getElementById('artisan-craft').value = artisan.craft_type;
  document.getElementById('artisan-bio').value = artisan.bio;
  document.getElementById('artisan-story').value = artisan.story || '';
  document.getElementById('artisan-image-url').value = artisan.image && artisan.image.startsWith('http') ? artisan.image : '';

  document.getElementById('modal-title').textContent = `Edit Artisan: ${artisan.name}`;
  document.getElementById('artisan-modal').classList.remove('hidden');
}

async function confirmDeleteArtisan(id, name) {
  if (!confirm(`Are you sure you want to delete artisan "${name}"?`)) return;

  try {
    const res = await API.delete(`/artisans/${id}`);
    if (res.success) {
      API.showToast(res.message, 'success');
      await loadArtisans();
    }
  } catch (error) {
    API.showToast(error.message || 'Failed to delete artisan', 'error');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

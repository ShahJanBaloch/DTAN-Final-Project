/**
 * BalochHunar — Gallery Management Logic
 */

let allGallery = [];

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const auth = await API.get('/auth/me');
    if (!auth.success) window.location.href = 'login.html';
  } catch (e) {
    window.location.href = 'login.html';
    return;
  }

  await loadGallery();

  const modal = document.getElementById('gallery-modal');
  const openAddBtn = document.getElementById('open-add-modal-btn');
  const closeBtn = document.getElementById('close-modal-btn');
  const cancelBtn = document.getElementById('cancel-modal-btn');
  const form = document.getElementById('gallery-form');

  openAddBtn.addEventListener('click', () => {
    form.reset();
    modal.classList.remove('hidden');
  });

  const closeModal = () => modal.classList.add('hidden');
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('title', document.getElementById('gallery-title').value.trim());
    formData.append('craft_type', document.getElementById('gallery-craft').value.trim());
    formData.append('description', document.getElementById('gallery-description').value.trim());
    formData.append('image_url', document.getElementById('gallery-image-url').value.trim());

    const fileInput = document.getElementById('gallery-file');
    if (fileInput.files.length > 0) {
      formData.append('image', fileInput.files[0]);
    }

    try {
      const res = await API.upload('/gallery', formData, 'POST');
      if (res.success) {
        API.showToast('Gallery media uploaded successfully', 'success');
        closeModal();
        await loadGallery();
      }
    } catch (error) {
      API.showToast(error.message || 'Failed to upload media', 'error');
    }
  });
});

async function loadGallery() {
  try {
    const res = await API.get('/gallery');
    if (res.success) {
      allGallery = res.data;
      renderGalleryGrid(allGallery);
    }
  } catch (error) {
    API.showToast('Could not load gallery', 'error');
  }
}

function renderGalleryGrid(items) {
  const container = document.getElementById('gallery-grid');
  const countBadge = document.getElementById('gallery-count-badge');
  if (countBadge) countBadge.textContent = `${items.length} Showcase Item(s)`;

  if (items.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center text-gray-400 text-sm">
        No gallery items found. Click "Upload Media" to add your first photo.
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="bg-white rounded-2xl border border-[#E8E2D9] overflow-hidden shadow-sm hover:shadow-md transition flex flex-col group">
      <div class="relative h-48 bg-gray-100 overflow-hidden">
        <img src="${item.image}" alt="${escapeHtml(item.title)}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" onerror="this.src='https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400'">
        <span class="absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-sm">
          ${escapeHtml(item.craft_type || 'Craft')}
        </span>
      </div>
      <div class="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h4 class="font-bold text-gray-900 text-sm line-clamp-1">${escapeHtml(item.title)}</h4>
          <p class="text-xs text-gray-500 mt-1 line-clamp-2">${escapeHtml(item.description || '')}</p>
        </div>
        <div class="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span class="text-[10px] text-gray-400 font-mono">${API.formatDate(item.created_at)}</span>
          <button onclick="confirmDeleteGallery(${item.id}, '${escapeHtml(item.title)}')" class="text-xs text-red-600 hover:text-red-800 font-semibold transition" title="Delete Photo">
            <i class="fas fa-trash-alt mr-1"></i> Delete
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

async function confirmDeleteGallery(id, title) {
  if (!confirm(`Are you sure you want to remove "${title}" from the gallery?`)) return;

  try {
    const res = await API.delete(`/gallery/${id}`);
    if (res.success) {
      API.showToast(res.message, 'success');
      await loadGallery();
    }
  } catch (error) {
    API.showToast(error.message || 'Failed to delete gallery item', 'error');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

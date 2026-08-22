/**
 * BalochHunar — Public Products Catalog & Quick View Controller
 */

let allProducts = [];
let allCategories = [];
let selectedCategoryId = '';

document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([loadCategories(), loadProducts()]);

  // Search input listener
  const searchInput = document.getElementById('public-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      filterAndRenderProducts();
    });
  }

  // Modal Close Setup
  const modal = document.getElementById('quick-view-modal');
  const closeBtn = document.getElementById('close-modal-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
  }
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });
  }
});

/**
 * Fetch and render category filter pills
 */
async function loadCategories() {
  try {
    const res = await API.get('/categories');
    if (res.success) {
      allCategories = res.data;
      renderCategoryPills(allCategories);
    }
  } catch (e) {
    console.error('Failed to load categories', e);
  }
}

function renderCategoryPills(categories) {
  const container = document.getElementById('category-pills');
  if (!container) return;

  const allPills = [
    `<button class="cat-pill px-4 py-2 rounded-xl text-xs font-bold transition ${selectedCategoryId === '' ? 'bg-terracotta text-white shadow-sm' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}" onclick="selectCategory('')">All Crafts</button>`,
    ...categories.map(c => `
      <button class="cat-pill px-4 py-2 rounded-xl text-xs font-bold transition ${String(selectedCategoryId) === String(c.id) ? 'bg-terracotta text-white shadow-sm' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}" onclick="selectCategory(${c.id})">
        ${escapeHtml(c.name)}
      </button>
    `)
  ];

  container.innerHTML = allPills.join('');
}

function selectCategory(catId) {
  selectedCategoryId = catId;
  renderCategoryPills(allCategories);
  filterAndRenderProducts();
}

/**
 * Fetch products from API
 */
async function loadProducts() {
  try {
    const res = await API.get('/products');
    if (res.success) {
      allProducts = res.data;
      filterAndRenderProducts();
    }
  } catch (e) {
    const container = document.getElementById('products-catalog-grid');
    if (container) {
      container.innerHTML = `<div class="col-span-full py-12 text-center text-red-500 text-sm">Failed to connect to database catalog.</div>`;
    }
  }
}

/**
 * Filter products based on search term & selected category
 */
function filterAndRenderProducts() {
  const searchTerm = (document.getElementById('public-search')?.value || '').toLowerCase().trim();

  const filtered = allProducts.filter(p => {
    const matchesSearch = !searchTerm ||
      p.name.toLowerCase().includes(searchTerm) ||
      p.description.toLowerCase().includes(searchTerm) ||
      p.artisan_name.toLowerCase().includes(searchTerm) ||
      (p.tags && p.tags.toLowerCase().includes(searchTerm)) ||
      p.category_name.toLowerCase().includes(searchTerm);

    const matchesCategory = !selectedCategoryId || String(p.category_id) === String(selectedCategoryId);

    return matchesSearch && matchesCategory;
  });

  renderProductsGrid(filtered);
}

/**
 * Render products cards into the DOM
 */
function renderProductsGrid(products) {
  const container = document.getElementById('products-catalog-grid');
  const countBadge = document.getElementById('catalog-count-badge');
  if (countBadge) countBadge.textContent = `${products.length} Handicraft(s) Found`;

  if (!container) return;

  if (products.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-20 text-center text-gray-400">
        <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-2xl mx-auto mb-3 text-gray-400">
          <i class="fas fa-search"></i>
        </div>
        <h3 class="font-serif text-lg font-bold text-gray-800">No Handicrafts Found</h3>
        <p class="text-xs text-gray-500 mt-1">Try adjusting your search keywords or craft category filter.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = products.map(p => `
    <div class="bg-white rounded-2xl border border-[#E8E2D9] overflow-hidden shadow-sm card-hover flex flex-col justify-between group">
      <div class="relative h-64 bg-gray-100 overflow-hidden cursor-pointer" onclick="openProductQuickView(${p.id})">
        <img src="${p.image}" alt="${escapeHtml(p.name)}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" onerror="this.src='https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=600'">
        <span class="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-gray-800 backdrop-blur-sm shadow-sm">
          ${escapeHtml(p.category_name)}
        </span>
        ${p.is_featured ? '<span class="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-sm"><i class="fas fa-star mr-1"></i> Featured</span>' : ''}
      </div>

      <div class="p-6 flex-1 flex flex-col justify-between">
        <div>
          <div class="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5">
            <i class="fas fa-user-circle text-sandstone-dark"></i>
            <span class="font-medium">${escapeHtml(p.artisan_name)}</span>
            <span>&bull;</span>
            <span class="text-gray-400">${escapeHtml(p.artisan_location)}</span>
          </div>
          <h3 class="font-serif font-bold text-lg text-gray-900 line-clamp-1 hover:text-terracotta cursor-pointer transition" onclick="openProductQuickView(${p.id})">
            ${escapeHtml(p.name)}
          </h3>
          <p class="text-xs text-gray-600 mt-2 line-clamp-2 leading-relaxed">
            ${escapeHtml(p.description)}
          </p>
        </div>

        <div class="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div>
            <span class="text-[10px] text-gray-400 uppercase font-semibold block leading-none">Price</span>
            <span class="font-bold text-gray-900 text-base mt-0.5 block">${API.formatCurrency(p.price)}</span>
          </div>
          <button onclick="openProductQuickView(${p.id})" class="px-4 py-2 bg-terracotta hover:bg-terracotta-dark text-white rounded-xl text-xs font-bold shadow-sm transition">
            View Details
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

/**
 * Open Quick View Modal with Full Product Details
 */
async function openProductQuickView(id) {
  const p = allProducts.find(prod => prod.id === id);
  if (!p) return;

  document.getElementById('modal-image').src = p.image;
  document.getElementById('modal-category').textContent = p.category_name;
  document.getElementById('modal-title').textContent = p.name;
  document.getElementById('modal-price').textContent = API.formatCurrency(p.price);
  document.getElementById('modal-artisan-name').textContent = p.artisan_name;
  document.getElementById('modal-artisan-loc').textContent = p.artisan_location;
  document.getElementById('modal-artisan-img').src = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100';
  document.getElementById('modal-description').textContent = p.description;

  // Inquire Button Link
  const inquireBtn = document.getElementById('modal-inquire-btn');
  if (inquireBtn) {
    inquireBtn.href = `order.html?product_id=${encodeURIComponent(p.id)}`;
    inquireBtn.innerHTML = '<i class="fas fa-bag-shopping"></i> Order Now';
  }

  // Tags
  const tagsContainer = document.getElementById('modal-tags-container');
  if (tagsContainer) {
    if (p.tags) {
      const tagList = p.tags.split(',').map(t => t.trim()).filter(Boolean);
      tagsContainer.innerHTML = tagList.map(t => `
        <span class="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-medium">
          #${escapeHtml(t)}
        </span>
      `).join('');
    } else {
      tagsContainer.innerHTML = '';
    }
  }

  document.getElementById('quick-view-modal').classList.remove('hidden');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

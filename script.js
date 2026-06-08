/**
 * Lokalmart — Frontend utama
 */

let currentCategory = 'all';
let currentSearch = '';

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initSearch();
  initCategoryCards();
  initFilterTabs();
  initScrollEffects();
  loadStats();
  loadCategories();
  loadProducts();
});

/* ---- Navigasi Mobile ---- */
function initNavigation() {
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav-link');

  if (!navToggle) return;

  navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('open');
    navToggle.classList.toggle('active', isOpen);
    navToggle.setAttribute('aria-expanded', isOpen);
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
      navToggle.classList.remove('active');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY + 100;
    sections.forEach((section) => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');
      if (scrollY >= top && scrollY < top + height) {
        navLinks.forEach((link) => {
          const href = link.getAttribute('href');
          link.classList.toggle('active', href === `#${id}`);
        });
      }
    });
  });
}

/* ---- Pencarian ---- */
function initSearch() {
  const searchToggle = document.getElementById('searchToggle');
  const searchBar = document.getElementById('searchBar');
  const searchForm = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');

  if (!searchToggle) return;

  searchToggle.addEventListener('click', () => {
    const isHidden = searchBar.hasAttribute('hidden');
    if (isHidden) {
      searchBar.removeAttribute('hidden');
      searchInput.focus();
    } else {
      searchBar.setAttribute('hidden', '');
    }
  });

  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    currentSearch = searchInput.value.trim();
    searchBar.setAttribute('hidden', '');

    document.getElementById('produk').scrollIntoView({ behavior: 'smooth' });
    setActiveFilter('all');
    loadProducts();

    if (currentSearch) {
      showToast(`Menampilkan hasil untuk "${currentSearch}"`);
    }
  });
}

/* ---- Filter Tab Produk ---- */
function initFilterTabs() {
  const tabs = document.querySelectorAll('.filter-tab');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      setActiveFilter(tab.dataset.category);
      loadProducts();
    });
  });
}

function setActiveFilter(category) {
  currentCategory = category;
  document.querySelectorAll('.filter-tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.category === category);
  });
}

/* ---- Kartu Kategori ---- */
function initCategoryCards() {
  document.querySelectorAll('.category-card[data-category]').forEach((card) => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const category = card.dataset.category;
      setActiveFilter(category);
      loadProducts();
      document.getElementById('produk').scrollIntoView({ behavior: 'smooth' });
    });
  });
}

/* ---- Load Data dari API ---- */
async function loadStats() {
  try {
    const stats = await LokalmartAPI.getStats();
    document.querySelector('[data-stat="totalUmkm"]').textContent = stats.totalUmkm + '+';
    document.querySelector('[data-stat="totalProvinces"]').textContent = stats.totalProvinces;
    document.querySelector('[data-stat="totalProducts"]').textContent = stats.totalProducts + '+';
  } catch {
    document.querySelector('[data-stat="totalUmkm"]').textContent = '500+';
    document.querySelector('[data-stat="totalProvinces"]').textContent = '20+';
    document.querySelector('[data-stat="totalProducts"]').textContent = '18+';
  }
}

async function loadCategories() {
  try {
    const categories = await LokalmartAPI.getCategories();
    categories.forEach((cat) => {
      const el = document.querySelector(`[data-cat-count="${cat.id}"]`);
      if (el) el.textContent = `${cat.count} produk`;
    });
  } catch {
    /* fallback silent */
  }
}

async function loadProducts() {
  const grid = document.getElementById('productGrid');
  const empty = document.getElementById('emptyState');

  grid.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Memuat produk...</p></div>';
  empty.hidden = true;

  try {
    const params = {};
    if (currentCategory !== 'all') params.category = currentCategory;
    if (currentSearch) params.search = currentSearch;

    const products = await LokalmartAPI.getProducts(params);

    if (!products.length) {
      grid.innerHTML = '';
      empty.hidden = false;
      return;
    }

    grid.innerHTML = products.map(createProductCard).join('');
    bindAddToCartButtons();
    if (typeof refreshScrollAnimate === 'function') refreshScrollAnimate(grid);
  } catch {
    grid.innerHTML = `
      <div class="error-state">
        <p>⚠️ Gagal memuat produk. Pastikan server backend berjalan.</p>
        <p class="error-hint">Jalankan: <code>cd backend && npm install && npm start</code></p>
      </div>
    `;
  }
}

function createProductCard(product) {
  const visual = renderProductImage(product, { size: 'thumb' });

  return `
    <article class="product-card" data-animate="scale">
      <a href="produk.html?id=${product.id}" class="product-card-link-wrap">
        <div class="product-card-visual">
          ${visual}
          ${product.featured ? '<span class="product-featured-badge">Unggulan</span>' : ''}
        </div>
        <div class="product-card-body">
          <span class="product-card-category">${product.categoryLabel}</span>
          <h3>${product.name}</h3>
          <p class="product-card-umkm">${product.umkm}</p>
          <p class="product-card-origin">📍 ${product.origin}</p>
          <p class="product-card-price">${formatRupiah(product.price)}<span>/${product.unit}</span></p>
        </div>
      </a>
      <div class="product-card-actions">
        <a href="produk.html?id=${product.id}" class="btn btn-outline btn-sm">Detail</a>
        <button class="btn btn-primary btn-sm" data-add-cart="${product.id}">+ Keranjang</button>
      </div>
    </article>
  `;
}

function bindAddToCartButtons() {
  document.querySelectorAll('[data-add-cart]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.disabled = true;
      try {
        await addToCart(btn.dataset.addCart);
      } finally {
        btn.disabled = false;
      }
    });
  });
}

/* ---- Efek Scroll Header ---- */
function initScrollEffects() {
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  });
}

/* ---- Toast ---- */
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove('show'), 3000);
}

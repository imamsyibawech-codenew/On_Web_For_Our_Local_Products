document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');

  if (!productId) {
    showError('Produk tidak ditemukan.');
    return;
  }

  try {
    const { product, related } = await LokalmartAPI.getProduct(productId);
    renderProduct(product);
    renderRelated(related);
    document.title = `${product.name} — Lokalmart`;
  } catch (err) {
    showError(err.message);
  }
});

function renderProduct(product) {
  const container = document.getElementById('productDetail');
  const visual = renderProductImage(product, { size: 'full', className: 'product-detail-img', priority: true });

  container.innerHTML = `
    <nav class="breadcrumb">
      <a href="index.html">Beranda</a><span>/</span>
      <a href="index.html#produk">Produk</a><span>/</span>
      <span>${product.name}</span>
    </nav>

    <article class="product-detail" data-animate>
      <div class="product-detail-visual">
        ${visual}
        <span class="product-badge">${product.categoryLabel}</span>
      </div>

      <div class="product-detail-info">
        <h1>${product.name}</h1>
        <p class="product-detail-umkm">oleh <strong>${product.umkm}</strong></p>
        <p class="product-detail-price">${formatRupiah(product.price)} <span>/ ${product.unit}</span></p>

        <div class="product-meta">
          <div class="meta-item">
            <span class="meta-label">Asal</span>
            <span class="meta-value">📍 ${product.origin}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Provinsi</span>
            <span class="meta-value">${product.province}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Stok</span>
            <span class="meta-value">${product.stock} ${product.unit}</span>
          </div>
        </div>

        <p class="product-detail-desc">${product.description}</p>

        <div class="product-highlights">
          <h3>Keunggulan Produk</h3>
          <ul>
            ${product.highlights.map((h) => `<li><span class="feature-icon">✓</span>${h}</li>`).join('')}
          </ul>
        </div>

        <div class="add-to-cart-row">
          <label for="qtyInput">Jumlah:</label>
          <div class="qty-control">
            <button type="button" class="qty-btn" id="qtyDecrease">−</button>
            <input type="number" id="qtyInput" value="1" min="1" max="${product.stock}">
            <button type="button" class="qty-btn" id="qtyIncrease">+</button>
          </div>
        </div>

        <div class="product-detail-actions">
          <button class="btn btn-primary btn-lg" id="addToCartBtn">Tambah ke Keranjang</button>
          <a href="keranjang.html" class="btn btn-outline btn-lg">Lihat Keranjang</a>
        </div>
      </div>
    </article>
  `;

  const qtyInput = document.getElementById('qtyInput');
  document.getElementById('qtyDecrease').addEventListener('click', () => {
    qtyInput.value = Math.max(1, parseInt(qtyInput.value, 10) - 1);
  });
  document.getElementById('qtyIncrease').addEventListener('click', () => {
    qtyInput.value = Math.min(product.stock, parseInt(qtyInput.value, 10) + 1);
  });

  if (typeof refreshScrollAnimate === 'function') {
    refreshScrollAnimate(container);
  }

  document.getElementById('addToCartBtn').addEventListener('click', async () => {
    const qty = parseInt(qtyInput.value, 10) || 1;
    const btn = document.getElementById('addToCartBtn');
    btn.disabled = true;
    try {
      await addToCart(product.id, qty);
    } finally {
      btn.disabled = false;
    }
  });
}

function renderRelated(products) {
  if (!products.length) return;

  const section = document.getElementById('relatedSection');
  const grid = document.getElementById('relatedGrid');

  section.hidden = false;
  grid.innerHTML = products.map(createProductCard).join('');
}

function createProductCard(product) {
  const visual = renderProductImage(product, { size: 'thumb' });

  return `
    <a href="produk.html?id=${product.id}" class="product-card">
      <div class="product-card-visual">${visual}</div>
      <div class="product-card-body">
        <span class="product-card-category">${product.categoryLabel}</span>
        <h3>${product.name}</h3>
        <p class="product-card-origin">📍 ${product.origin}</p>
        <p class="product-card-price">${formatRupiah(product.price)}</p>
      </div>
    </a>
  `;
}

function showError(message) {
  document.getElementById('productDetail').innerHTML = `
    <div class="error-state">
      <p>😔 ${message}</p>
      <a href="index.html#produk" class="btn btn-primary">Kembali ke Katalog</a>
    </div>
  `;
}

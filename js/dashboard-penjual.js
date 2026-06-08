let editingProductId = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireAuth()) return;

  const seller = Auth.getSeller();
  document.getElementById('sellerGreeting').textContent = seller?.namaUsaha || 'Penjual';
  document.getElementById('dashboardSubtitle').textContent =
    `Selamat datang, ${seller?.namaPemilik || 'Penjual'}! Kelola produk ${seller?.namaUsaha || ''}`;

  if (seller?.kategoriProduk) {
    document.getElementById('prodCategory').value = seller.kategoriProduk;
    document.getElementById('prodProvince').value = seller.provinsi || '';
  }

  document.getElementById('logoutBtn').addEventListener('click', () => {
    Auth.clearSession();
    window.location.href = 'login-penjual.html';
  });

  document.getElementById('addProductBtn').addEventListener('click', () => openProductForm());
  document.getElementById('cancelProductBtn').addEventListener('click', closeProductForm);

  document.getElementById('prodImage').addEventListener('change', previewImage);

  document.getElementById('productForm').addEventListener('submit', saveProduct);

  await loadSellerProducts();
});

function openProductForm(product = null) {
  editingProductId = product?.id || null;
  const panel = document.getElementById('productFormPanel');
  const form = document.getElementById('productForm');

  document.getElementById('formPanelTitle').textContent =
    product ? 'Edit Produk' : 'Tambah Produk Baru';
  document.getElementById('saveProductBtn').textContent = product ? 'Perbarui Produk' : 'Simpan Produk';
  document.getElementById('productFormErrors').hidden = true;

  if (product) {
    document.getElementById('editProductId').value = product.id;
    document.getElementById('prodName').value = product.name;
    document.getElementById('prodCategory').value = product.category;
    document.getElementById('prodPrice').value = product.price;
    document.getElementById('prodUnit').value = product.unit;
    document.getElementById('prodOrigin').value = product.origin;
    document.getElementById('prodProvince').value = product.province;
    document.getElementById('prodStock').value = product.stock;
    document.getElementById('prodDescription').value = product.description;
    document.getElementById('prodHighlights').value = (product.highlights || []).join(', ');
    document.getElementById('prodFeatured').checked = product.featured;
    document.getElementById('imagePreview').innerHTML = product.image
      ? `<img src="${product.image}" alt="Preview" class="preview-img">`
      : `<img src="/assets/products/placeholder.svg" alt="Belum ada foto" class="preview-img">`;
  } else {
    form.reset();
    document.getElementById('editProductId').value = '';
    document.getElementById('imagePreview').innerHTML = '';
    const seller = Auth.getSeller();
    if (seller?.kategoriProduk) document.getElementById('prodCategory').value = seller.kategoriProduk;
    if (seller?.provinsi) document.getElementById('prodProvince').value = seller.provinsi;
  }

  panel.hidden = false;
  panel.scrollIntoView({ behavior: 'smooth' });
}

function closeProductForm() {
  document.getElementById('productFormPanel').hidden = true;
  editingProductId = null;
  document.getElementById('productForm').reset();
  document.getElementById('imagePreview').innerHTML = '';
}

function previewImage(e) {
  const file = e.target.files[0];
  const preview = document.getElementById('imagePreview');
  if (!file) {
    preview.innerHTML = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = (ev) => {
    preview.innerHTML = `<img src="${ev.target.result}" alt="Preview" class="preview-img">`;
  };
  reader.readAsDataURL(file);
}

async function saveProduct(e) {
  e.preventDefault();
  const btn = document.getElementById('saveProductBtn');
  const errorsEl = document.getElementById('productFormErrors');
  errorsEl.hidden = true;
  btn.disabled = true;

  const formData = new FormData();
  formData.append('name', document.getElementById('prodName').value);
  formData.append('category', document.getElementById('prodCategory').value);
  formData.append('price', document.getElementById('prodPrice').value);
  formData.append('unit', document.getElementById('prodUnit').value);
  formData.append('origin', document.getElementById('prodOrigin').value);
  formData.append('province', document.getElementById('prodProvince').value);
  formData.append('stock', document.getElementById('prodStock').value);
  formData.append('description', document.getElementById('prodDescription').value);
  formData.append('highlights', document.getElementById('prodHighlights').value);
  formData.append('featured', document.getElementById('prodFeatured').checked);

  const imageFile = document.getElementById('prodImage').files[0];
  if (imageFile) formData.append('image', imageFile);

  try {
    if (editingProductId) {
      await LokalmartAPI.updateProduct(editingProductId, formData);
      showToast('Produk berhasil diperbarui');
    } else {
      await LokalmartAPI.createProduct(formData);
      showToast('Produk berhasil ditambahkan');
    }
    closeProductForm();
    await loadSellerProducts();
  } catch (err) {
    errorsEl.innerHTML = `<ul><li>${err.message}</li></ul>`;
    errorsEl.hidden = false;
  } finally {
    btn.disabled = false;
  }
}

async function loadSellerProducts() {
  const list = document.getElementById('sellerProductList');

  try {
    const products = await LokalmartAPI.getSellerProducts();
    document.getElementById('myProductCount').textContent = products.length;

    if (!products.length) {
      list.innerHTML = `
        <div class="empty-state">
          <p>Belum ada produk. Klik "Tambah Produk" untuk memulai.</p>
        </div>`;
      return;
    }

    list.innerHTML = products
      .map(
        (p) => `
      <div class="seller-product-item">
        <div class="seller-product-thumb">
          ${p.image ? `<img src="${p.image}" alt="${p.name}">` : `<img src="/assets/products/placeholder.svg" alt="${p.name}">`}
        </div>
        <div class="seller-product-info">
          <h3>${p.name}</h3>
          <p>${p.categoryLabel} · ${formatRupiah(p.price)}/${p.unit}</p>
          <p class="text-muted">Stok: ${p.stock} · 📍 ${p.origin}</p>
        </div>
        <div class="seller-product-actions">
          <a href="produk.html?id=${p.id}" class="btn btn-outline btn-sm" target="_blank">Lihat</a>
          <button class="btn btn-outline btn-sm" onclick="editProduct('${p.id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteProduct('${p.id}')">Hapus</button>
        </div>
      </div>`
      )
      .join('');

    window._sellerProducts = products;
  } catch (err) {
    list.innerHTML = `<div class="error-state"><p>${err.message}</p></div>`;
  }
}

window.editProduct = function (id) {
  const product = window._sellerProducts?.find((p) => p.id === id);
  if (product) openProductForm(product);
};

window.deleteProduct = async function (id) {
  if (!confirm('Yakin ingin menghapus produk ini?')) return;
  try {
    await LokalmartAPI.deleteProduct(id);
    showToast('Produk dihapus');
    await loadSellerProducts();
  } catch (err) {
    showToast(err.message);
  }
};

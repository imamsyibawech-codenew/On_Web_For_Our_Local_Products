document.addEventListener('DOMContentLoaded', () => {
  loadCart();

  document.getElementById('checkoutForm').addEventListener('submit', handleCheckout);
});

async function loadCart() {
  const panel = document.getElementById('cartItemsPanel');
  const summary = document.getElementById('cartSummary');

  try {
    const cart = await LokalmartAPI.getCart();

    if (!cart.items?.length) {
      panel.innerHTML = `
        <div class="empty-state cart-empty">
          <p>🛒 Keranjang Anda masih kosong</p>
          <a href="index.html#produk" class="btn btn-primary">Jelajahi Produk</a>
        </div>`;
      summary.hidden = true;
      return;
    }

    panel.innerHTML = cart.items.map((item) => renderCartItem(item)).join('');
    summary.hidden = false;
    document.getElementById('summaryCount').textContent = cart.itemCount;
    document.getElementById('summaryTotal').textContent = formatRupiah(cart.total);

    bindCartEvents();
  } catch (err) {
    panel.innerHTML = `<div class="error-state"><p>${err.message}</p></div>`;
  }
}

function renderCartItem(item) {
  const visual = renderProductImage(
    { name: item.name, imageThumb: item.imageThumb || item.image, image: item.image },
    { size: 'thumb', className: 'cart-item-img' }
  );

  return `
    <div class="cart-item" data-id="${item.productId}">
      <div class="cart-item-thumb">${visual}</div>
      <div class="cart-item-info">
        <h3>${item.name}</h3>
        <p class="text-muted">${item.umkm}</p>
        <p class="cart-item-price">${formatRupiah(item.price)} <span>/${item.unit}</span></p>
      </div>
      <div class="cart-item-qty">
        <button class="qty-btn" data-action="decrease" data-id="${item.productId}">−</button>
        <span class="qty-value">${item.quantity}</span>
        <button class="qty-btn" data-action="increase" data-id="${item.productId}">+</button>
      </div>
      <div class="cart-item-subtotal">
        <strong>${formatRupiah(item.subtotal)}</strong>
        <button class="cart-remove" data-id="${item.productId}">Hapus</button>
      </div>
    </div>`;
}

function bindCartEvents() {
  document.querySelectorAll('.qty-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      const qtyEl = btn.parentElement.querySelector('.qty-value');
      let qty = parseInt(qtyEl.textContent, 10);

      qty = action === 'increase' ? qty + 1 : qty - 1;
      if (qty < 1) return;

      try {
        await LokalmartAPI.updateCartItem(id, qty);
        await loadCart();
        await refreshCartBadge();
      } catch (err) {
        showToast(err.message);
      }
    });
  });

  document.querySelectorAll('.cart-remove').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await LokalmartAPI.removeFromCart(btn.dataset.id);
        await loadCart();
        await refreshCartBadge();
        showToast('Item dihapus dari keranjang');
      } catch (err) {
        showToast(err.message);
      }
    });
  });
}

async function handleCheckout(e) {
  e.preventDefault();
  const btn = document.getElementById('checkoutBtn');
  const errorsEl = document.getElementById('checkoutErrors');
  errorsEl.hidden = true;
  btn.disabled = true;
  btn.textContent = 'Memproses...';

  try {
    const result = await LokalmartAPI.checkout({
      nama: document.getElementById('checkoutNama').value,
      email: document.getElementById('checkoutEmail').value,
      telepon: document.getElementById('checkoutTelepon').value,
      alamat: document.getElementById('checkoutAlamat').value,
      catatan: document.getElementById('checkoutCatatan').value,
    });

    document.querySelector('.cart-layout').hidden = true;
    document.getElementById('checkoutSuccess').hidden = false;
    document.getElementById('checkoutSuccessMsg').textContent = result.message;
    document.getElementById('orderIdDisplay').textContent = `ID Pesanan: ${result.order.id}`;
    await refreshCartBadge();
  } catch (err) {
    errorsEl.innerHTML = `<ul><li>${err.message}</li></ul>`;
    errorsEl.hidden = false;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Buat Pesanan';
  }
}

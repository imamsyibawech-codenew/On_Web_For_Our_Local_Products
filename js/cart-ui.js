async function refreshCartBadge() {
  const badge = document.getElementById('cartCount');
  if (!badge) return;

  try {
    const cart = await LokalmartAPI.getCart();
    const count = cart.itemCount || 0;
    badge.textContent = count;
    badge.hidden = count === 0;
  } catch {
    badge.hidden = true;
  }
}

async function addToCart(productId, quantity = 1) {
  try {
    const result = await LokalmartAPI.addToCart(productId, quantity);
    await refreshCartBadge();
    showToast(result.message || 'Ditambahkan ke keranjang');
    return result;
  } catch (err) {
    showToast(err.message);
    throw err;
  }
}

function updateSellerNav() {
  const btn = document.getElementById('sellerNavBtn');
  if (!btn || typeof Auth === 'undefined') return;

  if (Auth.isLoggedIn()) {
    const seller = Auth.getSeller();
    btn.href = 'dashboard-penjual.html';
    btn.textContent = seller?.namaUsaha ? 'Dashboard' : 'Dashboard';
    btn.classList.remove('btn-outline');
    btn.classList.add('btn-primary');
  } else {
    btn.href = 'login-penjual.html';
    btn.textContent = 'Masuk Penjual';
    btn.classList.add('btn-outline');
    btn.classList.remove('btn-primary');
  }
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove('show'), 3000);
}

document.addEventListener('DOMContentLoaded', () => {
  refreshCartBadge();
  updateSellerNav();
});

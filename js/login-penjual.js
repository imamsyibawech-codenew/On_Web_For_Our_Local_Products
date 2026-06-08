document.addEventListener('DOMContentLoaded', () => {
  if (Auth.isLoggedIn()) {
    window.location.href = 'dashboard-penjual.html';
    return;
  }

  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const tabs = document.querySelectorAll('.auth-tab');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.toggle('active', t === tab));
      const isLogin = tab.dataset.tab === 'login';
      loginForm.hidden = !isLogin;
      registerForm.hidden = isLogin;
    });
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('loginBtn');
    const errorsEl = document.getElementById('loginErrors');
    errorsEl.hidden = true;
    btn.disabled = true;
    btn.textContent = 'Memproses...';

    try {
      const result = await LokalmartAPI.login(
        document.getElementById('loginEmail').value,
        document.getElementById('loginPassword').value
      );
      Auth.setSession(result.token, result.seller);
      window.location.href = 'dashboard-penjual.html';
    } catch (err) {
      errorsEl.innerHTML = `<ul><li>${err.message}</li></ul>`;
      errorsEl.hidden = false;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Masuk';
    }
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('registerBtn');
    const errorsEl = document.getElementById('registerErrors');
    errorsEl.hidden = true;
    btn.disabled = true;
    btn.textContent = 'Memproses...';

    try {
      const result = await LokalmartAPI.registerSeller({
        email: document.getElementById('regEmail').value,
        password: document.getElementById('regPassword').value,
        namaUsaha: document.getElementById('regNamaUsaha').value,
        namaPemilik: document.getElementById('regNamaPemilik').value,
        telepon: document.getElementById('regTelepon').value,
        kategoriProduk: document.getElementById('regKategori').value,
        provinsi: document.getElementById('regProvinsi').value,
        kota: document.getElementById('regKota').value,
      });
      Auth.setSession(result.token, result.seller);
      window.location.href = 'dashboard-penjual.html';
    } catch (err) {
      errorsEl.innerHTML = `<ul><li>${err.message}</li></ul>`;
      errorsEl.hidden = false;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Buat Akun Penjual';
    }
  });
});

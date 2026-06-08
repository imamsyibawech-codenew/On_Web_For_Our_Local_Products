document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('umkmForm');
  const deskripsi = document.getElementById('deskripsi');
  const hint = document.getElementById('deskripsiHint');
  const errorsEl = document.getElementById('formErrors');
  const successEl = document.getElementById('formSuccess');
  const submitBtn = document.getElementById('submitBtn');

  deskripsi.addEventListener('input', () => {
    const len = deskripsi.value.trim().length;
    hint.textContent = `${len} / 20 karakter minimum`;
    hint.classList.toggle('valid', len >= 20);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorsEl.hidden = true;
    errorsEl.innerHTML = '';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Mengirim...';

    const payload = {
      namaUsaha: form.namaUsaha.value,
      namaPemilik: form.namaPemilik.value,
      email: form.email.value,
      telepon: form.telepon.value,
      kategoriProduk: form.kategoriProduk.value,
      provinsi: form.provinsi.value,
      kota: form.kota.value,
      alamat: form.alamat.value,
      deskripsi: form.deskripsi.value,
      website: form.website.value,
    };

    try {
      const result = await LokalmartAPI.registerUmkm(payload);
      form.hidden = true;
      successEl.hidden = false;
      document.getElementById('successMessage').textContent = result.message;
    } catch (err) {
      const errors = err.message.split(', ');
      errorsEl.innerHTML = `<ul>${errors.map((e) => `<li>${e}</li>`).join('')}</ul>`;
      errorsEl.hidden = false;
      showToast('Periksa kembali formulir Anda.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Kirim Pendaftaran';
    }
  });
});

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

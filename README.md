# Lokalmart: Satu Website untuk Semua Produk Lokal

Proyek ini merupakan inisiasi pengembangan platform digital inovatif bernama **Lokalmart**. Proyek tahap awal ini berfokus pada penyiapan lingkungan pengembangan (*development environment*) modern terintegrasi AI, manajemen repositori, dan dokumentasi sistem awal.

**Visi Proyek**

> "Sebagai jembatan digital modern dalam mengenalkan dan memasarkan produk lokal yang berkualitas."

---

1. Alat yang Diinstal (Tools Installed)

Untuk mendukung ekosistem pengembangan yang cepat dan berbasis kecerdasan buatan, perangkat lunak dan ekstensi berikut telah dikonfigurasi:

- **Cursor IDE**: Editor kode berbasis AI (*fork* dari VS Code) yang digunakan sebagai lingkungan utama pembuatan kode platform Lokamarket.
- **Git**: Sistem pengontrol versi (*version control system*) lokal untuk melacak setiap perubahan kode.
- **GitHub**: Platform berbasis cloud untuk menyimpan, mengelola, dan mempublikasikan repositori proyek Lokalmart secara publik.
- **Claude Code Add-on (Ekstensi)**: Agen AI dari Anthropic di dalam Cursor yang direncanakan untuk otomatisasi penulisan kode komponen *front-end* dan *back-end*.
- **Codex Add-on (Ekstensi)**: Ekstensi pendukung di dalam Cursor untuk membantu kecepatan navigasi dan rekomendasi sintaks kode.

---

1. Langkah-Langkah yang Selesai (Steps Completed)

Proses inisiasi proyek Lokamarket diselesaikan melalui tahapan terstruktur berikut:

1. **Instalasi Editor Utama**: Mengunduh dan menginstal Cursor IDE versi desktop terbaru untuk Windows.
2. **Pemasangan Ekstensi AI**: Membuka Marketplace Ekstensi di Cursor `Ctrl + Shift + X`), mencari, lalu menginstal *add-on* **Claude Code** dan **Codex**.
3. **Inisialisasi Repositori**: Membuat repositori publik baru di GitHub dengan nama `On_Web_For_Our_Local_Products`.
4. **Sinkronisasi Lokal ke Cloud**: Melakukan *cloning* repositori kosong tersebut ke direktori lokal laptop, lalu membukanya sebagai *workspace* utama di dalam Cursor IDE.
5. **Penyusunan Dokumentasi Awal**: Membuat file `README.md` ini untuk memetakan arsitektur alat, visi proyek, serta catatan teknis.
6. **Pemberian Versi (Version Control)**: Melakukan manajemen Git dasar dengan perintah:
  ```bash

    git add [README.md](http://README.md)

    git commit -m "feat: Website lokalmarket menggunakan cursor composer"

    git push origin main

  ```

---

1. Masalah yang Dihadapi & Solusinya (Issues & Solutions)

Dalam proses penyiapan *environment*, terdapat beberapa kendala teknis yang berhasil diidentifikasi dan ditangani secara profesional:

Masalah 1: Kebijakan Paywall Anthropic pada Ekstensi Claude Code

- **Deskripsi Masalah**: Saat melakukan proses login manual menggunakan *Authorization Code* via akun [Claude.ai](http://Claude.ai) reguler, sistem menolak dan menampilkan pesan: *"Claude Max or Pro is required to connect to Claude Code"*. Fitur ini terkunci di balik akun berbayar.
- **Solusi & Mitigasi**: 
  1. **Pengalihan Berbasis Efisiensi Biaya**: Menunda aktivasi penuh agen Claude Code via web subscription untuk menghindari pembengkakan biaya di tahap awal (*bootstrap*).
  2. **Solusi Alternatif Terintegrasi**: Mengoptimalkan fitur **Cursor Composer (Model internal)** bawaan Cursor IDE yang memiliki kapabilitas serupa untuk menyusun struktur kode HTML/CSS awal website Lokamarket tanpa memicu *paywall* eksternal.
  3. **Rencana Jangka Panjang**: Mencoba jalur integrasi menggunakan *Anthropic Console API Key* (menggunakan *free credits* $5 jika tersedia untuk akun developer baru) guna mengaktifkan fungsionalitas Claude Code secara hemat di masa *deployment*.

Masalah 2: Kegagalan Otentikasi Otomatis Browser (*Timeout*)

- **Deskripsi Masalah**: Ketika menekan tombol login pada ekstensi, Cursor gagal membuka browser web secara otomatis untuk memberikan izin akses (*OAuth*).
- **Solusi**: Menggunakan metode otentikasi manual. Menyalin (*copy*) URL unik yang disediakan oleh Cursor, menempelkannya (*paste*) secara mandiri ke bilah alamat Google Chrome, melakukan proses otorisasi di web, lalu menyalin kembali *Authorization Code* yang dihasilkan ke dalam Cursor IDE.

Masalah 3: Struktur Navigasi Produk Lokal yang Kompleks

- **Deskripsi Masalah**: Menyelaraskan visi "Satu website untuk semua produk lokal" membutuhkan struktur database dan folder yang rapi agar kategori produk (misal: kerajinan, kuliner, fashion) tidak tumpang tindih.
- **Solusi**: Memanfaatkan AI bawaan Cursor untuk membuat rancangan awal struktur folder proyek yang modular (*Component-Based Architecture*), memisahkan aset tiap kategori produk lokal agar performa website tetap ringan dan berkualitas saat diakses pembeli.

---

---

# Implementasi Halaman Website Lokalmart

Platform digital untuk mengenalkan dan memasarkan produk lokal berkualitas dari UMKM Indonesia.

## Fitur

- Katalog produk (kerajinan, makanan, pertanian, perikanan)
- Detail produk dengan foto atau emoji
- Keranjang belanja & checkout
- Autentikasi penjual (login/register)
- Dashboard penjual — CRUD produk + upload foto
- Form pendaftaran UMKM
- REST API backend (Express.js)

## Struktur Proyek

```
├── index.html              # Beranda + katalog
├── produk.html             # Detail produk
├── keranjang.html          # Keranjang & checkout
├── login-penjual.html      # Login/register penjual
├── dashboard-penjual.html  # Kelola produk penjual
├── daftar-umkm.html        # Pendaftaran UMKM
├── js/                     # Frontend modules
└── backend/
    ├── server.js
    └── data/               # JSON database
```

## Menjalankan

```bash
cd backend
npm install
npm start
```

Buka **[http://localhost:3000](http://localhost:3000)**

### Akun Demo Penjual


| Email                                         | Password |
| --------------------------------------------- | -------- |
| [demo@lokalmart.id](mailto:demo@lokalmart.id) | demo123  |


## API Endpoints


| Method | Endpoint                   | Deskripsi                      |
| ------ | -------------------------- | ------------------------------ |
| GET    | `/api/products`            | Daftar produk                  |
| GET    | `/api/products/:id`        | Detail produk                  |
| POST   | `/api/auth/login`          | Login penjual                  |
| POST   | `/api/auth/register`       | Register penjual               |
| GET    | `/api/auth/me`             | Profil penjual (Bearer token)  |
| GET    | `/api/seller/products`     | Produk milik penjual           |
| POST   | `/api/seller/products`     | Tambah produk + upload foto    |
| PUT    | `/api/seller/products/:id` | Edit produk                    |
| DELETE | `/api/seller/products/:id` | Hapus produk                   |
| GET    | `/api/cart`                | Keranjang (header `X-Cart-Id`) |
| POST   | `/api/cart/items`          | Tambah ke keranjang            |
| PUT    | `/api/cart/items/:id`      | Update jumlah                  |
| DELETE | `/api/cart/items/:id`      | Hapus item                     |
| POST   | `/api/checkout`            | Buat pesanan                   |
| POST   | `/api/umkm/register`       | Daftar UMKM                    |


## Alur Penggunaan

1. **Pembeli** — jelajahi produk → tambah keranjang → checkout
2. **Penjual** — daftar/login → dashboard → tambah produk + upload foto
3. **UMKM baru** — isi form di halaman Daftar UMKM


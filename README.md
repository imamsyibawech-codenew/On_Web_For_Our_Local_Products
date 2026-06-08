# Lokalmart

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

Buka **http://localhost:3000**

### Akun Demo Penjual

| Email | Password |
|-------|----------|
| demo@lokalmart.id | demo123 |

## API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/products` | Daftar produk |
| GET | `/api/products/:id` | Detail produk |
| POST | `/api/auth/login` | Login penjual |
| POST | `/api/auth/register` | Register penjual |
| GET | `/api/auth/me` | Profil penjual (Bearer token) |
| GET | `/api/seller/products` | Produk milik penjual |
| POST | `/api/seller/products` | Tambah produk + upload foto |
| PUT | `/api/seller/products/:id` | Edit produk |
| DELETE | `/api/seller/products/:id` | Hapus produk |
| GET | `/api/cart` | Keranjang (header `X-Cart-Id`) |
| POST | `/api/cart/items` | Tambah ke keranjang |
| PUT | `/api/cart/items/:id` | Update jumlah |
| DELETE | `/api/cart/items/:id` | Hapus item |
| POST | `/api/checkout` | Buat pesanan |
| POST | `/api/umkm/register` | Daftar UMKM |

## Alur Penggunaan

1. **Pembeli** — jelajahi produk → tambah keranjang → checkout
2. **Penjual** — daftar/login → dashboard → tambah produk + upload foto
3. **UMKM baru** — isi form di halaman Daftar UMKM

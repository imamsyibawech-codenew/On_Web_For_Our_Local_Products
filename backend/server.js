const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const AUTH_SECRET = process.env.AUTH_SECRET || 'lokalmart-dev-secret';

const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const UMKM_FILE = path.join(DATA_DIR, 'umkm.json');
const SELLERS_FILE = path.join(DATA_DIR, 'sellers.json');
const CARTS_FILE = path.join(DATA_DIR, 'carts.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const PUBLIC_DIR = path.join(__dirname, '..');

const CATEGORIES = [
  { id: 'kerajinan', label: 'Kerajinan Khas', icon: '🎨' },
  { id: 'makanan', label: 'Makanan Khas', icon: '🍽️' },
  { id: 'pertanian', label: 'Hasil Pertanian', icon: '🌾' },
  { id: 'perikanan', label: 'Perikanan', icon: '🐟' },
];

const CATEGORY_LABELS = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label]));

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `prod-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|jpg|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Hanya file gambar (JPG, PNG, WebP) yang diizinkan'));
  },
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(PUBLIC_DIR));

function readJson(filePath, fallback = []) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function hashPassword(password, salt) {
  salt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, hash) {
  const { hash: check } = hashPassword(password, salt);
  return check === hash;
}

function createToken(sellerId) {
  const payload = { sellerId, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifyToken(token) {
  try {
    const [data, sig] = token.split('.');
    const expected = crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('base64url');
    if (sig !== expected) return null;
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function sanitizeSeller(seller) {
  const { passwordSalt, passwordHash, ...safe } = seller;
  return safe;
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Login diperlukan' });
  }
  const payload = verifyToken(auth.slice(7));
  if (!payload) {
    return res.status(401).json({ error: 'Sesi tidak valid atau kedaluwarsa' });
  }
  req.sellerId = payload.sellerId;
  next();
}

function getCartId(req) {
  return req.headers['x-cart-id'];
}

function getCart(cartId) {
  const carts = readJson(CARTS_FILE, {});
  if (!carts[cartId]) {
    carts[cartId] = { items: [], updatedAt: new Date().toISOString() };
    writeJson(CARTS_FILE, carts);
  }
  return { carts, cart: carts[cartId] };
}

function saveCart(cartId, cart) {
  const carts = readJson(CARTS_FILE, {});
  cart.updatedAt = new Date().toISOString();
  carts[cartId] = cart;
  writeJson(CARTS_FILE, carts);
}

function enrichCartItems(cart) {
  const products = readJson(PRODUCTS_FILE);
  const items = cart.items
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return null;
      return {
        productId: product.id,
        name: product.name,
        price: product.price,
        unit: product.unit,
        imageThumb: product.imageThumb || product.image || null,
        image: product.image || product.imageThumb || null,
        umkm: product.umkm,
        stock: product.stock,
        quantity: item.quantity,
        subtotal: product.price * item.quantity,
      };
    })
    .filter(Boolean);

  const total = items.reduce((sum, i) => sum + i.subtotal, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  return { items, total, itemCount };
}

function ensureDemoSeller() {
  const sellers = readJson(SELLERS_FILE);
  if (sellers.length > 0) return;

  const { salt, hash } = hashPassword('demo123');
  sellers.push({
    id: 'seller-demo',
    email: 'demo@lokalmart.id',
    passwordSalt: salt,
    passwordHash: hash,
    namaUsaha: 'Demo UMKM Lokalmart',
    namaPemilik: 'Admin Demo',
    telepon: '081234567890',
    kategoriProduk: 'makanan',
    provinsi: 'DKI Jakarta',
    kota: 'Jakarta',
    alamat: 'Jl. Produk Lokal No. 1, Jakarta',
    createdAt: new Date().toISOString(),
  });
  writeJson(SELLERS_FILE, sellers);
  console.log('Akun demo penjual: demo@lokalmart.id / demo123');
}

/* ---- Health & Stats ---- */

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Lokalmart API berjalan' });
});

app.get('/api/stats', (_req, res) => {
  const products = readJson(PRODUCTS_FILE);
  const umkm = readJson(UMKM_FILE);
  const sellers = readJson(SELLERS_FILE);
  const provinces = new Set(products.map((p) => p.province));

  res.json({
    totalProducts: products.length,
    totalUmkm: umkm.length + sellers.length + 500,
    totalProvinces: provinces.size,
    categories: CATEGORIES.length,
  });
});

app.get('/api/categories', (_req, res) => {
  const products = readJson(PRODUCTS_FILE);
  const counts = CATEGORIES.map((cat) => ({
    ...cat,
    count: products.filter((p) => p.category === cat.id).length,
  }));
  res.json(counts);
});

/* ---- Products ---- */

app.get('/api/products', (req, res) => {
  const products = readJson(PRODUCTS_FILE);
  const { category, search, featured, sellerId } = req.query;

  let result = [...products];

  if (category && category !== 'all') {
    result = result.filter((p) => p.category === category);
  }
  if (featured === 'true') {
    result = result.filter((p) => p.featured);
  }
  if (sellerId) {
    result = result.filter((p) => p.sellerId === sellerId);
  }
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.origin.toLowerCase().includes(q) ||
        p.umkm.toLowerCase().includes(q) ||
        p.categoryLabel.toLowerCase().includes(q)
    );
  }

  res.json(result);
});

app.get('/api/products/:id', (req, res) => {
  const products = readJson(PRODUCTS_FILE);
  const product = products.find((p) => p.id === req.params.id);

  if (!product) {
    return res.status(404).json({ error: 'Produk tidak ditemukan' });
  }

  const related = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 3);

  res.json({ product, related });
});

/* ---- Auth Penjual ---- */

app.post('/api/auth/register', (req, res) => {
  const { email, password, namaUsaha, namaPemilik, telepon, kategoriProduk, provinsi, kota, alamat } =
    req.body;

  const errors = [];
  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Email tidak valid');
  if (!password || password.length < 6) errors.push('Password minimal 6 karakter');
  if (!namaUsaha?.trim()) errors.push('Nama usaha wajib diisi');
  if (!namaPemilik?.trim()) errors.push('Nama pemilik wajib diisi');
  if (!telepon?.trim()) errors.push('Telepon wajib diisi');
  if (!kategoriProduk) errors.push('Kategori wajib dipilih');
  if (!provinsi?.trim()) errors.push('Provinsi wajib diisi');
  if (!kota?.trim()) errors.push('Kota wajib diisi');

  if (errors.length) {
    return res.status(400).json({ success: false, errors });
  }

  const sellers = readJson(SELLERS_FILE);
  if (sellers.find((s) => s.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ success: false, errors: ['Email sudah terdaftar'] });
  }

  const { salt, hash } = hashPassword(password);
  const seller = {
    id: `seller-${Date.now()}`,
    email: email.trim().toLowerCase(),
    passwordSalt: salt,
    passwordHash: hash,
    namaUsaha: namaUsaha.trim(),
    namaPemilik: namaPemilik.trim(),
    telepon: telepon.trim(),
    kategoriProduk,
    provinsi: provinsi.trim(),
    kota: kota.trim(),
    alamat: alamat?.trim() || '',
    createdAt: new Date().toISOString(),
  };

  sellers.push(seller);
  writeJson(SELLERS_FILE, sellers);

  const token = createToken(seller.id);
  res.status(201).json({
    success: true,
    message: 'Akun penjual berhasil dibuat',
    token,
    seller: sanitizeSeller(seller),
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, errors: ['Email dan password wajib diisi'] });
  }

  const sellers = readJson(SELLERS_FILE);
  const seller = sellers.find((s) => s.email.toLowerCase() === email.toLowerCase());

  if (!seller || !verifyPassword(password, seller.passwordSalt, seller.passwordHash)) {
    return res.status(401).json({ success: false, errors: ['Email atau password salah'] });
  }

  const token = createToken(seller.id);
  res.json({
    success: true,
    message: 'Login berhasil',
    token,
    seller: sanitizeSeller(seller),
  });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const sellers = readJson(SELLERS_FILE);
  const seller = sellers.find((s) => s.id === req.sellerId);

  if (!seller) {
    return res.status(404).json({ error: 'Penjual tidak ditemukan' });
  }

  res.json({ seller: sanitizeSeller(seller) });
});

/* ---- Seller Products (CRUD + Upload) ---- */

app.get('/api/seller/products', authMiddleware, (req, res) => {
  const products = readJson(PRODUCTS_FILE).filter((p) => p.sellerId === req.sellerId);
  res.json(products);
});

app.post('/api/seller/products', authMiddleware, upload.single('image'), (req, res) => {
  const sellers = readJson(SELLERS_FILE);
  const seller = sellers.find((s) => s.id === req.sellerId);
  if (!seller) return res.status(404).json({ error: 'Penjual tidak ditemukan' });

  const {
    name,
    category,
    price,
    unit,
    origin,
    province,
    description,
    highlights,
    stock,
    featured,
  } = req.body;

  const errors = [];
  if (!name?.trim()) errors.push('Nama produk wajib diisi');
  if (!category || !CATEGORY_LABELS[category]) errors.push('Kategori tidak valid');
  if (!price || isNaN(Number(price)) || Number(price) <= 0) errors.push('Harga tidak valid');
  if (!unit?.trim()) errors.push('Satuan wajib diisi');
  if (!origin?.trim()) errors.push('Asal daerah wajib diisi');
  if (!province?.trim()) errors.push('Provinsi wajib diisi');
  if (!description?.trim()) errors.push('Deskripsi wajib diisi');
  if (!stock || isNaN(Number(stock)) || Number(stock) < 0) errors.push('Stok tidak valid');

  if (errors.length) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({ success: false, errors });
  }

  const highlightList = highlights
    ? highlights.split(',').map((h) => h.trim()).filter(Boolean)
    : [];

  const products = readJson(PRODUCTS_FILE);
  const prefix = { kerajinan: 'krj', makanan: 'mkn', pertanian: 'prt', perikanan: 'prk' }[category];
  const count = products.filter((p) => p.category === category).length + 1;

  const product = {
    id: `${prefix}-${String(count).padStart(3, '0')}-${Date.now().toString(36)}`,
    name: name.trim(),
    category,
    categoryLabel: CATEGORY_LABELS[category],
    price: Number(price),
    unit: unit.trim(),
    origin: origin.trim(),
    province: province.trim(),
    umkm: seller.namaUsaha,
    sellerId: seller.id,
    image: req.file ? `/uploads/${req.file.filename}` : '/assets/products/placeholder.svg',
    imageThumb: req.file ? `/uploads/${req.file.filename}` : '/assets/products/placeholder.svg',
    description: description.trim(),
    highlights: highlightList.length ? highlightList : ['Produk lokal berkualitas'],
    stock: Number(stock),
    featured: featured === 'true' || featured === true,
    createdAt: new Date().toISOString(),
  };

  products.push(product);
  writeJson(PRODUCTS_FILE, products);

  res.status(201).json({ success: true, message: 'Produk berhasil ditambahkan', product });
});

app.put('/api/seller/products/:id', authMiddleware, upload.single('image'), (req, res) => {
  const products = readJson(PRODUCTS_FILE);
  const index = products.findIndex((p) => p.id === req.params.id && p.sellerId === req.sellerId);

  if (index === -1) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(404).json({ error: 'Produk tidak ditemukan' });
  }

  const existing = products[index];
  const body = req.body;

  if (body.name) existing.name = body.name.trim();
  if (body.category && CATEGORY_LABELS[body.category]) {
    existing.category = body.category;
    existing.categoryLabel = CATEGORY_LABELS[body.category];
  }
  if (body.price) existing.price = Number(body.price);
  if (body.unit) existing.unit = body.unit.trim();
  if (body.origin) existing.origin = body.origin.trim();
  if (body.province) existing.province = body.province.trim();
  if (body.description) existing.description = body.description.trim();
  if (body.stock !== undefined) existing.stock = Number(body.stock);
  if (body.highlights) {
    existing.highlights = body.highlights.split(',').map((h) => h.trim()).filter(Boolean);
  }
  if (body.featured !== undefined) {
    existing.featured = body.featured === 'true' || body.featured === true;
  }

  if (req.file) {
    if (existing.image) {
      const oldPath = path.join(UPLOADS_DIR, path.basename(existing.image));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    existing.image = `/uploads/${req.file.filename}`;
    existing.imageThumb = `/uploads/${req.file.filename}`;
  }

  products[index] = existing;
  writeJson(PRODUCTS_FILE, products);

  res.json({ success: true, message: 'Produk berhasil diperbarui', product: existing });
});

app.delete('/api/seller/products/:id', authMiddleware, (req, res) => {
  const products = readJson(PRODUCTS_FILE);
  const index = products.findIndex((p) => p.id === req.params.id && p.sellerId === req.sellerId);

  if (index === -1) {
    return res.status(404).json({ error: 'Produk tidak ditemukan' });
  }

  const [removed] = products.splice(index, 1);
  if (removed.image) {
    const imgPath = path.join(UPLOADS_DIR, path.basename(removed.image));
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }

  writeJson(PRODUCTS_FILE, products);
  res.json({ success: true, message: 'Produk berhasil dihapus' });
});

/* ---- Cart ---- */

app.get('/api/cart', (req, res) => {
  const cartId = getCartId(req);
  if (!cartId) {
    return res.json({ items: [], total: 0, itemCount: 0 });
  }

  const { cart } = getCart(cartId);
  res.json(enrichCartItems(cart));
});

app.post('/api/cart/items', (req, res) => {
  const cartId = getCartId(req);
  if (!cartId) {
    return res.status(400).json({ error: 'Cart ID diperlukan' });
  }

  const { productId, quantity = 1 } = req.body;
  const products = readJson(PRODUCTS_FILE);
  const product = products.find((p) => p.id === productId);

  if (!product) {
    return res.status(404).json({ error: 'Produk tidak ditemukan' });
  }

  const qty = Math.max(1, parseInt(quantity, 10) || 1);
  const { cart } = getCart(cartId);

  const existing = cart.items.find((i) => i.productId === productId);
  const newQty = (existing?.quantity || 0) + qty;

  if (newQty > product.stock) {
    return res.status(400).json({ error: `Stok tersedia hanya ${product.stock} ${product.unit}` });
  }

  if (existing) {
    existing.quantity = newQty;
  } else {
    cart.items.push({ productId, quantity: qty });
  }

  saveCart(cartId, cart);
  const enriched = enrichCartItems(cart);

  res.json({
    success: true,
    message: `${product.name} ditambahkan ke keranjang`,
    ...enriched,
  });
});

app.put('/api/cart/items/:productId', (req, res) => {
  const cartId = getCartId(req);
  if (!cartId) return res.status(400).json({ error: 'Cart ID diperlukan' });

  const { quantity } = req.body;
  const qty = parseInt(quantity, 10);

  if (!qty || qty < 1) {
    return res.status(400).json({ error: 'Jumlah tidak valid' });
  }

  const products = readJson(PRODUCTS_FILE);
  const product = products.find((p) => p.id === req.params.productId);

  if (product && qty > product.stock) {
    return res.status(400).json({ error: `Stok tersedia hanya ${product.stock} ${product.unit}` });
  }

  const { cart } = getCart(cartId);
  const item = cart.items.find((i) => i.productId === req.params.productId);

  if (!item) {
    return res.status(404).json({ error: 'Item tidak ada di keranjang' });
  }

  item.quantity = qty;
  saveCart(cartId, cart);

  res.json({ success: true, ...enrichCartItems(cart) });
});

app.delete('/api/cart/items/:productId', (req, res) => {
  const cartId = getCartId(req);
  if (!cartId) return res.status(400).json({ error: 'Cart ID diperlukan' });

  const { cart } = getCart(cartId);
  cart.items = cart.items.filter((i) => i.productId !== req.params.productId);
  saveCart(cartId, cart);

  res.json({ success: true, message: 'Item dihapus dari keranjang', ...enrichCartItems(cart) });
});

app.delete('/api/cart', (req, res) => {
  const cartId = getCartId(req);
  if (!cartId) return res.json({ success: true, items: [], total: 0, itemCount: 0 });

  saveCart(cartId, { items: [], updatedAt: new Date().toISOString() });
  res.json({ success: true, message: 'Keranjang dikosongkan', items: [], total: 0, itemCount: 0 });
});

/* ---- Checkout ---- */

app.post('/api/checkout', (req, res) => {
  const cartId = getCartId(req);
  if (!cartId) {
    return res.status(400).json({ error: 'Keranjang kosong' });
  }

  const { nama, email, telepon, alamat, catatan } = req.body;
  const errors = [];

  if (!nama?.trim()) errors.push('Nama penerima wajib diisi');
  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Email tidak valid');
  if (!telepon?.trim()) errors.push('Telepon wajib diisi');
  if (!alamat?.trim()) errors.push('Alamat pengiriman wajib diisi');

  const { cart } = getCart(cartId);
  const enriched = enrichCartItems(cart);

  if (!enriched.items.length) {
    return res.status(400).json({ error: 'Keranjang kosong' });
  }

  const products = readJson(PRODUCTS_FILE);
  for (const item of enriched.items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product || product.stock < item.quantity) {
      errors.push(`Stok ${item.name} tidak mencukupi`);
    }
  }

  if (errors.length) {
    return res.status(400).json({ success: false, errors });
  }

  for (const item of enriched.items) {
    const product = products.find((p) => p.id === item.productId);
    product.stock -= item.quantity;
  }
  writeJson(PRODUCTS_FILE, products);

  const orders = readJson(ORDERS_FILE);
  const order = {
    id: `order-${Date.now()}`,
    cartId,
    customer: { nama: nama.trim(), email: email.trim(), telepon: telepon.trim(), alamat: alamat.trim() },
    catatan: catatan?.trim() || '',
    items: enriched.items,
    total: enriched.total,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  orders.push(order);
  writeJson(ORDERS_FILE, orders);
  saveCart(cartId, { items: [], updatedAt: new Date().toISOString() });

  res.status(201).json({
    success: true,
    message: 'Pesanan berhasil dibuat! Kami akan menghubungi Anda untuk konfirmasi.',
    order: { id: order.id, total: order.total, itemCount: enriched.itemCount },
  });
});

/* ---- UMKM Register (existing) ---- */

app.post('/api/umkm/register', (req, res) => {
  const {
    namaUsaha, namaPemilik, email, telepon, kategoriProduk,
    provinsi, kota, alamat, deskripsi, website,
  } = req.body;

  const errors = [];
  if (!namaUsaha?.trim()) errors.push('Nama usaha wajib diisi');
  if (!namaPemilik?.trim()) errors.push('Nama pemilik wajib diisi');
  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Email tidak valid');
  if (!telepon?.trim() || telepon.replace(/\D/g, '').length < 10) errors.push('Nomor telepon tidak valid');
  if (!kategoriProduk) errors.push('Kategori produk wajib dipilih');
  if (!provinsi?.trim()) errors.push('Provinsi wajib diisi');
  if (!kota?.trim()) errors.push('Kota wajib diisi');
  if (!alamat?.trim()) errors.push('Alamat wajib diisi');
  if (!deskripsi?.trim() || deskripsi.trim().length < 20) errors.push('Deskripsi usaha minimal 20 karakter');

  if (errors.length) {
    return res.status(400).json({ success: false, errors });
  }

  const registrations = readJson(UMKM_FILE);
  if (registrations.find((r) => r.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ success: false, errors: ['Email sudah terdaftar'] });
  }

  const registration = {
    id: `umkm-${Date.now()}`,
    namaUsaha: namaUsaha.trim(),
    namaPemilik: namaPemilik.trim(),
    email: email.trim().toLowerCase(),
    telepon: telepon.trim(),
    kategoriProduk,
    provinsi: provinsi.trim(),
    kota: kota.trim(),
    alamat: alamat.trim(),
    deskripsi: deskripsi.trim(),
    website: website?.trim() || '',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  registrations.push(registration);
  writeJson(UMKM_FILE, registrations);

  res.status(201).json({
    success: true,
    message: 'Pendaftaran UMKM berhasil! Tim kami akan menghubungi Anda dalam 1–3 hari kerja.',
    data: { id: registration.id, namaUsaha: registration.namaUsaha },
  });
});

/* ---- Error handler for multer ---- */

app.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'Ukuran file maksimal 5MB' : err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

ensureDemoSeller();

app.listen(PORT, () => {
  console.log(`Lokalmart server berjalan di http://localhost:${PORT}`);
});

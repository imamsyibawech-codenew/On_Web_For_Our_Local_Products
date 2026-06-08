const API_BASE = window.location.origin;

function getApiHeaders(isJson = true) {
  const headers = {};
  if (isJson) headers['Content-Type'] = 'application/json';

  const token = typeof Auth !== 'undefined' ? Auth.getToken() : null;
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const cartId = typeof Auth !== 'undefined' ? Auth.getCartId() : null;
  if (cartId) headers['X-Cart-Id'] = cartId;

  return headers;
}

async function apiRequest(endpoint, options = {}) {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: { ...getApiHeaders(!isFormData), ...options.headers },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.errors?.join(', ') || data.error || 'Terjadi kesalahan';
    throw new Error(message);
  }

  return data;
}

const LokalmartAPI = {
  getCategories: () => apiRequest('/api/categories'),
  getProducts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/products${query ? `?${query}` : ''}`);
  },
  getProduct: (id) => apiRequest(`/api/products/${id}`),
  registerUmkm: (payload) =>
    apiRequest('/api/umkm/register', { method: 'POST', body: JSON.stringify(payload) }),
  getStats: () => apiRequest('/api/stats'),

  login: (email, password) =>
    apiRequest('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  registerSeller: (payload) =>
    apiRequest('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => apiRequest('/api/auth/me'),

  getSellerProducts: () => apiRequest('/api/seller/products'),
  createProduct: (formData) =>
    apiRequest('/api/seller/products', { method: 'POST', body: formData }),
  updateProduct: (id, formData) =>
    apiRequest(`/api/seller/products/${id}`, { method: 'PUT', body: formData }),
  deleteProduct: (id) =>
    apiRequest(`/api/seller/products/${id}`, { method: 'DELETE' }),

  getCart: () => apiRequest('/api/cart'),
  addToCart: (productId, quantity = 1) =>
    apiRequest('/api/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    }),
  updateCartItem: (productId, quantity) =>
    apiRequest(`/api/cart/items/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    }),
  removeFromCart: (productId) =>
    apiRequest(`/api/cart/items/${productId}`, { method: 'DELETE' }),
  clearCart: () => apiRequest('/api/cart', { method: 'DELETE' }),
  checkout: (payload) =>
    apiRequest('/api/checkout', { method: 'POST', body: JSON.stringify(payload) }),
};

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}


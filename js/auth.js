const Auth = {
  TOKEN_KEY: 'lokalmart_token',
  SELLER_KEY: 'lokalmart_seller',
  CART_KEY: 'lokalmart_cart_id',

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  setSession(token, seller) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.SELLER_KEY, JSON.stringify(seller));
  },

  getSeller() {
    try {
      return JSON.parse(localStorage.getItem(this.SELLER_KEY));
    } catch {
      return null;
    }
  },

  clearSession() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.SELLER_KEY);
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  getCartId() {
    let id = localStorage.getItem(this.CART_KEY);
    if (!id) {
      id = `cart-${crypto.randomUUID()}`;
      localStorage.setItem(this.CART_KEY, id);
    }
    return id;
  },

  requireAuth(redirectTo = 'login-penjual.html') {
    if (!this.isLoggedIn()) {
      window.location.href = redirectTo;
      return false;
    }
    return true;
  },
};

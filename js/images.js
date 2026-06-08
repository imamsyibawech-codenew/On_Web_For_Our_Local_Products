const PRODUCT_PLACEHOLDER = '/assets/products/placeholder.svg';

function getProductImageSrc(product, size = 'thumb') {
  if (size === 'thumb' && product.imageThumb) return product.imageThumb;
  if (size === 'full' && product.image) return product.image;
  return product.image || product.imageThumb || PRODUCT_PLACEHOLDER;
}

function renderProductImage(product, options = {}) {
  const { size = 'thumb', className = '', priority = false } = options;
  const thumb = product.imageThumb || product.image;
  const full = product.image || product.imageThumb;
  const isThumb = size === 'thumb';
  const src = isThumb ? thumb : full;
  const dims = isThumb ? { w: 320, h: 240 } : { w: 640, h: 480 };

  if (!src) {
    return `<img src="${PRODUCT_PLACEHOLDER}" alt="${product.name}" class="product-img ${className}" width="${dims.w}" height="${dims.h}" loading="lazy" decoding="async">`;
  }

  const loading = priority ? 'eager' : 'lazy';
  const priorityAttr = priority ? ' fetchpriority="high"' : '';
  const srcset =
    product.imageThumb && product.image && product.imageThumb !== product.image
      ? ` srcset="${product.imageThumb} 320w, ${product.image} 640w" sizes="${isThumb ? '(max-width:768px) 45vw, 280px' : '(max-width:768px) 100vw, 640px'}"`
      : '';

  return `<img src="${src || PRODUCT_PLACEHOLDER}" alt="${product.name}" class="product-img ${className}" width="${dims.w}" height="${dims.h}"${srcset} loading="${loading}" decoding="async"${priorityAttr} onerror="this.onerror=null;this.src='${PRODUCT_PLACEHOLDER}'">`;
}

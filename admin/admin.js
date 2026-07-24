(function () {
  'use strict';

  let productsData = [];
  let nextId = 1;
  let activeCategoryFilter = '';

  const authGate = document.getElementById('auth-gate');
  const app = document.getElementById('app');
  const usernameLabel = document.getElementById('username-label');
  const container = document.getElementById('products-container');
  const categoryFilterSelect = document.getElementById('category-filter');
  const saveBtn = document.getElementById('save-btn');
  const saveStatus = document.getElementById('save-status');
  const banner = document.getElementById('banner');
  const productTemplate = document.getElementById('product-template');

  function showBanner(message, type) {
    banner.textContent = message;
    banner.className = 'banner ' + type;
    banner.classList.remove('hidden');
  }

  function hideBanner() {
    banner.classList.add('hidden');
  }

  function imageSrc(image) {
    if (!image) return 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
    if (/^https?:\/\//i.test(image) || image.startsWith('data:')) return image;
    return '/images/' + image;
  }

  // --- Auth gate ---
  async function checkSession() {
    try {
      const res = await fetch('/api/session');
      const data = await res.json();
      if (!data.authenticated) {
        window.location.href = '/admin/login.html';
        return;
      }
      usernameLabel.textContent = data.username || '';
      authGate.classList.add('hidden');
      app.classList.remove('hidden');
      await loadProducts();
    } catch (err) {
      authGate.textContent = 'Could not check your session. Please refresh.';
    }
  }

  // --- Load product data ---
  async function loadProducts() {
    try {
      const res = await fetch('/api/products', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load products (status ' + res.status + ')');
      productsData = await res.json();
      computeNextId();
      renderAll();
    } catch (err) {
      showBanner('Could not load the products: ' + err.message, 'error');
    }
  }

  function computeNextId() {
    let max = 0;
    productsData.forEach((p) => {
      if (typeof p.id === 'number' && p.id > max) max = p.id;
    });
    nextId = max + 1;
  }

  // --- Rendering ---
  function renderAll() {
    container.innerHTML = '';
    productsData.forEach((product) => {
      if (activeCategoryFilter && product.category !== activeCategoryFilter) return;
      container.appendChild(renderProduct(product));
    });
  }

  categoryFilterSelect.addEventListener('change', () => {
    activeCategoryFilter = categoryFilterSelect.value;
    renderAll();
  });

  function renderProduct(product) {
    const node = productTemplate.content.firstElementChild.cloneNode(true);
    const img = node.querySelector('.product-photo-img');
    const photoInput = node.querySelector('.photo-input');
    const nameInput = node.querySelector('.p-name-input');
    const categoryInput = node.querySelector('.p-category-input');
    const priceInput = node.querySelector('.p-price-input');
    const stockInput = node.querySelector('.p-stock-input');
    const discountInput = node.querySelector('.p-discount-input');
    const discountRow = node.querySelector('.discount-row');
    const oldPriceInput = node.querySelector('.p-oldprice-input');
    const deleteBtn = node.querySelector('.delete-product-btn');

    img.src = imageSrc(product.image);
    img.alt = product.name || '';
    nameInput.value = product.name || '';
    categoryInput.value = product.category || 'women';
    priceInput.value = product.price != null ? product.price : '';
    stockInput.value = product.stock != null ? product.stock : 0;
    discountInput.checked = product.oldPrice != null;
    oldPriceInput.value = product.oldPrice != null ? product.oldPrice : '';
    discountRow.classList.toggle('hidden', !discountInput.checked);

    nameInput.addEventListener('input', () => { product.name = nameInput.value; });
    categoryInput.addEventListener('change', () => { product.category = categoryInput.value; });
    priceInput.addEventListener('input', () => {
      const v = parseFloat(priceInput.value);
      product.price = Number.isNaN(v) ? 0 : v;
    });
    stockInput.addEventListener('input', () => {
      const v = parseInt(stockInput.value, 10);
      product.stock = Number.isNaN(v) ? 0 : v;
    });
    discountInput.addEventListener('change', () => {
      discountRow.classList.toggle('hidden', !discountInput.checked);
      if (discountInput.checked) {
        if (product.oldPrice == null) product.oldPrice = product.price || 0;
        oldPriceInput.value = product.oldPrice;
      } else {
        delete product.oldPrice;
        oldPriceInput.value = '';
      }
    });
    oldPriceInput.addEventListener('input', () => {
      const v = parseFloat(oldPriceInput.value);
      product.oldPrice = Number.isNaN(v) ? 0 : v;
    });

    photoInput.addEventListener('change', async () => {
      const file = photoInput.files[0];
      if (!file) return;
      try {
        img.style.opacity = '0.5';
        const dataUrl = await compressImage(file, 1000, 0.85);
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, dataUrl }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        product.image = data.url;
        img.src = data.url;
      } catch (err) {
        showBanner('Photo upload failed: ' + err.message, 'error');
      } finally {
        img.style.opacity = '1';
      }
    });

    deleteBtn.addEventListener('click', () => {
      if (!confirm(`Delete "${product.name || 'this product'}"?`)) return;
      const idx = productsData.indexOf(product);
      if (idx !== -1) productsData.splice(idx, 1);
      node.remove();
    });

    return node;
  }

  // Resizes/re-encodes an image client-side so uploads stay well under
  // Vercel's request body limit, before sending it to /api/upload.
  function compressImage(file, maxDimension, quality) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Could not read the file'));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error('Could not read the image'));
        image.onload = () => {
          let { width, height } = image;
          if (width > maxDimension || height > maxDimension) {
            if (width >= height) {
              height = Math.round((height / width) * maxDimension);
              width = maxDimension;
            } else {
              width = Math.round((width / height) * maxDimension);
              height = maxDimension;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(image, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // --- Add product ---
  document.getElementById('add-product-btn').addEventListener('click', () => {
    const newProduct = {
      id: nextId++,
      name: '',
      category: activeCategoryFilter || 'women',
      price: 0,
      oldPrice: null,
      stock: 0,
      image: '',
    };
    productsData.push(newProduct);
    renderAll();
    const cards = container.querySelectorAll('.product-card');
    const lastCard = cards[cards.length - 1];
    if (lastCard) {
      lastCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const nameField = lastCard.querySelector('.p-name-input');
      if (nameField) nameField.focus();
    }
  });

  // --- Save ---
  saveBtn.addEventListener('click', async () => {
    hideBanner();
    const validationError = validate();
    if (validationError) {
      showBanner(validationError, 'error');
      return;
    }
    saveBtn.disabled = true;
    saveStatus.textContent = 'Saving…';
    saveStatus.className = 'save-status';
    try {
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productsData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      saveStatus.textContent = 'Saved ✓';
      saveStatus.className = 'save-status ok';
      showBanner('Products saved. Changes are live on the site now.', 'success');
    } catch (err) {
      saveStatus.textContent = 'Save failed';
      saveStatus.className = 'save-status err';
      showBanner('Could not save: ' + err.message, 'error');
    } finally {
      saveBtn.disabled = false;
      setTimeout(() => { saveStatus.textContent = ''; }, 4000);
    }
  });

  function validate() {
    const seenIds = new Set();
    for (const product of productsData) {
      if (!product.name || !product.name.trim()) {
        return 'Every product needs a name.';
      }
      if (!product.image) {
        return `"${product.name}" needs a photo.`;
      }
      if (product.price == null || Number.isNaN(product.price) || product.price < 0) {
        return `"${product.name}" needs a valid price.`;
      }
      if (product.stock == null || Number.isNaN(product.stock) || product.stock < 0) {
        return `"${product.name}" needs a valid stock quantity.`;
      }
      if (product.oldPrice != null) {
        if (Number.isNaN(product.oldPrice) || product.oldPrice < 0) {
          return `"${product.name}" needs a valid old price for its discount.`;
        }
        if (product.oldPrice <= product.price) {
          return `"${product.name}"'s old price must be higher than its current price for the discount to show.`;
        }
      }
      if (seenIds.has(product.id)) {
        return `Duplicate product id detected for "${product.name}". Please refresh and try again.`;
      }
      seenIds.add(product.id);
    }
    return null;
  }

  // --- Logout ---
  document.getElementById('logout-btn').addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/admin/login.html';
  });

  checkSession();
})();

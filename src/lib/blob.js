import { put, head, del } from '@vercel/blob';

// We use a single JSON file in Vercel Blob as the "products table".
// Vercel Blob has no query engine, so every read/write loads or replaces
// this whole file. Fine for a boutique catalog (tens to low thousands of
// products); if the catalog grows large or needs concurrent writers,
// migrate to Vercel Postgres/KV instead.
const PRODUCTS_PATH = 'data/products.json';

async function readProductsBlob() {
  try {
    const meta = await head(PRODUCTS_PATH);
    const res = await fetch(meta.url, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    // No file yet on first run
    if (err?.status === 404 || err?.message?.includes('not_found')) return [];
    console.error('readProductsBlob error', err);
    return [];
  }
}

async function writeProductsBlob(products) {
  await put(PRODUCTS_PATH, JSON.stringify(products, null, 2), {
    access: 'public',
    contentType: 'application/json',
    allowOverwrite: true,
  });
}

export async function getProducts() {
  const products = await readProductsBlob();
  return products.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
}

export async function getProductById(id) {
  const products = await readProductsBlob();
  return products.find((p) => p.id === id) || null;
}

export async function getProductBySlug(slug) {
  const products = await readProductsBlob();
  return products.find((p) => p.slug === slug) || null;
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export async function createProduct(data) {
  const products = await readProductsBlob();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const product = {
    id,
    name: data.name?.trim() || 'Untitled product',
    slug: data.slug?.trim() || slugify(data.name || id),
    description: data.description || '',
    price: Number(data.price) || 0,
    salePrice: data.salePrice !== undefined && data.salePrice !== '' ? Number(data.salePrice) : null,
    category: data.category || '',
    sizes: Array.isArray(data.sizes) ? data.sizes : [],
    colors: Array.isArray(data.colors) ? data.colors : [],
    stock: Number.isFinite(Number(data.stock)) ? Number(data.stock) : 0,
    images: Array.isArray(data.images) ? data.images : [],
    featured: Boolean(data.featured),
    createdAt: now,
    updatedAt: now,
  };
  products.push(product);
  await writeProductsBlob(products);
  return product;
}

export async function updateProduct(id, data) {
  const products = await readProductsBlob();
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  const existing = products[idx];
  const updated = {
    ...existing,
    name: data.name?.trim() ?? existing.name,
    slug: data.slug?.trim() || existing.slug,
    description: data.description ?? existing.description,
    price: data.price !== undefined ? Number(data.price) : existing.price,
    salePrice:
      data.salePrice !== undefined
        ? data.salePrice === '' || data.salePrice === null
          ? null
          : Number(data.salePrice)
        : existing.salePrice,
    category: data.category ?? existing.category,
    sizes: Array.isArray(data.sizes) ? data.sizes : existing.sizes,
    colors: Array.isArray(data.colors) ? data.colors : existing.colors,
    stock: data.stock !== undefined ? Number(data.stock) : existing.stock,
    images: Array.isArray(data.images) ? data.images : existing.images,
    featured: data.featured !== undefined ? Boolean(data.featured) : existing.featured,
    updatedAt: new Date().toISOString(),
  };
  products[idx] = updated;
  await writeProductsBlob(products);
  return updated;
}

export async function deleteProduct(id) {
  const products = await readProductsBlob();
  const target = products.find((p) => p.id === id);
  const remaining = products.filter((p) => p.id !== id);
  await writeProductsBlob(remaining);
  // best-effort cleanup of this product's images
  if (target?.images?.length) {
    await Promise.allSettled(target.images.map((url) => del(url).catch(() => {})));
  }
  return true;
}

export async function uploadProductImage(file) {
  const ext = file.name?.split('.').pop() || 'jpg';
  const pathname = `products/${crypto.randomUUID()}.${ext}`;
  const blob = await put(pathname, file, {
    access: 'public',
    contentType: file.type || 'image/jpeg',
  });
  return blob.url;
}

export async function deleteProductImage(url) {
  await del(url);
}

/* Renders the product grid (.isotope-grid) on index.html / product.html from
   /api/products instead of hardcoded HTML, so the admin panel's edits show
   up on the live site without touching any page markup. Falls back to
   whatever static markup is already in the page if the fetch fails. */
(function () {
  'use strict';

  function imageSrc(image) {
    if (!image) return 'images/product-01.jpg';
    if (/^https?:\/\//i.test(image) || image.startsWith('data:')) return image;
    return 'images/' + image;
  }

  function money(n) {
    return '$' + Number(n).toFixed(2);
  }

  function buildCard(product) {
    const col = document.createElement('div');
    col.className = 'col-sm-6 col-md-4 col-lg-3 p-b-35 isotope-item ' + (product.category || '');

    const outOfStock = Number(product.stock) <= 0;
    const priceHtml = product.oldPrice != null
      ? `<span class="stext-105 cl3">${money(product.price)}</span> ` +
        `<span class="stext-105" style="color:#999;text-decoration:line-through;margin-left:6px;">${money(product.oldPrice)}</span>`
      : `<span class="stext-105 cl3">${money(product.price)}</span>`;

    col.innerHTML = `
      <div class="block2">
        <div class="block2-pic hov-img0">
          <img src="${imageSrc(product.image)}" alt="IMG-PRODUCT">
          ${outOfStock ? '<span class="out-of-stock-badge">Out of Stock</span>' : ''}
          <a href="#" class="block2-btn flex-c-m stext-103 cl2 size-102 bg0 bor2 hov-btn1 p-lr-15 trans-04 js-show-modal1">
            Quick View
          </a>
        </div>

        <div class="block2-txt flex-w flex-t p-t-14">
          <div class="block2-txt-child1 flex-col-l ">
            <a href="product-detail.html" class="stext-104 cl4 hov-cl1 trans-04 js-name-b2 p-b-6">
              ${escapeHtml(product.name)}
            </a>
            ${priceHtml}
          </div>

          <div class="block2-txt-child2 flex-r p-t-3">
            <a href="#" class="btn-addwish-b2 dis-block pos-relative js-addwish-b2">
              <img class="icon-heart1 dis-block trans-04" src="images/icons/icon-heart-01.png" alt="ICON">
              <img class="icon-heart2 dis-block trans-04 ab-t-l" src="images/icons/icon-heart-02.png" alt="ICON">
            </a>
          </div>
        </div>
      </div>
    `;
    return col;
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function initIsotope() {
    if (typeof jQuery === 'undefined' || !jQuery.fn.isotope) return;
    jQuery('.isotope-grid').each(function () {
      const $grid = jQuery(this);
      if ($grid.data('isotope')) {
        $grid.isotope('reloadItems').isotope('layout');
      } else {
        $grid.isotope({
          itemSelector: '.isotope-item',
          layoutMode: 'fitRows',
          percentPosition: true,
          masonry: { columnWidth: '.isotope-item' },
        });
      }
    });
  }

  async function renderGrids() {
    const grids = document.querySelectorAll('.isotope-grid[data-dynamic-products]');
    if (!grids.length) return;

    let products;
    try {
      const res = await fetch('/api/products', { cache: 'no-store' });
      if (!res.ok) throw new Error('bad response');
      products = await res.json();
    } catch {
      // Leave whatever static fallback markup is already in the page.
      return;
    }

    grids.forEach((grid) => {
      const limit = grid.getAttribute('data-limit');
      const list = limit ? products.slice(0, Number(limit)) : products;
      grid.innerHTML = '';
      list.forEach((product) => grid.appendChild(buildCard(product)));
    });

    initIsotope();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderGrids);
  } else {
    renderGrids();
  }
})();

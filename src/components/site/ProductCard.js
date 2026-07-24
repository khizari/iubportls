function slugifyCategory(category) {
  return (category || 'uncategorized')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export function categoryClass(category) {
  return slugifyCategory(category);
}

export default function ProductCard({ product, isotope = false }) {
  const image = product.images?.[0] || '/images/product-01.jpg';
  const hasSale = product.salePrice != null && product.salePrice < product.price;

  return (
    <div
      className={`col-sm-6 col-md-4 col-lg-3 p-b-35${
        isotope ? ` isotope-item ${categoryClass(product.category)}` : ''
      }`}
    >
      <div className="block2">
        <div className="block2-pic hov-img0">
          <img src={image} alt={product.name} />

          <a
            href={`/products/${product.slug}`}
            className="block2-btn flex-c-m stext-103 cl2 size-102 bg0 bor2 hov-btn1 p-lr-15 trans-04"
          >
            View Product
          </a>
        </div>

        <div className="block2-txt flex-w flex-t p-t-14">
          <div className="block2-txt-child1 flex-col-l">
            <a
              href={`/products/${product.slug}`}
              className="stext-104 cl4 hov-cl1 trans-04 js-name-b2 p-b-6"
            >
              {product.name}
            </a>

            <span className="stext-105 cl3">
              {hasSale ? (
                <>
                  <span style={{ textDecoration: 'line-through', marginRight: 6, opacity: 0.6 }}>
                    ${product.price.toFixed(2)}
                  </span>
                  ${product.salePrice.toFixed(2)}
                </>
              ) : (
                <>${(product.price || 0).toFixed(2)}</>
              )}
            </span>
          </div>

          <div className="block2-txt-child2 flex-r p-t-3">
            <a href="#" className="btn-addwish-b2 dis-block pos-relative js-addwish-b2">
              <img className="icon-heart1 dis-block trans-04" src="/images/icons/icon-heart-01.png" alt="ICON" />
              <img className="icon-heart2 dis-block trans-04 ab-t-l" src="/images/icons/icon-heart-02.png" alt="ICON" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

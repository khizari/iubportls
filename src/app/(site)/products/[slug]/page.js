import { notFound } from 'next/navigation';
import { getProductBySlug, getProducts } from '@/lib/blob';
import ProductCard from '@/components/site/ProductCard';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const product = await getProductBySlug(params.slug);
  return { title: product ? `${product.name} — ZAZ Collection Store` : 'Product not found' };
}

export default async function ProductDetailPage({ params }) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const images = product.images?.length ? product.images : ['/images/product-detail-01.jpg'];
  const hasSale = product.salePrice != null && product.salePrice < product.price;

  const allProducts = await getProducts();
  const related = allProducts
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 4);

  return (
    <>
      {/* Product Detail */}
      <section className="sec-product-detail bg0 p-t-65 p-b-60">
        <div className="container">
          <div className="row">
            <div className="col-md-6 col-lg-7 p-b-30">
              <div className="p-l-25 p-r-30 p-lr-0-lg">
                <div className="wrap-slick3 flex-sb flex-w">
                  <div className="wrap-slick3-dots" />
                  <div className="wrap-slick3-arrows flex-sb-m flex-w" />
                  <div className="slick3 gallery-lb">
                    {images.map((img, i) => (
                      <div className="item-slick3" data-thumb={img} key={i}>
                        <div className="wrap-pic-w pos-relative">
                          <img src={img} alt={product.name} />
                          <a
                            className="flex-c-m size-108 how-pos1 bor0 fs-16 cl10 bg0 hov-btn3 trans-04"
                            href={img}
                          >
                            <i className="fa fa-expand" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-lg-5 p-b-30">
              <div className="p-r-50 p-t-5 p-lr-0-lg">
                <h4 className="mtext-105 cl2 js-name-detail p-b-14">{product.name}</h4>

                <span className="mtext-106 cl2">
                  {hasSale ? (
                    <>
                      <span style={{ textDecoration: 'line-through', marginRight: 10, opacity: 0.6 }}>
                        ${product.price.toFixed(2)}
                      </span>
                      ${product.salePrice.toFixed(2)}
                    </>
                  ) : (
                    <>${(product.price || 0).toFixed(2)}</>
                  )}
                </span>

                <p className="stext-102 cl3 p-t-23">
                  {product.description || 'No description provided for this product yet.'}
                </p>

                <div className="p-t-33">
                  {product.sizes?.length > 0 && (
                    <div className="flex-w flex-r-m p-b-10">
                      <div className="size-203 flex-c-m respon6">Size</div>
                      <div className="size-204 respon6-next">
                        <div className="rs1-select2 bor8 bg0">
                          <select className="js-select2" name="size">
                            <option>Choose an option</option>
                            {product.sizes.map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                          <div className="dropDownSelect2" />
                        </div>
                      </div>
                    </div>
                  )}

                  {product.colors?.length > 0 && (
                    <div className="flex-w flex-r-m p-b-10">
                      <div className="size-203 flex-c-m respon6">Color</div>
                      <div className="size-204 respon6-next">
                        <div className="rs1-select2 bor8 bg0">
                          <select className="js-select2" name="color">
                            <option>Choose an option</option>
                            {product.colors.map((c) => (
                              <option key={c}>{c}</option>
                            ))}
                          </select>
                          <div className="dropDownSelect2" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex-w flex-r-m p-b-10">
                    <div className="size-204 flex-w flex-m respon6-next">
                      <div className="wrap-num-product flex-w m-r-20 m-tb-10">
                        <div className="btn-num-product-down cl8 hov-btn3 trans-04 flex-c-m">
                          <i className="fs-16 zmdi zmdi-minus" />
                        </div>
                        <input
                          className="mtext-104 cl3 txt-center num-product"
                          type="number"
                          name="num-product"
                          defaultValue={1}
                        />
                        <div className="btn-num-product-up cl8 hov-btn3 trans-04 flex-c-m">
                          <i className="fs-16 zmdi zmdi-plus" />
                        </div>
                      </div>

                      <button
                        className="flex-c-m stext-101 cl0 size-101 bg1 bor1 hov-btn1 p-lr-15 trans-04 js-addcart-detail"
                        disabled={product.stock <= 0}
                      >
                        {product.stock > 0 ? 'Add to cart' : 'Out of stock'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex-w flex-m p-l-100 p-t-40 respon7">
                  <div className="flex-m bor9 p-r-10 m-r-11">
                    <a
                      href="#"
                      className="fs-14 cl3 hov-cl1 trans-04 lh-10 p-lr-5 p-tb-2 js-addwish-detail tooltip100"
                      data-tooltip="Add to Wishlist"
                    >
                      <i className="zmdi zmdi-favorite" />
                    </a>
                  </div>
                  <a href="#" className="fs-14 cl3 hov-cl1 trans-04 lh-10 p-lr-5 p-tb-2 m-r-8 tooltip100" data-tooltip="Facebook">
                    <i className="fa fa-facebook" />
                  </a>
                  <a href="#" className="fs-14 cl3 hov-cl1 trans-04 lh-10 p-lr-5 p-tb-2 m-r-8 tooltip100" data-tooltip="Twitter">
                    <i className="fa fa-twitter" />
                  </a>
                  <a href="#" className="fs-14 cl3 hov-cl1 trans-04 lh-10 p-lr-5 p-tb-2 m-r-8 tooltip100" data-tooltip="Google Plus">
                    <i className="fa fa-google-plus" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="bor10 m-t-50 p-t-43 p-b-40">
            <div className="tab01">
              <ul className="nav nav-tabs" role="tablist">
                <li className="nav-item p-b-10">
                  <a className="nav-link active" data-toggle="tab" href="#description" role="tab">Description</a>
                </li>
                <li className="nav-item p-b-10">
                  <a className="nav-link" data-toggle="tab" href="#information" role="tab">Additional information</a>
                </li>
              </ul>

              <div className="tab-content p-t-43">
                <div className="tab-pane fade show active" id="description" role="tabpanel">
                  <div className="how-pos2 p-lr-15-md">
                    <p className="stext-102 cl6">
                      {product.description || 'No description provided for this product yet.'}
                    </p>
                  </div>
                </div>

                <div className="tab-pane fade" id="information" role="tabpanel">
                  <div className="row">
                    <div className="col-sm-10 col-md-8 col-lg-6 m-lr-auto">
                      <ul className="p-lr-28 p-lr-15-sm">
                        <li className="flex-w flex-t p-b-7">
                          <span className="stext-102 cl3 size-205">Category</span>
                          <span className="stext-102 cl6 size-206">{product.category || '—'}</span>
                        </li>
                        <li className="flex-w flex-t p-b-7">
                          <span className="stext-102 cl3 size-205">Stock</span>
                          <span className="stext-102 cl6 size-206">{product.stock ?? 0} available</span>
                        </li>
                        {product.colors?.length > 0 && (
                          <li className="flex-w flex-t p-b-7">
                            <span className="stext-102 cl3 size-205">Color</span>
                            <span className="stext-102 cl6 size-206">{product.colors.join(', ')}</span>
                          </li>
                        )}
                        {product.sizes?.length > 0 && (
                          <li className="flex-w flex-t p-b-7">
                            <span className="stext-102 cl3 size-205">Size</span>
                            <span className="stext-102 cl6 size-206">{product.sizes.join(', ')}</span>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg6 flex-c-m flex-w size-302 m-t-73 p-tb-15">
          <span className="stext-107 cl6 p-lr-25">SKU: {product.id.slice(0, 8).toUpperCase()}</span>
          <span className="stext-107 cl6 p-lr-25">Category: {product.category || 'Uncategorized'}</span>
        </div>
      </section>

      {related.length > 0 && (
        <section className="sec-relate-product bg0 p-t-45 p-b-105">
          <div className="container">
            <div className="p-b-45">
              <h3 className="ltext-106 cl5 txt-center">Related Products</h3>
            </div>

            <div className="row">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

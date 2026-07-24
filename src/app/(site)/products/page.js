import { getProducts } from '@/lib/blob';
import ProductCard, { categoryClass } from '@/components/site/ProductCard';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Shop — ZAZ Collection Store' };

export default async function ProductsPage() {
  const products = await getProducts();

  const categories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean))
  ).sort();

  return (
    <div className="bg0 m-t-23 p-b-140">
      <div className="container">
        <div className="flex-w flex-sb-m p-b-52">
          <div className="flex-w flex-l-m filter-tope-group m-tb-10">
            <button
              className="stext-106 cl6 hov1 bor3 trans-04 m-r-32 m-tb-5 how-active1"
              data-filter="*"
            >
              All Products
            </button>

            {categories.map((category) => (
              <button
                key={category}
                className="stext-106 cl6 hov1 bor3 trans-04 m-r-32 m-tb-5"
                data-filter={`.${categoryClass(category)}`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="flex-w flex-c-m m-tb-10">
            <div className="flex-c-m stext-106 cl6 size-104 bor4 pointer hov-btn3 trans-04 m-r-8 m-tb-4 js-show-filter">
              <i className="icon-filter cl2 m-r-6 fs-15 trans-04 zmdi zmdi-filter-list" />
              <i className="icon-close-filter cl2 m-r-6 fs-15 trans-04 zmdi zmdi-close dis-none" />
              Filter
            </div>

            <div className="flex-c-m stext-106 cl6 size-105 bor4 pointer hov-btn3 trans-04 m-tb-4 js-show-search">
              <i className="icon-search cl2 m-r-6 fs-15 trans-04 zmdi zmdi-search" />
              <i className="icon-close-search cl2 m-r-6 fs-15 trans-04 zmdi zmdi-close dis-none" />
              Search
            </div>
          </div>

          {/* Search product */}
          <div className="dis-none panel-search w-full p-t-10 p-b-15">
            <div className="bor8 dis-flex p-l-15">
              <button className="size-113 flex-c-m fs-16 cl2 hov-cl1 trans-04">
                <i className="zmdi zmdi-search" />
              </button>

              <input
                className="mtext-107 cl2 size-114 plh2 p-r-15"
                type="text"
                name="search-product"
                placeholder="Search"
              />
            </div>
          </div>
        </div>

        {products.length === 0 ? (
          <p className="stext-102 cl6 txt-center p-b-100">
            No products yet. Add your first product from the{' '}
            <a href="/admin/login" className="hov-cl1">admin panel</a>.
          </p>
        ) : (
          <div className="row isotope-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} isotope />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

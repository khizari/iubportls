import Link from 'next/link';
import { getProducts } from '@/lib/blob';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div>
      <div className="admin-topbar">
        <h2>Products ({products.length})</h2>
        <Link href="/admin/products/new" className="btn btn-primary">
          + New product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="empty-state">
          No products yet. <Link href="/admin/products/new">Add your first product</Link>.
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th></th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.name} className="thumb" />
                  ) : (
                    <div className="thumb" />
                  )}
                </td>
                <td>{p.name}</td>
                <td>{p.category || '—'}</td>
                <td>
                  {p.salePrice ? (
                    <>
                      <span style={{ textDecoration: 'line-through', color: '#9ca3af', marginRight: 6 }}>
                        ${Number(p.price).toFixed(2)}
                      </span>
                      ${Number(p.salePrice).toFixed(2)}
                    </>
                  ) : (
                    <>${Number(p.price).toFixed(2)}</>
                  )}
                </td>
                <td>
                  <span className={`badge ${p.stock > 0 ? 'badge-in' : 'badge-out'}`}>
                    {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                  </span>
                </td>
                <td>
                  <Link href={`/admin/products/${p.id}`} className="btn">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

import { notFound } from 'next/navigation';
import ProductForm from '@/components/ProductForm';
import { getProductById } from '@/lib/blob';

export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }) {
  const product = await getProductById(params.id);
  if (!product) notFound();

  return (
    <div>
      <div className="admin-topbar">
        <h2>Edit product</h2>
      </div>
      <ProductForm initialProduct={product} />
    </div>
  );
}

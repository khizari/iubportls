import ProductForm from '@/components/ProductForm';

export default function NewProductPage() {
  return (
    <div>
      <div className="admin-topbar">
        <h2>New product</h2>
      </div>
      <ProductForm />
    </div>
  );
}

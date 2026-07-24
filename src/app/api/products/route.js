import { NextResponse } from 'next/server';
import { getProducts, createProduct } from '@/lib/blob';

export async function GET() {
  const products = await getProducts();
  return NextResponse.json({ products });
}

export async function POST(request) {
  const data = await request.json().catch(() => null);
  if (!data || !data.name) {
    return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
  }
  const product = await createProduct(data);
  return NextResponse.json({ product }, { status: 201 });
}

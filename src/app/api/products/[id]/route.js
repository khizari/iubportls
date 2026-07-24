import { NextResponse } from 'next/server';
import { getProductById, updateProduct, deleteProduct } from '@/lib/blob';

export async function GET(_request, { params }) {
  const product = await getProductById(params.id);
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ product });
}

export async function PUT(request, { params }) {
  const data = await request.json().catch(() => null);
  if (!data) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  const product = await updateProduct(params.id, data);
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ product });
}

export async function DELETE(_request, { params }) {
  const product = await getProductById(params.id);
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await deleteProduct(params.id);
  return NextResponse.json({ ok: true });
}

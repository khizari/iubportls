import { NextResponse } from 'next/server';
import { uploadProductImage, deleteProductImage } from '@/lib/blob';

export async function POST(request) {
  const formData = await request.formData().catch(() => null);
  const file = formData?.get('file');

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (!file.type?.startsWith('image/')) {
    return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
  }

  const MAX_SIZE = 8 * 1024 * 1024; // 8MB
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Image must be under 8MB' }, { status: 400 });
  }

  const url = await uploadProductImage(file);
  return NextResponse.json({ url });
}

export async function DELETE(request) {
  const { url } = await request.json().catch(() => ({}));
  if (!url) return NextResponse.json({ error: 'url is required' }, { status: 400 });
  await deleteProductImage(url);
  return NextResponse.json({ ok: true });
}

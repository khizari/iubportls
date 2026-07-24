import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/session';

export const config = {
  matcher: ['/admin/:path*', '/api/products/:path*', '/api/upload/:path*'],
};

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith('/api/');

  if (pathname.startsWith('/admin/login')) {
    return NextResponse.next();
  }

  // Public storefront reads: GET on the products API stays open so the
  // shop pages can fetch the catalog without logging in. Everything else
  // (POST/PUT/DELETE, and the whole /admin UI) requires a valid session.
  if (isApi && request.method === 'GET') {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!(await verifySessionToken(token))) {
    if (isApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

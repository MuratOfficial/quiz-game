
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Дополнительная логика если нужна
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

// Защищаемые маршруты
export const config = {
  matcher: [
    // '/',
    // '/coding/:path*',
    '/admin/:path*',
    '/profile/:path*',
  ],
};
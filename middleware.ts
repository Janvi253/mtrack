import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // public paths that should be accessible without auth
    const publicPaths = [
        '/login',
        '/signup',
        '/favicon.ico',
        '/robots.txt'
    ];

    // allow API, _next/static assets, and explicit public paths
    if (
        pathname.startsWith('/api/') ||
        pathname.startsWith('/_next/') ||
        pathname.startsWith('/static/') ||
        publicPaths.includes(pathname)
    ) {
        return NextResponse.next();
    }

    const userCookie = request.cookies.get('session_user');
    if (!userCookie) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // Admin-only route protection
    if (pathname.startsWith('/request-form/admin')) {
        const adminCookie = request.cookies.get('session_admin');
        if (!adminCookie) {
            const url = request.nextUrl.clone();
            url.pathname = '/request-form/index';
            return NextResponse.redirect(url);
        }
    }

    return NextResponse.next();
}

export const config = {
    // match root and all non-api/_next/static routes
    matcher: ['/', '/((?!api|_next|static|favicon.ico).*)'],
};

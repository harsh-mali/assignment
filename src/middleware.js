import { jwtVerify } from 'jose';
import { NextResponse } from 'next/server';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');

export async function middleware(req) {
    const token = req.cookies.get('token')?.value;

    if (!token) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    try {
        await jwtVerify(token, secret);

        // Add the token to the request headers for API calls
        const requestHeaders = new Headers(req.headers);
        requestHeaders.set('Authorization', `Bearer ${token}`);

        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });

    } catch (err) {
        return NextResponse.redirect(new URL('/login', req.url));
    }
}

export const config = {
    matcher: ['/notes', '/api/notes/:path*', '/api/tenants/:path*'],
};
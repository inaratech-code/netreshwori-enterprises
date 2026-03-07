import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Admin whitelist – only these emails can access /admin
const ADMIN_EMAILS = [
    'netreshworienterprises2065@gmail.com',
    'admin@netreshwori.com',
    '1akshya.r@gmail.com',
];

export function middleware(request: NextRequest) {
    if (request.nextUrl.pathname.startsWith('/admin')) {
        const userAgent = request.headers.get('user-agent') || '';
        const isWindows = /Windows/i.test(userAgent);

        if (!isWindows) {
            return new NextResponse(
                "Admin access restricted to authorized Windows devices.",
                {
                    status: 403,
                    headers: { 'Content-Type': 'text/plain' }
                }
            );
        }

        const adminSession = request.cookies.get('admin_session');

        if (!adminSession?.value) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        const email = decodeURIComponent(adminSession.value);
        if (!ADMIN_EMAILS.includes(email)) {
            return new NextResponse(
                "Unauthorized access. Your email is not whitelisted for admin access.",
                {
                    status: 403,
                    headers: { 'Content-Type': 'text/plain' }
                }
            );
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/admin/:path*',
};

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define protected and public routes
const PUBLIC_FILE = /\.(.*)$/; // Regex for static files
const publicRoutes = ["/login"];

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    
    // 1. Skip static files (images, fonts, etc.)
    if (PUBLIC_FILE.test(pathname) || pathname.startsWith("/_next") || pathname.startsWith("/api")) {
        return NextResponse.next();
    }

    // 2. Get auth tokens and role from cookies
    const token = req.cookies.get("token")?.value;
    const role = req.cookies.get("userRole")?.value;

    const isPublicRoute = publicRoutes.some(route => pathname === route);

    // 3. Logic for Unauthenticated Users
    if (!token && !isPublicRoute) {
        const url = req.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    // 4. Logic for Authenticated Users
    if (token) {
        // If trying to access login page or root, redirect to respective dashboard
        if (isPublicRoute || pathname === "/") {
            const url = req.nextUrl.clone();
            
            if (role === "EXECUTIVE") {
                url.pathname = "/executive/dashboard";
            } else if (role === "PROCESSOR") {
                url.pathname = "/data-processor/management";
            } else {
                url.pathname = "/data-owner/management";
            }
            return NextResponse.redirect(url);
        }

        // 5. Role-Based Access Control (RBAC) - Prevent cross-role navigation
        if (pathname.startsWith("/executive") && role !== "EXECUTIVE") {
            const url = req.nextUrl.clone();
            url.pathname = role === "PROCESSOR" ? "/data-processor/management" : "/data-owner/management";
            return NextResponse.redirect(url);
        }

        if (pathname.startsWith("/data-owner") && role !== "OWNER") {
            const url = req.nextUrl.clone();
            url.pathname = role === "EXECUTIVE" ? "/executive/dashboard" : "/data-processor/management";
            return NextResponse.redirect(url);
        }

        if (pathname.startsWith("/data-processor") && role !== "PROCESSOR") {
            const url = req.nextUrl.clone();
            url.pathname = role === "EXECUTIVE" ? "/executive/dashboard" : "/data-owner/management";
            return NextResponse.redirect(url);
        }
    }

    return NextResponse.next();
}

// Optionally, specify which routes this middleware should run on
export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

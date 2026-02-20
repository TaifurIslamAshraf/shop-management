import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(async (auth, req) => {
    if (isProtectedRoute(req)) {
        const session = await auth();

        // Ensure user is authenticated
        if (!session.userId) {
            return session.redirectToSignIn();
        }

        // Check if user has the admin role using sessionClaims
        // Assumes role is stored in public metadata: { metadata: { role: 'admin' } }
        const role = (session.sessionClaims?.metadata as any)?.role;

        if (role !== "admin") {
            // Redirect non-admins away from dashboard
            return Response.redirect(new URL("/", req.url));
        }
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};

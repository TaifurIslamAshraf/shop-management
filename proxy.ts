import { clerkMiddleware, createRouteMatcher, clerkClient } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(async (auth, req) => {
    if (isProtectedRoute(req)) {
        const session = await auth();

        // Ensure user is authenticated
        if (!session.userId) {
            return session.redirectToSignIn();
        }

        // Fetch user from clerk API to access publicMetadata reliably
        const client = await clerkClient();
        const user = await client.users.getUser(session.userId);
        const role = user.publicMetadata?.role;

        if (role !== "admin") {
            // Redirect non-admins away from dashboard
            // We cannot redirect to '/' because '/' automatically redirects authenticated users to '/dashboard'
            return Response.redirect(new URL("/unauthorized", req.url));
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

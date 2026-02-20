import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";

export default function UnauthorizedPage() {
    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 items-center justify-center p-4 text-center">
            <ShieldAlert className="h-24 w-24 text-red-500 mb-6" />
            <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white">
                Access Denied
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-md mb-8">
                You do not have the required permissions (Admin role) to access the dashboard. Please contact an administrator if you believe this is an error.
            </p>
            <div className="flex gap-4">
                <SignOutButton>
                    <Button variant="outline" size="lg">Sign Out</Button>
                </SignOutButton>
                <Button asChild size="lg">
                    <Link href="/">Return Home</Link>
                </Button>
            </div>
        </div>
    );
}

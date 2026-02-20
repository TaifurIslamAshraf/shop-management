import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, PackageOpen } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="px-6 py-4 flex items-center justify-between border-b bg-white dark:bg-slate-900">
        <div className="flex items-center gap-2 font-bold text-xl text-primary">
          <PackageOpen className="h-6 w-6" />
          <span>ShopDash</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <PackageOpen className="h-20 w-20 text-primary mb-6" />
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white">
          Manage your inventory <br className="hidden md:block" />
          <span className="text-primary">with ease</span>
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mb-8">
          The ultimate platform for shop owners. Securely log in, manage your products, track stock levels, and oversee your inventory all in one place.
        </p>
        <div className="flex items-center gap-4">
          <Button asChild size="lg" className="gap-2">
            <Link href="/sign-in">
              Go to Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/sign-up">Sign Up</Link>
          </Button>
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-slate-500 border-t">
        &copy; {new Date().getFullYear()} Shop Management System. All rights reserved.
      </footer>
    </div>
  );
}

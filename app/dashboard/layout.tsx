import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TopNav } from "@/components/dashboard/TopNav";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <TopNav />
                <div className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 pt-6">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}

"use client";

import { Package, Search, Bell } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getSmartAlerts } from "@/actions/dashboard";

export function TopNav() {
    const [alertCount, setAlertCount] = useState(0);

    useEffect(() => {
        const fetchAlerts = async () => {
            const res = await getSmartAlerts();
            if (res.success && res.alerts) {
                const total =
                    res.alerts.lowStock.length +
                    res.alerts.outOfStock.length +
                    res.alerts.expiring.length +
                    res.alerts.duePurchases.length +
                    res.alerts.dueOrders.length;
                setAlertCount(total);
            }
        };

        fetchAlerts();
    }, []);

    return (
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 justify-between transition-all sm:h-14 sm:px-6 shadow-sm">
            <div className="flex items-center gap-2 font-semibold">
                <SidebarTrigger className="-ml-1" />
                <Package className="h-5 w-5 sm:hidden" />
                <span className="sm:hidden">ShopDash</span>
            </div>

            <div className="flex items-center gap-4 md:gap-6 ml-auto">
                <div className="hidden md:flex relative w-full max-w-sm items-center">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search..."
                        className="w-full rounded-md bg-muted/50 pl-8 md:w-[200px] lg:w-[300px]"
                    />
                </div>
                <Button variant="ghost" size="icon" className="relative cursor-pointer hidden sm:flex" asChild>
                    <Link href="/dashboard">
                        <Bell className="h-4 w-4" />
                        {alertCount > 0 && (
                            <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                {alertCount > 99 ? '99+' : alertCount}
                            </span>
                        )}
                    </Link>
                </Button>
            </div>
        </header>
    );
}

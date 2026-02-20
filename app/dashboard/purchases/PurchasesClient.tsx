"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DataTable } from "./data-table";
import { columns, Purchase } from "./columns";

interface PurchasesClientProps {
    initialPurchases: Purchase[];
}

export default function PurchasesClient({ initialPurchases }: PurchasesClientProps) {
    return (
        <>
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Purchase Orders</h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Manage your incoming stock and supplier purchases
                    </p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/purchases/new">
                        <Plus className="mr-2 h-4 w-4" /> New Purchase
                    </Link>
                </Button>
            </div>

            <DataTable columns={columns} data={initialPurchases} />
        </>
    );
}

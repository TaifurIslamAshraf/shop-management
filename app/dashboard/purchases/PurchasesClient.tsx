"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DataTable } from "./data-table";
import { getColumns, Purchase } from "./columns";
import { deletePurchase } from "@/actions/purchase";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PurchasesClientProps {
    initialPurchases: Purchase[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
    };
}

export default function PurchasesClient({ initialPurchases, pagination }: PurchasesClientProps) {
    const router = useRouter();

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this purchase? Stock changes will be reversed.")) {
            const res = await deletePurchase(id);
            if (res.success) {
                toast.success("Purchase deleted successfully");
                router.refresh();
            } else {
                toast.error(res.error || "Failed to delete purchase");
            }
        }
    };

    const columns = getColumns({ onDelete: handleDelete });

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
            <PaginationControls
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalCount={pagination.totalCount}
            />
        </>
    );
}


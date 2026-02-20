import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getProductById } from "@/actions/product";
import { getStockMovements } from "@/actions/stock";
import { Button } from "@/components/ui/button";
import { StockHistoryFilters } from "@/components/products/StockHistoryFilters";
import { IStockMovement } from "@/models/StockMovement";

// Ensure the page is dynamic
export const dynamic = "force-dynamic";

export default async function StockHistoryPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const [productRes, movementsRes] = await Promise.all([
        getProductById(id),
        getStockMovements(id),
    ]);

    if (!productRes.success || !productRes.product) {
        notFound();
    }

    const product = productRes.product;
    const movements = (movementsRes.movements || []) as Pick<IStockMovement, "_id" | "createdAt" | "type" | "quantity" | "previousStock" | "newStock" | "reason" | "reference">[];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/dashboard/products">
                            <Button variant="ghost" size="icon" className="-ml-2">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <h2 className="text-3xl font-bold tracking-tight">Stock History</h2>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg border shadow-sm p-6">
                <StockHistoryFilters initialMovements={movements} />
            </div>
        </div>
    );
}

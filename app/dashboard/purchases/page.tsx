import { getPurchases } from "@/actions/purchase";
import PurchasesClient from "./PurchasesClient";

export default async function PurchasesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
    const resolvedParams = await searchParams;
    const page = Number(resolvedParams.page) || 1;

    const { purchases, success, error, totalCount, totalPages } = await getPurchases({ page });

    if (!success) {
        return <div className="p-6 text-red-500">Error loading purchases: {error}</div>;
    }

    return (
        <div className="flex flex-col gap-6">
            <PurchasesClient
                initialPurchases={purchases || []}
                pagination={{ currentPage: page, totalPages: totalPages || 1, totalCount: totalCount || 0 }}
            />
        </div>
    );
}

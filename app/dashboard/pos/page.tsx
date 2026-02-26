import { getProducts } from "@/actions/product";
import POSClient from "@/components/pos/POSClient";

export default async function POSPage() {
    const { products, totalPages, success, error } = await getProducts({ limit: 12 });

    if (!success) {
        return (
            <div className="p-8 text-red-500">
                <h2>Failed to load POS System</h2>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <POSClient initialProducts={products || []} initialTotalPages={totalPages || 1} />
        </div>
    );
}

import { getSupplierById } from "@/actions/supplier";
import { getProducts } from "@/actions/product";
import SupplierDetailClient from "./SupplierDetailClient";

export default async function SupplierDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Fetch supplier details
    const supplierRes = await getSupplierById(id);

    // Fetch all products (we will filter by supplierId on the client for simplicity, 
    // or we could add a getProductsBySupplier action, but filtering in memory is fine for a small dataset)
    const productRes = await getProducts();

    if (!supplierRes.success || !supplierRes.supplier) {
        return <div className="p-6 text-red-500">Error loading supplier details: {supplierRes.error}</div>;
    }

    // Filter products supplied by this supplier
    const suppliedProducts = (productRes.products || []).filter((p: any) => p.supplierId === id);

    return (
        <div className="flex flex-col gap-6">
            <SupplierDetailClient
                supplier={supplierRes.supplier}
                recentPurchases={supplierRes.recentPurchases || []}
                suppliedProducts={suppliedProducts}
            />
        </div>
    );
}

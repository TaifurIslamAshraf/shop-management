import { getSuppliers } from "@/actions/supplier";
import { getProducts } from "@/actions/product";
import { PurchaseForm } from "@/components/purchases/PurchaseForm";

export default async function NewPurchasePage() {
    // Fetch dependencies for the form
    const [suppliersRes, productsRes] = await Promise.all([
        getSuppliers(),
        getProducts()
    ]);

    if (!suppliersRes.success || !productsRes.success) {
        return (
            <div className="p-6 text-red-500">
                Error loading dependencies.
                {suppliersRes.error} {productsRes.error}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">New Purchase Order</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                    Create a new purchase order to restock inventory from a supplier.
                </p>
            </div>

            <PurchaseForm
                suppliers={suppliersRes.suppliers || []}
                products={productsRes.products || []}
            />
        </div>
    );
}

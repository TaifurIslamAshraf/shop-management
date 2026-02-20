import { getPurchaseById } from "@/actions/purchase";
import { getSuppliers } from "@/actions/supplier";
import { getProducts } from "@/actions/product";
import { PurchaseForm } from "@/components/purchases/PurchaseForm";

export default async function EditPurchasePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [purchaseRes, suppliersRes, productsRes] = await Promise.all([
        getPurchaseById(id),
        getSuppliers(),
        getProducts()
    ]);

    if (!purchaseRes.success || !purchaseRes.purchase || !suppliersRes.success || !productsRes.success) {
        return (
            <div className="p-6 text-red-500">
                Failed to load purchase details for editing.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Edit Purchase Order</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                    Modify the details of an existing purchase order.
                </p>
            </div>

            <PurchaseForm
                suppliers={suppliersRes.suppliers || []}
                products={productsRes.products || []}
                initialData={purchaseRes.purchase}
            />
        </div>
    );
}

import { getProducts } from "@/actions/product";
import { getSuppliers } from "@/actions/supplier";
import ProductsClient from "./ProductsClient";

export default async function ProductsPage() {
    const [productsRes, suppliersRes] = await Promise.all([
        getProducts(),
        getSuppliers()
    ]);
    const { products, success, error } = productsRes;

    if (!success) {
        return <div className="p-6 text-red-500">Error loading products: {error}</div>;
    }

    return (
        <div className="flex flex-col gap-6">
            <ProductsClient initialProducts={products || []} suppliers={suppliersRes.suppliers || []} />
        </div>
    );
}

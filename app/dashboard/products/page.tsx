import { getProducts } from "@/actions/product";
import { getSuppliers } from "@/actions/supplier";
import ProductsClient from "./ProductsClient";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
    const resolvedParams = await searchParams;
    const page = Number(resolvedParams.page) || 1;

    const [productsRes, suppliersRes] = await Promise.all([
        getProducts({ page }),
        getSuppliers({ page: 1, limit: 100 })
    ]);
    const { products, success, error, totalCount, totalPages } = productsRes;

    if (!success) {
        return <div className="p-6 text-red-500">Error loading products: {error}</div>;
    }

    return (
        <div className="flex flex-col gap-6">
            <ProductsClient
                initialProducts={products || []}
                suppliers={suppliersRes.suppliers || []}
                pagination={{ currentPage: page, totalPages: totalPages || 1, totalCount: totalCount || 0 }}
            />
        </div>
    );
}

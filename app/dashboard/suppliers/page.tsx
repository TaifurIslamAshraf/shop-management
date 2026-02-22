import { getSuppliers } from "@/actions/supplier";
import SuppliersClient from "./SuppliersClient";

export default async function SuppliersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
    const resolvedParams = await searchParams;
    const page = Number(resolvedParams.page) || 1;

    const { suppliers, success, error, totalCount, totalPages } = await getSuppliers({ page });

    if (!success) {
        return <div className="p-6 text-red-500">Error loading suppliers: {error}</div>;
    }

    return (
        <div className="flex flex-col gap-6">
            <SuppliersClient
                initialSuppliers={suppliers || []}
                pagination={{ currentPage: page, totalPages: totalPages || 1, totalCount: totalCount || 0 }}
            />
        </div>
    );
}

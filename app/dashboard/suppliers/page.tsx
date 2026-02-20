import { getSuppliers } from "@/actions/supplier";
import SuppliersClient from "./SuppliersClient";

export default async function SuppliersPage() {
    const { suppliers, success, error } = await getSuppliers();

    if (!success) {
        return <div className="p-6 text-red-500">Error loading suppliers: {error}</div>;
    }

    return (
        <div className="flex flex-col gap-6">
            <SuppliersClient initialSuppliers={suppliers || []} />
        </div>
    );
}

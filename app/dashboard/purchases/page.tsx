import { getPurchases } from "@/actions/purchase";
import PurchasesClient from "./PurchasesClient";

export default async function PurchasesPage() {
    const { purchases, success, error } = await getPurchases();

    if (!success) {
        return <div className="p-6 text-red-500">Error loading purchases: {error}</div>;
    }

    return (
        <div className="flex flex-col gap-6">
            <PurchasesClient initialPurchases={purchases || []} />
        </div>
    );
}

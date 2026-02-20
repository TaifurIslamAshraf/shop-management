import { getPurchaseById } from "@/actions/purchase";
import PurchaseDetailClient from "./PurchaseDetailClient";

export default async function PurchaseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const { purchase, success, error } = await getPurchaseById(id);

    if (!success || !purchase) {
        return <div className="p-6 text-red-500">Error loading purchase details: {error}</div>;
    }

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
            <PurchaseDetailClient purchase={purchase} />
        </div>
    );
}

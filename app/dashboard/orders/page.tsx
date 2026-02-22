import { getOrders } from "@/actions/order";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import OrdersClient from "./OrdersClient";

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
    const resolvedParams = await searchParams;
    const page = Number(resolvedParams.page) || 1;

    const { orders, success, error, totalCount, totalPages } = await getOrders({ page });

    if (!success) {
        return (
            <div className="p-8 text-red-500">
                <h2>Failed to load Orders</h2>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Sales &amp; Orders</h2>
                    <p className="text-muted-foreground">
                        View and manage all sales transactions.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                </CardHeader>
                <CardContent>
                    <OrdersClient
                        orders={orders || []}
                        pagination={{ currentPage: page, totalPages: totalPages || 1, totalCount: totalCount || 0 }}
                    />
                </CardContent>
            </Card>
        </div>
    );
}

import { getOrders } from "@/actions/order";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

function getStatusBadge(status: string) {
    switch (status) {
        case "Paid":
            return <Badge variant="secondary">Paid</Badge>;
        case "Partial":
            return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Partial</Badge>;
        case "Unpaid":
            return <Badge variant="destructive">Unpaid</Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
}

export default async function OrdersPage() {
    const { orders, success, error } = await getOrders();

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
                    {(!orders || orders.length === 0) ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No orders found.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order No.</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Payment</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="text-right">Paid</TableHead>
                                    <TableHead className="text-right">Due</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map((order: any) => (
                                    <TableRow key={order._id}>
                                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                                        <TableCell>{format(new Date(order.createdAt), "PPp")}</TableCell>
                                        <TableCell>
                                            {order.customerName || <span className="text-muted-foreground italic">Walk-in</span>}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {order.paymentMethod}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-bold">
                                            ${order.totalAmount.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            ${(order.paidAmount || 0).toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {(order.dueAmount || 0) > 0 ? (
                                                <span className="font-semibold text-red-600">
                                                    ${order.dueAmount.toFixed(2)}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">$0.00</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(order.paymentStatus)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/dashboard/pos/receipt/${order._id}`}>
                                                <Button variant="ghost" size="icon">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

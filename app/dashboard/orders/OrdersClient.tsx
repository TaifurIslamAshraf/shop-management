"use client";

import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Eye, Trash2 } from "lucide-react";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { deleteOrder } from "@/actions/order";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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

interface OrdersClientProps {
    orders: any[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
    };
}

export default function OrdersClient({ orders, pagination }: OrdersClientProps) {
    const router = useRouter();

    const handleDelete = async (id: string, orderNumber: string) => {
        if (confirm(`Are you sure you want to delete order ${orderNumber}? This will restore stock for sold items.`)) {
            const result = await deleteOrder(id);
            if (result.success) {
                toast.success("Order deleted successfully");
                router.refresh();
            } else {
                toast.error(result.error || "Failed to delete order");
            }
        }
    };

    if (!orders || orders.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No orders found.
            </div>
        );
    }

    return (
        <>
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
                                <div className="flex items-center justify-end gap-1">
                                    <Link href={`/dashboard/pos/receipt/${order._id}`}>
                                        <Button variant="ghost" size="icon">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => handleDelete(order._id, order.orderNumber)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <PaginationControls
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalCount={pagination.totalCount}
            />
        </>
    );
}

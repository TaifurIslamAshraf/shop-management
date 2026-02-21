"use client";

import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import CollectPaymentDialog from "./CollectPaymentDialog";

interface Invoice {
    _id: string;
    orderNumber: string;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    paymentStatus: string;
    paymentMethod: string;
    createdAt: string;
}

interface CustomerInvoicesProps {
    invoices: Invoice[];
    customerId: string;
    customerName: string;
    totalDue: number;
}

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

export default function CustomerInvoices({
    invoices,
    customerId,
    customerName,
    totalDue,
}: CustomerInvoicesProps) {
    if (!invoices || invoices.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No invoices found for this customer.
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {invoices.map((invoice) => (
                    <TableRow key={invoice._id}>
                        <TableCell className="font-medium">{invoice.orderNumber}</TableCell>
                        <TableCell>{format(new Date(invoice.createdAt), "PP")}</TableCell>
                        <TableCell className="text-right">${invoice.totalAmount.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${invoice.paidAmount.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-semibold">
                            {invoice.dueAmount > 0 ? (
                                <span className="text-red-600">${invoice.dueAmount.toFixed(2)}</span>
                            ) : (
                                <span>${invoice.dueAmount.toFixed(2)}</span>
                            )}
                        </TableCell>
                        <TableCell>{getStatusBadge(invoice.paymentStatus)}</TableCell>
                        <TableCell className="text-right">
                            {invoice.dueAmount > 0 ? (
                                <CollectPaymentDialog
                                    customerId={customerId}
                                    customerName={customerName}
                                    totalDue={totalDue}
                                    invoice={{
                                        _id: invoice._id,
                                        orderNumber: invoice.orderNumber,
                                        dueAmount: invoice.dueAmount,
                                    }}
                                />
                            ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                            )}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

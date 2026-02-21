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

interface AllocationDetail {
    saleId: string;
    amount: number;
    invoiceNumber: string;
}

interface PaymentRecord {
    _id: string;
    amount: number;
    method: string;
    note?: string;
    allocationType: string;
    allocationDetails: AllocationDetail[];
    createdAt: string;
}

interface PaymentHistoryProps {
    payments: PaymentRecord[];
}

export default function PaymentHistory({ payments }: PaymentHistoryProps) {
    if (!payments || payments.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No payment history found.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {payments.map((payment) => (
                <div
                    key={payment._id}
                    className="border rounded-lg p-4 space-y-2"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-green-600">
                                +${payment.amount.toFixed(2)}
                            </span>
                            <Badge variant="outline">{payment.method}</Badge>
                            <Badge variant="secondary" className="text-xs">
                                {payment.allocationType === "specific_invoice"
                                    ? "Invoice Payment"
                                    : "Bulk Payment (FIFO)"}
                            </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                            {format(new Date(payment.createdAt), "PPp")}
                        </span>
                    </div>

                    {payment.note && (
                        <p className="text-sm text-muted-foreground italic">
                            {payment.note}
                        </p>
                    )}

                    {payment.allocationDetails && payment.allocationDetails.length > 0 && (
                        <div className="mt-2">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                                Allocation Details:
                            </p>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="h-8 text-xs">Invoice</TableHead>
                                        <TableHead className="h-8 text-xs text-right">Amount Applied</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payment.allocationDetails.map((detail, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="py-1 text-sm">
                                                {detail.invoiceNumber}
                                            </TableCell>
                                            <TableCell className="py-1 text-sm text-right">
                                                ${detail.amount.toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

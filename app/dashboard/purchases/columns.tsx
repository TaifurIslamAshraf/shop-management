"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Eye, Pencil } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export type Purchase = {
    _id: string;
    purchaseNumber: string;
    supplierId: {
        _id: string;
        name: string;
        companyName?: string;
    };
    items: any[];
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    status: string;
    paymentStatus: string;
    createdAt: string;
};

export const columns: ColumnDef<Purchase>[] = [
    {
        accessorKey: "purchaseNumber",
        header: "PO Number",
        cell: ({ row }) => {
            const purchase = row.original;
            return (
                <Link href={`/dashboard/purchases/${purchase._id}`} className="font-medium text-blue-600 hover:underline">
                    {purchase.purchaseNumber}
                </Link>
            );
        },
    },
    {
        accessorKey: "createdAt",
        header: "Date",
        cell: ({ row }) => {
            return <div>{format(new Date(row.getValue("createdAt")), "MMM d, yyyy")}</div>;
        },
    },
    {
        id: "supplier",
        header: "Supplier",
        cell: ({ row }) => {
            const supplier = row.original.supplierId;
            if (!supplier) return <span className="text-muted-foreground">Unknown</span>;
            return (
                <div>
                    <div>{supplier.name}</div>
                    {supplier.companyName && <div className="text-xs text-muted-foreground">{supplier.companyName}</div>}
                </div>
            );
        },
    },
    {
        id: "itemsCount",
        header: "Items",
        cell: ({ row }) => {
            return <div>{row.original.items.length}</div>;
        },
    },
    {
        accessorKey: "totalAmount",
        header: () => <div className="text-right">Total</div>,
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("totalAmount"));
            const formatted = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
            }).format(amount);
            return <div className="text-right font-medium">{formatted}</div>;
        },
    },
    {
        accessorKey: "paymentStatus",
        header: "Payment",
        cell: ({ row }) => {
            const status = row.getValue("paymentStatus") as string;
            return (
                <Badge variant={status === "Paid" ? "default" : status === "Partial" ? "secondary" : "destructive"} className={status === "Paid" ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                    {status}
                </Badge>
            );
        },
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string;
            return (
                <Badge variant={status === "Completed" ? "outline" : "default"}>
                    {status}
                </Badge>
            );
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const purchase = row.original;

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                            <Link href={`/dashboard/purchases/${purchase._id}`}>
                                <Eye className="mr-2 h-4 w-4" /> View Details
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={`/dashboard/purchases/${purchase._id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];

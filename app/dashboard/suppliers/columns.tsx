"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Trash, Eye, Phone, Mail, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export type Supplier = {
    _id: string;
    name: string;
    companyName?: string;
    email?: string;
    phone?: string;
    address?: string;
    status: "Active" | "Inactive";
    dueAmount: number;
};

interface ColumnsProps {
    onEdit: (supplier: Supplier) => void;
    onDelete: (id: string) => void;
}

export const getColumns = ({ onEdit, onDelete }: ColumnsProps): ColumnDef<Supplier>[] => [
    {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => {
            const supplier = row.original;
            return (
                <div>
                    <div className="font-medium text-slate-900 dark:text-slate-100">{supplier.name}</div>
                    {supplier.companyName && (
                        <div className="flex items-center text-xs text-slate-500 mt-1">
                            <Building2 className="mr-1 h-3 w-3" /> {supplier.companyName}
                        </div>
                    )}
                </div>
            );
        },
    },
    {
        accessorKey: "contact",
        header: "Contact",
        cell: ({ row }) => {
            const supplier = row.original;
            return (
                <div className="text-sm text-slate-500 flex flex-col gap-1">
                    {supplier.phone && (
                        <div className="flex items-center">
                            <Phone className="mr-2 h-3 w-3" /> {supplier.phone}
                        </div>
                    )}
                    {supplier.email && (
                        <div className="flex items-center">
                            <Mail className="mr-2 h-3 w-3" /> {supplier.email}
                        </div>
                    )}
                </div>
            );
        },
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string;
            return (
                <Badge variant={status === "Active" ? "default" : "secondary"} className={status === "Active" ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                    {status}
                </Badge>
            );
        },
    },
    {
        accessorKey: "dueAmount",
        header: () => <div className="text-right">Due Amount</div>,
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("dueAmount") || "0");
            const formatted = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
            }).format(amount);

            const isDue = amount > 0;

            return <div className={`text-right font-medium ${isDue ? "text-red-500" : "text-emerald-500"}`}>{formatted}</div>;
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const supplier = row.original;

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
                            <Link href={`/dashboard/suppliers/${supplier._id}`}>
                                <Eye className="mr-2 h-4 w-4" /> View Details
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onEdit(supplier)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(supplier._id)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                            <Trash className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];

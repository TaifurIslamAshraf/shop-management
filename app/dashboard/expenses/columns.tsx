"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ArrowUpDown, Edit, MoreHorizontal, Trash } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { deleteExpense } from "@/actions/expense";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ExpenseColumn = {
    _id: string;
    title: string;
    amount: number;
    category: string;
    expenseDate: string;
    description: string;
};

export const columns: ColumnDef<ExpenseColumn>[] = [
    {
        accessorKey: "title",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Title
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
    },
    {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => {
            const category = row.getValue("category") as string;
            return <Badge variant="secondary">{category}</Badge>;
        },
    },
    {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("amount"));
            const formatted = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
            }).format(amount);

            return <div className="font-medium">{formatted}</div>;
        },
    },
    {
        accessorKey: "expenseDate",
        header: "Date",
        cell: ({ row }) => {
            const date = new Date(row.getValue("expenseDate"));
            return <div>{format(date, "MMM d, yyyy")}</div>;
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const expense = row.original;

            const handleDelete = async () => {
                if (confirm("Are you sure you want to delete this expense?")) {
                    try {
                        const result = await deleteExpense(expense._id);
                        if (result.success) {
                            toast.success("Expense deleted successfully");
                            // Ideally, you would invalidate the router or refresh data here.
                        } else {
                            toast.error(result.error || "Failed to delete expense");
                        }
                    } catch (error) {
                        toast.error("An error occurred");
                    }
                }
            };

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
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href={`/dashboard/expenses/${expense._id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Expense
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={handleDelete}
                            className="text-red-600 focus:text-red-600"
                        >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];

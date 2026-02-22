"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Trash, Image as ImageIcon, Settings2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";

export type Product = {
    _id: string;
    type: "Product" | "Service";
    name: string;
    sku: string;
    price: number;
    purchasePrice: number;
    stockQuantity: number;
    lowStockThreshold: number;
    category?: string;
    imageUrl?: string;
};

interface ColumnsProps {
    onEdit: (product: Product) => void;
    onDelete: (id: string) => void;
    onStockAdjust: (product: Product) => void;
    onStockHistory: (product: Product) => void;
}

export const getColumns = ({ onEdit, onDelete, onStockAdjust, onStockHistory }: ColumnsProps): ColumnDef<Product>[] => [
    {
        accessorKey: "imageUrl",
        header: "Image",
        cell: ({ row }) => {
            const imageUrl = row.getValue("imageUrl") as string;
            return imageUrl ? (
                <Image
                    src={imageUrl}
                    alt={row.getValue("name")}
                    width={40}
                    height={40}
                    className="rounded-md object-cover h-10 w-10"
                />
            ) : (
                <div className="h-10 w-10 rounded-md bg-slate-100 flex items-center justify-center">
                    <ImageIcon className="h-5 w-5 text-slate-400" />
                </div>
            );
        },
    },
    {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => {
            const product = row.original;
            return (
                <div className="flex items-center gap-2">
                    <span className="font-medium">{product.name}</span>
                    {product.type === "Service" && (
                        <span className="bg-blue-100 text-blue-800 text-[10px] font-semibold px-2 py-0.5 rounded">
                            Service
                        </span>
                    )}
                </div>
            );
        },
    },
    {
        accessorKey: "sku",
        header: "SKU",
    },
    {
        accessorKey: "category",
        header: "Category",
    },
    {
        accessorKey: "purchasePrice",
        header: () => <div className="text-right">Cost</div>,
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("purchasePrice") || "0");
            const formatted = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
            }).format(amount);
            return <div className="text-right font-medium text-slate-500">{formatted}</div>;
        },
    },
    {
        accessorKey: "price",
        header: () => <div className="text-right">Price</div>,
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("price"));
            const formatted = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
            }).format(amount);
            return <div className="text-right font-medium">{formatted}</div>;
        },
    },
    {
        id: "profit",
        header: () => <div className="text-right">Profit</div>,
        cell: ({ row }) => {
            const price = parseFloat(row.getValue("price"));
            const cost = parseFloat(row.getValue("purchasePrice") || "0");
            const profit = price - cost;
            const margin = cost > 0 ? (profit / cost) * 100 : 100;

            const formattedProfit = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
            }).format(profit);

            const isPositive = profit >= 0;

            return (
                <div className={`text-right font-medium flex flex-col ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
                    <span>{formattedProfit}</span>
                    <span className="text-xs opacity-80">{margin.toFixed(1)}%</span>
                </div>
            );
        },
    },
    {
        accessorKey: "stockQuantity",
        header: () => <div className="text-right">Stock</div>,
        cell: ({ row }) => {
            const product = row.original;
            if (product.type === "Service") {
                return <div className="text-right text-muted-foreground">—</div>;
            }

            const stock = product.stockQuantity;
            const threshold = product.lowStockThreshold || 5;

            return (
                <div className={`text-right font-medium ${stock <= threshold ? "text-red-500" : ""}`}>
                    {stock}
                </div>
            );
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const product = row.original;

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
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(product.sku)}>
                            Copy SKU
                        </DropdownMenuItem>
                        {product.type !== "Service" && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => onStockAdjust(product)}>
                                    <Settings2 className="mr-2 h-4 w-4" /> Quick Adjust Stock
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                    if (typeof window !== "undefined") {
                                        window.location.href = `/dashboard/products/${product._id}/stock-history`;
                                    }
                                }}>
                                    <History className="mr-2 h-4 w-4" /> View Stock History
                                </DropdownMenuItem>
                            </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onEdit(product)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(product._id)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                            <Trash className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];

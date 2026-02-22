"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { getColumns, Product } from "./columns";
import { ProductForm } from "@/components/products/ProductForm";
import { deleteProduct } from "@/actions/product";

import { StockAdjustModal } from "@/components/products/StockAdjustModal";

interface ProductsClientProps {
    initialProducts: Product[];
    suppliers?: any[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
    };
}

export default function ProductsClient({ initialProducts, suppliers = [], pagination }: ProductsClientProps) {
    console.log("ProductsClient received initialProducts:", initialProducts?.length);
    const router = useRouter();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [activeProduct, setActiveProduct] = useState<Product | null>(null);
    const [isStockAdjustOpen, setIsStockAdjustOpen] = useState(false);

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this product?")) {
            const res = await deleteProduct(id);
            if (res.success) {
                toast.success("Product deleted successfully");
                router.refresh();
            } else {
                toast.error(res.error || "Failed to delete product");
            }
        }
    };

    const handleStockAdjust = (product: Product) => {
        setActiveProduct(product);
        setIsStockAdjustOpen(true);
    };

    const handleStockHistory = (product: Product) => {
        // Now handled via columns.tsx router link
    };

    const columns = getColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
        onStockAdjust: handleStockAdjust,
        onStockHistory: handleStockHistory,
    });

    return (
        <>
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Products</h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Manage your store inventory
                    </p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Product
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
                        <DialogHeader>
                            <DialogTitle>Add New Product</DialogTitle>
                            <DialogDescription>
                                Fill in the details to add a new product to your inventory.
                            </DialogDescription>
                        </DialogHeader>
                        <ProductForm onSuccess={() => setIsAddOpen(false)} suppliers={suppliers} />
                    </DialogContent>
                </Dialog>
            </div>

            <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
                <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Edit Product</DialogTitle>
                        <DialogDescription>
                            Modify the product details below.
                        </DialogDescription>
                    </DialogHeader>
                    {editingProduct && (
                        <ProductForm
                            initialData={editingProduct}
                            onSuccess={() => setEditingProduct(null)}
                            suppliers={suppliers}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <StockAdjustModal
                product={activeProduct}
                isOpen={isStockAdjustOpen}
                onClose={() => setIsStockAdjustOpen(false)}
            />

            <DataTable columns={columns} data={initialProducts} />
            <PaginationControls
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalCount={pagination.totalCount}
            />
        </>
    );
}

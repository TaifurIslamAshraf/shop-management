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
import { DataTable } from "./data-table";
import { getColumns, Supplier } from "./columns";
import { SupplierForm } from "@/components/suppliers/SupplierForm";
import { deleteSupplier } from "@/actions/supplier";

interface SuppliersClientProps {
    initialSuppliers: Supplier[];
}

export default function SuppliersClient({ initialSuppliers }: SuppliersClientProps) {
    const router = useRouter();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

    const handleEdit = (supplier: Supplier) => {
        setEditingSupplier(supplier);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this supplier?")) {
            const res = await deleteSupplier(id);
            if (res.success) {
                toast.success("Supplier deleted successfully");
                router.refresh();
            } else {
                toast.error(res.error || "Failed to delete supplier");
            }
        }
    };

    const columns = getColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
    });

    return (
        <>
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Suppliers</h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Manage your suppliers and vendors
                    </p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Supplier
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
                        <DialogHeader>
                            <DialogTitle>Add New Supplier</DialogTitle>
                            <DialogDescription>
                                Fill in the details to add a new supplier.
                            </DialogDescription>
                        </DialogHeader>
                        <SupplierForm onSuccess={() => setIsAddOpen(false)} />
                    </DialogContent>
                </Dialog>
            </div>

            <Dialog open={!!editingSupplier} onOpenChange={(open) => !open && setEditingSupplier(null)}>
                <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Edit Supplier</DialogTitle>
                        <DialogDescription>
                            Modify the supplier details below.
                        </DialogDescription>
                    </DialogHeader>
                    {editingSupplier && (
                        <SupplierForm
                            initialData={editingSupplier}
                            onSuccess={() => setEditingSupplier(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <DataTable columns={columns} data={initialSuppliers} />
        </>
    );
}

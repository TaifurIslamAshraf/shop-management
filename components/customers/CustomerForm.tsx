"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { createCustomer, updateCustomer } from "@/actions/customer";
import { Plus, Pencil } from "lucide-react";

interface CustomerFormProps {
    customer?: {
        _id: string;
        name: string;
        phone?: string;
        email?: string;
        address?: string;
    };
    trigger?: React.ReactNode;
}

export default function CustomerForm({ customer, trigger }: CustomerFormProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: customer?.name || "",
        phone: customer?.phone || "",
        email: customer?.email || "",
        address: customer?.address || "",
    });

    const isEditing = !!customer;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error("Customer name is required");
            return;
        }

        setIsSubmitting(true);
        try {
            const result = isEditing
                ? await updateCustomer(customer._id, formData)
                : await createCustomer(formData);

            if (result.success) {
                toast.success(isEditing ? "Customer updated!" : "Customer created!");
                setOpen(false);
                if (!isEditing) {
                    setFormData({ name: "", phone: "", email: "", address: "" });
                }
            } else {
                toast.error(result.error);
            }
        } catch (error: any) {
            toast.error(error.message || "Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        {isEditing ? (
                            <><Pencil className="mr-2 h-4 w-4" /> Edit</>
                        ) : (
                            <><Plus className="mr-2 h-4 w-4" /> Add Customer</>
                        )}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Customer" : "Add New Customer"}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Update customer details."
                            : "Add a new customer to your system."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                placeholder="Customer name"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                                }
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                placeholder="Phone number"
                                value={formData.phone}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Email address"
                                value={formData.email}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Textarea
                                id="address"
                                placeholder="Customer address"
                                value={formData.address}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, address: e.target.value }))
                                }
                                rows={2}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting
                                ? "Saving..."
                                : isEditing
                                    ? "Update Customer"
                                    : "Create Customer"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

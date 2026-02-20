"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { adjustStock } from "@/actions/stock";
import { type Product } from "@/app/dashboard/products/columns";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
    type: z.enum(["IN", "OUT", "ADJUST"]),
    quantity: z.coerce.number().min(0, { message: "Quantity must be at least 0" }),
    reason: z.string().optional(),
    reference: z.string().optional(),
});

interface StockAdjustModalProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
}

type FormValues = z.infer<typeof formSchema>;

export function StockAdjustModal({ product, isOpen, onClose }: StockAdjustModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            type: "IN",
            quantity: 1,
            reason: "",
            reference: "",
        },
    });

    async function onSubmit(values: FormValues) {
        if (!product) return;

        try {
            setLoading(true);
            const res = await adjustStock({
                productId: product._id,
                ...values,
            });

            if (res.success) {
                toast.success("Stock adjusted successfully");
                form.reset();
                onClose();
                router.refresh();
            } else {
                toast.error(res.error || "Failed to adjust stock");
            }
        } catch (error: any) {
            toast.error(error.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    }

    if (!product) return null;

    const watchedType = form.watch("type");

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Adjust Stock</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Adjustment Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="IN">Stock In (Add)</SelectItem>
                                            <SelectItem value="OUT">Stock Out (Remove)</SelectItem>
                                            <SelectItem value="ADJUST">Set Exact Stock</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="quantity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {watchedType === "ADJUST" ? "New Total Quantity" : "Quantity to Change"}
                                    </FormLabel>
                                    <FormControl>
                                        <Input type="number" min="0" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="reference"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Reference Number (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. PO-12345 or SO-9876" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Reason (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="e.g. New shipment, Damaged, Found in warehouse" className="resize-none" rows={3} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end pt-4">
                            <Button type="button" variant="outline" onClick={onClose} className="mr-2">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Saving..." : "Save Adjustments"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

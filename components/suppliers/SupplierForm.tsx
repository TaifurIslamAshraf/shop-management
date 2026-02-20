"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { createSupplier, updateSupplier } from "@/actions/supplier";

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    companyName: z.string().optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
    status: z.enum(["Active", "Inactive"]).default("Active"),
});

type SupplierFormValues = z.infer<typeof formSchema>;

interface SupplierFormProps {
    initialData?: any;
    onSuccess?: () => void;
}

export function SupplierForm({ initialData, onSuccess }: SupplierFormProps) {
    const [isPending, startTransition] = useTransition();

    const form = useForm<SupplierFormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name: initialData?.name || "",
            companyName: initialData?.companyName || "",
            email: initialData?.email || "",
            phone: initialData?.phone || "",
            address: initialData?.address || "",
            status: initialData?.status || "Active",
        },
    });

    function onSubmit(data: SupplierFormValues) {
        startTransition(async () => {
            let res;
            if (initialData) {
                res = await updateSupplier(initialData._id, data);
            } else {
                res = await createSupplier(data);
            }

            if (res.success) {
                toast.success(`Supplier ${initialData ? "updated" : "created"} successfully`);
                if (onSuccess) onSuccess();
            } else {
                toast.error(res.error || `Failed to ${initialData ? "update" : "create"} supplier`);
            }
        });
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Contact Name *</FormLabel>
                                <FormControl>
                                    <Input placeholder="John Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="companyName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Company Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Acme Corp" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input placeholder="john@example.com" type="email" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                    <Input placeholder="+1 234 567 8900" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="Inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                            <FormItem className="md:col-span-2">
                                <FormLabel>Address</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Supplier physical address"
                                        className="resize-none"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            form.reset();
                            if (onSuccess) onSuccess();
                        }}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isPending}>
                        {isPending ? "Saving..." : initialData ? "Save Changes" : "Create Supplier"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

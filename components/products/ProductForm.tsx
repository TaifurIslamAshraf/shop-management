"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UploadButton } from "@/lib/uploadthing";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Form,
    FormControl,
    FormDescription,
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
import { createProduct, updateProduct } from "@/actions/product";

const formSchema = z.object({
    type: z.enum(["Product", "Service"]).default("Product"),
    name: z.string().min(1, { message: "Name is required" }),
    description: z.string().optional(),
    sku: z.string().min(1, { message: "SKU is required" }),
    price: z.coerce.number().min(0, { message: "Price must be a positive number" }),
    purchasePrice: z.coerce.number().min(0, { message: "Purchase price must be a valid number" }),
    stockQuantity: z.coerce.number().min(0, { message: "Stock quantity cannot be negative" }),
    lowStockThreshold: z.coerce.number().min(0, { message: "Threshold cannot be negative" }),
    category: z.string().optional(),
    imageUrl: z.string().optional(),
    supplierId: z.string().optional().or(z.literal("none")),
    expiryDate: z.date().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ProductFormProps {
    initialData?: any;
    onSuccess?: () => void;
    suppliers?: any[];
}

export function ProductForm({ initialData, onSuccess, suppliers = [] }: ProductFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || "");

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: initialData || {
            type: "Product",
            name: "",
            description: "",
            sku: "",
            price: 0,
            purchasePrice: 0,
            stockQuantity: 0,
            lowStockThreshold: 5,
            category: "",
            imageUrl: "",
            supplierId: initialData?.supplierId || "none",
            expiryDate: initialData?.expiryDate ? new Date(initialData.expiryDate) : undefined,
        },
    });

    async function onSubmit(values: FormValues) {
        try {
            setLoading(true);
            const dataToSubmit: any = { ...values, imageUrl };
            if (dataToSubmit.supplierId === "none") {
                delete dataToSubmit.supplierId;
            }

            let res;
            if (initialData) {
                res = await updateProduct(initialData._id, dataToSubmit);
            } else {
                res = await createProduct(dataToSubmit);
            }

            if (res.success) {
                toast.success(`Product ${initialData ? "updated" : "created"} successfully`);
                form.reset();
                setImageUrl("");
                router.refresh();
                if (onSuccess) onSuccess();
            } else {
                toast.error(res.error || "Something went wrong");
            }
        } catch (error: any) {
            toast.error(error.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!initialData}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Product">Physical Product</SelectItem>
                                        <SelectItem value="Service">Service (No Inventory)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Product name" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="sku"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>SKU</FormLabel>
                                <FormControl>
                                    <Input placeholder="Stock Keeping Unit" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Product description..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FormField
                        control={form.control}
                        name="purchasePrice"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Purchase Price ($)</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Selling Price ($)</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {form.watch("type") !== "Service" && (
                        <>
                            <FormField
                                control={form.control}
                                name="stockQuantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Stock Quantity</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="lowStockThreshold"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Low Stock Threshold</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </>
                    )}
                    <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Category</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Electronics" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {form.watch("type") !== "Service" && (
                        <FormField
                            control={form.control}
                            name="supplierId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Supplier</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select supplier" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {suppliers.map(sup => (
                                                <SelectItem key={sup._id} value={sup._id}>{sup.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                    <FormField
                        control={form.control}
                        name="expiryDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col mt-2.5">
                                <FormLabel>Expiry Date (Optional)</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full pl-3 text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? (
                                                    format(field.value, "PPP")
                                                ) : (
                                                    <span>Pick a date</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) =>
                                                date < new Date(new Date().setHours(0, 0, 0, 0))
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="space-y-2">
                    <FormLabel>Product Image</FormLabel>
                    {imageUrl ? (
                        <div className="relative w-40 h-40 border rounded-md overflow-hidden">
                            <img src={imageUrl} alt="Product" className="object-cover w-full h-full" />
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={() => setImageUrl("")}
                            >
                                Remove
                            </Button>
                        </div>
                    ) : (
                        <div className="border border-dashed rounded-md p-4 flex flex-col items-center justify-center min-h-[160px]">
                            <UploadButton
                                endpoint="productImage"
                                onClientUploadComplete={(res) => {
                                    const uploadedUrl = res?.[0]?.serverData?.url || res?.[0]?.url;
                                    if (uploadedUrl) {
                                        setImageUrl(uploadedUrl);
                                        toast.success("Image uploaded!");
                                    }
                                }}
                                onUploadError={(error: Error) => {
                                    toast.error(`Upload failed: ${error.message}`);
                                }}
                                appearance={{
                                    button: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2",
                                    allowedContent: "text-muted-foreground mt-2"
                                }}
                            />
                        </div>
                    )}
                </div>

                <div className="pt-4 flex justify-end">
                    <Button type="submit" disabled={loading}>
                        {loading ? "Saving..." : initialData ? "Update Product" : "Add Product"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createPurchase, updatePurchase } from "@/actions/purchase";

interface PurchaseFormProps {
    suppliers: any[];
    products: any[];
    initialData?: any;
}

interface PurchaseItem {
    productId: string;
    name: string;
    sku: string;
    quantity: number;
    purchasePrice: number;
    subTotal: number;
}

export function PurchaseForm({ suppliers, products, initialData }: PurchaseFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [supplierId, setSupplierId] = useState<string>(initialData?.supplierId?._id || initialData?.supplierId || "");
    const [purchaseNumber, setPurchaseNumber] = useState<string>(initialData?.purchaseNumber || "");
    const [status, setStatus] = useState<"Completed" | "Pending" | "Cancelled">(initialData?.status || "Completed");
    const [paidAmount, setPaidAmount] = useState<number>(initialData?.paidAmount || 0);
    const [notes, setNotes] = useState<string>(initialData?.notes || "");

    // Items management
    const [items, setItems] = useState<PurchaseItem[]>(initialData?.items || []);

    // Product Search state
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const addProductToPurchase = (product: any) => {
        // Check if already in list
        const existing = items.find(item => item.productId === product._id);
        if (existing) {
            updateItemQuantity(product._id, existing.quantity + 1);
            return;
        }

        const initialQuantity = 1;
        const subTotal = product.purchasePrice * initialQuantity;

        setItems([
            ...items,
            {
                productId: product._id,
                name: product.name,
                sku: product.sku,
                quantity: initialQuantity,
                purchasePrice: product.purchasePrice || 0,
                subTotal: subTotal,
            }
        ]);
        setSearchQuery(""); // clear search
    };

    const removeProduct = (productId: string) => {
        setItems(items.filter(item => item.productId !== productId));
    };

    const updateItemQuantity = (productId: string, quantity: number) => {
        if (quantity < 1) return;
        setItems(items.map(item => {
            if (item.productId === productId) {
                return { ...item, quantity, subTotal: quantity * item.purchasePrice };
            }
            return item;
        }));
    };

    const updateItemPrice = (productId: string, price: number) => {
        if (price < 0) return;
        setItems(items.map(item => {
            if (item.productId === productId) {
                return { ...item, purchasePrice: price, subTotal: item.quantity * price };
            }
            return item;
        }));
    };

    const totalAmount = items.reduce((sum, item) => sum + item.subTotal, 0);
    const dueAmount = Math.max(0, totalAmount - paidAmount);

    const filteredProducts = products.filter(p =>
        (p.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku || "").toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5); // limit to 5 results for dropdown

    const onSubmit = () => {
        if (!supplierId) {
            toast.error("Please select a supplier");
            return;
        }

        if (items.length === 0) {
            toast.error("Please add at least one product to the purchase order");
            return;
        }

        startTransition(async () => {
            const data = {
                supplierId,
                purchaseNumber, // optional, backend generates if empty
                status,
                paidAmount,
                totalAmount,
                notes,
                items,
            };

            const res = initialData
                ? await updatePurchase(initialData._id, data)
                : await createPurchase(data);

            if (res.success) {
                toast.success(`Purchase order ${initialData ? 'updated' : 'created'} successfully`);
                router.push("/dashboard/purchases");
            } else {
                toast.error(res.error || `Failed to ${initialData ? 'update' : 'create'} purchase order`);
            }
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                {/* Product Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle>Add Products</CardTitle>
                        <CardDescription>Search and add products to this purchase order.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or SKU..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                            />
                            {(isSearchFocused || searchQuery) && (
                                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-950 border rounded-md shadow-lg p-2 max-h-60 overflow-auto">
                                    {filteredProducts.length > 0 ? (
                                        <div className="space-y-1">
                                            {filteredProducts.map(product => (
                                                <div
                                                    key={product._id}
                                                    className="flex items-center justify-between p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer"
                                                    onClick={() => addProductToPurchase(product)}
                                                >
                                                    <div>
                                                        <div className="font-medium text-sm">{product.name}</div>
                                                        <div className="text-xs text-muted-foreground">SKU: {product.sku} | Cost: ${product.purchasePrice} | Stock: {product.stockQuantity}</div>
                                                    </div>
                                                    <Button size="icon" variant="ghost" className="h-6 w-6">
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-2 text-sm text-center text-muted-foreground">No products found</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Selected Items Table */}
                        <div className="mt-6 border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-900 border-b">
                                    <tr>
                                        <th className="text-left p-3 font-medium">Product</th>
                                        <th className="text-center p-3 font-medium w-32">Unit Cost ($)</th>
                                        <th className="text-center p-3 font-medium w-32">Qty</th>
                                        <th className="text-right p-3 font-medium w-24">Total</th>
                                        <th className="p-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-6 text-center text-muted-foreground">
                                                No products added yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map(item => (
                                            <tr key={item.productId} className="border-b last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                                <td className="p-3">
                                                    <div className="font-medium">{item.name}</div>
                                                    <div className="text-xs text-muted-foreground">{item.sku}</div>
                                                </td>
                                                <td className="p-2">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        className="h-8 text-center"
                                                        value={item.purchasePrice || ""}
                                                        onChange={(e) => updateItemPrice(item.productId, parseFloat(e.target.value) || 0)}
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        className="h-8 text-center"
                                                        value={item.quantity || ""}
                                                        onChange={(e) => updateItemQuantity(item.productId, parseInt(e.target.value) || 0)}
                                                    />
                                                </td>
                                                <td className="p-3 text-right font-medium">
                                                    ${item.subTotal.toFixed(2)}
                                                </td>
                                                <td className="p-2 text-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => removeProduct(item.productId)}
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Purchase Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Supplier *</Label>
                            <Select value={supplierId} onValueChange={setSupplierId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select supplier" />
                                </SelectTrigger>
                                <SelectContent>
                                    {suppliers.length === 0 ? (
                                        <SelectItem value="none" disabled>No suppliers found</SelectItem>
                                    ) : (
                                        suppliers.map(sup => (
                                            <SelectItem key={sup._id} value={sup._id}>{sup.name} {sup.companyName ? `(${sup.companyName})` : ''}</SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>PO Number (Optional)</Label>
                            <Input
                                placeholder="Auto-generated if left blank"
                                value={purchaseNumber}
                                onChange={(e) => setPurchaseNumber(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={status} onValueChange={(val) => setStatus(val as "Completed" | "Pending" | "Cancelled")}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Completed">Completed (Received)</SelectItem>
                                    <SelectItem value="Pending">Pending (Ordered)</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">Only 'Completed' purchases will update your stock inventory automatically.</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Payment & Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Items Total:</span>
                            <span className="font-medium">${totalAmount.toFixed(2)}</span>
                        </div>

                        <div className="pt-2 border-t space-y-2 flex justify-between items-center">
                            <Label>Amount Paid ($)</Label>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                className="w-32 text-right h-8"
                                value={paidAmount === 0 ? "" : paidAmount}
                                onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                            />
                        </div>

                        <div className="flex justify-between text-sm font-bold pt-2 border-t">
                            <span className={dueAmount > 0 ? "text-red-500" : "text-emerald-500"}>Due Balance:</span>
                            <span className={dueAmount > 0 ? "text-red-500" : "text-emerald-500"}>${dueAmount.toFixed(2)}</span>
                        </div>

                        <div className="space-y-2 pt-4">
                            <Label>Notes</Label>
                            <Textarea
                                placeholder="Add any notes..."
                                className="resize-none text-sm h-20"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                        <Button
                            className="w-full"
                            size="lg"
                            onClick={onSubmit}
                            disabled={isPending}
                        >
                            {isPending ? (initialData ? "Updating Purchase..." : "Creating Purchase...") : (initialData ? "Update Purchase" : "Complete Purchase")}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

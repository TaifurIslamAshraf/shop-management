"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Minus, Trash2, Search, ShoppingCart, UserPlus, X, Wrench, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createOrder } from "@/actions/order";
import { searchCustomers, createCustomer } from "@/actions/customer";
import { getProducts } from "@/actions/product";

interface Product {
    _id: string;
    name: string;
    sku: string;
    price: number;
    purchasePrice?: number;
    stockQuantity: number;
    imageUrl?: string;
}

interface CartItem {
    product: Product;
    quantity: number;
    subTotal: number;
    isCustom?: boolean;
    description?: string;
}

interface CustomerResult {
    _id: string;
    name: string;
    phone?: string;
    totalDue: number;
    unpaidInvoiceCount: number;
}

export default function POSClient({ initialProducts, initialTotalPages = 1 }: { initialProducts: Product[]; initialTotalPages?: number }) {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(initialTotalPages);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [cart, setCart] = useState<CartItem[]>([]);

    const isFirstRender = useRef(true);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery !== debouncedSearchQuery) {
                setDebouncedSearchQuery(searchQuery);
                setPage(1); // Reset to page 1 on new search
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, debouncedSearchQuery]);

    // Fetch products
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const fetchProducts = async () => {
            setIsLoadingProducts(true);
            try {
                const result = await getProducts({ search: debouncedSearchQuery, page, limit: 12 });
                if (result.success) {
                    // Update stock matching cart before replacing list to avoid glitch
                    setProducts(result.products || []);
                    setTotalPages(result.totalPages || 1);
                } else {
                    toast.error(result.error || "Failed to fetch products");
                }
            } catch (error) {
                toast.error("An error occurred while fetching products");
            } finally {
                setIsLoadingProducts(false);
            }
        };

        fetchProducts();
    }, [debouncedSearchQuery, page]);

    // POS State
    const [discount, setDiscount] = useState<number>(0);
    const [taxRate, setTaxRate] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");

    // Customer & Due state
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerResult | null>(null);
    const [customerSearchQuery, setCustomerSearchQuery] = useState("");
    const [customerSearchResults, setCustomerSearchResults] = useState<CustomerResult[]>([]);
    const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
    const [showCustomerSearch, setShowCustomerSearch] = useState(false);
    const [paymentType, setPaymentType] = useState<"full" | "due">("full");

    // Custom item state
    const [showCustomItemForm, setShowCustomItemForm] = useState(false);
    const [customItemName, setCustomItemName] = useState("");
    const [customItemDescription, setCustomItemDescription] = useState("");
    const [customItemPrice, setCustomItemPrice] = useState<number>(0);
    const [customItemPurchasePrice, setCustomItemPurchasePrice] = useState<number>(0);

    const [isProcessing, setIsProcessing] = useState(false);

    const checkStockAvailability = (productId: string, requestedQty: number) => {
        const product = products.find(p => p._id === productId);
        if (!product) return false;

        const existingCartItem = cart.find(c => c.product._id === productId);
        const currentCartQty = existingCartItem ? existingCartItem.quantity : 0;

        return (currentCartQty + requestedQty) <= product.stockQuantity;
    };

    const addToCart = (product: Product) => {
        if (!checkStockAvailability(product._id, 1)) {
            toast.error(`Not enough stock for ${product.name}`);
            return;
        }

        setCart((current) => {
            const existing = current.find((item) => item.product._id === product._id && !item.isCustom);
            if (existing) {
                return current.map((item) =>
                    item.product._id === product._id && !item.isCustom
                        ? {
                            ...item,
                            quantity: item.quantity + 1,
                            subTotal: (item.quantity + 1) * item.product.price,
                        }
                        : item
                );
            }
            return [
                ...current,
                { product, quantity: 1, subTotal: product.price },
            ];
        });
    };

    const addCustomItem = () => {
        if (!customItemName.trim()) {
            toast.error("Please enter a name for the custom item");
            return;
        }
        if (customItemPrice <= 0) {
            toast.error("Please enter a valid price");
            return;
        }

        const tempId = `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const customProduct: Product = {
            _id: tempId,
            name: customItemName.trim(),
            sku: "",
            price: customItemPrice,
            purchasePrice: customItemPurchasePrice || 0,
            stockQuantity: 999, // unlimited for custom items
        };

        setCart((current) => [
            ...current,
            {
                product: customProduct,
                quantity: 1,
                subTotal: customItemPrice,
                isCustom: true,
                description: customItemDescription.trim() || undefined,
            },
        ]);

        // Reset form
        setCustomItemName("");
        setCustomItemDescription("");
        setCustomItemPrice(0);
        setCustomItemPurchasePrice(0);
        setShowCustomItemForm(false);
        toast.success("Custom item added to cart");
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart((current) =>
            current.map((item) => {
                if (item.product._id === productId) {
                    const newQty = item.quantity + delta;
                    if (newQty < 1) return item;

                    // Skip stock check for custom items
                    if (!item.isCustom && delta > 0 && !checkStockAvailability(productId, delta)) {
                        toast.error(`Not enough stock for ${item.product.name}`);
                        return item;
                    }

                    return {
                        ...item,
                        quantity: newQty,
                        subTotal: newQty * item.product.price,
                    };
                }
                return item;
            })
        );
    };

    const removeFromCart = (productId: string) => {
        setCart((current) => current.filter((item) => item.product._id !== productId));
    };

    const clearCart = () => {
        setCart([]);
        setDiscount(0);
        setTaxRate(0);
        setCustomerName("");
        setCustomerPhone("");
        setSelectedCustomer(null);
        setPaymentType("full");
    };

    const cartTotals = useMemo(() => {
        const subTotal = cart.reduce((sum, item) => sum + item.subTotal, 0);
        const taxAmount = (subTotal * taxRate) / 100;
        const total = Math.max(0, subTotal - discount + taxAmount);

        return { subTotal, taxAmount, total };
    }, [cart, discount, taxRate]);

    // Customer search
    const handleCustomerSearch = useCallback(async (query: string) => {
        setCustomerSearchQuery(query);
        if (query.length < 2) {
            setCustomerSearchResults([]);
            return;
        }

        setIsSearchingCustomers(true);
        try {
            const result = await searchCustomers(query);
            if (result.success) {
                setCustomerSearchResults(result.customers || []);
            }
        } catch {
            // silently fail
        } finally {
            setIsSearchingCustomers(false);
        }
    }, []);

    const selectCustomer = (customer: CustomerResult) => {
        setSelectedCustomer(customer);
        setCustomerName(customer.name);
        setCustomerPhone(customer.phone || "");
        setShowCustomerSearch(false);
        setCustomerSearchQuery("");
        setCustomerSearchResults([]);
    };

    const clearCustomer = () => {
        setSelectedCustomer(null);
        setPaymentType("full");
    };

    // Quick create customer
    const handleQuickCreateCustomer = async () => {
        if (!customerName.trim()) {
            toast.error("Please enter a customer name first");
            return;
        }

        try {
            const result = await createCustomer({
                name: customerName.trim(),
                phone: customerPhone.trim() || undefined,
            });

            if (result.success && result.customer) {
                setSelectedCustomer(result.customer);
                setShowCustomerSearch(false);
                toast.success("Customer created!");
            } else {
                toast.error(result.error || "Failed to create customer");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to create customer");
        }
    };

    const handleCheckout = async () => {
        if (cart.length === 0) {
            toast.error("Cart is empty");
            return;
        }

        if (paymentType === "due" && !selectedCustomer) {
            toast.error("Please select a customer for credit sale");
            return;
        }

        setIsProcessing(true);
        try {
            const orderData = {
                customerId: selectedCustomer?._id || undefined,
                customerName: customerName.trim() || undefined,
                customerPhone: customerPhone.trim() || undefined,
                items: cart.map(c => ({
                    productId: c.isCustom ? undefined : c.product._id,
                    name: c.product.name,
                    sku: c.isCustom ? undefined : c.product.sku,
                    price: c.product.price,
                    purchasePrice: c.product.purchasePrice || 0,
                    quantity: c.quantity,
                    isCustom: c.isCustom || false,
                    description: c.description || undefined,
                })),
                discountAmount: Number(discount),
                taxAmount: Number(cartTotals.taxAmount.toFixed(2)),
                paidAmount: paymentType === "due" ? 0 : undefined,
                paymentMethod: paymentMethod as any,
            };

            const result = await createOrder(orderData);

            if (result.success) {
                toast.success(
                    paymentType === "due"
                        ? "Credit sale created!"
                        : "Checkout successful!"
                );
                clearCart();
                router.push(`/dashboard/pos/receipt/${result.order?._id}`);
            } else {
                toast.error(result.error);
            }

        } catch (error: any) {
            toast.error(error.message || "Checkout failed");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
            {/* Left Side: Products Grid */}
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search products by name or SKU..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button
                        variant="outline"
                        className="gap-2 shrink-0"
                        onClick={() => setShowCustomItemForm(!showCustomItemForm)}
                    >
                        <Wrench className="h-4 w-4" />
                        Custom Item
                    </Button>
                </div>

                {/* Custom Item Form */}
                {showCustomItemForm && (
                    <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Wrench className="h-4 w-4 text-primary" />
                                <h3 className="text-sm font-semibold">Add Custom Item</h3>
                                <span className="text-xs text-muted-foreground">(Service / Repair)</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">Item Name *</label>
                                    <Input
                                        placeholder="e.g. Screen Replacement"
                                        className="h-8 text-sm"
                                        value={customItemName}
                                        onChange={(e) => setCustomItemName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">Description</label>
                                    <Input
                                        placeholder="e.g. iPhone 14 Pro Max"
                                        className="h-8 text-sm"
                                        value={customItemDescription}
                                        onChange={(e) => setCustomItemDescription(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">Selling Price *</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        placeholder="0.00"
                                        className="h-8 text-sm"
                                        value={customItemPrice || ""}
                                        onChange={(e) => setCustomItemPrice(Number(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">Cost/Purchase Price</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        placeholder="0.00 (for profit tracking)"
                                        className="h-8 text-sm"
                                        value={customItemPurchasePrice || ""}
                                        onChange={(e) => setCustomItemPurchasePrice(Number(e.target.value))}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 mt-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => setShowCustomItemForm(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    className="flex-1"
                                    onClick={addCustomItem}
                                >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add to Cart
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="flex-1 overflow-auto border rounded-md">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-[80px]">Image</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                                <TableHead className="text-right">Stock</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoadingProducts ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                        Loading products...
                                    </TableCell>
                                </TableRow>
                            ) : products.map((product) => (
                                <TableRow
                                    key={product._id}
                                    className={`cursor-pointer transition-colors hover:bg-muted/50 ${product.stockQuantity <= 0 ? 'opacity-50' : ''}`}
                                    onClick={() => product.stockQuantity > 0 && addToCart(product)}
                                >
                                    <TableCell>
                                        <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center overflow-hidden shrink-0">
                                            {product.imageUrl ? (
                                                <img src={product.imageUrl} alt={product.name} className="object-cover w-full h-full" />
                                            ) : (
                                                <span className="text-muted-foreground text-[10px]">No img</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium whitespace-nowrap">{product.name}</TableCell>
                                    <TableCell className="text-muted-foreground whitespace-nowrap">{product.sku}</TableCell>
                                    <TableCell className="text-right font-bold whitespace-nowrap">${product.price.toFixed(2)}</TableCell>
                                    <TableCell className={`text-right whitespace-nowrap ${product.stockQuantity <= 0 ? 'text-red-500 font-bold' : ''}`}>
                                        {product.stockQuantity}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!isLoadingProducts && products.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No products found matching &quot;{searchQuery}&quot;
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination Controls */}
                {!isLoadingProducts && totalPages > 1 && (
                    <div className="flex items-center justify-between shrink-0 border bg-card rounded-md p-2 shadow-sm">
                        <p className="text-xs text-muted-foreground font-medium pl-1">
                            Page {page} of {totalPages}
                        </p>
                        <div className="flex items-center gap-1.5">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page <= 1}
                            >
                                <ChevronLeft className="h-3 w-3 mr-0.5" />
                                Prev
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                            >
                                Next
                                <ChevronRight className="h-3 w-3 ml-0.5" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Side: Cart / POS Checkout */}
            <div className="w-full lg:w-[400px] flex flex-col gap-4 border rounded-lg bg-card p-4 overflow-hidden h-full shrink-0">
                <div className="flex-1 overflow-auto">
                    <h2 className="text-lg font-semibold border-b pb-2 mb-4">Current Order</h2>
                    {cart.length === 0 ? (
                        <div className="text-center text-muted-foreground p-8 flex flex-col items-center justify-center h-48">
                            <ShoppingCart className="w-12 h-12 mb-4 opacity-20" />
                            <p>Cart is empty</p>
                            <p className="text-sm mt-2">Add items from the store to begin</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {cart.map((item) => (
                                <div key={item.product._id} className="flex flex-col gap-2 border-b pb-4">
                                    <div className="flex justify-between font-medium">
                                        <span className="truncate pr-4 flex items-center gap-1.5">
                                            {item.isCustom && (
                                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                                                    <Wrench className="h-2.5 w-2.5 mr-0.5" />
                                                    Custom
                                                </Badge>
                                            )}
                                            {item.product.name}
                                        </span>
                                        <span>${item.subTotal.toFixed(2)}</span>
                                    </div>
                                    {item.description && (
                                        <p className="text-xs text-muted-foreground italic">{item.description}</p>
                                    )}
                                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                                        <span>${item.product.price.toFixed(2)} / ea</span>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.product._id, -1)}>
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <span className="w-8 text-center">{item.quantity}</span>
                                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.product._id, 1)}>
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 ml-2 text-destructive hover:text-destructive" onClick={() => removeFromCart(item.product._id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-4 pt-4 border-t shrink-0">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Discount ($)</label>
                            <Input
                                type="number"
                                min="0"
                                value={discount}
                                onChange={(e) => setDiscount(Number(e.target.value))}
                                className="h-8"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Tax Rate (%)</label>
                            <Input
                                type="number"
                                min="0" max="100"
                                value={taxRate}
                                onChange={(e) => setTaxRate(Number(e.target.value))}
                                className="h-8"
                            />
                        </div>
                    </div>

                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>${cartTotals.subTotal.toFixed(2)}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>Discount</span>
                                <span>-${discount.toFixed(2)}</span>
                            </div>
                        )}
                        {cartTotals.taxAmount > 0 && (
                            <div className="flex justify-between text-muted-foreground">
                                <span>Tax ({taxRate}%)</span>
                                <span>+${cartTotals.taxAmount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-lg pt-2 border-t">
                            <span>Total</span>
                            <span>${cartTotals.total.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t">
                        {/* Customer Selection */}
                        <div className="space-y-2">
                            {selectedCustomer ? (
                                <div className="flex items-center justify-between bg-muted/50 rounded-md p-2">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{selectedCustomer.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {selectedCustomer.totalDue > 0 && (
                                                <span className="text-red-500">Due: ${selectedCustomer.totalDue.toFixed(2)} </span>
                                            )}
                                            {selectedCustomer.phone && `• ${selectedCustomer.phone}`}
                                        </p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={clearCustomer}>
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            ) : showCustomerSearch ? (
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                                        <Input
                                            placeholder="Search customers..."
                                            className="h-8 text-sm pl-7"
                                            value={customerSearchQuery}
                                            onChange={(e) => handleCustomerSearch(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                    {customerSearchResults.length > 0 && (
                                        <div className="max-h-32 overflow-auto border rounded-md">
                                            {customerSearchResults.map((c) => (
                                                <div
                                                    key={c._id}
                                                    className="p-2 hover:bg-muted/50 cursor-pointer text-sm border-b last:border-b-0"
                                                    onClick={() => selectCustomer(c)}
                                                >
                                                    <span className="font-medium">{c.name}</span>
                                                    {c.phone && <span className="text-muted-foreground ml-2">{c.phone}</span>}
                                                    {c.totalDue > 0 && (
                                                        <Badge variant="destructive" className="ml-2 text-[10px]">
                                                            Due: ${c.totalDue.toFixed(2)}
                                                        </Badge>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="text-xs flex-1" onClick={() => setShowCustomerSearch(false)}>
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <Button
                                    variant="outline"
                                    className="w-full h-8 text-sm"
                                    onClick={() => setShowCustomerSearch(true)}
                                >
                                    <UserPlus className="mr-2 h-3.5 w-3.5" />
                                    Select Customer (for credit)
                                </Button>
                            )}
                        </div>

                        {/* Payment Type (only if customer selected) */}
                        {selectedCustomer && (
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Payment Type</Label>
                                <RadioGroup
                                    value={paymentType}
                                    onValueChange={(v) => setPaymentType(v as "full" | "due")}
                                    className="flex gap-4"
                                >
                                    <div className="flex items-center space-x-1.5">
                                        <RadioGroupItem value="full" id="pay-full" />
                                        <Label htmlFor="pay-full" className="text-sm cursor-pointer">Full Payment</Label>
                                    </div>
                                    <div className="flex items-center space-x-1.5">
                                        <RadioGroupItem value="due" id="pay-due" />
                                        <Label htmlFor="pay-due" className="text-sm cursor-pointer">Due (Credit)</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        )}

                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Payment Method" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Cash">Cash</SelectItem>
                                <SelectItem value="Card">Card</SelectItem>
                                <SelectItem value="Mobile Banking">Mobile Banking</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>

                        {!selectedCustomer && (
                            <div className="grid grid-cols-2 gap-2">
                                <Input placeholder="Customer Name" className="h-9 text-sm" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                                <Input placeholder="Phone" className="h-9 text-sm" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                            </div>
                        )}

                        {/* Quick create customer from name/phone fields */}
                        {!selectedCustomer && customerName.trim() && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-xs"
                                onClick={handleQuickCreateCustomer}
                            >
                                <UserPlus className="mr-1.5 h-3 w-3" />
                                Create &quot;{customerName.trim()}&quot; as Customer
                            </Button>
                        )}

                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={clearCart} disabled={cart.length === 0 || isProcessing}>
                                Clear
                            </Button>
                            <Button
                                className="flex-2"
                                onClick={handleCheckout}
                                disabled={cart.length === 0 || isProcessing}
                                variant={paymentType === "due" ? "destructive" : "default"}
                            >
                                {isProcessing
                                    ? "Processing..."
                                    : paymentType === "due"
                                        ? `Credit Sale $${cartTotals.total.toFixed(2)}`
                                        : "Checkout & Print"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

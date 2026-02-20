"use client";

import { Building2, Mail, Phone, MapPin, ArrowLeft, Truck, Package, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function SupplierDetailClient({
    supplier,
    recentPurchases,
    suppliedProducts
}: {
    supplier: any;
    recentPurchases: any[];
    suppliedProducts: any[];
}) {
    const router = useRouter();

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);
    };

    return (
        <>
            <div className="flex items-center gap-4 mb-2">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{supplier.name}</h2>
                    <p className="text-muted-foreground mt-1 text-sm flex items-center gap-2">
                        {supplier.companyName && <span><Building2 className="inline-block mr-1 h-3 w-3" /> {supplier.companyName}</span>}
                        <Badge variant={supplier.status === "Active" ? "default" : "secondary"} className={supplier.status === "Active" ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                            {supplier.status}
                        </Badge>
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 pt-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Due Amount</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${supplier.dueAmount > 0 ? "text-red-500" : "text-emerald-500"}`}>
                            {formatCurrency(supplier.dueAmount)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Outstanding payment to supplier
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Products Supplied</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{suppliedProducts.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Items currently in catalog
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
                        <Truck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{recentPurchases.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Recent purchase orders
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Contact Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 mt-2">
                        {supplier.phone && (
                            <div className="flex items-center text-sm text-muted-foreground">
                                <Phone className="mr-2 h-4 w-4" /> {supplier.phone}
                            </div>
                        )}
                        {supplier.email && (
                            <div className="flex items-center text-sm text-muted-foreground">
                                <Mail className="mr-2 h-4 w-4" /> {supplier.email}
                            </div>
                        )}
                        {supplier.address && (
                            <div className="flex items-start text-sm text-muted-foreground mt-2">
                                <MapPin className="mr-2 h-4 w-4 mt-0.5" />
                                <span className="line-clamp-2">{supplier.address}</span>
                            </div>
                        )}
                        {!supplier.phone && !supplier.email && !supplier.address && (
                            <div className="text-sm text-muted-foreground italic">No contact details provided.</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 mt-6">
                {/* Recent Purchases */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Recent Purchases</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>PO Number</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Items</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead className="text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentPurchases.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                                                No purchases found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        recentPurchases.map((purchase) => (
                                            <TableRow key={purchase._id}>
                                                <TableCell className="font-medium">
                                                    <Link href={`/dashboard/purchases/${purchase._id}`} className="text-blue-600 hover:underline">
                                                        {purchase.purchaseNumber}
                                                    </Link>
                                                </TableCell>
                                                <TableCell>{format(new Date(purchase.createdAt), "MMM d, yyyy")}</TableCell>
                                                <TableCell>{purchase.items.length}</TableCell>
                                                <TableCell className="text-right font-medium">{formatCurrency(purchase.totalAmount)}</TableCell>
                                                <TableCell className="text-right">
                                                    <Badge variant={purchase.paymentStatus === "Paid" ? "default" : purchase.paymentStatus === "Partial" ? "secondary" : "destructive"}>
                                                        {purchase.paymentStatus}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Products Supplied */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Products Supplied</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead>SKU</TableHead>
                                        <TableHead className="text-right">Cost</TableHead>
                                        <TableHead className="text-right">Stock</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {suppliedProducts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                                                No products associated.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        suppliedProducts.map((product) => (
                                            <TableRow key={product._id}>
                                                <TableCell className="font-medium">{product.name}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground">{product.sku}</TableCell>
                                                <TableCell className="text-right font-medium">{formatCurrency(product.purchasePrice)}</TableCell>
                                                <TableCell className="text-right">
                                                    <span className={product.stockQuantity <= (product.lowStockThreshold || 5) ? "text-red-500 font-bold" : ""}>
                                                        {product.stockQuantity}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

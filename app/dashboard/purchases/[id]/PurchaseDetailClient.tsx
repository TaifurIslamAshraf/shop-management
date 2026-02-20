"use client";

import { ArrowLeft, User, MapPin, Phone, Mail, FileText, Calendar, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
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

export default function PurchaseDetailClient({ purchase }: { purchase: any }) {
    const router = useRouter();

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);
    };

    const supplier = purchase.supplierId;

    return (
        <>
            <div className="flex items-center gap-4 mb-2">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Purchase Order {purchase.purchaseNumber}</h2>
                    <p className="text-muted-foreground mt-1 text-sm flex items-center gap-2">
                        <Calendar className="h-3 w-3" /> {format(new Date(purchase.createdAt), "MMMM d, yyyy")}
                        <Badge variant={purchase.status === "Completed" ? "default" : "secondary"} className="ml-2">
                            {purchase.status}
                        </Badge>
                        <Badge variant={purchase.paymentStatus === "Paid" ? "default" : purchase.paymentStatus === "Partial" ? "secondary" : "destructive"}>
                            Payment: {purchase.paymentStatus}
                        </Badge>
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Supplier Info */}
                <Card>
                    <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <User className="h-5 w-5" /> Supplier Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div>
                            <div className="font-semibold text-lg">{supplier?.name || "Unknown Supplier"}</div>
                            {supplier?.companyName && <div className="text-muted-foreground">{supplier?.companyName}</div>}
                        </div>
                        <div className="space-y-2 text-sm">
                            {supplier?.email && (
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span>{supplier.email}</span>
                                </div>
                            )}
                            {supplier?.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span>{supplier.phone}</span>
                                </div>
                            )}
                            {supplier?.address && (
                                <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <span>{supplier.address}</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Purchase Summary */}
                <Card>
                    <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="h-5 w-5" /> Order Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-muted-foreground">Total Items</span>
                                <span className="font-medium">{purchase.items.length}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-muted-foreground">Total Amount</span>
                                <span className="font-medium">{formatCurrency(purchase.totalAmount)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-muted-foreground">Amount Paid</span>
                                <span className="font-medium text-emerald-600 dark:text-emerald-500">{formatCurrency(purchase.paidAmount)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 bg-slate-50 dark:bg-slate-900 p-3 rounded-md">
                                <span className="font-semibold">Balance Due</span>
                                <span className={`font-bold ${purchase.dueAmount > 0 ? "text-red-500" : "text-emerald-500"}`}>
                                    {formatCurrency(purchase.dueAmount)}
                                </span>
                            </div>
                            {purchase.status === "Completed" && (
                                <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-500 mt-2 bg-emerald-50 dark:bg-emerald-950/50 p-3 rounded-md">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span>Stock inventory has been successfully updated.</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Items Table */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 dark:bg-slate-900">
                                    <TableHead>Product</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead className="text-right">Unit Price</TableHead>
                                    <TableHead className="text-right">Quantity</TableHead>
                                    <TableHead className="text-right">Subtotal</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {purchase.items.map((item: any) => (
                                    <TableRow key={item._id || item.productId}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell className="text-muted-foreground text-xs">{item.sku}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(item.purchasePrice)}</TableCell>
                                        <TableCell className="text-right">{item.quantity}</TableCell>
                                        <TableCell className="text-right font-medium">{formatCurrency(item.subTotal)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {purchase.notes && (
                        <div className="mt-8 border-t pt-6">
                            <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Order Notes</h4>
                            <p className="text-sm whitespace-pre-wrap p-4 bg-slate-50 dark:bg-slate-900 rounded-md">
                                {purchase.notes}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    );
}

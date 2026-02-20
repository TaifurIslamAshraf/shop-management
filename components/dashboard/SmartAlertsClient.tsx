"use client";

import { useEffect, useState } from "react";
import { getSmartAlerts } from "@/actions/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Clock, PackageX, DollarSign, PackageMinus } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type AlertData = {
    lowStock: any[];
    outOfStock: any[];
    expiring: any[];
    duePurchases: any[];
    dueOrders: any[];
};

export function SmartAlertsClient() {
    const [alerts, setAlerts] = useState<AlertData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAlerts = async () => {
            const res = await getSmartAlerts();
            if (res.success && res.alerts) {
                setAlerts(res.alerts);
            }
            setLoading(false);
        };
        fetchAlerts();
    }, []);

    if (loading) {
        return (
            <Card className="col-span-4 lg:col-span-3">
                <CardHeader>
                    <CardTitle>Smart Alerts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </CardContent>
            </Card>
        );
    }

    if (!alerts) return null;

    const totalAlerts =
        alerts.lowStock.length +
        alerts.outOfStock.length +
        alerts.expiring.length +
        alerts.duePurchases.length +
        alerts.dueOrders.length;

    return (
        <Card className="col-span-4 lg:col-span-3 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        Smart Alerts
                        {totalAlerts > 0 && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                {totalAlerts}
                            </span>
                        )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Action items requiring your attention</p>
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto max-h-[600px] pr-2 space-y-4">
                {totalAlerts === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed rounded-lg">
                        <AlertCircle className="h-8 w-8 text-muted-foreground mb-4 opacity-20" />
                        <p className="text-sm text-muted-foreground text-balance">
                            All caught up! No active alerts at the moment.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Out of Stock */}
                        {alerts.outOfStock.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold flex items-center text-red-600">
                                    <PackageX className="h-4 w-4 mr-2" /> Out of Stock ({alerts.outOfStock.length})
                                </h4>
                                {alerts.outOfStock.slice(0, 3).map((item) => (
                                    <div key={item._id} className="flex flex-col gap-2 p-3 border rounded-lg bg-red-50/50">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium text-sm">{item.name}</p>
                                                <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                                            </div>
                                            <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                                                <Link href={`/dashboard/purchases/new`}>Restock</Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Expiring Products */}
                        {alerts.expiring.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold flex items-center text-orange-600">
                                    <Clock className="h-4 w-4 mr-2" /> Expiring Soon ({alerts.expiring.length})
                                </h4>
                                {alerts.expiring.slice(0, 3).map((item) => {
                                    const isExpired = new Date(item.expiryDate) < new Date();
                                    return (
                                        <div key={item._id} className={`flex flex-col gap-2 p-3 border rounded-lg ${isExpired ? 'bg-red-50/50 border-red-200' : 'bg-orange-50/50'}`}>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium text-sm">{item.name}</p>
                                                    <p className={`text-xs font-semibold ${isExpired ? 'text-red-600' : 'text-orange-600'}`}>
                                                        {isExpired ? 'Expired: ' : 'Expires: '}
                                                        {format(new Date(item.expiryDate), 'MMM d, yyyy')}
                                                    </p>
                                                </div>
                                                <p className="text-xs text-muted-foreground">{item.stockQuantity} in stock</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* Low Stock */}
                        {alerts.lowStock.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold flex items-center text-yellow-600">
                                    <PackageMinus className="h-4 w-4 mr-2" /> Low Stock ({alerts.lowStock.length})
                                </h4>
                                {alerts.lowStock.slice(0, 3).map((item) => (
                                    <div key={item._id} className="flex flex-col gap-2 p-3 border rounded-lg bg-yellow-50/50">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-medium text-sm">{item.name}</p>
                                            </div>
                                            <p className="text-xs font-bold text-yellow-600">{item.stockQuantity} left</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Due Purchases */}
                        {alerts.duePurchases.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold flex items-center text-blue-600">
                                    <DollarSign className="h-4 w-4 mr-2" /> Due Supplier Payments ({alerts.duePurchases.length})
                                </h4>
                                {alerts.duePurchases.slice(0, 3).map((purchase) => (
                                    <div key={purchase._id} className="flex flex-col gap-2 p-3 border rounded-lg bg-blue-50/50">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium text-sm">{purchase.supplierId?.name || 'Unknown Supplier'}</p>
                                                <p className="text-xs text-muted-foreground">PO: {purchase.purchaseNumber}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-blue-600">${purchase.dueAmount.toFixed(2)}</p>
                                                <p className="text-xs text-muted-foreground">Due</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Due Orders / Pending Customer Invoices */}
                        {alerts.dueOrders.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold flex items-center text-purple-600">
                                    <DollarSign className="h-4 w-4 mr-2" /> Pending Invoices ({alerts.dueOrders.length})
                                </h4>
                                {alerts.dueOrders.slice(0, 3).map((order) => (
                                    <div key={order._id} className="flex flex-col gap-2 p-3 border rounded-lg bg-purple-50/50">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium text-sm">{order.customerName || 'Walk-in Customer'}</p>
                                                <p className="text-xs text-muted-foreground">Order: {order.orderNumber}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-purple-600">${order.totalAmount.toFixed(2)}</p>
                                                <p className="text-xs text-muted-foreground">Total</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}

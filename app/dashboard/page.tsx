import { getDailySalesSummary } from "@/actions/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, DollarSign, Activity } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SmartAlertsClient } from "@/components/dashboard/SmartAlertsClient";

export default async function DashboardPage() {
    const { summary, success } = await getDailySalesSummary();

    if (!success || !summary) {
        return (
            <div className="p-6">
                <h2 className="text-2xl font-bold tracking-tight text-red-500">Failed to load dashboard data</h2>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <Button asChild>
                    <Link href="/dashboard/products">Manage Products</Link>
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${summary.totalRevenue.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total revenue today</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${summary.netProfit?.toFixed(2) || "0.00"}</div>
                        <p className="text-xs text-muted-foreground mt-1">Revenue - COGS - Expenses</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${summary.totalExpenses?.toFixed(2) || "0.00"}</div>
                        <p className="text-xs text-muted-foreground mt-1">Operational costs today</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <SmartAlertsClient />
                {/* Placeholder for future charts/widgets on the right side */}
                <Card className="col-span-4 lg:col-span-4 bg-muted/20 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center p-12 text-center h-full min-h-[400px]">
                        <Activity className="h-8 w-8 text-muted-foreground mb-4 opacity-20" />
                        <p className="text-sm text-muted-foreground font-medium">Sales Analytics</p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-sm text-balance">
                            Detailed sales charts and analytics will appear here in a future update.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

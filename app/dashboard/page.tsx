import { getDailySalesSummary, getDueMetrics, getWeeklyAnalytics } from "@/actions/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, DollarSign, Activity, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SmartAlertsClient } from "@/components/dashboard/SmartAlertsClient";
import { ChartAreaInteractive } from "@/components/dashboard/chart-area-interactive";
import { DashboardDateFilter } from "@/components/dashboard/DashboardDateFilter";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ from?: string, to?: string }> }) {
    const resolvedParams = await searchParams;
    const from = resolvedParams.from;
    const to = resolvedParams.to;

    const [{ summary, success }, dueResult, analyticsResult] = await Promise.all([
        getDailySalesSummary(from, to),
        getDueMetrics(),
        getWeeklyAnalytics(from, to),
    ]);

    if (!success || !summary) {
        return (
            <div className="p-6">
                <h2 className="text-2xl font-bold tracking-tight text-red-500">Failed to load dashboard data</h2>
            </div>
        );
    }

    const dueMetrics = dueResult.metrics;
    const analyticsData = analyticsResult.data || [];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <div className="flex items-center gap-4">
                    <DashboardDateFilter />
                    <Button asChild>
                        <Link href="/dashboard/products">Manage Products</Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${summary.totalRevenue.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total revenue for period</p>
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
                        <p className="text-xs text-muted-foreground mt-1">Operational costs for period</p>
                    </CardContent>
                </Card>
            </div>

            {/* Due Overview */}
            {dueMetrics && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className={dueMetrics.totalOutstanding > 0 ? "border-red-200" : ""}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${dueMetrics.totalOutstanding > 0 ? "text-red-600" : ""}`}>
                                ${dueMetrics.totalOutstanding.toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                <Link href="/dashboard/customers" className="hover:underline">
                                    {dueMetrics.customersWithDue} customer(s) with due
                                </Link>
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Overdue Invoices</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{dueMetrics.totalOverdueInvoices}</div>
                            <p className="text-xs text-muted-foreground mt-1">Unpaid or partial invoices</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Multi-Due Customers</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{dueMetrics.multiDueCustomers}</div>
                            <p className="text-xs text-muted-foreground mt-1">Customers with 2+ unpaid</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Oldest Unpaid</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold">
                                {dueMetrics.oldestUnpaidDate
                                    ? new Date(dueMetrics.oldestUnpaidDate).toLocaleDateString()
                                    : "—"}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Oldest pending invoice</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            <SmartAlertsClient />

            <ChartAreaInteractive data={analyticsData} />
        </div>
    );
}

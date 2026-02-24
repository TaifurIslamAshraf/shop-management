"use server";

import { auth } from "@clerk/nextjs/server";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import Order from "@/models/Order";
import Purchase from "@/models/Purchase";
import Customer from "@/models/Customer";
import Expense from "@/models/Expense";

export async function getSmartAlerts() {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await connectDB();

        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        const [lowStockProducts, outOfStockProducts, expiringProducts, pendingPurchases, pendingOrders] = await Promise.all([
            // 1. Low Stock & Out of Stock
            // Products where 0 < stockQuantity <= lowStockThreshold
            Product.find({
                userId,
                stockQuantity: { $gt: 0 },
                $expr: { $lte: ["$stockQuantity", "$lowStockThreshold"] }
            }).lean(),

            // Products where stockQuantity === 0
            Product.find({
                userId,
                stockQuantity: 0
            }).lean(),

            // 2. Expiring Products (within next 30 days)
            Product.find({
                userId,
                expiryDate: { $lte: thirtyDaysFromNow }
            }).sort({ expiryDate: 1 }).lean(),

            // 3. Due Payments
            // Pending supplier payments (Purchases)
            Purchase.find({
                userId,
                dueAmount: { $gt: 0 }
            }).populate("supplierId", "name companyName").lean(),

            // Pending customer payments (Orders)
            Order.find({
                userId,
                paymentStatus: "Pending"
            }).lean()
        ]);

        return {
            success: true,
            alerts: {
                lowStock: JSON.parse(JSON.stringify(lowStockProducts)),
                outOfStock: JSON.parse(JSON.stringify(outOfStockProducts)),
                expiring: JSON.parse(JSON.stringify(expiringProducts)),
                duePurchases: JSON.parse(JSON.stringify(pendingPurchases)),
                dueOrders: JSON.parse(JSON.stringify(pendingOrders))
            }
        };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to fetch smart alerts" };
    }
}

export async function getDailySalesSummary(from?: Date | string, to?: Date | string) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await connectDB();

        const endOfDay = to ? new Date(to) : new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const startOfDay = from ? new Date(from) : new Date();
        if (!from && !to) {
            // Default 30 days if no dates provided
            startOfDay.setDate(startOfDay.getDate() - 30);
        }
        startOfDay.setHours(0, 0, 0, 0);

        // Fetch Orders and Expenses for today concurrently
        const [todayOrders, todayExpenses] = await Promise.all([
            Order.find({
                userId,
                createdAt: { $gte: startOfDay, $lte: endOfDay }
            }).lean(),
            import("@/models/Expense").then((module) => module.default.find({
                userId,
                expenseDate: { $gte: startOfDay, $lte: endOfDay }
            }).lean())
        ]);

        const totalOrders = todayOrders.length;
        const totalRevenue = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Calculate Cost of Goods Sold (COGS)
        let totalCogs = 0;
        todayOrders.forEach(order => {
            order.items.forEach(item => {
                // If purchasePrice is 0 or missing, it contributes 0 to COGS (100% margin)
                const cost = (item.purchasePrice || 0) * item.quantity;
                totalCogs += cost;
            });
        });

        const grossProfit = totalRevenue - totalCogs;

        // Calculate Total Expenses
        const totalExpenses = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0);

        // Calculate Net Profit
        const netProfit = grossProfit - totalExpenses;

        return {
            success: true,
            summary: {
                totalOrders,
                totalRevenue,
                averageOrderValue,
                totalCogs,
                grossProfit,
                totalExpenses,
                netProfit
            }
        };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to fetch daily sales summary" };
    }
}

export async function getDueMetrics() {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await connectDB();

        const [dueStats, oldestUnpaid, multiDueCustomers, totalOverdueInvoices] = await Promise.all([
            Customer.aggregate([
                { $match: { userId, totalDue: { $gt: 0 } } },
                {
                    $group: {
                        _id: null,
                        totalOutstanding: { $sum: "$totalDue" },
                        customersWithDue: { $sum: 1 },
                    },
                },
            ]),
            Order.findOne({
                userId,
                paymentStatus: { $in: ["Unpaid", "Partial"] },
            })
                .sort({ createdAt: 1 })
                .select("createdAt orderNumber")
                .lean(),
            Customer.countDocuments({
                userId,
                unpaidInvoiceCount: { $gt: 1 },
            }),
            Order.countDocuments({
                userId,
                paymentStatus: { $in: ["Unpaid", "Partial"] },
            }),
        ]);

        return {
            success: true,
            metrics: {
                totalOutstanding: dueStats[0]?.totalOutstanding || 0,
                customersWithDue: dueStats[0]?.customersWithDue || 0,
                multiDueCustomers,
                oldestUnpaidDate: oldestUnpaid?.createdAt || null,
                totalOverdueInvoices,
            },
        };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to fetch due metrics" };
    }
}

export async function getWeeklyAnalytics(from?: Date | string, to?: Date | string) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await connectDB();

        // Build date range
        let endDate = to ? new Date(to) : new Date();
        let startDate = from ? new Date(from) : new Date();

        if (!from && !to) {
            startDate.setDate(endDate.getDate() - 29); // 30 days inclusive
        }

        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        // Calculate maximum 90 days if date range is longer to prevent excessive data
        const diffDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const numDays = Math.min(diffDays + 1, 90);

        // Always reconstruct the startDate from endDate and numDays if limited to 90
        startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - numDays + 1);
        startDate.setHours(0, 0, 0, 0);

        const days: { date: string; start: Date; end: Date }[] = [];
        for (let i = numDays - 1; i >= 0; i--) {
            const d = new Date(endDate);
            d.setDate(d.getDate() - i);
            const start = new Date(d);
            start.setHours(0, 0, 0, 0);
            const end = new Date(d);
            end.setHours(23, 59, 59, 999);
            // ISO date string YYYY-MM-DD for chart parsing
            const date = start.toISOString().split("T")[0];
            days.push({ date, start, end });
        }

        const dateRangeStart = days[0].start;

        // Fetch all orders and expenses in the 90-day window
        const [orders, expenses] = await Promise.all([
            Order.find({
                userId,
                createdAt: { $gte: dateRangeStart, $lte: endDate },
            })
                .select("totalAmount items createdAt")
                .lean(),
            Expense.find({
                userId,
                expenseDate: { $gte: dateRangeStart, $lte: endDate },
            })
                .select("amount expenseDate")
                .lean(),
        ]);

        // Bucket into days
        const data = days.map(({ date, start, end }) => {
            const dayOrders = orders.filter(
                (o) => new Date(o.createdAt) >= start && new Date(o.createdAt) <= end
            );
            const dayExpenses = expenses.filter(
                (e) => new Date(e.expenseDate) >= start && new Date(e.expenseDate) <= end
            );

            const revenue = dayOrders.reduce((s, o) => s + o.totalAmount, 0);
            let cogs = 0;
            dayOrders.forEach((o) => {
                (o.items || []).forEach((item: any) => {
                    cogs += (item.purchasePrice || 0) * item.quantity;
                });
            });
            const totalExpenses = dayExpenses.reduce((s, e) => s + e.amount, 0);
            const netProfit = revenue - cogs - totalExpenses;

            return {
                date,
                revenue: Math.round(revenue * 100) / 100,
                expenses: Math.round(totalExpenses * 100) / 100,
                netProfit: Math.round(netProfit * 100) / 100,
            };
        });

        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to fetch weekly analytics" };
    }
}

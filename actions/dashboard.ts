"use server";

import { auth } from "@clerk/nextjs/server";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import Order from "@/models/Order";
import Purchase from "@/models/Purchase";

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

export async function getDailySalesSummary() {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await connectDB();

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

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

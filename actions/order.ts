"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Order from "@/models/Order";
import Product from "@/models/Product";
import StockMovement from "@/models/StockMovement";

const orderItemSchema = z.object({
    productId: z.string().min(1, "Product ID is required"),
    name: z.string().min(1, "Product name is required"),
    sku: z.string().min(1, "SKU is required"),
    price: z.coerce.number().min(0, "Price must be a positive number"),
    purchasePrice: z.coerce.number().min(0).optional(),
    quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
});

const orderSchema = z.object({
    customerName: z.string().optional(),
    customerPhone: z.string().optional(),
    items: z.array(orderItemSchema).min(1, "At least one item is required"),
    discountAmount: z.coerce.number().min(0).default(0),
    taxAmount: z.coerce.number().min(0).default(0),
    paymentMethod: z.enum(["Cash", "Card", "Mobile Banking", "Other"]).default("Cash"),
});

export type OrderInput = z.infer<typeof orderSchema>;

export async function createOrder(data: OrderInput) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await connectDB();

        const validatedData = orderSchema.parse(data);

        // Calculate SubTotal server-side to avoid tampering
        let calculatedSubTotal = 0;
        const processedItems = validatedData.items.map(item => {
            const subTotal = item.price * item.quantity;
            calculatedSubTotal += subTotal;
            return {
                ...item,
                subTotal,
            };
        });

        const calculatedTotalAmount = Math.max(0, calculatedSubTotal - validatedData.discountAmount + validatedData.taxAmount);

        // Generate Order Number
        const currentYear = new Date().getFullYear().toString().slice(-2);
        const orderCount = await Order.countDocuments({ userId });
        const prefix = "INV";
        const sequenceNumber = (orderCount + 1).toString().padStart(6, '0');
        const orderNumber = `${prefix}-${currentYear}-${sequenceNumber}`;

        // Create Order and deduct stock in a somewhat transactional way (Mongoose session is better for replica sets, avoiding here for simpler setup unless needed)
        // Check stock availability first to avoid partial commits
        for (const item of processedItems) {
            const product = await Product.findOne({ _id: item.productId, userId });
            if (!product) {
                throw new Error(`Product ${item.name} not found`);
            }
            if (product.stockQuantity < item.quantity) {
                throw new Error(`Insufficient stock for ${item.name}. Available: ${product.stockQuantity}`);
            }
        }

        const newOrder = new Order({
            userId,
            orderNumber,
            customerName: validatedData.customerName,
            customerPhone: validatedData.customerPhone,
            items: processedItems,
            subTotal: calculatedSubTotal,
            discountAmount: validatedData.discountAmount,
            taxAmount: validatedData.taxAmount,
            totalAmount: calculatedTotalAmount,
            paymentMethod: validatedData.paymentMethod,
            paymentStatus: "Paid",
        });

        const savedOrder = await newOrder.save();

        // Deduct Stock and log movement
        for (const item of processedItems) {
            const product = await Product.findOne({ _id: item.productId, userId });
            if (product) {
                const previousStock = product.stockQuantity;
                product.stockQuantity -= item.quantity;
                await product.save();

                await StockMovement.create({
                    productId: product._id,
                    userId,
                    type: "OUT",
                    quantity: item.quantity,
                    previousStock,
                    newStock: product.stockQuantity,
                    reason: `Sale via POS (Invoice: ${savedOrder.orderNumber})`,
                });
            }
        }

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/pos");
        revalidatePath("/dashboard/orders");
        revalidatePath("/dashboard/products");

        return { success: true, order: JSON.parse(JSON.stringify(savedOrder)) };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to create order" };
    }
}

export async function getOrders() {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await connectDB();

        const orders = await Order.find({ userId }).sort({ createdAt: -1 }).lean();

        return { success: true, orders: JSON.parse(JSON.stringify(orders)) };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to fetch orders" };
    }
}

export async function getOrderById(id: string) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await connectDB();

        const order = await Order.findOne({ _id: id, userId }).lean();

        if (!order) {
            throw new Error("Order not found");
        }

        return { success: true, order: JSON.parse(JSON.stringify(order)) };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to fetch order" };
    }
}

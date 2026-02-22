"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Order from "@/models/Order";
import Product from "@/models/Product";
import StockMovement from "@/models/StockMovement";
import Customer from "@/models/Customer";
import crypto from "crypto";

const orderItemSchema = z.object({
    productId: z.string().optional(),
    name: z.string().min(1, "Product name is required"),
    sku: z.string().optional(),
    price: z.coerce.number().min(0, "Price must be a positive number"),
    purchasePrice: z.coerce.number().min(0).optional(),
    quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
    isCustom: z.boolean().optional().default(false),
    description: z.string().optional(),
});

const orderSchema = z.object({
    customerId: z.string().optional(),
    customerName: z.string().optional(),
    customerPhone: z.string().optional(),
    items: z.array(orderItemSchema).min(1, "At least one item is required"),
    discountAmount: z.coerce.number().min(0).default(0),
    taxAmount: z.coerce.number().min(0).default(0),
    paidAmount: z.coerce.number().min(0).optional(),
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

        // Determine paid/due amounts
        const paidAmount = validatedData.paidAmount !== undefined
            ? Math.min(validatedData.paidAmount, calculatedTotalAmount)
            : calculatedTotalAmount; // default: fully paid
        const dueAmount = Math.max(0, calculatedTotalAmount - paidAmount);

        // Determine payment status
        let paymentStatus: "Paid" | "Partial" | "Unpaid" = "Paid";
        if (dueAmount > 0 && paidAmount > 0) {
            paymentStatus = "Partial";
        } else if (dueAmount > 0 && paidAmount === 0) {
            paymentStatus = "Unpaid";
        }

        // Generate Super Random and Unique Order Number
        const currentYear = new Date().getFullYear().toString().slice(-2);
        const prefix = "INV";
        const uniqueId = crypto.randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase();
        const orderNumber = `${prefix}-${currentYear}-${Date.now().toString(36).toUpperCase()}-${uniqueId}`;

        // Check stock availability only for non-custom items
        for (const item of processedItems) {
            if (item.isCustom) continue; // Skip stock check for custom items

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
            customerId: validatedData.customerId || undefined,
            customerName: validatedData.customerName,
            customerPhone: validatedData.customerPhone,
            items: processedItems,
            subTotal: calculatedSubTotal,
            discountAmount: validatedData.discountAmount,
            taxAmount: validatedData.taxAmount,
            totalAmount: calculatedTotalAmount,
            paidAmount,
            dueAmount,
            paymentMethod: validatedData.paymentMethod,
            paymentStatus,
        });

        const savedOrder = await newOrder.save();

        // Update customer totals if this is a customer order
        if (validatedData.customerId) {
            const customerUpdate: any = {
                $inc: {
                    invoiceCount: 1,
                    totalPaid: paidAmount,
                },
            };

            if (dueAmount > 0) {
                customerUpdate.$inc.totalDue = dueAmount;
                customerUpdate.$inc.unpaidInvoiceCount = 1;
            }

            await Customer.findByIdAndUpdate(validatedData.customerId, customerUpdate);
        }

        // Deduct Stock and log movement only for non-custom items
        for (const item of processedItems) {
            if (item.isCustom) continue; // Skip stock deduction for custom items

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
        revalidatePath("/dashboard/customers");

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

export async function deleteOrder(id: string) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await connectDB();

        const order = await Order.findOne({ _id: id, userId });
        if (!order) {
            throw new Error("Order not found");
        }

        // Restore stock for non-custom items
        for (const item of order.items) {
            if (item.isCustom) continue;

            const product = await Product.findOne({ _id: item.productId, userId });
            if (product) {
                const previousStock = product.stockQuantity;
                product.stockQuantity += item.quantity;
                await product.save();

                await StockMovement.create({
                    productId: product._id,
                    userId,
                    type: "IN",
                    quantity: item.quantity,
                    previousStock,
                    newStock: product.stockQuantity,
                    reason: `Order Deleted (Invoice: ${order.orderNumber})`,
                });
            }
        }

        // Update customer totals if this was a customer order
        if (order.customerId) {
            const customerUpdate: any = {
                $inc: {
                    invoiceCount: -1,
                    totalPaid: -(order.paidAmount || 0),
                },
            };

            if (order.dueAmount > 0) {
                customerUpdate.$inc.totalDue = -order.dueAmount;
                customerUpdate.$inc.unpaidInvoiceCount = -1;
            }

            await Customer.findByIdAndUpdate(order.customerId, customerUpdate);
        }

        await Order.findByIdAndDelete(id);

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/pos");
        revalidatePath("/dashboard/orders");
        revalidatePath("/dashboard/products");
        revalidatePath("/dashboard/customers");

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to delete order" };
    }
}

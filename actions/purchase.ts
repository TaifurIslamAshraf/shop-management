"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";
import { z } from "zod";
import connectDB from "@/lib/db";
import Purchase from "@/models/Purchase";
import Supplier from "@/models/Supplier";
import Product from "@/models/Product";
import StockMovement from "@/models/StockMovement";

const purchaseItemSchema = z.object({
    productId: z.string(),
    name: z.string(),
    sku: z.string(),
    quantity: z.coerce.number().min(1),
    purchasePrice: z.coerce.number().min(0),
    subTotal: z.coerce.number().min(0),
});

const purchaseSchema = z.object({
    supplierId: z.string(),
    purchaseNumber: z.string(),
    items: z.array(purchaseItemSchema).min(1, "At least one item is required"),
    totalAmount: z.coerce.number().min(0),
    paidAmount: z.coerce.number().min(0).default(0),
    status: z.enum(["Pending", "Completed", "Cancelled"]).default("Completed"),
    notes: z.string().optional(),
});

type PurchaseInput = z.infer<typeof purchaseSchema>;

function generatePurchaseNumber() {
    return `PO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export async function createPurchase(data: PurchaseInput) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await connectDB();

        // Use transaction to ensure data integrity
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Validate input
            const validatedData = purchaseSchema.parse({
                ...data,
                purchaseNumber: data.purchaseNumber || generatePurchaseNumber(),
            });

            // Calculate due amount
            const dueAmount = Math.max(0, validatedData.totalAmount - validatedData.paidAmount);

            // Determine payment status
            let paymentStatus = "Unpaid";
            if (validatedData.paidAmount >= validatedData.totalAmount) {
                paymentStatus = "Paid";
            } else if (validatedData.paidAmount > 0) {
                paymentStatus = "Partial";
            }

            // Create Purchase
            const purchase = await Purchase.create([{
                ...validatedData,
                userId,
                dueAmount,
                paymentStatus,
            }], { session });

            const createdPurchase = purchase[0];

            // If purchase is completed, update product stock and supplier due amount
            if (validatedData.status === "Completed") {
                // Update supplier due amount
                if (dueAmount > 0) {
                    await Supplier.findByIdAndUpdate(
                        validatedData.supplierId,
                        { $inc: { dueAmount: dueAmount } },
                        { session }
                    );
                }

                // Process each item
                for (const item of validatedData.items) {
                    // Update Product stock and optionally purchase price/supplier
                    const product = await Product.findById(item.productId).session(session);

                    if (!product) {
                        throw new Error(`Product not found: ${item.name}`);
                    }

                    const previousStock = product.stockQuantity;
                    const newStock = previousStock + item.quantity;

                    // Update product
                    await Product.findByIdAndUpdate(
                        item.productId,
                        {
                            $set: {
                                stockQuantity: newStock,
                                purchasePrice: item.purchasePrice, // Update to latest purchase price
                                supplierId: validatedData.supplierId // Associate supplier
                            }
                        },
                        { session }
                    );

                    // Create stock movement
                    await StockMovement.create([{
                        productId: item.productId,
                        userId,
                        type: "IN",
                        quantity: item.quantity,
                        previousStock,
                        newStock,
                        reason: `Purchase Restock [${createdPurchase.purchaseNumber}]`,
                        reference: createdPurchase._id.toString(),
                    }], { session });
                }
            }

            await session.commitTransaction();
            session.endSession();

            revalidatePath("/dashboard");
            revalidatePath("/dashboard/purchases");
            revalidatePath("/dashboard/suppliers");
            revalidatePath("/dashboard/products");

            return { success: true, purchase: JSON.parse(JSON.stringify(createdPurchase)) };
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    } catch (error: any) {
        console.error("Create Purchase Error:", error);
        return { success: false, error: error.message || "Failed to create purchase" };
    }
}

export async function getPurchases({ page = 1, limit = 20 }: { page?: number; limit?: number } = {}) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await connectDB();

        const skip = (page - 1) * limit;
        const [purchases, totalCount] = await Promise.all([
            Purchase.find({ userId })
                .populate("supplierId", "name companyName")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Purchase.countDocuments({ userId }),
        ]);
        const totalPages = Math.ceil(totalCount / limit);

        return { success: true, purchases: JSON.parse(JSON.stringify(purchases)), totalCount, page, totalPages };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to fetch purchases" };
    }
}

export async function getPurchaseById(id: string) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await connectDB();

        const purchase = await Purchase.findOne({ _id: id, userId })
            .populate("supplierId", "name companyName email phone address")
            .lean();

        if (!purchase) {
            throw new Error("Purchase not found");
        }

        return { success: true, purchase: JSON.parse(JSON.stringify(purchase)) };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to fetch purchase details" };
    }
}

export async function updatePurchase(id: string, data: PurchaseInput) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await connectDB();

        // Use transaction to ensure data integrity
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Validate input
            const validatedData = purchaseSchema.parse(data);

            const existingPurchase = await Purchase.findOne({ _id: id, userId }).session(session);
            if (!existingPurchase) {
                throw new Error("Purchase not found");
            }

            // Calculate new due amount
            const newDueAmount = Math.max(0, validatedData.totalAmount - validatedData.paidAmount);

            // Determine payment status
            let paymentStatus = "Unpaid";
            if (validatedData.paidAmount >= validatedData.totalAmount) {
                paymentStatus = "Paid";
            } else if (validatedData.paidAmount > 0) {
                paymentStatus = "Partial";
            }

            // REVERSE OLD COMPLETED PURCHASE EFFECTS
            if (existingPurchase.status === "Completed") {
                // Reverse supplier due amount
                if (existingPurchase.dueAmount > 0) {
                    await Supplier.findByIdAndUpdate(
                        existingPurchase.supplierId,
                        { $inc: { dueAmount: -existingPurchase.dueAmount } },
                        { session }
                    );
                }

                // Reverse stock for each old item
                for (const oldItem of existingPurchase.items) {
                    const product = await Product.findById(oldItem.productId).session(session);
                    if (product) {
                        const previousStock = product.stockQuantity;
                        const newStock = previousStock - oldItem.quantity;

                        await Product.findByIdAndUpdate(
                            oldItem.productId,
                            { $set: { stockQuantity: Math.max(0, newStock) } },
                            { session }
                        );

                        await StockMovement.create([{
                            productId: oldItem.productId,
                            userId,
                            type: "OUT",
                            quantity: oldItem.quantity,
                            previousStock,
                            newStock: Math.max(0, newStock),
                            reason: `Purchase Edit Reversal [${existingPurchase.purchaseNumber}]`,
                            reference: existingPurchase._id.toString(),
                        }], { session });
                    }
                }
            }

            // APPLY NEW EFFECTS IF NEW STATUS IS COMPLETED
            if (validatedData.status === "Completed") {
                // Update supplier due amount
                if (newDueAmount > 0) {
                    await Supplier.findByIdAndUpdate(
                        validatedData.supplierId,
                        { $inc: { dueAmount: newDueAmount } },
                        { session }
                    );
                }

                // Process each new item
                for (const item of validatedData.items) {
                    const product = await Product.findById(item.productId).session(session);
                    if (!product) throw new Error(`Product not found: ${item.name}`);

                    const previousStock = product.stockQuantity;
                    const newStock = previousStock + item.quantity;

                    await Product.findByIdAndUpdate(
                        item.productId,
                        {
                            $set: {
                                stockQuantity: newStock,
                                purchasePrice: item.purchasePrice,
                                supplierId: validatedData.supplierId
                            }
                        },
                        { session }
                    );

                    await StockMovement.create([{
                        productId: item.productId,
                        userId,
                        type: "IN",
                        quantity: item.quantity,
                        previousStock,
                        newStock,
                        reason: `Purchase Edit Restock [${existingPurchase.purchaseNumber}]`,
                        reference: existingPurchase._id.toString(),
                    }], { session });
                }
            }

            // UPDATE PURCHASE RECORD
            const updatedPurchase = await Purchase.findByIdAndUpdate(
                id,
                {
                    $set: {
                        ...validatedData,
                        dueAmount: newDueAmount,
                        paymentStatus
                    }
                },
                { new: true, session }
            );

            await session.commitTransaction();
            session.endSession();

            revalidatePath("/dashboard");
            revalidatePath("/dashboard/purchases");
            revalidatePath("/dashboard/suppliers");
            revalidatePath("/dashboard/products");

            return { success: true, purchase: JSON.parse(JSON.stringify(updatedPurchase)) };
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    } catch (error: any) {
        console.error("Update Purchase Error:", error);
        return { success: false, error: error.message || "Failed to update purchase" };
    }
}

export async function deletePurchase(id: string) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await connectDB();

        const purchase = await Purchase.findOne({ _id: id, userId });
        if (!purchase) {
            throw new Error("Purchase not found");
        }

        // If purchase was completed, reverse stock and supplier due
        if (purchase.status === "Completed") {
            // Reverse supplier due amount
            if (purchase.dueAmount > 0) {
                await Supplier.findByIdAndUpdate(
                    purchase.supplierId,
                    { $inc: { dueAmount: -purchase.dueAmount } }
                );
            }

            // Reverse stock for each item
            for (const item of purchase.items) {
                const product = await Product.findById(item.productId);
                if (product) {
                    const previousStock = product.stockQuantity;
                    const newStock = Math.max(0, previousStock - item.quantity);

                    await Product.findByIdAndUpdate(item.productId, {
                        $set: { stockQuantity: newStock },
                    });

                    await StockMovement.create({
                        productId: item.productId,
                        userId,
                        type: "OUT",
                        quantity: item.quantity,
                        previousStock,
                        newStock,
                        reason: `Purchase Deleted [${purchase.purchaseNumber}]`,
                        reference: purchase._id.toString(),
                    });
                }
            }
        }

        await Purchase.findByIdAndDelete(id);

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/purchases");
        revalidatePath("/dashboard/suppliers");
        revalidatePath("/dashboard/products");

        return { success: true };
    } catch (error: any) {
        console.error("Delete Purchase Error:", error);
        return { success: false, error: error.message || "Failed to delete purchase" };
    }
}

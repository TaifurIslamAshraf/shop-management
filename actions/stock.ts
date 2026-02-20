"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import StockMovement from "@/models/StockMovement";

const adjustStockSchema = z.object({
    productId: z.string(),
    type: z.enum(["IN", "OUT", "ADJUST"]),
    quantity: z.coerce.number().min(0, "Quantity must be a positive number"),
    reason: z.string().optional(),
    reference: z.string().optional(),
});

type AdjustStockInput = z.infer<typeof adjustStockSchema>;

export async function adjustStock(data: AdjustStockInput) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await connectDB();

        const validatedData = adjustStockSchema.parse(data);

        const product = await Product.findOne({
            _id: validatedData.productId,
            userId,
        });

        if (!product) {
            throw new Error("Product not found");
        }

        const previousStock = product.stockQuantity;
        let newStock = previousStock;

        // Ignore zero change adjustments as requested
        if (validatedData.quantity === 0 && validatedData.type !== "ADJUST") {
            return { success: true };
        }

        if (validatedData.type === "ADJUST" && validatedData.quantity === previousStock) {
            return { success: true }; // Ignore zero change adjustments
        }

        if (validatedData.type === "IN") {
            newStock = previousStock + validatedData.quantity;
        } else if (validatedData.type === "OUT") {
            newStock = previousStock - validatedData.quantity;
            if (newStock < 0) {
                throw new Error("Cannot remove more stock than is available.");
            }
        } else if (validatedData.type === "ADJUST") {
            newStock = validatedData.quantity;
        }

        // Only log movement if there's actually a change
        if (newStock !== previousStock) {
            product.stockQuantity = newStock;
            await product.save();

            // When type is ADJUST, the actual quantity changed could be different than what was inputted directly
            const movementQuantity = validatedData.type === "ADJUST"
                ? Math.abs(newStock - previousStock)
                : validatedData.quantity;

            // When type is ADJUST, we need to map to IN/OUT based on numerical change because Movement history strictly shows how it moved
            // But the instructions specify Badge colors for IN, OUT, ADJUST. Thus we should keep ADJUST as the type if it was an adjustment and calculate quantity accordingly.

            await StockMovement.create({
                productId: product._id,
                userId,
                type: validatedData.type,
                quantity: movementQuantity,
                previousStock,
                newStock,
                reason: validatedData.reason,
                reference: validatedData.reference,
            });

            revalidatePath("/dashboard");
            revalidatePath("/dashboard/products");
            revalidatePath(`/dashboard/products/${product._id}/stock-history`);
        }

        return { success: true, newStock };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to adjust stock" };
    }
}

export async function getStockMovements(productId: string) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await connectDB();

        // Ensure the product belongs to the user
        const product = await Product.findOne({ _id: productId, userId }).lean();
        if (!product) {
            throw new Error("Product not found or unauthorized");
        }

        const movements = await StockMovement.find({ productId, userId })
            .sort({ createdAt: -1 })
            .lean();

        return { success: true, movements: JSON.parse(JSON.stringify(movements)) };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to fetch stock movements" };
    }
}

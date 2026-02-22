"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import StockMovement from "@/models/StockMovement";

const productSchema = z.object({
    type: z.enum(["Product", "Service"]).default("Product"),
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    sku: z.string().min(1, "SKU is required"),
    price: z.coerce.number().min(0, "Price must be a positive number"),
    purchasePrice: z.coerce.number().min(0, "Purchase price must be a valid number").default(0),
    stockQuantity: z.coerce.number().min(0, "Stock quantity cannot be negative").default(0),
    lowStockThreshold: z.coerce.number().min(0, "Low stock threshold cannot be negative").default(5),
    category: z.string().optional(),
    imageUrl: z.string().optional(),
    supplierId: z.string().optional().or(z.literal("none")),
    expiryDate: z.coerce.date().optional(),
});

type ProductInput = z.infer<typeof productSchema>;

export async function createProduct(data: ProductInput) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await connectDB();

        const validatedData = productSchema.parse(data);

        // Check if duplicate SKU exists for this user
        const existingProduct = await Product.findOne({
            userId,
            sku: validatedData.sku,
        });
        if (existingProduct) {
            throw new Error("A product with this SKU already exists in your inventory.");
        }

        const product = await Product.create({
            ...validatedData,
            userId,
        });

        // Log initial stock if greater than 0 and type is Product
        if (product.type === "Product" && product.stockQuantity > 0) {
            await StockMovement.create({
                productId: product._id,
                userId,
                type: "IN",
                quantity: product.stockQuantity,
                previousStock: 0,
                newStock: product.stockQuantity,
                reason: "Initial stock on product creation",
            });
        }

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/products");

        return { success: true, product: JSON.parse(JSON.stringify(product)) };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to create product" };
    }
}

export async function getProducts() {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await connectDB();
        console.log("getProducts for userId:", userId);

        const products = await Product.find({ userId }).sort({ createdAt: -1 }).lean();

        return { success: true, products: JSON.parse(JSON.stringify(products)) };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to fetch products" };
    }
}

export async function getProductById(id: string) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await connectDB();

        const product = await Product.findOne({ _id: id, userId }).lean();

        if (!product) {
            throw new Error("Product not found");
        }

        return { success: true, product: JSON.parse(JSON.stringify(product)) };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to fetch product" };
    }
}

export async function updateProduct(id: string, data: ProductInput) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await connectDB();

        const validatedData = productSchema.parse(data);

        // Ensure SKU is unique if it's changed
        const existingProduct = await Product.findOne({
            userId,
            sku: validatedData.sku,
            _id: { $ne: id },
        });

        if (existingProduct) {
            throw new Error("A product with this SKU already exists in your inventory.");
        }

        const existingProductItem = await Product.findOne({ _id: id, userId });
        if (!existingProductItem) {
            throw new Error("Product not found or unauthorized");
        }

        const previousStock = existingProductItem.stockQuantity;

        const product = await Product.findOneAndUpdate(
            { _id: id, userId },
            { $set: validatedData },
            { new: true }
        ).lean();

        if (!product) {
            throw new Error("Product not found or unauthorized");
        }

        // Log adjustment if stock was changed directly from the edit modal and type is Product
        if (product.type === "Product" && product.stockQuantity !== previousStock) {
            const quantityChanged = Math.abs(product.stockQuantity - previousStock);
            await StockMovement.create({
                productId: product._id,
                userId,
                type: "ADJUST",
                quantity: quantityChanged,
                previousStock,
                newStock: product.stockQuantity,
                reason: "Direct adjustment from product edit",
            });
        }

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/products");
        revalidatePath(`/dashboard/products/${id}/stock-history`);

        return { success: true, product: JSON.parse(JSON.stringify(product)) };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to update product" };
    }
}

export async function deleteProduct(id: string) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await connectDB();

        const product = await Product.findOneAndDelete({ _id: id, userId }).lean();

        if (!product) {
            throw new Error("Product not found or unauthorized");
        }

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/products");

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to delete product" };
    }
}

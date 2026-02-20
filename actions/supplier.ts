"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import connectDB from "@/lib/db";
import Supplier from "@/models/Supplier";
import Purchase from "@/models/Purchase";

const supplierSchema = z.object({
    name: z.string().min(1, "Name is required"),
    companyName: z.string().optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
    status: z.enum(["Active", "Inactive"]).default("Active"),
});

type SupplierInput = z.infer<typeof supplierSchema>;

export async function createSupplier(data: SupplierInput) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await connectDB();

        const validatedData = supplierSchema.parse(data);

        const supplier = await Supplier.create({
            ...validatedData,
            userId,
        });

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/suppliers");

        return { success: true, supplier: JSON.parse(JSON.stringify(supplier)) };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to create supplier" };
    }
}

export async function getSuppliers() {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await connectDB();

        const suppliers = await Supplier.find({ userId }).sort({ createdAt: -1 }).lean();

        return { success: true, suppliers: JSON.parse(JSON.stringify(suppliers)) };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to fetch suppliers" };
    }
}

export async function getSupplierById(id: string) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await connectDB();

        const supplier = await Supplier.findOne({ _id: id, userId }).lean();

        if (!supplier) {
            throw new Error("Supplier not found");
        }

        // Fetch recent purchases for this supplier
        const purchases = await Purchase.find({ supplierId: id, userId })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        return {
            success: true,
            supplier: JSON.parse(JSON.stringify(supplier)),
            recentPurchases: JSON.parse(JSON.stringify(purchases))
        };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to fetch supplier details" };
    }
}

export async function updateSupplier(id: string, data: SupplierInput) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await connectDB();

        const validatedData = supplierSchema.parse(data);

        const supplier = await Supplier.findOneAndUpdate(
            { _id: id, userId },
            { $set: validatedData },
            { new: true }
        ).lean();

        if (!supplier) {
            throw new Error("Supplier not found or unauthorized");
        }

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/suppliers");
        revalidatePath(`/dashboard/suppliers/${id}`);

        return { success: true, supplier: JSON.parse(JSON.stringify(supplier)) };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to update supplier" };
    }
}

export async function deleteSupplier(id: string) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await connectDB();

        // Check if there are associated purchases
        const hasPurchases = await Purchase.exists({ supplierId: id, userId });
        if (hasPurchases) {
            throw new Error("Cannot delete supplier with existing purchase history.");
        }

        const supplier = await Supplier.findOneAndDelete({ _id: id, userId }).lean();

        if (!supplier) {
            throw new Error("Supplier not found or unauthorized");
        }

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/suppliers");

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to delete supplier" };
    }
}

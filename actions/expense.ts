"use server";

import dbConnect from "@/lib/db";
import Expense, { IExpense } from "@/models/Expense";
import { auth } from "@clerk/nextjs/server";

interface ActionResult<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export async function getExpenses({ page = 1, limit = 20 }: { page?: number; limit?: number } = {}): Promise<ActionResult<any>> {
    try {
        const { userId } = await auth();
        if (!userId) {
            return { success: false, error: "Unauthorized" };
        }

        await dbConnect();

        const skip = (page - 1) * limit;
        const [expenses, totalCount] = await Promise.all([
            Expense.find({ userId })
                .sort({ expenseDate: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Expense.countDocuments({ userId }),
        ]);
        const totalPages = Math.ceil(totalCount / limit);

        // Convert MongoDB _id to string for Next.js serialization
        const serializedExpenses = expenses.map((expense: any) => ({
            ...expense,
            _id: expense._id.toString(),
        }));

        return { success: true, data: serializedExpenses, totalCount, page, totalPages } as any;
    } catch (error) {
        console.error("Error fetching expenses:", error);
        return { success: false, error: "Failed to fetch expenses" };
    }
}

export async function getExpenseById(id: string): Promise<ActionResult<any>> {
    try {
        const { userId } = await auth();
        if (!userId) {
            return { success: false, error: "Unauthorized" };
        }

        await dbConnect();

        const expense = await Expense.findOne({ _id: id, userId }).lean();

        if (!expense) {
            return { success: false, error: "Expense not found" };
        }

        return {
            success: true,
            data: { ...expense, _id: (expense as any)._id.toString() },
        };
    } catch (error) {
        console.error("Error fetching expense:", error);
        return { success: false, error: "Failed to fetch expense" };
    }
}

export async function createExpense(data: Partial<IExpense>): Promise<ActionResult<any>> {
    try {
        const { userId } = await auth();
        if (!userId) {
            return { success: false, error: "Unauthorized" };
        }

        await dbConnect();

        const newExpense = new Expense({
            ...data,
            userId,
        });

        const savedExpense = await newExpense.save();

        return {
            success: true,
            data: { ...savedExpense.toObject(), _id: savedExpense._id.toString() },
        };
    } catch (error: any) {
        console.error("Error creating expense:", error);
        return { success: false, error: error.message || "Failed to create expense" };
    }
}

export async function updateExpense(
    id: string,
    data: Partial<IExpense>
): Promise<ActionResult<any>> {
    try {
        const { userId } = await auth();
        if (!userId) {
            return { success: false, error: "Unauthorized" };
        }

        await dbConnect();

        const updatedExpense = await Expense.findOneAndUpdate(
            { _id: id, userId },
            { $set: data },
            { new: true, runValidators: true }
        ).lean();

        if (!updatedExpense) {
            return { success: false, error: "Expense not found or unauthorized" };
        }

        return {
            success: true,
            data: { ...updatedExpense, _id: (updatedExpense as any)._id.toString() },
        };
    } catch (error: any) {
        console.error("Error updating expense:", error);
        return { success: false, error: error.message || "Failed to update expense" };
    }
}

export async function deleteExpense(id: string): Promise<ActionResult<boolean>> {
    try {
        const { userId } = await auth();
        if (!userId) {
            return { success: false, error: "Unauthorized" };
        }

        await dbConnect();

        const result = await Expense.deleteOne({ _id: id, userId });

        if (result.deletedCount === 0) {
            return { success: false, error: "Expense not found or unauthorized" };
        }

        return { success: true, data: true };
    } catch (error) {
        console.error("Error deleting expense:", error);
        return { success: false, error: "Failed to delete expense" };
    }
}

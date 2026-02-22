"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import connectDB from "@/lib/db";
import Customer from "@/models/Customer";
import Order from "@/models/Order";
import Payment from "@/models/Payment";

const customerSchema = z.object({
    name: z.string().min(1, "Customer name is required"),
    phone: z.string().optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    address: z.string().optional(),
});

export type CustomerInput = z.infer<typeof customerSchema>;

export async function createCustomer(data: CustomerInput) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await connectDB();

        const validatedData = customerSchema.parse(data);

        const customer = await Customer.create({
            ...validatedData,
            userId,
            totalDue: 0,
            totalPaid: 0,
            invoiceCount: 0,
            unpaidInvoiceCount: 0,
        });

        revalidatePath("/dashboard/customers");

        return { success: true, customer: JSON.parse(JSON.stringify(customer)) };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to create customer" };
    }
}

export async function getCustomers() {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await connectDB();

        const customers = await Customer.find({ userId })
            .sort({ createdAt: -1 })
            .lean();

        return { success: true, customers: JSON.parse(JSON.stringify(customers)) };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to fetch customers" };
    }
}

export async function getCustomerById(id: string) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await connectDB();

        const customer = await Customer.findOne({ _id: id, userId }).lean();

        if (!customer) {
            throw new Error("Customer not found");
        }

        // Get the oldest unpaid invoice date
        const oldestUnpaid = await Order.findOne({
            userId,
            customerId: id,
            paymentStatus: { $in: ["Unpaid", "Partial"] },
        })
            .sort({ createdAt: 1 })
            .select("createdAt")
            .lean();

        // Get the latest sale
        const latestSale = await Order.findOne({
            userId,
            customerId: id,
        })
            .sort({ createdAt: -1 })
            .select("createdAt orderNumber totalAmount")
            .lean();

        return {
            success: true,
            customer: JSON.parse(JSON.stringify(customer)),
            oldestUnpaidDate: oldestUnpaid ? JSON.parse(JSON.stringify(oldestUnpaid.createdAt)) : null,
            latestSale: latestSale ? JSON.parse(JSON.stringify(latestSale)) : null,
        };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to fetch customer" };
    }
}

export async function updateCustomer(id: string, data: CustomerInput) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await connectDB();

        const validatedData = customerSchema.parse(data);

        const customer = await Customer.findOneAndUpdate(
            { _id: id, userId },
            { $set: validatedData },
            { new: true }
        ).lean();

        if (!customer) {
            throw new Error("Customer not found");
        }

        revalidatePath("/dashboard/customers");
        revalidatePath(`/dashboard/customers/${id}`);

        return { success: true, customer: JSON.parse(JSON.stringify(customer)) };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to update customer" };
    }
}

export async function getCustomerInvoices(customerId: string) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await connectDB();

        const invoices = await Order.find({ userId, customerId })
            .sort({ createdAt: -1 })
            .lean();

        return { success: true, invoices: JSON.parse(JSON.stringify(invoices)) };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to fetch invoices" };
    }
}

export async function getCustomerPayments(customerId: string) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await connectDB();

        const payments = await Payment.find({ userId, customerId })
            .sort({ createdAt: -1 })
            .lean();

        return { success: true, payments: JSON.parse(JSON.stringify(payments)) };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to fetch payments" };
    }
}

export async function searchCustomers(query: string) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await connectDB();

        const customers = await Customer.find({
            userId,
            status: "Active",
            $or: [
                { name: { $regex: query, $options: "i" } },
                { phone: { $regex: query, $options: "i" } },
            ],
        })
            .limit(10)
            .lean();

        return { success: true, customers: JSON.parse(JSON.stringify(customers)) };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to search customers" };
    }
}

export async function getCustomerDueSummary() {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await connectDB();

        const [dueStats, oldestUnpaid, multiDueCustomers] = await Promise.all([
            // Total outstanding due
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

            // Oldest unpaid invoice
            Order.findOne({
                userId,
                paymentStatus: { $in: ["Unpaid", "Partial"] },
            })
                .sort({ createdAt: 1 })
                .select("createdAt orderNumber dueAmount customerName")
                .lean(),

            // Customers with multiple unpaid invoices
            Customer.countDocuments({
                userId,
                unpaidInvoiceCount: { $gt: 1 },
            }),
        ]);

        const totalOverdue = await Order.countDocuments({
            userId,
            paymentStatus: { $in: ["Unpaid", "Partial"] },
        });

        return {
            success: true,
            summary: {
                totalOutstanding: dueStats[0]?.totalOutstanding || 0,
                customersWithDue: dueStats[0]?.customersWithDue || 0,
                multiDueCustomers,
                oldestUnpaid: oldestUnpaid ? JSON.parse(JSON.stringify(oldestUnpaid)) : null,
                totalOverdueInvoices: totalOverdue,
            },
        };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to fetch due summary" };
    }
}

export async function deleteCustomer(id: string) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await connectDB();

        // Check for existing orders
        const hasOrders = await Order.exists({ customerId: id, userId });
        if (hasOrders) {
            throw new Error("Cannot delete customer with existing orders. Remove their orders first.");
        }

        const customer = await Customer.findOneAndDelete({ _id: id, userId }).lean();

        if (!customer) {
            throw new Error("Customer not found");
        }

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/customers");

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to delete customer" };
    }
}

"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Order from "@/models/Order";
import Customer from "@/models/Customer";
import Payment from "@/models/Payment";

const payInvoiceSchema = z.object({
    saleId: z.string().min(1, "Invoice ID is required"),
    amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
    method: z.enum(["Cash", "Card", "Mobile Banking", "Other"]).default("Cash"),
    note: z.string().optional(),
});

const payCustomerSchema = z.object({
    customerId: z.string().min(1, "Customer ID is required"),
    amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
    method: z.enum(["Cash", "Card", "Mobile Banking", "Other"]).default("Cash"),
    note: z.string().optional(),
});

export type PayInvoiceInput = z.infer<typeof payInvoiceSchema>;
export type PayCustomerInput = z.infer<typeof payCustomerSchema>;

/**
 * Pay a specific invoice.
 * Updates invoice paidAmount/dueAmount/paymentStatus and customer totals.
 */
export async function collectPaymentForInvoice(data: PayInvoiceInput) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await connectDB();

        const validatedData = payInvoiceSchema.parse(data);

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const invoice = await Order.findOne({
                _id: validatedData.saleId,
                userId,
            }).session(session);

            if (!invoice) throw new Error("Invoice not found");

            if (invoice.paymentStatus === "Paid") {
                throw new Error("This invoice is already fully paid");
            }

            if (validatedData.amount > invoice.dueAmount) {
                throw new Error(
                    `Payment amount (${validatedData.amount}) exceeds invoice due (${invoice.dueAmount})`
                );
            }

            if (!invoice.customerId) {
                throw new Error("This invoice has no associated customer");
            }

            // Update invoice
            const newPaidAmount = invoice.paidAmount + validatedData.amount;
            const newDueAmount = Math.max(0, invoice.dueAmount - validatedData.amount);
            let newStatus: "Paid" | "Partial" | "Unpaid" = "Partial";
            if (newDueAmount === 0) {
                newStatus = "Paid";
            }

            await Order.findByIdAndUpdate(
                validatedData.saleId,
                {
                    $set: {
                        paidAmount: newPaidAmount,
                        dueAmount: newDueAmount,
                        paymentStatus: newStatus,
                    },
                },
                { session }
            );

            // Update customer totals
            const customerUpdate: any = {
                $inc: {
                    totalDue: -validatedData.amount,
                    totalPaid: validatedData.amount,
                },
            };

            if (newStatus === "Paid") {
                customerUpdate.$inc.unpaidInvoiceCount = -1;
            }

            await Customer.findByIdAndUpdate(
                invoice.customerId,
                customerUpdate,
                { session }
            );

            // Create payment record
            const payment = await Payment.create(
                [
                    {
                        userId,
                        customerId: invoice.customerId,
                        saleId: invoice._id,
                        amount: validatedData.amount,
                        method: validatedData.method,
                        note: validatedData.note,
                        allocationType: "specific_invoice",
                        allocationDetails: [
                            {
                                saleId: invoice._id,
                                amount: validatedData.amount,
                                invoiceNumber: invoice.orderNumber,
                            },
                        ],
                    },
                ],
                { session }
            );

            await session.commitTransaction();
            session.endSession();

            revalidatePath("/dashboard");
            revalidatePath("/dashboard/customers");
            revalidatePath("/dashboard/orders");

            return {
                success: true,
                payment: JSON.parse(JSON.stringify(payment[0])),
            };
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    } catch (error: any) {
        console.error("Collect Payment Error:", error);
        return { success: false, error: error.message || "Failed to collect payment" };
    }
}

/**
 * Pay against customer total due using FIFO allocation.
 * Oldest unpaid invoices are paid first.
 */
export async function collectPaymentForCustomer(data: PayCustomerInput) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await connectDB();

        const validatedData = payCustomerSchema.parse(data);

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const customer = await Customer.findOne({
                _id: validatedData.customerId,
                userId,
            }).session(session);

            if (!customer) throw new Error("Customer not found");

            if (customer.totalDue <= 0) {
                throw new Error("Customer has no outstanding due");
            }

            if (validatedData.amount > customer.totalDue) {
                throw new Error(
                    `Payment amount (${validatedData.amount}) exceeds total due (${customer.totalDue})`
                );
            }

            // Get all unpaid invoices sorted by date (oldest first) — FIFO
            const unpaidInvoices = await Order.find({
                userId,
                customerId: validatedData.customerId,
                paymentStatus: { $in: ["Unpaid", "Partial"] },
            })
                .sort({ createdAt: 1 })
                .session(session);

            // FIFO distribution
            let remainingPayment = validatedData.amount;
            const allocationDetails: {
                saleId: mongoose.Types.ObjectId;
                amount: number;
                invoiceNumber: string;
            }[] = [];
            let invoicesPaidOff = 0;

            for (const invoice of unpaidInvoices) {
                if (remainingPayment <= 0) break;

                const apply = Math.min(invoice.dueAmount, remainingPayment);

                const newPaidAmount = invoice.paidAmount + apply;
                const newDueAmount = Math.max(0, invoice.dueAmount - apply);
                let newStatus: "Paid" | "Partial" | "Unpaid" = "Partial";
                if (newDueAmount === 0) {
                    newStatus = "Paid";
                    invoicesPaidOff++;
                }

                await Order.findByIdAndUpdate(
                    invoice._id,
                    {
                        $set: {
                            paidAmount: newPaidAmount,
                            dueAmount: newDueAmount,
                            paymentStatus: newStatus,
                        },
                    },
                    { session }
                );

                allocationDetails.push({
                    saleId: invoice._id as mongoose.Types.ObjectId,
                    amount: apply,
                    invoiceNumber: invoice.orderNumber,
                });

                remainingPayment -= apply;
            }

            // Update customer totals
            await Customer.findByIdAndUpdate(
                validatedData.customerId,
                {
                    $inc: {
                        totalDue: -validatedData.amount,
                        totalPaid: validatedData.amount,
                        unpaidInvoiceCount: -invoicesPaidOff,
                    },
                },
                { session }
            );

            // Create payment record
            const payment = await Payment.create(
                [
                    {
                        userId,
                        customerId: validatedData.customerId,
                        amount: validatedData.amount,
                        method: validatedData.method,
                        note: validatedData.note,
                        allocationType: "customer_total",
                        allocationDetails,
                    },
                ],
                { session }
            );

            await session.commitTransaction();
            session.endSession();

            revalidatePath("/dashboard");
            revalidatePath("/dashboard/customers");
            revalidatePath("/dashboard/orders");

            return {
                success: true,
                payment: JSON.parse(JSON.stringify(payment[0])),
                allocationDetails: JSON.parse(JSON.stringify(allocationDetails)),
            };
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    } catch (error: any) {
        console.error("Collect Customer Payment Error:", error);
        return { success: false, error: error.message || "Failed to collect payment" };
    }
}

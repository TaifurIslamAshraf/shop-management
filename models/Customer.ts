import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICustomer extends Document {
    userId: string;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    totalDue: number;
    totalPaid: number;
    invoiceCount: number;
    unpaidInvoiceCount: number;
    status: "Active" | "Inactive";
    createdAt: Date;
    updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
        },
        email: {
            type: String,
        },
        address: {
            type: String,
        },
        totalDue: {
            type: Number,
            default: 0,
            min: 0,
        },
        totalPaid: {
            type: Number,
            default: 0,
            min: 0,
        },
        invoiceCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        unpaidInvoiceCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        status: {
            type: String,
            enum: ["Active", "Inactive"],
            default: "Active",
        },
    },
    {
        timestamps: true,
    }
);

CustomerSchema.index({ name: 1, userId: 1 });
CustomerSchema.index({ phone: 1, userId: 1 });

const Customer: Model<ICustomer> =
    mongoose.models.Customer || mongoose.model<ICustomer>("Customer", CustomerSchema);

export default Customer;

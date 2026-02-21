import mongoose, { Document, Model, Schema } from "mongoose";

export interface IAllocationDetail {
    saleId: mongoose.Types.ObjectId;
    amount: number;
    invoiceNumber: string;
}

export interface IPayment extends Document {
    userId: string;
    customerId: mongoose.Types.ObjectId;
    saleId?: mongoose.Types.ObjectId;
    amount: number;
    method: "Cash" | "Card" | "Mobile Banking" | "Other";
    note?: string;
    allocationType: "specific_invoice" | "customer_total";
    allocationDetails: IAllocationDetail[];
    createdAt: Date;
    updatedAt: Date;
}

const AllocationDetailSchema = new Schema<IAllocationDetail>(
    {
        saleId: {
            type: Schema.Types.ObjectId,
            ref: "Order",
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        invoiceNumber: {
            type: String,
            required: true,
        },
    },
    { _id: false }
);

const PaymentSchema = new Schema<IPayment>(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        customerId: {
            type: Schema.Types.ObjectId,
            ref: "Customer",
            required: true,
            index: true,
        },
        saleId: {
            type: Schema.Types.ObjectId,
            ref: "Order",
        },
        amount: {
            type: Number,
            required: true,
            min: 0.01,
        },
        method: {
            type: String,
            enum: ["Cash", "Card", "Mobile Banking", "Other"],
            default: "Cash",
            required: true,
        },
        note: {
            type: String,
        },
        allocationType: {
            type: String,
            enum: ["specific_invoice", "customer_total"],
            required: true,
        },
        allocationDetails: [AllocationDetailSchema],
    },
    {
        timestamps: true,
    }
);

PaymentSchema.index({ createdAt: -1 });

const Payment: Model<IPayment> =
    mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema);

export default Payment;

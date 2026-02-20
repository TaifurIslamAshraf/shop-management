import mongoose, { Document, Model, Schema } from "mongoose";

export interface IPurchaseItem {
    productId: mongoose.Types.ObjectId | string;
    name: string;
    sku: string;
    quantity: number;
    purchasePrice: number;
    subTotal: number;
}

export interface IPurchase extends Document {
    userId: string;
    supplierId: mongoose.Types.ObjectId | string;
    purchaseNumber: string;
    items: IPurchaseItem[];
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    status: "Pending" | "Completed" | "Cancelled";
    paymentStatus: "Paid" | "Partial" | "Unpaid";
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const PurchaseItemSchema = new Schema<IPurchaseItem>({
    productId: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    sku: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    purchasePrice: {
        type: Number,
        required: true,
        min: 0,
    },
    subTotal: {
        type: Number,
        required: true,
        min: 0,
    },
});

const PurchaseSchema = new Schema<IPurchase>(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        supplierId: {
            type: Schema.Types.ObjectId,
            ref: "Supplier",
            required: true,
            index: true,
        },
        purchaseNumber: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        items: [PurchaseItemSchema],
        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        paidAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        dueAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        status: {
            type: String,
            enum: ["Pending", "Completed", "Cancelled"],
            default: "Completed",
            required: true,
        },
        paymentStatus: {
            type: String,
            enum: ["Paid", "Partial", "Unpaid"],
            default: "Unpaid",
            required: true,
        },
        notes: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

PurchaseSchema.index({ createdAt: -1 });

// Prevent re-compiling the model if it already exists in the dev environment
const Purchase: Model<IPurchase> =
    mongoose.models.Purchase || mongoose.model<IPurchase>("Purchase", PurchaseSchema);

export default Purchase;

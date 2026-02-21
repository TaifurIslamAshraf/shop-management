import mongoose, { Document, Model, Schema } from "mongoose";

export interface IOrderItem {
    productId: mongoose.Types.ObjectId;
    name: string;
    sku: string;
    price: number;
    purchasePrice?: number; // Optional: To track profit per item later
    quantity: number;
    subTotal: number;
}

export interface IOrder extends Document {
    userId: string;
    orderNumber: string;
    customerId?: mongoose.Types.ObjectId;
    customerName?: string;
    customerPhone?: string;
    items: IOrderItem[];
    subTotal: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    paymentMethod: "Cash" | "Card" | "Mobile Banking" | "Other";
    paymentStatus: "Paid" | "Partial" | "Unpaid";
    createdAt: Date;
    updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
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
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    purchasePrice: {
        type: Number,
        default: 0,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    subTotal: {
        type: Number,
        required: true,
        min: 0,
    },
});

const OrderSchema = new Schema<IOrder>(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        orderNumber: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        customerId: {
            type: Schema.Types.ObjectId,
            ref: "Customer",
            index: true,
        },
        customerName: {
            type: String,
        },
        customerPhone: {
            type: String,
        },
        items: [OrderItemSchema],
        subTotal: {
            type: Number,
            required: true,
            min: 0,
        },
        discountAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        taxAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
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
        paymentMethod: {
            type: String,
            enum: ["Cash", "Card", "Mobile Banking", "Other"],
            default: "Cash",
            required: true,
        },
        paymentStatus: {
            type: String,
            enum: ["Paid", "Partial", "Unpaid"],
            default: "Paid",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

OrderSchema.index({ customerId: 1, paymentStatus: 1 });
OrderSchema.index({ createdAt: -1 });

// Prevent re-compiling the model if it already exists in the dev environment
const Order: Model<IOrder> =
    mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default Order;

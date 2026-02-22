import mongoose, { Document, Model, Schema } from "mongoose";

export interface IProduct extends Document {
    userId: string;
    type: "Product" | "Service";
    name: string;
    description?: string;
    sku: string;
    price: number;
    purchasePrice: number;
    stockQuantity: number;
    lowStockThreshold: number;
    category?: string;
    imageUrl?: string;
    supplierId?: mongoose.Types.ObjectId | string;
    expiryDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ["Product", "Service"],
            default: "Product",
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        sku: {
            type: String,
            required: true,
            unique: true,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        purchasePrice: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },
        stockQuantity: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },
        lowStockThreshold: {
            type: Number,
            required: true,
            default: 5,
            min: 0,
        },
        category: {
            type: String,
        },
        imageUrl: {
            type: String,
        },
        supplierId: {
            type: Schema.Types.ObjectId,
            ref: "Supplier",
        },
        expiryDate: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Prevent re-compiling the model if it already exists in the dev environment
const Product: Model<IProduct> =
    mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);

export default Product;

import mongoose, { Document, Model, Schema } from "mongoose";

export interface IStockMovement extends Document {
    productId: mongoose.Types.ObjectId | string;
    userId: string;
    type: "IN" | "OUT" | "ADJUST";
    quantity: number;
    previousStock: number;
    newStock: number;
    reason?: string;
    reference?: string;
    createdAt: Date;
    updatedAt: Date;
}

const StockMovementSchema = new Schema<IStockMovement>(
    {
        productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
            index: true,
        },
        userId: {
            type: String,
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ["IN", "OUT", "ADJUST"],
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
        previousStock: {
            type: Number,
            required: true,
        },
        newStock: {
            type: Number,
            required: true,
        },
        reason: {
            type: String,
        },
        reference: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Explicitly add index on createdAt desc as requested
StockMovementSchema.index({ createdAt: -1 });

// Prevent re-compiling the model if it already exists in the dev environment
const StockMovement: Model<IStockMovement> =
    mongoose.models.StockMovement || mongoose.model<IStockMovement>("StockMovement", StockMovementSchema);

export default StockMovement;

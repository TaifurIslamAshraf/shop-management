import mongoose, { Document, Model, Schema } from "mongoose";

export interface ISupplier extends Document {
    userId: string;
    name: string;
    companyName?: string;
    email?: string;
    phone?: string;
    address?: string;
    status: "Active" | "Inactive";
    dueAmount: number;
    createdAt: Date;
    updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplier>(
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
        companyName: {
            type: String,
        },
        email: {
            type: String,
        },
        phone: {
            type: String,
        },
        address: {
            type: String,
        },
        status: {
            type: String,
            enum: ["Active", "Inactive"],
            default: "Active",
        },
        dueAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Prevent re-compiling the model if it already exists in the dev environment
const Supplier: Model<ISupplier> =
    mongoose.models.Supplier || mongoose.model<ISupplier>("Supplier", SupplierSchema);

export default Supplier;

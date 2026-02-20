import mongoose, { Document, Model, Schema } from "mongoose";

export interface IExpense extends Document {
    userId: string;
    title: string;
    amount: number;
    category: string;
    expenseDate: Date;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        category: {
            type: String,
            required: true,
            enum: [
                "Rent",
                "Utilities",
                "Salary",
                "Marketing",
                "Supplies",
                "Software",
                "Maintenance",
                "Other",
            ],
        },
        expenseDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        description: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Prevent re-compiling the model if it already exists in the dev environment
const Expense: Model<IExpense> =
    mongoose.models.Expense || mongoose.model<IExpense>("Expense", ExpenseSchema);

export default Expense;

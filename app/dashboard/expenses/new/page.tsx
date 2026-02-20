import { ExpenseForm } from "@/components/expenses/ExpenseForm";

export default function NewExpensePage() {
    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <ExpenseForm />
            </div>
        </div>
    );
}

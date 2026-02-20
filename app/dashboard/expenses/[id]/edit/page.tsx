import { getExpenseById } from "@/actions/expense";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { notFound } from "next/navigation";

export default async function EditExpensePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const { data: expense, success } = await getExpenseById(id);

    if (!success || !expense) {
        notFound();
    }

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <ExpenseForm initialData={expense} />
            </div>
        </div>
    );
}

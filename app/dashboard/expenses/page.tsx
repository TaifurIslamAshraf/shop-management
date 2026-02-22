import { getExpenses } from "@/actions/expense";
import { DataTable } from "@/components/ui/data-table";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { columns } from "./columns";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
    const { data: expenses, success, error } = await getExpenses();

    if (!success) {
        return (
            <div className="p-6">
                <h2 className="text-2xl font-bold tracking-tight text-red-500">
                    Failed to load expenses
                </h2>
                <p className="text-muted-foreground">{error}</p>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Expenses</h2>
                    <p className="text-muted-foreground">
                        Manage your business expenses and operational costs.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button asChild>
                        <Link href="/dashboard/expenses/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Expense
                        </Link>
                    </Button>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={expenses || []}
                searchKey="title"
            />
        </div>
    );
}

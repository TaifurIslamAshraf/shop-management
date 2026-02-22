import { getExpenses } from "@/actions/expense";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ExpensesClient from "./ExpensesClient";

export const dynamic = "force-dynamic";

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
    const resolvedParams = await searchParams;
    const page = Number(resolvedParams.page) || 1;

    const result = await getExpenses({ page });
    const { data: expenses, success, error } = result;
    const { totalCount, totalPages } = result as any;

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

            <ExpensesClient
                expenses={expenses || []}
                pagination={{ currentPage: page, totalPages: totalPages || 1, totalCount: totalCount || 0 }}
            />
        </div>
    );
}
